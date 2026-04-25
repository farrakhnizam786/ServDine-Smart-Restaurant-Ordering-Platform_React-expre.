import { useEffect, useState } from "react";
import API from "../api/axios";
import { toast } from "react-toastify";
import { io } from "socket.io-client";
import { Clock, ChefHat, CheckCircle2, Package, BellRing, Users, UserCheck, Truck, ShoppingBag, Bell, X, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function KitchenScreen() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");
    const [isRestaurantOpen, setIsRestaurantOpen] = useState(true);
    const [togglingOpen, setTogglingOpen] = useState(false);
    const [replyText, setReplyText] = useState({});
    const [activeStaff, setActiveStaff] = useState([]);
    const [callingStaff, setCallingStaff] = useState({}); // keyed by orderId
    const [settingDelivery, setSettingDelivery] = useState({}); // keyed by orderId
    const [socket, setSocket] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [incomingCall, setIncomingCall] = useState(null);
    const [tableCalls, setTableCalls] = useState([]);

    const addNotification = (text, type = 'info') => {
        setNotifications(prev => [{ id: Date.now(), text, type, time: new Date() }, ...prev].slice(0, 50));
        setUnreadCount(prev => prev + 1);
    };

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

    const fetchActiveStaff = async () => {
        try {
            const res = await API.get("/admin/staff/active");
            setActiveStaff(res.data);
        } catch (err) {
            console.error("Failed to fetch active staff", err);
        }
    };

    useEffect(() => {
        fetchOrders();
        fetchActiveStaff();
        // Fetch current restaurant open status
        const u = JSON.parse(localStorage.getItem("user") || "{}");
        if (u.restaurantId) {
            API.get(`/restaurant/${u.restaurantId}`).then(r => setIsRestaurantOpen(r.data.isOpen !== false)).catch(() => { });
        }

        // Refresh staff every 30 seconds
        const staffInterval = setInterval(fetchActiveStaff, 30000);

        const newSocket = io("http://localhost:5000");
        setSocket(newSocket);
        const user = JSON.parse(localStorage.getItem("user"));

        if (user?.restaurantId) {
            newSocket.emit("joinRestaurant", user.restaurantId);

            newSocket.on("newOrder", (order) => {
                setOrders(prev => [order, ...prev]);
                addNotification(`🆕 New order — ${order.tableNumber || 'Home Delivery'}`, 'order');
                toast.info(`New order received for ${order.tableNumber || 'Home Delivery'}`);
                try {
                    const audio = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");
                    audio.play();
                } catch (e) { }
            });

            newSocket.on("orderUpdated", (updatedOrder) => {
                setOrders(prev => prev.map(o => o._id === updatedOrder._id ? { ...o, ...updatedOrder } : o));
                addNotification(`📦 Order #${updatedOrder._id.slice(-4).toUpperCase()} → ${updatedOrder.status}`, 'update');
            });

            // Chat notification from customer
            newSocket.on("customerChatMessage", ({ orderId, tableNumber, message }) => {
                const label = tableNumber?.includes("Home Delivery") ? "Home Delivery" : `Table ${tableNumber}`;
                addNotification(`💬 ${label} sent a message: "${message.slice(0, 35)}${message.length > 35 ? '...' : ''}"`, 'message');
                try {
                    const audio = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");
                    audio.play();
                } catch (e) { }
            });

            newSocket.on("staffAvailabilityChanged", ({ staffId, isAvailable }) => {
                setActiveStaff(prev => {
                    if (isAvailable) {
                        fetchActiveStaff();
                        return prev;
                    }
                    return prev.filter(s => s._id !== staffId);
                });
            });

            newSocket.on("receiveTableCall", ({ table, message }) => {
                setIncomingCall({ table, message });
                addNotification(`🔔 Table ${table} is calling for help!`, 'call');
                toast.info(`Help request from Table ${table}`);
                try {
                    const audio = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");
                    audio.play();
                } catch (e) { }
            });
        }

        return () => {
            newSocket.disconnect();
            clearInterval(staffInterval);
        };
    }, []);

    const updateStatus = async (id, status) => {
        try {
            await API.put(`/orders/${id}`, { status });
            toast.success(`Order marked as ${status}`);
            setOrders(prev => prev.map(o => o._id === id ? { ...o, status } : o));
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to update status");
        }
    };

    const callFreeStaff = (order) => {
        if (!socket) return;
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        if (activeStaff.length === 0) {
            toast.warning("No available staff on duty right now!");
            return;
        }

        setCallingStaff(prev => ({ ...prev, [order._id]: true }));
        socket.emit("sendTableCall", {
            restaurantId: user.restaurantId,
            table: order.tableNumber || "Home Delivery",
            message: {
                text: `🍽️ Order #${order._id.slice(-4).toUpperCase()} is READY for delivery to ${order.tableNumber || 'Home Delivery'}!`,
                sender: "kitchen",
                timestamp: new Date()
            }
        });
        toast.success("Free staff has been notified to collect the order!");

        setTimeout(() => {
            setCallingStaff(prev => ({ ...prev, [order._id]: false }));
        }, 8000);
    };

    const markDeliveryType = async (orderId, deliveryType) => {
        setSettingDelivery(prev => ({ ...prev, [orderId]: true }));
        try {
            await API.patch(`/orders/${orderId}/delivery-type`, { deliveryType });
            const label = deliveryType === "self_pickup" ? "Self Pickup" : "Out for Delivery";
            toast.success(`Order marked as: ${label}`);
            setOrders(prev => prev.map(o => o._id === orderId ? { ...o, deliveryType } : o));
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to set delivery type");
        } finally {
            setSettingDelivery(prev => ({ ...prev, [orderId]: false }));
        }
    };

    const toggleRestaurantOpen = async () => {
        setTogglingOpen(true);
        try {
            const res = await API.put("/restaurant/toggle-open");
            setIsRestaurantOpen(res.data.isOpen);
            toast.success(res.data.isOpen ? "🟢 Restaurant is now OPEN" : "🔴 Restaurant is now CLOSED");
            addNotification(res.data.isOpen ? "🟢 Restaurant marked OPEN" : "🔴 Restaurant marked CLOSED", 'update');
        } catch (err) {
            toast.error("Failed to update status");
        } finally {
            setTogglingOpen(false);
        }
    };

    const sendReply = (orderId) => {
        if (!replyText[orderId] || !socket) return;
        socket.emit("sendMessage", {
            orderId,
            message: { text: replyText[orderId], sender: "kitchen", timestamp: new Date() },
            restaurantId: user.restaurantId
        });
        setReplyText(prev => ({ ...prev, [orderId]: "" }));
        toast.success("Note sent to customer!");
    };

    const filteredOrders = orders.filter(o => {
        if (filter === "active") return ["pending", "preparing", "ready"].includes(o.status);
        if (filter === "completed") return o.status === "delivered";
        return true;
    });

    const getStatusConfig = (status) => {
        switch (status) {
            case "pending": return { color: "text-yellow-500", bg: "bg-yellow-500/10", icon: Clock, label: "Pending" };
            case "preparing": return { color: "text-blue-500", bg: "bg-blue-500/10", icon: ChefHat, label: "Preparing" };
            case "ready": return { color: "text-brand-primary", bg: "bg-brand-primary/10", icon: Package, label: "Ready" };
            case "delivered": return { color: "text-green-500", bg: "bg-green-500/10", icon: CheckCircle2, label: "Completed" };
            default: return { color: "text-gray-500", bg: "bg-gray-500/10", icon: Clock, label: status };
        }
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div></div>;
    }

    const user = JSON.parse(localStorage.getItem("user") || "{}");

    return (
        <div className="p-6 max-w-7xl mx-auto min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                        Kitchen Screen {user.restaurantName ? `- ${user.restaurantName}` : ''}
                    </h1>
                    <div className="flex items-center gap-4 mt-2">
                        <p className="text-gray-500">Manage active orders in real-time</p>
                        <div className="h-4 w-px bg-gray-100"></div>
                        <div className="flex gap-3">
                            <span className="text-brand-primary font-medium bg-brand-primary/10 px-3 py-1 rounded-full text-sm">
                                Active: {orders.filter(o => ["pending", "preparing", "ready"].includes(o.status)).length}
                            </span>
                            <span className="text-brand-gold font-medium bg-brand-gold/10 px-3 py-1 rounded-full text-sm">
                                Total Today: {orders.length}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Restaurant Open/Close */}
                    <button
                        onClick={toggleRestaurantOpen}
                        disabled={togglingOpen}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all border ${isRestaurantOpen
                                ? 'bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20'
                                : 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
                            }`}
                    >
                        <span className={`w-2 h-2 rounded-full ${isRestaurantOpen ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                        {isRestaurantOpen ? 'Restaurant Open' : 'Restaurant Closed'}
                    </button>

                    {/* Bell */}
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

                    <div className="flex bg-gray-200 p-1 rounded-xl border border-gray-100">
                        {["all", "active", "completed"].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === f
                                        ? "bg-white text-gray-900 shadow"
                                        : "text-gray-500 hover:text-gray-900"
                                    }`}
                            >
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Active Staff Panel */}
            <div className="glass-panel p-5 mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Users className="w-5 h-5 text-green-400" />
                        Staff On Duty
                        <span className="text-xs bg-green-400/10 text-green-400 border border-green-400/20 px-2 py-0.5 rounded-full ml-1">
                            {activeStaff.length} available
                        </span>
                    </h2>
                    <button onClick={fetchActiveStaff} className="text-xs text-gray-500 hover:text-gray-700 transition-colors">
                        ↻ Refresh
                    </button>
                </div>
                {activeStaff.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-3">No staff currently on duty. Staff members set themselves active from their dashboard.</p>
                ) : (
                    <div className="flex flex-wrap gap-3">
                        {activeStaff.map(s => (
                            <div key={s._id} className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 px-4 py-2 rounded-xl">
                                <UserCheck className="w-4 h-4 text-green-400" />
                                <div>
                                    <p className="text-gray-900 font-medium text-sm">{s.name}</p>
                                    <p className="text-gray-500 text-xs">{s.email}</p>
                                </div>
                                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse ml-1"></span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Orders Grid */}
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
                            const isCalling = callingStaff[order._id];
                            const isSettingDelivery = settingDelivery[order._id];
                            const isTakeawayOrDelivery = order.tableNumber === "Takeaway" || (order.tableNumber && order.tableNumber.toLowerCase().includes("home delivery"));

                            return (
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    key={order._id}
                                    className={`glass-panel overflow-hidden flex flex-col transition-colors duration-500 ${order.status === 'pending' ? 'border-yellow-500/30 shadow-[0_0_20px_rgba(234,179,8,0.1)]' : ''} ${order.status === 'ready' ? 'border-brand-primary/40 shadow-[0_0_20px_rgba(230,57,70,0.15)]' : ''}`}
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
                                                onChange={(e) => setReplyText(prev => ({ ...prev, [order._id]: e.target.value }))}
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
                                    </div>

                                    <div className="p-5 bg-brand-light/50 border-t border-gray-100">
                                        <div className="flex flex-col gap-2">
                                            {order.status === "pending" && (
                                                <button
                                                    onClick={() => updateStatus(order._id, "preparing")}
                                                    className="w-full bg-blue-600 hover:bg-blue-500 text-gray-900 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                                                >
                                                    <ChefHat className="w-4 h-4" /> Start Preparing
                                                </button>
                                            )}
                                            {order.status === "preparing" && (
                                                <button
                                                    onClick={() => updateStatus(order._id, "ready")}
                                                    className="w-full bg-brand-primary hover:bg-brand-primaryDark text-gray-900 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                                                >
                                                    <Package className="w-4 h-4" /> Mark Ready
                                                </button>
                                            )}
                                            {order.status === "ready" && (
                                                <button
                                                    onClick={() => callFreeStaff(order)}
                                                    disabled={isCalling}
                                                    className={`w-full py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${isCalling
                                                            ? "bg-gray-600/50 text-gray-500 cursor-not-allowed"
                                                            : "bg-green-600 hover:bg-green-500 text-gray-900 shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                                                        }`}
                                                >
                                                    <BellRing className={`w-4 h-4 ${isCalling ? "" : "animate-bounce"}`} />
                                                    {isCalling ? "Staff Notified!" : `Call Free Staff (${activeStaff.length} on duty)`}
                                                </button>
                                            )}
                                            {/* Delivery Type Selector — only for takeaway/home delivery once ready */}
                                            {isTakeawayOrDelivery && order.status === "ready" && (
                                                <div className="mt-2 p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                                                    <p className="text-xs text-purple-300 font-semibold mb-2 flex items-center gap-1">
                                                        <Truck className="w-3 h-3" /> Dispatch Decision
                                                    </p>
                                                    {order.deliveryType ? (
                                                        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold ${order.deliveryType === "self_pickup" ? "bg-brand-gold/10 text-brand-gold" : "bg-purple-500/20 text-purple-300"
                                                            }`}>
                                                            {order.deliveryType === "self_pickup" ? <ShoppingBag className="w-4 h-4" /> : <Truck className="w-4 h-4" />}
                                                            {order.deliveryType === "self_pickup" ? "Customer Self Pickup" : "Sent to Delivery Staff"}
                                                        </div>
                                                    ) : (
                                                        <div className="flex gap-2">
                                                            <button
                                                                disabled={isSettingDelivery}
                                                                onClick={() => markDeliveryType(order._id, "self_pickup")}
                                                                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-bold bg-brand-gold/10 text-brand-gold border border-brand-gold/20 hover:bg-brand-gold/20 transition-colors"
                                                            >
                                                                <ShoppingBag className="w-3 h-3" /> Self Pickup
                                                            </button>
                                                            <button
                                                                disabled={isSettingDelivery}
                                                                onClick={() => markDeliveryType(order._id, "out_for_delivery")}
                                                                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-bold bg-purple-500/10 text-purple-300 border border-purple-500/20 hover:bg-purple-500/20 transition-colors"
                                                            >
                                                                <Truck className="w-3 h-3" /> Delivery Staff
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
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
                                    <Bell className="w-4 h-4 text-brand-primary" /> Kitchen Notifications
                                </h3>
                                <div className="flex gap-2">
                                    {notifications.length > 0 && (
                                        <button onClick={() => setNotifications([])} className="text-xs text-gray-500 hover:text-gray-700">Clear</button>
                                    )}
                                    <button onClick={() => setShowNotifications(false)} className="text-gray-500 hover:text-gray-900"><X className="w-4 h-4" /></button>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <p className="text-center text-gray-600 text-sm mt-12">No notifications yet</p>
                                ) : (
                                    notifications.map(n => (
                                        <div key={n.id} className={`p-4 border-b border-gray-100 ${n.type === 'order' ? 'border-l-4 border-l-green-500' :
                                                n.type === 'update' ? 'border-l-4 border-l-blue-500' :
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
                                    onClick={() => setIncomingCall(null)}
                                    className="flex-1 py-3 rounded-xl font-bold text-white bg-brand-primary hover:bg-brand-primaryDark shadow-[0_0_20px_rgba(234,88,12,0.4)] transition-colors"
                                >
                                    Acknowledge
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default KitchenScreen;