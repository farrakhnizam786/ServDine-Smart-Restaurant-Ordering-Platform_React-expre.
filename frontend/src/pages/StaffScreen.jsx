import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import { toast } from "react-toastify";
import { io } from "socket.io-client";
import { Clock, ChefHat, CheckCircle2, Package, Search, MessageCircle, Send, X, BellRing, Bell, LogOut, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function Orders() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");
    const [tick, setTick] = useState(0);
    const [incomingOrder, setIncomingOrder] = useState(null);
    const [isAvailable, setIsAvailable] = useState(() => {
        const saved = localStorage.getItem("staff_available");
        return saved !== null ? JSON.parse(saved) : true;
    });
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const [staffList, setStaffList] = useState([]);
    const [selectedStaff, setSelectedStaff] = useState(user.role === 'staff' ? user._id : "");
    const isFreeRef = useRef(isAvailable);
    
    // Chat state
    const [activeChat, setActiveChat] = useState(null); // Either an orderId or { table, restaurantId }
    const [messages, setMessages] = useState({}); // Keyed by orderId or "table_X"
    const [chatMsg, setChatMsg] = useState("");
    const [socket, setSocket] = useState(null);
    const chatEndRef = useRef(null);

    // Table calls
    const [tableCalls, setTableCalls] = useState([]);
    const [incomingCall, setIncomingCall] = useState(null);
    // Notifications panel
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [replyText, setReplyText] = useState({});

    const addNotification = (text, type = 'info') => {
        const notif = { id: Date.now(), text, type, time: new Date() };
        setNotifications(prev => [notif, ...prev].slice(0, 50));
        setUnreadCount(prev => prev + 1);
    };

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, activeChat]);

    useEffect(() => {
        localStorage.setItem("staff_available", JSON.stringify(isAvailable));
        isFreeRef.current = isAvailable;
        // Sync to backend so admin panel reflects real-time status
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        if (user._id) {
            API.put(`/admin/staff/${user._id}/availability`, { isAvailable }).catch(() => {});
        }
    }, [isAvailable]);

    useEffect(() => {
        const interval = setInterval(() => setTick(t => t + 1), 60000); // 1 min tick
        return () => clearInterval(interval);
    }, []);

    const fetchOrders = async () => {
        try {
            const res = await API.get("/orders");
            setOrders(res.data.orders || res.data);
            if (user.role !== 'staff') {
                const s = await API.get("/admin/staff");
                setStaffList(s.data.filter(u => u.role === 'staff' || u.role === 'admin'));
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to fetch data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();

        const newSocket = io(`http://${window.location.hostname}:5000`);
        setSocket(newSocket);
        const user = JSON.parse(localStorage.getItem("user"));

        if (user?.restaurantId) {
            newSocket.emit("joinRestaurant", user.restaurantId);
            
            newSocket.on("newOrder", (order) => {
                // Ignore delivery/takeaway for normal staff
                if (order.tableNumber === "Takeaway" || order.tableNumber?.toLowerCase().includes("home delivery")) return;
                
                setOrders(prev => [order, ...prev]);
                
                if (isFreeRef.current) {
                    setIncomingOrder(order);
                    try {
                        const audio = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");
                        audio.play();
                    } catch(e) {}
                } else {
                    toast.info(`New order received for ${order.tableNumber || 'Home Delivery'}`);
                }
            });

            newSocket.on("orderUpdated", (updatedOrder) => {
                setOrders(prev => prev.map(o => o._id === updatedOrder._id ? { ...o, ...updatedOrder } : o));
                if (updatedOrder.status !== 'pending') {
                    setIncomingOrder(prev => prev?._id === updatedOrder._id ? null : prev);
                }
            });

            newSocket.on("receiveMessage", (msg) => {
                const key = msg.orderId || activeChat?.id;
                if (!key) return;
                setMessages(prev => ({
                    ...prev,
                    [key]: [...(prev[key] || []), msg]
                }));
                // Only show toast if chat is not currently open for this order
                addNotification(`💬 New message from customer (Order #${key.slice(-4).toUpperCase()})`, 'message');
                toast.info("New message from customer!");
            });

            // Global chat notification (from any active order) with table number
            newSocket.on("customerChatMessage", ({ orderId, tableNumber, message }) => {
                const shortId = orderId?.slice(-4).toUpperCase();
                const label = tableNumber?.includes("Home Delivery") ? "Home Delivery" : `Table ${tableNumber}`;
                addNotification(`💬 ${label} — "${message.slice(0, 40)}${message.length > 40 ? '...' : ''}"`, 'message');
                toast.info(`New message from ${label}`);
            });

            newSocket.on("receiveTableCall", ({ table, message }) => {
                if (!isFreeRef.current) return; // Only free staff get calls

                setMessages(prev => ({
                    ...prev,
                    [`table_${table}`]: [...(prev[`table_${table}`] || []), message]
                }));
                
                setTableCalls(prev => {
                    if (!prev.includes(table)) return [...prev, table];
                    return prev;
                });
                
                setIncomingCall({ table, message });
                addNotification(`🔔 Table ${table} is calling for help!`, 'call');
                toast.info(`Help request from Table ${table}`);
                try {
                    const audio = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");
                    audio.play();
                } catch(e) {}
            });

            newSocket.on("newOrder", (order) => {
                addNotification(`🆕 New order received — ${order.tableNumber || 'Home Delivery'}`, 'order');
            });

            newSocket.on("orderUpdated", (updatedOrder) => {
                addNotification(`📦 Order #${updatedOrder._id.slice(-4).toUpperCase()} updated → ${updatedOrder.status}`, 'update');
            });
        }

        return () => newSocket.disconnect();
    }, []);

    const openChat = (orderId) => {
        setActiveChat({ type: 'order', id: orderId });
        if (socket) {
            socket.emit("joinOrderRoom", orderId);
        }
    };

    const openTableChat = (table) => {
        const user = JSON.parse(localStorage.getItem("user"));
        setActiveChat({ type: 'table', table, restaurantId: user.restaurantId });
        if (socket) {
            socket.emit("joinTable", { restaurantId: user.restaurantId, table });
        }
        setTableCalls(prev => prev.filter(t => t !== table));
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
        } else if (activeChat.type === 'table') {
            const newMsg = { text: chatMsg, sender: "staff", timestamp: new Date() };
            socket.emit("sendTableMessage", { restaurantId: activeChat.restaurantId, table: activeChat.table, message: newMsg });
            
            setMessages(prev => ({
                ...prev,
                [`table_${activeChat.table}`]: [...(prev[`table_${activeChat.table}`] || []), newMsg]
            }));
        }
        setChatMsg("");
    };

    const updateStatus = async (id, status) => {
        if (!selectedStaff) {
            toast.error("Please select a staff member first!");
            return;
        }
        try {
            await API.put(`/orders/${id}`, { status });
            toast.success(`Order marked as ${status}`);
            setOrders(prev => prev.map(o => o._id === id ? { ...o, status, staffId: selectedStaff } : o));
            if (incomingOrder?._id === id) setIncomingOrder(null);
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to update status");
        }
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

    const filteredOrders = orders.filter(o => {
        // Exclude Delivery & Takeaway from normal staff
        if (o.tableNumber === "Takeaway" || o.tableNumber?.toLowerCase().includes("home delivery")) return false;
        
        if (filter === "active") return ["pending", "preparing", "ready"].includes(o.status);
        if (filter === "completed") return o.status === "delivered";
        if (filter === "cancelled") return o.status === "cancelled";
        if (filter === "all") return o.status !== "cancelled";
        return true;
    });

    const getStatusConfig = (status) => {
        switch (status) {
            case "pending": return { color: "text-yellow-500", bg: "bg-yellow-500/10", icon: Clock, label: "Pending" };
            case "preparing": return { color: "text-blue-500", bg: "bg-blue-500/10", icon: ChefHat, label: "Preparing" };
            case "ready": return { color: "text-brand-primary", bg: "bg-brand-primary/10", icon: Package, label: "Ready" };
            case "delivered": return { color: "text-green-500", bg: "bg-green-500/10", icon: CheckCircle2, label: "Completed" };
            case "cancelled": return { color: "text-red-500", bg: "bg-red-500/10", icon: X, label: "Cancelled" };
            default: return { color: "text-gray-500", bg: "bg-gray-500/10", icon: Clock, label: status };
        }
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div></div>;
    }

    const isFree = isAvailable && orders.filter(o => ["preparing", "ready"].includes(o.status) && o.staffId === selectedStaff).length === 0;
    isFreeRef.current = isFree;

    return (
        <div className="p-6 max-w-7xl mx-auto min-h-screen">
            {/* Top Navigation Bar */}
            <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-900 font-bold flex items-center gap-2 text-sm transition-colors">
                    <ChevronLeft className="w-4 h-4"/> Back
                </button>
                <div className="flex items-center gap-4">
                    {user.role !== 'staff' && (
                        <select value={selectedStaff} onChange={e => setSelectedStaff(e.target.value)} className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-brand-primary focus:border-brand-primary block w-48 p-2.5">
                            <option value="">Select Staff Member</option>
                            {staffList.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                        </select>
                    )}
                    <div onClick={() => navigate("/profile")} className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-red-400 flex items-center justify-center text-white font-bold text-xs cursor-pointer hover:opacity-80 transition-opacity" title="Edit Profile">
                        {(user?.name || "S")[0].toUpperCase()}
                    </div>
                    <button onClick={() => { localStorage.clear(); navigate("/login"); }} className="text-red-500 hover:text-red-700 font-bold flex items-center gap-2 text-sm transition-colors">
                        <LogOut className="w-4 h-4"/> Sign Out
                    </button>
                </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                        Staff Dashboard {user.restaurantName ? `- ${user.restaurantName}` : ''}
                    </h1>
                    <div className="flex items-center gap-4 mt-2">
                        <p className="text-gray-500">Manage live orders and customer requests</p>
                        <div className="h-4 w-px bg-gray-100"></div>
                        <p className="text-brand-gold font-medium bg-brand-gold/10 px-3 py-1 rounded-full text-sm">
                            My Completed Orders: {orders.filter(o => o.status === "delivered" && o.staffId === selectedStaff).length}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Notification Bell */}
                    <button
                        onClick={() => { setShowNotifications(!showNotifications); setUnreadCount(0); }}
                        className="relative w-10 h-10 bg-brand-light/50 border border-gray-200 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors"
                    >
                        <Bell className="w-5 h-5 text-gray-700" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-primary text-gray-900 text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>
                    <div className="flex items-center gap-3 bg-brand-light/50 p-2 rounded-xl border border-gray-100">
                        <span className={`text-sm font-medium ${isAvailable ? 'text-green-400' : 'text-gray-500'}`}>
                            {isAvailable ? 'Active' : 'Inactive'}
                        </span>
                        <button 
                            onClick={() => setIsAvailable(!isAvailable)}
                            className={`w-12 h-6 rounded-full p-1 transition-colors relative ${isAvailable ? 'bg-green-500' : 'bg-gray-600'}`}
                        >
                            <div className={`w-4 h-4 bg-white rounded-full transition-transform shadow-md ${isAvailable ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                    </div>

                    <div className="flex bg-gray-200 p-1 rounded-xl border border-gray-100 overflow-x-auto">
                        {["all", "active", "completed", "cancelled"].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                                    filter === f
                                    ? "bg-white text-gray-900 shadow"
                                    : "text-gray-500 hover:text-gray-900"
                                } ${f === "cancelled" && filter !== "cancelled" ? "text-red-400" : ""}`}
                            >
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                                {f === "active" && <span className="ml-1 text-xs bg-yellow-400/20 text-yellow-600 px-1.5 rounded-full">{orders.filter(o => ["pending","preparing","ready"].includes(o.status) && o.tableNumber !== "Takeaway" && !o.tableNumber?.toLowerCase().includes("home delivery")).length}</span>}
                                {f === "cancelled" && <span className="ml-1 text-xs bg-red-400/20 text-red-500 px-1.5 rounded-full">{orders.filter(o => o.status === "cancelled" && o.tableNumber !== "Takeaway" && !o.tableNumber?.toLowerCase().includes("home delivery")).length}</span>}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            
            {/* Table Calls Section (Only for free staff) */}
            {isFree && tableCalls.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-4">
                        <BellRing className="w-5 h-5 text-brand-gold animate-pulse" /> Live Table Calls
                    </h2>
                    <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
                        {tableCalls.map((table) => (
                            <button
                                key={table}
                                onClick={() => openTableChat(table)}
                                className="glass-panel px-6 py-4 rounded-xl flex items-center gap-3 hover:bg-gray-50 transition-colors border-brand-primary/50 shadow-[0_0_15px_rgba(230,57,70,0.2)] whitespace-nowrap"
                            >
                                <span className="bg-brand-primary text-gray-900 w-10 h-10 rounded-full flex items-center justify-center font-bold">
                                    T{table}
                                </span>
                                <div className="text-left">
                                    <span className="block font-bold text-gray-900">Table {table}</span>
                                    <span className="text-xs text-brand-primary">Needs assistance</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {filteredOrders.length === 0 ? (
                <div className="text-center py-20 glass-panel">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                        <ChefHat className="w-10 h-10 text-gray-500" />
                    </div>
                    <h3 className="text-xl font-medium text-gray-700">No orders found</h3>
                    <p className="text-gray-500 mt-2">Waiting for new orders to arrive...</p>
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
                                    className={`glass-panel overflow-hidden flex flex-col transition-colors duration-500 ${order.status === 'pending' ? 'border-yellow-500/30 shadow-[0_0_20px_rgba(234,179,8,0.1)]' : ''}`}
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
                                        
                                        <div className="bg-brand-primary/20 border border-brand-primary/30 text-brand-primary px-3 py-1.5 rounded-lg text-sm font-bold text-center">
                                            <span className="block text-xs uppercase opacity-80 mb-0.5">
                                                {(order.tableNumber && order.tableNumber.includes("Home Delivery")) ? "Type" : "Table"}
                                            </span>
                                            {order.tableNumber || "Home Delivery"}
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
                                        
                                        {order.customerNote && (
                                            <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                                                <p className="text-xs text-red-400 font-bold mb-1 flex items-center gap-1">
                                                    <MessageCircle className="w-3 h-3" /> Customer Note
                                                </p>
                                                <p className="text-sm text-gray-800">"{order.customerNote}"</p>
                                            </div>
                                        )}

                                        {order.staffNote && (
                                            <div className="mt-2 bg-brand-primary/10 border border-brand-primary/20 rounded-lg p-3">
                                                <p className="text-xs text-brand-primary font-bold mb-1 flex items-center gap-1">
                                                    <ChefHat className="w-3 h-3" /> Our Note
                                                </p>
                                                <p className="text-sm text-gray-800">"{order.staffNote}"</p>
                                            </div>
                                        )}

                                        <div className="mt-4 flex gap-2">
                                            <input 
                                                type="text" 
                                                value={replyText[order._id] || ""}
                                                onChange={(e) => setReplyText(prev => ({...prev, [order._id]: e.target.value}))}
                                                placeholder="Send a note to customer..."
                                                className="flex-1 bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-brand-primary"
                                                onKeyDown={(e) => e.key === 'Enter' && sendReply(order._id)}
                                            />
                                            <button 
                                                onClick={() => sendReply(order._id)}
                                                className="bg-brand-primary text-white px-3 py-2 rounded-lg hover:bg-brand-primaryDark transition-colors"
                                            >
                                                Send
                                            </button>
                                        </div>
                                        
                                        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                                            <span className="text-gray-500 font-medium">Total Amount</span>
                                            <span className="text-xl font-bold text-gray-900">₹{order.totalAmount}</span>
                                        </div>
                                    </div>

                                    <div className="p-5 bg-brand-light/50 border-t border-gray-100">
                                        <div className="flex gap-2">
                                            <div className="flex gap-2">
                                                {order.status === "pending" && (
                                                    <button 
                                                        onClick={() => updateStatus(order._id, "preparing")}
                                                        className="flex-1 bg-blue-600 hover:bg-blue-500 text-gray-900 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                                                    >
                                                        <ChefHat className="w-4 h-4" /> Start
                                                    </button>
                                                )}
                                                {order.status === "preparing" && (
                                                    <button 
                                                        onClick={() => updateStatus(order._id, "ready")}
                                                        className="flex-1 bg-brand-primary hover:bg-brand-primaryDark text-gray-900 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                                                    >
                                                        <Package className="w-4 h-4" /> Ready
                                                    </button>
                                                )}
                                                {order.status === "ready" && (
                                                    <button 
                                                        onClick={() => updateStatus(order._id, "delivered")}
                                                        className="flex-1 bg-green-600 hover:bg-green-500 text-gray-900 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                                                    >
                                                        <CheckCircle2 className="w-4 h-4" /> Complete
                                                    </button>
                                                )}
                                                {order.status === "delivered" && order.deliveredAt && (new Date() - new Date(order.deliveredAt)) < 5 * 60 * 1000 && (
                                                    <button 
                                                        onClick={() => updateStatus(order._id, "ready")}
                                                        className="flex-1 bg-gray-600 hover:bg-gray-500 text-gray-900 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                                                    >
                                                        <Clock className="w-4 h-4" /> Undo Complete
                                                    </button>
                                                )}
                                                <button 
                                                    onClick={() => openChat(order._id)}
                                                    className="w-10 h-10 bg-gray-100 hover:bg-white/20 text-gray-900 rounded-lg flex items-center justify-center transition-colors shrink-0"
                                                >
                                                    <MessageCircle className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </motion.div>
            )}
            {/* Notifications Drawer */}
            <AnimatePresence>
                {showNotifications && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed right-0 top-16 bottom-0 w-80 z-50 bg-brand-light border-l border-gray-200 flex flex-col shadow-2xl"
                        >
                            <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                    <Bell className="w-4 h-4 text-brand-primary" /> Notifications
                                    {notifications.length > 0 && (
                                        <span className="text-xs bg-brand-primary/20 text-brand-primary px-2 py-0.5 rounded-full">{notifications.length}</span>
                                    )}
                                </h3>
                                <div className="flex gap-2">
                                    {notifications.length > 0 && (
                                        <button onClick={() => setNotifications([])} className="text-xs text-gray-500 hover:text-gray-700">Clear all</button>
                                    )}
                                    <button onClick={() => setShowNotifications(false)} className="text-gray-500 hover:text-gray-900"><X className="w-4 h-4" /></button>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <p className="text-center text-gray-600 text-sm mt-12">No notifications yet</p>
                                ) : (
                                    notifications.map(n => (
                                        <div key={n.id} className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                                            n.type === 'call' ? 'border-l-4 border-l-brand-primary' :
                                            n.type === 'message' ? 'border-l-4 border-l-blue-500' :
                                            n.type === 'order' ? 'border-l-4 border-l-green-500' :
                                            'border-l-4 border-l-gray-600'
                                        }`}>
                                            <p className="text-gray-900 text-sm">{n.text}</p>
                                            <p className="text-gray-500 text-xs mt-1">{new Date(n.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

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
                                    <MessageCircle className="w-5 h-5 text-brand-primary" />
                                    <h3 className="font-bold text-gray-900">
                                        Chat with {activeChat.type === 'table' ? `Table ${activeChat.table}` : 'Customer'}
                                    </h3>
                                </div>
                                <button onClick={() => setActiveChat(null)} className="text-gray-500 hover:text-gray-900 transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {(messages[activeChat.type === 'table' ? `table_${activeChat.table}` : activeChat.id] || []).map((msg, i) => (
                                    <div key={i} className={`flex ${msg.sender === 'staff' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${msg.sender === 'staff' ? 'bg-blue-600 text-gray-900 rounded-br-sm' : 'bg-gray-100 text-gray-800 rounded-bl-sm'}`}>
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
                                    className="flex-1 bg-brand-light border border-gray-200 rounded-full px-4 py-2 text-sm text-gray-900 focus:outline-none focus:border-brand-primary"
                                />
                                <button type="submit" className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-gray-900 shrink-0 hover:bg-blue-500 transition-colors">
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
                            className="bg-brand-light border-2 border-brand-primary/50 shadow-[0_0_50px_rgba(230,57,70,0.3)] rounded-2xl w-full max-w-md p-6 relative overflow-hidden"
                        >
                            <div className="text-center mb-6 relative z-10">
                                <div className="w-20 h-20 bg-brand-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                                    <BellRing className="w-10 h-10 text-brand-primary" />
                                </div>
                                <h2 className="text-3xl font-bold text-gray-900 mb-2">New Order!</h2>
                                <p className="text-xl text-brand-gold font-medium">
                                    {incomingOrder.tableNumber && incomingOrder.tableNumber.includes("Home Delivery") ? "Home Delivery" : `Table ${incomingOrder.tableNumber || "Takeaway"}`}
                                </p>
                            </div>
                            
                            <div className="bg-gray-50 rounded-xl p-4 mb-6 relative z-10">
                                <p className="text-gray-500 text-sm mb-2 text-center">{incomingOrder.items.length} items • ₹{incomingOrder.totalAmount}</p>
                            </div>

                            <div className="flex gap-4 relative z-10">
                                <button 
                                    onClick={() => setIncomingOrder(null)}
                                    className="flex-1 py-3 rounded-xl font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 transition-colors"
                                >
                                    Dismiss
                                </button>
                                <button 
                                    onClick={() => updateStatus(incomingOrder._id, "preparing")}
                                    className="flex-1 py-3 rounded-xl font-bold text-gray-900 bg-brand-primary hover:bg-brand-primaryDark shadow-[0_0_20px_rgba(230,57,70,0.4)] transition-colors"
                                >
                                    Accept Order
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            {/* Incoming Call Popup */}
            <AnimatePresence>
                {incomingCall && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8, y: 50 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.8, y: 50 }}
                            className="bg-brand-light border-2 border-brand-primary/50 shadow-[0_0_50px_rgba(234,88,12,0.3)] rounded-2xl w-full max-w-md p-6 relative"
                        >
                            <div className="text-center mb-6">
                                <div className="w-20 h-20 bg-brand-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-ping">
                                    <BellRing className="w-10 h-10 text-brand-primary" />
                                </div>
                                <h2 className="text-3xl font-bold text-gray-900 mb-2">Table Call!</h2>
                                <p className="text-xl text-brand-gold font-medium">
                                    {incomingCall.table}
                                </p>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-center text-gray-800 text-sm">
                                "{incomingCall.message?.text || "Customer requested assistance"}"
                            </div>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setIncomingCall(null)}
                                    className="flex-1 py-3 rounded-xl font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 transition-colors"
                                >
                                    Dismiss
                                </button>
                                <button
                                    onClick={() => {
                                        setIncomingCall(null);
                                        openTableChat(incomingCall.table);
                                    }}
                                    className="flex-1 py-3 rounded-xl font-bold text-white bg-brand-primary hover:bg-brand-primaryDark shadow-[0_0_20px_rgba(234,88,12,0.4)] transition-colors"
                                >
                                    Chat with Table
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default Orders;
