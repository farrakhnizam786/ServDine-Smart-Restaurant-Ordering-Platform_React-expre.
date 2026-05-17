import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import { toast } from "react-toastify";
import { io } from "socket.io-client";
import { Clock, CheckCircle2, Package, MessageCircle, Send, X, Truck, BellRing, ShoppingBag, LogOut, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function DeliveryStaffScreen() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");
    const [incomingOrder, setIncomingOrder] = useState(null);
    const [isAvailable, setIsAvailable] = useState(() => {
        const saved = localStorage.getItem("delivery_available");
        return saved !== null ? JSON.parse(saved) : true;
    });
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const isFreeRef = useRef(isAvailable);
    const [location, setLocation] = useState(null);

    // Chat state
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState({});
    const [chatMsg, setChatMsg] = useState("");
    const [replyText, setReplyText] = useState({});
    const [socket, setSocket] = useState(null);
    const chatEndRef = useRef(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, activeChat]);

    useEffect(() => {
        localStorage.setItem("delivery_available", JSON.stringify(isAvailable));
        if (user._id) {
            API.put(`/admin/staff/${user._id}/availability`, { isAvailable }).catch(() => {});
        }
    }, [isAvailable]);

    // Request continuous location access for delivery tracking
    useEffect(() => {
        if ("geolocation" in navigator) {
            const watchId = navigator.geolocation.watchPosition(
                (position) => {
                    setLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
                    // Ready for future use: emit socket or API call here
                },
                (err) => console.warn("Location access denied or unavailable", err),
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
            return () => navigator.geolocation.clearWatch(watchId);
        }
    }, []);

    const fetchOrders = async () => {
        try {
            const res = await API.get("/orders");
            setOrders(res.data.orders || res.data);
        } catch (err) {
            console.error(err);
            toast.error("Failed to fetch orders");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();

        const newSocket = io(`http://${window.location.hostname}:5000`);
        setSocket(newSocket);

        if (user?.restaurantId) {
            newSocket.emit("joinRestaurant", user.restaurantId);

            newSocket.on("newOrder", (order) => {
                // Show home delivery AND all takeaway orders to delivery staff
                const isDeliveryOrder = order.tableNumber?.toLowerCase().includes("home delivery") || order.tableNumber === "Takeaway";

                if (!isDeliveryOrder) return;

                setOrders(prev => [order, ...prev]);

                if (isFreeRef.current) {
                    setIncomingOrder(order);
                    try {
                        const audio = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");
                        audio.play();
                    } catch(e) {}
                }
            });

            newSocket.on("orderUpdated", (updatedOrder) => {
                setOrders(prev => prev.map(o => o._id === updatedOrder._id ? { ...o, ...updatedOrder } : o));
                if (updatedOrder.status !== 'pending') {
                    setIncomingOrder(prev => prev?._id === updatedOrder._id ? null : prev);
                }
            });

            // Receive table calls (from kitchen)
            newSocket.on("receiveTableCall", ({ table, message }) => {
                if (!isFreeRef.current) return;
                setMessages(prev => ({
                    ...prev,
                    [`table_${table}`]: [...(prev[`table_${table}`] || []), message]
                }));
                toast.info(`Delivery alert: ${message.text}`);
                try {
                    const audio = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");
                    audio.play();
                } catch(e) {}
            });

            newSocket.on("receiveMessage", (msg) => {
                setMessages(prev => ({
                    ...prev,
                    [msg.orderId]: [...(prev[msg.orderId] || []), msg]
                }));
            });
        }

        return () => newSocket.disconnect();
    }, []);

    useEffect(() => {
        isFreeRef.current = isAvailable;
    }, [isAvailable]);

    const openChat = (orderId) => {
        setActiveChat({ type: 'order', id: orderId });
        if (socket) socket.emit("joinOrderRoom", orderId);
    };

    const sendMessage = (e) => {
        e.preventDefault();
        if (!chatMsg.trim() || !socket || !activeChat) return;
        if (activeChat.type === 'order') {
            const newMsg = { text: chatMsg, sender: "staff", timestamp: new Date(), orderId: activeChat.id };
            socket.emit("sendMessage", { orderId: activeChat.id, message: newMsg });
            setMessages(prev => ({
                ...prev,
                [activeChat.id]: [...(prev[activeChat.id] || []), newMsg]
            }));
        }
        setChatMsg("");
    };

    const sendReply = (orderId) => {
        if (!replyText[orderId] || !socket) return;
        socket.emit("sendMessage", {
            orderId,
            message: { text: replyText[orderId], sender: "staff", timestamp: new Date() },
            restaurantId: user.restaurantId
        });
        setReplyText(prev => ({ ...prev, [orderId]: "" }));
        toast.success("Note sent to customer!");
    };

    const updateStatus = async (id, status) => {
        try {
            await API.put(`/orders/${id}`, { status });
            toast.success(`Order marked as ${status}`);
            setOrders(prev => prev.map(o => o._id === id ? { ...o, status, staffId: user._id } : o));
            if (incomingOrder?._id === id) setIncomingOrder(null);
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to update status");
        }
    };

    // 🔥 Broadcast live delivery status to customer (home delivery orders only)
    const broadcastDeliveryStatus = (orderId, status) => {
        if (!socket) return;
        socket.emit("deliveryStatusUpdate", {
            orderId,
            status,
            staffName: user.name,
            restaurantId: user.restaurantId
        });
        toast.success(`Status "${status.replace(/_/g, ' ')}" sent to customer!`);
    };

    const filteredOrders = orders.filter(o => {
        // Ensure we only show delivery/takeaway
        const isDeliveryOrder = o.tableNumber?.toLowerCase().includes("home delivery") || o.tableNumber === "Takeaway";
        if (!isDeliveryOrder) return false;

        if (filter === "active") return ["pending", "preparing", "ready"].includes(o.status);
        if (filter === "completed") return o.status === "delivered";
        return true;
    });

    const getStatusConfig = (status) => {
        switch (status) {
            case "pending": return { color: "text-yellow-500", bg: "bg-yellow-500/10", icon: Clock, label: "Pending" };
            case "preparing": return { color: "text-blue-500", bg: "bg-blue-500/10", icon: Package, label: "Preparing" };
            case "ready": return { color: "text-brand-primary", bg: "bg-brand-primary/10", icon: Truck, label: "Ready for Pickup" };
            case "delivered": return { color: "text-green-500", bg: "bg-green-500/10", icon: CheckCircle2, label: "Delivered" };
            default: return { color: "text-gray-500", bg: "bg-gray-500/10", icon: Clock, label: status };
        }
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div></div>;
    }

    const isFree = isAvailable && orders.filter(o => ["preparing", "ready"].includes(o.status) && o.staffId === user._id).length === 0;

    return (
        <div className="p-6 max-w-7xl mx-auto min-h-screen">
            {/* Top Navigation Bar */}
            <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-900 font-bold flex items-center gap-2 text-sm transition-colors">
                    <ChevronLeft className="w-4 h-4"/> Back
                </button>
                <div className="flex items-center gap-4">
                    <div onClick={() => navigate("/profile")} className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-red-400 flex items-center justify-center text-white font-bold text-xs cursor-pointer hover:opacity-80 transition-opacity" title="Edit Profile">
                        {(user?.name || "D")[0].toUpperCase()}
                    </div>
                    <button onClick={() => { localStorage.clear(); navigate("/login"); }} className="text-red-500 hover:text-red-700 font-bold flex items-center gap-2 text-sm transition-colors">
                        <LogOut className="w-4 h-4"/> Sign Out
                    </button>
                </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                        <Truck className="w-8 h-8 text-purple-400" />
                        Delivery Dashboard {user.restaurantName ? `- ${user.restaurantName}` : ''}
                    </h1>
                    <div className="flex items-center gap-4 mt-2">
                        <p className="text-gray-500">Home delivery & takeaway orders</p>
                        <div className="h-4 w-px bg-gray-100"></div>
                        <span className="text-purple-400 font-medium bg-purple-400/10 px-3 py-1 rounded-full text-sm">
                            Active: {orders.filter(o => ["pending", "preparing", "ready"].includes(o.status)).length}
                        </span>
                        <span className="text-brand-gold font-medium bg-brand-gold/10 px-3 py-1 rounded-full text-sm">
                            Completed: {orders.filter(o => o.status === "delivered" && o.staffId === user._id).length}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Active/Inactive toggle */}
                    <div className="flex items-center gap-3 bg-brand-light/50 p-2 rounded-xl border border-gray-100">
                        <span className={`text-sm font-medium ${isAvailable ? 'text-green-400' : 'text-gray-500'}`}>
                            {isAvailable ? 'On Duty' : 'Off Duty'}
                        </span>
                        <button
                            onClick={() => setIsAvailable(!isAvailable)}
                            className={`w-12 h-6 rounded-full p-1 transition-colors relative ${isAvailable ? 'bg-green-500' : 'bg-gray-600'}`}
                        >
                            <div className={`w-4 h-4 bg-white rounded-full transition-transform shadow-md ${isAvailable ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                    </div>

                    <div className="flex bg-gray-500 p-1 rounded-xl border border-gray-100 backdrop-blur-md">
                        {["all", "active", "completed"].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                    filter === f ? "bg-gray-100 text-gray-900 shadow" : "text-gray-500 hover:text-gray-900"
                                }`}
                            >
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {filteredOrders.length === 0 ? (
                <div className="text-center py-20 glass-panel">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                        <Truck className="w-10 h-10 text-gray-500" />
                    </div>
                    <h3 className="text-xl font-medium text-gray-700">No delivery orders</h3>
                    <p className="text-gray-500 mt-2">Waiting for home delivery or takeaway orders...</p>
                </div>
            ) : (
                <motion.div layout className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    <AnimatePresence>
                        {filteredOrders.map((order) => {
                            const config = getStatusConfig(order.status);
                            const StatusIcon = config.icon;

                            return (
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    key={order._id}
                                    className={`glass-panel overflow-hidden flex flex-col ${order.status === 'ready' ? 'border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.1)]' : ''}`}
                                >
                                    <div className="p-5 border-b border-gray-100 flex justify-between items-start bg-gray-50">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-bold text-lg text-gray-900">
                                                    Order #{order._id.slice(-4).toUpperCase()}
                                                </h3>
                                                <span className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md ${config.bg} ${config.color}`}>
                                                    <StatusIcon className="w-3 h-3" /> {config.label}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500">
                                                {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>

                                        <div className={`px-3 py-1.5 rounded-lg text-sm font-bold text-center border ${
                                            order.tableNumber === "Takeaway" ? 'bg-brand-gold/20 border-brand-gold/30 text-brand-gold' : 'bg-purple-500/20 border-purple-500/30 text-purple-300'
                                        }`}>
                                            <span className="block text-xs uppercase opacity-80 mb-0.5">
                                                {order.tableNumber === "Takeaway" ? "Takeaway" : "Home Delivery"}
                                            </span>
                                            {order.tableNumber === "Takeaway" ? <ShoppingBag className="w-4 h-4 mx-auto" /> : <Truck className="w-4 h-4 mx-auto" />}
                                        </div>
                                    </div>

                                    <div className="p-5 flex-1">
                                        <ul className="space-y-3">
                                            {order.items.map((item, i) => (
                                                <li key={i} className="flex justify-between items-start gap-4">
                                                    <div className="flex gap-3">
                                                        <span className="font-semibold text-brand-gold">{item.quantity}x</span>
                                                        <span className="text-gray-800">{item.name}</span>
                                                    </div>
                                                    <span className="text-gray-500 font-medium">₹{item.price * item.quantity}</span>
                                                </li>
                                            ))}
                                        </ul>
                                        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                                            <span className="text-gray-500 font-medium">Total</span>
                                            <span className="text-xl font-bold text-gray-900">₹{order.totalAmount}</span>
                                        </div>
                                        
                                        {order.customerNote && (
                                            <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                                                <p className="text-xs text-red-400 font-bold mb-1 flex items-center gap-1">
                                                    <MessageCircle className="w-3 h-3" /> Customer Note
                                                </p>
                                                <p className="text-sm text-gray-800">"{order.customerNote}"</p>
                                            </div>
                                        )}

                                        {order.staffNote && (
                                            <div className="mt-2 bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
                                                <p className="text-xs text-purple-600 font-bold mb-1 flex items-center gap-1">
                                                    <Truck className="w-3 h-3" /> Our Note
                                                </p>
                                                <p className="text-sm text-gray-800">"{order.staffNote}"</p>
                                            </div>
                                        )}

                                        <div className="mt-4 flex gap-2">
                                            <input 
                                                type="text" 
                                                value={replyText[order._id] || ""}
                                                onChange={(e) => setReplyText(prev => ({...prev, [order._id]: e.target.value}))}
                                                placeholder="Send note to customer..."
                                                className="flex-1 bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-purple-400"
                                                onKeyDown={(e) => e.key === 'Enter' && sendReply(order._id)}
                                            />
                                            <button 
                                                onClick={() => sendReply(order._id)}
                                                className="bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-500 transition-colors"
                                            >
                                                Send
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-5 bg-brand-light/50 border-t border-gray-100">
                                        <div className="flex gap-2">
                                            {order.status === "ready" && (
                                                <button
                                                    onClick={() => updateStatus(order._id, "delivered")}
                                                    className="flex-1 bg-purple-600 hover:bg-purple-500 text-gray-900 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                                                >
                                                    <CheckCircle2 className="w-4 h-4" /> Mark Delivered
                                                </button>
                                            )}
                                            {order.status === "delivered" && (
                                                <div className="flex-1 flex items-center justify-center gap-2 text-green-400 text-sm font-bold py-2.5">
                                                    <CheckCircle2 className="w-4 h-4" /> Delivered ✓
                                                </div>
                                            )}
                                            <button
                                                onClick={() => openChat(order._id)}
                                                className="w-10 h-10 bg-gray-100 hover:bg-white/20 text-gray-900 rounded-lg flex items-center justify-center transition-colors shrink-0"
                                            >
                                                <MessageCircle className="w-4 h-4" />
                                            </button>
                                        </div>

                                        {/* 🔥 Live Delivery Status Broadcast — only for Home Delivery */}
                                        {order.tableNumber?.toLowerCase().includes("home delivery") && ["preparing", "ready"].includes(order.status) && (
                                            <div className="mt-3 pt-3 border-t border-gray-100">
                                                <p className="text-xs text-gray-500 mb-2 font-medium">📡 Update Customer Status:</p>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {[
                                                        { key: "accepted", label: "✅ Accepted" },
                                                        { key: "picked_up", label: "📦 Picked Up" },
                                                        { key: "on_the_way", label: "🏍️ On The Way" },
                                                        { key: "nearby", label: "📍 Nearby" },
                                                    ].map(s => (
                                                        <button key={s.key}
                                                            onClick={() => broadcastDeliveryStatus(order._id, s.key)}
                                                            className="text-xs py-2 px-3 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/20 hover:bg-purple-500/20 transition-colors font-medium">
                                                            {s.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </motion.div>
            )}

            {/* Chat Modal */}
            <AnimatePresence>
                {activeChat && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-brand-light border border-gray-200 rounded-2xl w-full max-w-md h-[500px] flex flex-col relative overflow-hidden shadow-2xl"
                        >
                            <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <MessageCircle className="w-5 h-5 text-purple-400" />
                                    <h3 className="font-bold text-gray-900">Chat with Customer</h3>
                                </div>
                                <button onClick={() => setActiveChat(null)} className="text-gray-500 hover:text-gray-900 transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {(messages[activeChat.id] || []).map((msg, i) => (
                                    <div key={i} className={`flex ${msg.sender === 'staff' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${msg.sender === 'staff' ? 'bg-purple-600 text-gray-900 rounded-br-sm' : 'bg-gray-100 text-gray-800 rounded-bl-sm'}`}>
                                            {msg.text}
                                        </div>
                                    </div>
                                ))}
                                <div ref={chatEndRef} />
                            </div>
                            <form onSubmit={sendMessage} className="p-3 bg-gray-50 border-t border-gray-200 flex gap-2">
                                <input
                                    type="text"
                                    value={chatMsg}
                                    onChange={(e) => setChatMsg(e.target.value)}
                                    placeholder="Reply..."
                                    className="flex-1 bg-brand-light border border-gray-200 rounded-full px-4 py-2 text-sm text-gray-900 focus:outline-none focus:border-purple-400"
                                />
                                <button type="submit" className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-gray-900 shrink-0 hover:bg-purple-500 transition-colors">
                                    <Send className="w-4 h-4" />
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Incoming Order Popup */}
            <AnimatePresence>
                {incomingOrder && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8, y: 50 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.8, y: 50 }}
                            className="bg-brand-light border-2 border-purple-500/50 shadow-[0_0_50px_rgba(168,85,247,0.3)] rounded-2xl w-full max-w-md p-6 relative"
                        >
                            <div className="text-center mb-6">
                                <div className="w-20 h-20 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                                    <Truck className="w-10 h-10 text-purple-400" />
                                </div>
                                <h2 className="text-3xl font-bold text-gray-900 mb-2">New Delivery Order!</h2>
                                <p className="text-xl text-brand-gold font-medium">
                                    {incomingOrder.tableNumber?.toLowerCase().includes("home delivery") ? "🏠 Home Delivery" : "🛍️ Takeaway"}
                                </p>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-4 mb-6">
                                <p className="text-gray-500 text-sm text-center">{incomingOrder.items?.length} items • ₹{incomingOrder.totalAmount}</p>
                            </div>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setIncomingOrder(null)}
                                    className="flex-1 py-3 rounded-xl font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 transition-colors"
                                >
                                    Dismiss
                                </button>
                                <button
                                    onClick={() => updateStatus(incomingOrder._id, "preparing")}
                                    className="flex-1 py-3 rounded-xl font-bold text-gray-900 bg-purple-600 hover:bg-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-colors"
                                >
                                    Accept Order
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default DeliveryStaffScreen;
