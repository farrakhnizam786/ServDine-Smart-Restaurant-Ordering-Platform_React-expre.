import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import { Clock, ChefHat, Package, ArrowRight, Store } from "lucide-react";
import { motion } from "framer-motion";

function OrderStatusList() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const res = await API.get("/orders/customer");
                // Filter only active orders
                const activeOrders = (res.data.orders || []).filter(
                    o => ["pending", "preparing", "ready"].includes(o.status)
                );
                setOrders(activeOrders);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, []);

    const getStatusConfig = (status) => {
        switch (status) {
            case "pending": return { color: "text-yellow-500", bg: "bg-yellow-500/10", icon: Clock, label: "Order Placed" };
            case "preparing": return { color: "text-blue-500", bg: "bg-blue-500/10", icon: ChefHat, label: "Preparing" };
            case "ready": return { color: "text-brand-primary", bg: "bg-brand-primary/10", icon: Package, label: "Ready to Serve" };
            default: return { color: "text-gray-500", bg: "bg-gray-500/10", icon: Clock, label: status };
        }
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div></div>;
    }

    return (
        <div className="min-h-screen p-6 max-w-4xl mx-auto pt-24">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Live Orders</h1>
            <p className="text-gray-500 mb-8">Track your current active orders</p>

            {orders.length === 0 ? (
                <div className="text-center py-20 glass-panel">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                        <Package className="w-10 h-10 text-gray-500" />
                    </div>
                    <h3 className="text-xl font-medium text-gray-700">No active orders</h3>
                    <p className="text-gray-500 mt-2">Looks like you haven't placed an order recently.</p>
                    <button onClick={() => navigate("/")} className="mt-6 glass-button">
                        Browse Restaurants
                    </button>
                </div>
            ) : (
                <div className="grid gap-6">
                    {orders.map((order) => {
                        const config = getStatusConfig(order.status);
                        const StatusIcon = config.icon;

                        return (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                key={order._id}
                                onClick={() => navigate(`/orders/tracking/${order._id}`)}
                                className="glass-panel p-6 cursor-pointer group hover:border-brand-primary/50 transition-colors"
                            >
                                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${config.bg} ${config.color}`}>
                                            <StatusIcon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-gray-900 mb-1">
                                                {order.restaurantId?.name || "Restaurant"}
                                            </h3>
                                            <p className="text-sm text-gray-500">Order #{order._id.slice(-6).toUpperCase()}</p>
                                            <p className="text-xs text-brand-primary mt-0.5">
                                                {order.tableNumber && order.tableNumber.includes("Home Delivery") ? "Home Delivery" : `Table ${order.tableNumber || "Takeaway"}`}
                                            </p>
                                            <p className="text-sm text-gray-500 mt-1">
                                                {order.items.length} items • ₹{order.totalAmount}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center justify-between md:justify-end gap-6 border-t border-gray-200 md:border-t-0 pt-4 md:pt-0">
                                        <div className="text-right">
                                            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.color}`}>
                                                {config.label}
                                            </span>
                                            <p className="text-xs text-gray-500 mt-2">
                                                Placed at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                        <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-brand-primary group-hover:text-gray-900 transition-colors">
                                            <ArrowRight className="w-5 h-5" />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default OrderStatusList;
