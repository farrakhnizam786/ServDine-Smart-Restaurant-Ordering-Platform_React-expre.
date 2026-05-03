import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import { toast } from "react-toastify";
import {
    CheckCircle2, Search, Store, Receipt, XCircle,
    Star, MessageSquare, Send, ChevronDown, ChevronUp, Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ⭐ Star Rating Component
function StarRating({ value, onChange, size = "w-6 h-6", readOnly = false }) {
    const [hovered, setHovered] = useState(0);
    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
                <button
                    key={n}
                    type="button"
                    disabled={readOnly}
                    onClick={() => !readOnly && onChange && onChange(n)}
                    onMouseEnter={() => !readOnly && setHovered(n)}
                    onMouseLeave={() => !readOnly && setHovered(0)}
                    className={`transition-transform ${!readOnly ? "hover:scale-110 cursor-pointer" : "cursor-default"}`}
                >
                    <Star
                        className={`${size} transition-colors ${
                            n <= (hovered || value)
                                ? "fill-brand-gold text-brand-gold"
                                : "text-gray-300"
                        }`}
                    />
                </button>
            ))}
        </div>
    );
}

// 💬 Review Box for a single order
function ReviewBox({ order }) {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [existingReview, setExistingReview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        const checkExisting = async () => {
            try {
                const res = await API.get(`/reviews/check/${order._id}`);
                if (res.data.reviewed) {
                    setExistingReview(res.data.review);
                    setSubmitted(true);
                }
            } catch {
                // silently fail
            } finally {
                setChecking(false);
            }
        };
        checkExisting();
    }, [order._id]);

    const handleSubmit = async () => {
        if (!rating) return toast.error("Please select a star rating");
        setLoading(true);
        try {
            await API.post("/reviews", {
                orderId: order._id,
                restaurantId: order.restaurantId?._id || order.restaurantId,
                rating,
                comment,
                userName: user.name,
            });
            toast.success("Review submitted! Thank you 🎉");
            setSubmitted(true);
            setExistingReview({ rating, comment });
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to submit review");
        } finally {
            setLoading(false);
        }
    };

    if (checking) return <div className="flex items-center gap-2 text-xs text-gray-400 mt-4"><Loader2 className="w-3 h-3 animate-spin" /> Loading review...</div>;

    if (submitted && existingReview) {
        return (
            <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2 mb-1">
                    <StarRating value={existingReview.rating} readOnly size="w-4 h-4" />
                    <span className="text-xs text-gray-400">Your review</span>
                </div>
                {existingReview.comment && (
                    <p className="text-sm text-gray-600 italic">"{existingReview.comment}"</p>
                )}
                <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Review submitted
                </p>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 pt-4 border-t border-gray-100 space-y-3"
        >
            <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-brand-primary" />
                Rate your experience
            </p>
            <StarRating value={rating} onChange={setRating} />
            <textarea
                rows={2}
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Share your thoughts (optional)..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 resize-none focus:outline-none focus:border-brand-primary"
            />
            <button
                onClick={handleSubmit}
                disabled={loading || !rating}
                className="flex items-center gap-2 bg-brand-primary text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-brand-primaryDark transition-colors disabled:opacity-50"
            >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Submit Review
            </button>
        </motion.div>
    );
}

// 📋 Single Order Card
function OrderCard({ order, showReview }) {
    const [expanded, setExpanded] = useState(false);
    const isCancelled = order.status === "cancelled";

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`glass-panel overflow-hidden ${isCancelled ? "opacity-80" : ""}`}
        >
            {/* Header */}
            <div className={`p-5 border-b flex flex-col md:flex-row justify-between md:items-center gap-4 ${isCancelled ? "bg-red-50/50 border-red-100" : "bg-gray-50 border-gray-100"}`}>
                <div className="flex items-center gap-4">
                    {order.restaurantId?.image ? (
                        <img src={order.restaurantId.image} alt="Restaurant" className="w-12 h-12 rounded-xl object-cover" />
                    ) : (
                        <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center border border-gray-100">
                            <Store className="w-6 h-6 text-gray-400" />
                        </div>
                    )}
                    <div>
                        <h3 className="font-bold text-lg text-gray-900">{order.restaurantId?.name || "Restaurant"}</h3>
                        <p className="text-sm text-gray-500">
                            {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} at {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                    </div>
                </div>
                {isCancelled ? (
                    <span className="inline-flex items-center gap-1.5 bg-red-500/10 text-red-500 border border-red-200 px-3 py-1.5 rounded-full text-sm font-semibold">
                        <XCircle className="w-4 h-4" /> Cancelled
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1.5 bg-green-500/10 text-green-500 border border-green-200 px-3 py-1.5 rounded-full text-sm font-semibold">
                        <CheckCircle2 className="w-4 h-4" /> Delivered
                    </span>
                )}
            </div>

            {/* Body */}
            <div className="p-5">
                {/* Items summary */}
                <div className="space-y-2 mb-4">
                    {(expanded ? order.items : order.items.slice(0, 3)).map((item, i) => (
                        <div key={i} className="flex justify-between items-center text-sm">
                            <div className="flex gap-3">
                                <span className="text-brand-gold font-semibold">{item.quantity}x</span>
                                <span className="text-gray-700">{item.name}</span>
                            </div>
                            <span className="text-gray-500">₹{item.price * item.quantity}</span>
                        </div>
                    ))}
                    {order.items.length > 3 && (
                        <button
                            onClick={() => setExpanded(!expanded)}
                            className="text-xs text-brand-primary flex items-center gap-1 hover:underline mt-1"
                        >
                            {expanded ? <><ChevronUp className="w-3 h-3" /> Show less</> : <><ChevronDown className="w-3 h-3" /> +{order.items.length - 3} more items</>}
                        </button>
                    )}
                </div>

                {/* Footer row */}
                <div className="border-t border-gray-100 pt-4 flex justify-between items-center">
                    <div>
                        <p className="text-xs text-gray-400">Order ID: #{order._id.slice(-6).toUpperCase()}</p>
                        <p className="text-xs text-brand-primary mt-0.5">
                            {order.tableNumber?.includes("Home Delivery") ? "🏠 Home Delivery" : `🪑 Table ${order.tableNumber || "Takeaway"}`}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-400">Total Paid</p>
                        <p className="text-xl font-bold text-gray-900">₹{order.totalAmount}</p>
                    </div>
                </div>

                {/* Rating Box — only for delivered orders */}
                {showReview && !isCancelled && <ReviewBox order={order} />}
            </div>
        </motion.div>
    );
}

function OrderHistory() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState("completed");

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const res = await API.get("/orders/customer");
                const all = (res.data.orders || []).filter(
                    o => o.status === "delivered" || o.status === "cancelled"
                );
                setOrders(all);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, []);

    const completed = orders.filter(o => o.status === "delivered");
    const cancelled = orders.filter(o => o.status === "cancelled");

    const filterBySearch = (list) =>
        list.filter(o =>
            (o.restaurantId?.name || "").toLowerCase().includes(search.toLowerCase()) ||
            o._id.toLowerCase().includes(search.toLowerCase())
        );

    const displayList = filterBySearch(activeTab === "completed" ? completed : cancelled);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary" /></div>;
    }

    return (
        <div className="min-h-screen p-6 max-w-4xl mx-auto pt-24">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Order History</h1>
                <p className="text-gray-500 mt-1">View past orders, rate your experience</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-3 mb-6">
                <button
                    onClick={() => setActiveTab("completed")}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all border ${activeTab === "completed" ? "bg-green-500 text-white border-green-500 shadow-lg" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`}
                >
                    <CheckCircle2 className="w-4 h-4" />
                    Completed
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${activeTab === "completed" ? "bg-white/30 text-white" : "bg-green-100 text-green-600"}`}>{completed.length}</span>
                </button>
                <button
                    onClick={() => setActiveTab("cancelled")}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all border ${activeTab === "cancelled" ? "bg-red-500 text-white border-red-500 shadow-lg" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`}
                >
                    <XCircle className="w-4 h-4" />
                    Cancelled
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${activeTab === "cancelled" ? "bg-white/30 text-white" : "bg-red-100 text-red-600"}`}>{cancelled.length}</span>
                </button>
            </div>

            {/* Search */}
            {orders.length > 0 && (
                <div className="mb-6 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by restaurant or order ID..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-2xl pl-12 pr-4 py-3.5 text-gray-900 focus:outline-none focus:border-brand-primary shadow-sm"
                    />
                </div>
            )}

            {/* Orders List */}
            {displayList.length === 0 ? (
                <div className="text-center py-20 glass-panel">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                        <Receipt className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-medium text-gray-700">
                        No {activeTab} orders{search ? ` matching "${search}"` : ""}
                    </h3>
                    <p className="text-gray-400 mt-2 text-sm">
                        {activeTab === "completed" ? "Your delivered orders will appear here." : "Cancelled orders will appear here."}
                    </p>
                </div>
            ) : (
                <div className="grid gap-5">
                    <AnimatePresence mode="wait">
                        {displayList.map(order => (
                            <OrderCard
                                key={order._id}
                                order={order}
                                showReview={activeTab === "completed"}
                            />
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}

export default OrderHistory;
