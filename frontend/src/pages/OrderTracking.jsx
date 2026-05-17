import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/axios";
import { io } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import {
    CheckCircle2, ChefHat, Clock, Package, ArrowLeft, Store,
    MessageCircle, Send, BellRing, X, Star, ThumbsUp, XCircle,
    Bike, MapPin, Navigation
} from "lucide-react";
import { toast } from "react-toastify";

function OrderTracking() {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [callingStaff, setCallingStaff] = useState(false);
    const [cancelling, setCancelling] = useState(false);

    // Chat state
    const [messages, setMessages] = useState([]);
    const [chatMsg, setChatMsg] = useState("");
    const socketRef = useRef(null);
    const chatEndRef = useRef(null);

    // Review state
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviewRating, setReviewRating] = useState(0);
    const [reviewHover, setReviewHover] = useState(0);
    const [reviewComment, setReviewComment] = useState("");
    const [submittingReview, setSubmittingReview] = useState(false);
    const [reviewed, setReviewed] = useState(false);

    // Live Delivery Status
    const [deliveryStatus, setDeliveryStatus] = useState(null); // null | accepted | picked_up | on_the_way | nearby | delivered

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const res = await API.get("/orders/customer");
                const foundOrder = res.data.orders?.find(o => o._id === orderId);
                setOrder(foundOrder || null);
                
                if (foundOrder) {
                    const initialMsgs = [];
                    if (foundOrder.customerNote) {
                        initialMsgs.push({ text: foundOrder.customerNote, sender: "customer", timestamp: foundOrder.createdAt });
                    }
                    if (foundOrder.staffNote) {
                        initialMsgs.push({ text: foundOrder.staffNote, sender: "staff", timestamp: foundOrder.updatedAt });
                    }
                    setMessages(initialMsgs);
                }

                // Check if already reviewed
                if (foundOrder?.status === "delivered") {
                    try {
                        const rv = await API.get(`/reviews/check/${orderId}`);
                        setReviewed(rv.data.reviewed);
                    } catch {}
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchOrder();
    }, [orderId]);

    // Socket setup immediately on mount
    useEffect(() => {
        const socket = io(`http://${window.location.hostname}:5000`);
        socketRef.current = socket;

        socket.emit("joinOrderRoom", orderId);

        socket.on("orderUpdated", (updatedOrder) => {
            if (updatedOrder._id === orderId) {
                setOrder(prev => prev ? { ...prev, status: updatedOrder.status, staffNote: updatedOrder.staffNote } : prev);
                
                // If staff updated the note via a different screen, update our chat
                if (updatedOrder.staffNote) {
                    setMessages(prev => {
                        const hasStaffNote = prev.some(m => m.text === updatedOrder.staffNote);
                        if (!hasStaffNote) {
                            return [...prev, { text: updatedOrder.staffNote, sender: "staff", timestamp: new Date() }];
                        }
                        return prev;
                    });
                }

                if (updatedOrder.status === "delivered") {
                    toast.success("🎉 Your order has been delivered! Enjoy your meal.");
                    setTimeout(() => setShowReviewModal(true), 2000);
                }
                if (updatedOrder.status === "cancelled") {
                    toast.error("Your order has been cancelled.");
                }
            }
        });

        socket.on("receiveMessage", (msg) => {
            setMessages(prev => [...prev, msg]);
        });

        // 🔥 Live delivery boy status updates
        socket.on("deliveryStatusUpdated", ({ orderId: oid, status, staffName }) => {
            if (oid === orderId) {
                setDeliveryStatus(status);
                const labels = { accepted: "Delivery accepted", picked_up: "Order picked up", on_the_way: "On the way!", nearby: "Almost there!", delivered: "Delivered!" };
                toast.info(`🏍️ ${staffName || "Delivery"}: ${labels[status] || status}`);
            }
        });

        return () => socket.disconnect();
    }, [orderId]);

    const sendMessage = (e) => {
        e.preventDefault();
        if (!chatMsg.trim() || !socketRef.current) return;

        const newMsg = {
            text: chatMsg,
            sender: "customer",
            orderId,
            timestamp: new Date()
        };
        socketRef.current.emit("sendMessage", {
            orderId,
            message: newMsg,
            restaurantId: order?.restaurantId?._id || order?.restaurantId,
            tableNumber: order?.tableNumber
        });
        setMessages(prev => [...prev, newMsg]);
        setChatMsg("");
    };

    const callStaff = () => {
        if (!socketRef.current || !order?.restaurantId) return;

        setCallingStaff(true);
        const callMsg = {
            text: order.tableNumber?.includes("Home Delivery")
                ? "Customer needs help with delivery order"
                : "Customer is requesting table assistance",
            sender: "customer",
            orderId,
            timestamp: new Date()
        };
        socketRef.current.emit("sendTableCall", {
            restaurantId: order.restaurantId?._id || order.restaurantId,
            table: order.tableNumber || "Home Delivery",
            message: callMsg
        });
        setMessages(prev => [...prev, { text: "📣 Staff has been notified!", sender: "system", timestamp: new Date() }]);
        setTimeout(() => setCallingStaff(false), 5000);
    };

    const handleCancelOrder = async () => {
        if (!window.confirm("Are you sure you want to cancel this order?")) return;
        setCancelling(true);
        try {
            await API.patch(`/orders/${orderId}/cancel`);
            toast.success("Order cancelled successfully");
            setOrder(prev => prev ? { ...prev, status: "cancelled" } : prev);
        } catch (err) {
            toast.error(err.response?.data?.message || "Cannot cancel this order");
        } finally {
            setCancelling(false);
        }
    };

    const submitReview = async () => {
        if (reviewRating === 0) {
            toast.error("Please select a star rating");
            return;
        }
        setSubmittingReview(true);
        try {
            await API.post("/reviews", {
                orderId,
                restaurantId: order?.restaurantId?._id || order?.restaurantId,
                rating: reviewRating,
                comment: reviewComment,
                userName: JSON.parse(localStorage.getItem("user") || "{}").name
            });
            toast.success("Thank you for your review! ⭐");
            setReviewed(true);
            setShowReviewModal(false);
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to submit review");
        } finally {
            setSubmittingReview(false);
        }
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary" /></div>;
    }

    if (!order) {
        return (
            <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-6 text-center">
                <Package className="w-16 h-16 text-gray-600 mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h2>
                <button onClick={() => navigate("/orders/status")} className="mt-6 glass-button">
                    <ArrowLeft className="w-4 h-4" /> View Live Orders
                </button>
            </div>
        );
    }

    const statuses = [
        { id: "pending", label: "Order Placed", icon: Clock },
        { id: "preparing", label: "Preparing", icon: ChefHat },
        { id: "ready", label: "Ready to Serve", icon: Package },
        { id: "delivered", label: "Completed", icon: CheckCircle2 }
    ];

    const isCancelled = order.status === "cancelled";
    const isDelivered = order.status === "delivered";
    const currentStatusIndex = isCancelled ? -1 : statuses.findIndex(s => s.id === order.status);

    return (
        <div className="min-h-[calc(100vh-4rem)] p-6 max-w-3xl mx-auto">
            <button onClick={() => navigate("/orders/status")} className="mb-8 flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to Live Orders
            </button>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-8 space-y-8">

                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-200 pb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-1">Order #{order._id.slice(-6).toUpperCase()}</h1>
                        <p className="text-gray-500 text-sm">
                            {order.tableNumber?.includes("Home Delivery") ? "Type: Home Delivery" : `Table: ${order.tableNumber || "Takeaway"}`}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-500">Total</p>
                        <p className="text-2xl font-bold text-brand-gold">₹{order.totalAmount?.toFixed(2)}</p>
                    </div>
                </div>

                {/* Cancelled Banner */}
                {isCancelled && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
                        <XCircle className="w-6 h-6 text-red-400 shrink-0" />
                        <div>
                            <p className="font-bold text-red-300">Order Cancelled</p>
                            <p className="text-gray-500 text-sm">This order has been cancelled.</p>
                        </div>
                    </div>
                )}

                {/* Live Delivery Status — only for Home Delivery orders */}
                {order.tableNumber === "Home Delivery" && !isCancelled && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-5">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Bike className="w-5 h-5 text-blue-400 animate-bounce" />
                            Live Delivery Tracking
                        </h3>
                        <div className="space-y-3">
                            {[
                                { key: "accepted", label: "Order Accepted", emoji: "✅" },
                                { key: "picked_up", label: "Order Picked Up", emoji: "📦" },
                                { key: "on_the_way", label: "On the Way", emoji: "🏍️" },
                                { key: "nearby", label: "Almost There!", emoji: "📍" },
                                { key: "delivered", label: "Delivered!", emoji: "🎉" },
                            ].map((step, i) => {
                                const statusOrder = ["accepted", "picked_up", "on_the_way", "nearby", "delivered"];
                                const currentIdx = deliveryStatus ? statusOrder.indexOf(deliveryStatus) : -1;
                                const stepIdx = statusOrder.indexOf(step.key);
                                const isDone = currentIdx >= stepIdx;
                                const isCurr = currentIdx === stepIdx;
                                return (
                                    <div key={step.key} className={`flex items-center gap-3 p-2.5 rounded-lg transition-all ${
                                        isDone ? "bg-blue-500/10" : "opacity-40"
                                    }`}>
                                        <span className={`text-xl ${isCurr ? "animate-bounce" : ""}`}>{step.emoji}</span>
                                        <span className={`text-sm font-medium ${isDone ? "text-gray-900" : "text-gray-500"}`}>{step.label}</span>
                                        {isCurr && <span className="ml-auto text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full font-bold animate-pulse">LIVE</span>}
                                        {isDone && !isCurr && <span className="ml-auto text-green-400 text-xs">✓</span>}
                                    </div>
                                );
                            })}
                        </div>
                        {!deliveryStatus && (
                            <p className="text-xs text-gray-500 mt-3 text-center">Waiting for delivery staff to accept your order...</p>
                        )}
                    </motion.div>
                )}

                {/* Progress Tracker */}
                {!isCancelled && (
                    <div className="relative">
                        <div className="absolute top-6 left-0 w-full h-1 bg-gray-50 rounded-full" />
                        <div
                            className="absolute top-6 left-0 h-1 bg-brand-primary rounded-full transition-all duration-700"
                            style={{ width: `${(currentStatusIndex / (statuses.length - 1)) * 100}%` }}
                        />
                        <div className="relative flex justify-between">
                            {statuses.map((status, index) => {
                                const Icon = status.icon;
                                const isCompleted = index <= currentStatusIndex;
                                const isCurrent = index === currentStatusIndex;
                                return (
                                    <div key={status.id} className="flex flex-col items-center">
                                        <motion.div
                                            initial={false}
                                            animate={{
                                                scale: isCurrent ? 1.2 : 1,
                                                backgroundColor: isCompleted ? '#e63946' : '#1a1a1a',
                                                borderColor: isCompleted ? '#e63946' : '#333'
                                            }}
                                            className={`w-12 h-12 rounded-full border-4 flex items-center justify-center relative z-10 ${isCompleted ? 'text-gray-900' : 'text-gray-500'}`}
                                        >
                                            <Icon className="w-5 h-5" />
                                            {isCurrent && <span className="absolute -inset-2 rounded-full border-2 border-brand-primary/50 animate-ping" />}
                                        </motion.div>
                                        <span className={`mt-3 text-xs font-medium text-center ${isCompleted ? 'text-gray-900' : 'text-gray-500'}`}>{status.label}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Actions row */}
                <div className="flex flex-wrap gap-3">
                    {/* Cancel button - only for pending */}
                    {order.status === "pending" && (
                        <button
                            onClick={handleCancelOrder}
                            disabled={cancelling}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all text-sm font-bold disabled:opacity-50"
                        >
                            <XCircle className="w-4 h-4" />
                            {cancelling ? "Cancelling..." : "Cancel Order"}
                        </button>
                    )}

                    {/* Review button - for delivered, not yet reviewed */}
                    {isDelivered && !reviewed && (
                        <button
                            onClick={() => setShowReviewModal(true)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-gold/10 border border-brand-gold/30 text-brand-gold hover:bg-brand-gold/20 transition-all text-sm font-bold"
                        >
                            <Star className="w-4 h-4" />
                            Leave a Review
                        </button>
                    )}
                    {isDelivered && reviewed && (
                        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm font-bold">
                            <ThumbsUp className="w-4 h-4" /> Review Submitted
                        </div>
                    )}
                </div>

                {/* Order Items + Chat */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Items */}
                    <div className="bg-brand-light rounded-xl p-6 border border-gray-100">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Store className="w-5 h-5 text-brand-primary" /> Order Items
                        </h3>
                        <div className="space-y-3">
                            {order.items?.map((item, i) => (
                                <div key={i} className="flex justify-between items-center text-sm">
                                    <div className="flex gap-3">
                                        <span className="text-gray-500">{item.quantity}x</span>
                                        <span className="text-gray-900">{item.name}</span>
                                    </div>
                                    <span className="text-gray-500">₹{(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between">
                            <span className="text-gray-500 text-sm">Total</span>
                            <span className="text-gray-900 font-bold">₹{order.totalAmount?.toFixed(2)}</span>
                        </div>
                        
                        {/* Static notes removed in favor of live chat box */}
                    </div>

                    {/* Live Chat */}
                    <div className="bg-brand-light rounded-xl border border-gray-100 flex flex-col h-[380px]">
                        <div className="p-4 border-b border-gray-100 bg-gray-50 rounded-t-xl flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <MessageCircle className="w-5 h-5 text-brand-primary" />
                                <h3 className="font-bold text-gray-900 text-sm">Chat with Restaurant</h3>
                            </div>
                            <button
                                onClick={callStaff}
                                disabled={callingStaff}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    callingStaff
                                    ? "bg-gray-600/50 text-gray-500 cursor-not-allowed"
                                    : "bg-brand-primary/20 text-brand-primary hover:bg-brand-primary hover:text-gray-900 border border-brand-primary/30"
                                }`}
                            >
                                <BellRing className={`w-3.5 h-3.5 ${callingStaff ? "" : "animate-bounce"}`} />
                                {callingStaff ? "Notified!" : "Call Staff"}
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {messages.length === 0 && (
                                <p className="text-center text-gray-600 text-xs mt-8">
                                    Chat with kitchen for order changes, special requests, or questions
                                </p>
                            )}
                            {messages.map((msg, i) => (
                                <div key={i} className={`flex ${msg.sender === 'customer' ? 'justify-end' : msg.sender === 'system' ? 'justify-center' : 'justify-start'}`}>
                                    {msg.sender === 'system' ? (
                                        <span className="text-xs text-gray-500 bg-gray-50 px-3 py-1 rounded-full">{msg.text}</span>
                                    ) : (
                                        <div>
                                            {msg.sender !== 'customer' && (
                                                <p className="text-xs text-gray-500 mb-1 ml-1">
                                                    {msg.sender === 'staff' ? '👨‍🍳 Staff' : '🧑‍🍳 Kitchen'}
                                                </p>
                                            )}
                                            <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${msg.sender === 'customer' ? 'bg-brand-primary text-gray-900 rounded-br-sm' : 'bg-gray-100 text-gray-800 rounded-bl-sm'}`}>
                                                {msg.text}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                            <div ref={chatEndRef} />
                        </div>

                        <form onSubmit={sendMessage} className="p-3 bg-gray-50 rounded-b-xl flex gap-2 border-t border-gray-100">
                            <input
                                type="text"
                                value={chatMsg}
                                onChange={(e) => setChatMsg(e.target.value)}
                                placeholder="Message kitchen..."
                                className="flex-1 bg-brand-light border border-gray-200 rounded-full px-4 py-2 text-sm text-gray-900 focus:outline-none focus:border-brand-primary"
                            />
                            <button type="submit" className="w-9 h-9 rounded-full bg-brand-primary flex items-center justify-center text-gray-900 shrink-0 hover:bg-brand-primaryDark">
                                <Send className="w-4 h-4" />
                            </button>
                        </form>
                    </div>
                </div>
            </motion.div>

            {/* Review Modal */}
            <AnimatePresence>
                {showReviewModal && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-brand-light border border-gray-200 rounded-2xl w-full max-w-md p-8 relative"
                        >
                            <button onClick={() => setShowReviewModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-gray-900">
                                <X className="w-5 h-5" />
                            </button>

                            <div className="text-center mb-6">
                                <div className="w-16 h-16 bg-brand-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Star className="w-8 h-8 text-brand-gold" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900">How was your meal?</h2>
                                <p className="text-gray-500 text-sm mt-1">Your feedback helps us improve</p>
                            </div>

                            {/* Star Rating */}
                            <div className="flex justify-center gap-3 mb-6">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <button
                                        key={star}
                                        onClick={() => setReviewRating(star)}
                                        onMouseEnter={() => setReviewHover(star)}
                                        onMouseLeave={() => setReviewHover(0)}
                                        className="transition-transform hover:scale-110"
                                    >
                                        <Star
                                            className={`w-10 h-10 transition-colors ${
                                                star <= (reviewHover || reviewRating)
                                                ? 'fill-brand-gold text-brand-gold'
                                                : 'text-gray-600'
                                            }`}
                                        />
                                    </button>
                                ))}
                            </div>

                            {reviewRating > 0 && (
                                <p className="text-center text-brand-gold text-sm font-bold mb-4">
                                    {["", "Poor 😞", "Fair 😐", "Good 😊", "Very Good 😃", "Excellent! 🤩"][reviewRating]}
                                </p>
                            )}

                            <textarea
                                value={reviewComment}
                                onChange={(e) => setReviewComment(e.target.value)}
                                placeholder="Tell us about your experience (optional)..."
                                rows={3}
                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-brand-primary resize-none mb-6"
                            />

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowReviewModal(false)}
                                    className="flex-1 py-3 rounded-xl font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 transition-colors"
                                >
                                    Skip
                                </button>
                                <button
                                    onClick={submitReview}
                                    disabled={submittingReview || reviewRating === 0}
                                    className="flex-1 py-3 rounded-xl font-bold text-gray-900 bg-brand-gold hover:bg-brand-gold/90 shadow-lg transition-colors disabled:opacity-50"
                                >
                                    {submittingReview ? "Submitting..." : "Submit Review"}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default OrderTracking;
