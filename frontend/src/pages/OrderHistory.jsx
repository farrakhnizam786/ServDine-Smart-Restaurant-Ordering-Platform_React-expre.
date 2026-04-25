import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import { CheckCircle2, Search, Store, Receipt } from "lucide-react";
import { motion } from "framer-motion";

function OrderHistory() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const res = await API.get("/orders/customer");
                // Filter completed and cancelled orders
                const historyOrders = (res.data.orders || []).filter(
                    o => o.status === "delivered" || o.status === "cancelled"
                );
                setOrders(historyOrders);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, []);

    const filteredOrders = orders.filter(o => 
        (o.restaurantId?.name || "").toLowerCase().includes(search.toLowerCase()) ||
        o._id.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div></div>;
    }

    return (
        <div className="min-h-screen p-6 max-w-4xl mx-auto pt-24">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Order History</h1>
            <p className="text-gray-500 mb-8">View your past orders and receipts</p>

            {orders.length > 0 && (
                <div className="mb-8 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search by restaurant or order ID..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-brand-light/80 backdrop-blur-md border border-gray-200 rounded-2xl pl-12 pr-4 py-4 text-gray-900 focus:outline-none focus:border-brand-primary shadow-lg"
                    />
                </div>
            )}

            {filteredOrders.length === 0 ? (
                <div className="text-center py-20 glass-panel">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                        <Receipt className="w-10 h-10 text-gray-500" />
                    </div>
                    <h3 className="text-xl font-medium text-gray-700">No past orders found</h3>
                    <p className="text-gray-500 mt-2">Looks like you haven't ordered yet.</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {filteredOrders.map((order) => (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            key={order._id}
                            className="glass-panel overflow-hidden"
                        >
                            <div className="p-6 border-b border-gray-100 bg-gray-50 flex flex-col md:flex-row justify-between md:items-center gap-4">
                                <div className="flex items-center gap-4">
                                    {order.restaurantId?.image ? (
                                        <img src={order.restaurantId.image} alt="Restaurant" className="w-12 h-12 rounded-xl object-cover" />
                                    ) : (
                                        <div className="w-12 h-12 rounded-xl bg-brand-light flex items-center justify-center">
                                            <Store className="w-6 h-6 text-gray-500" />
                                        </div>
                                    )}
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-900">
                                            {order.restaurantId?.name || "Restaurant"}
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                                {order.status === "cancelled" ? (
                                    <div className="flex items-center gap-2 bg-red-500/10 text-red-500 px-3 py-1 rounded-full text-sm font-medium">
                                        Cancelled
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 bg-green-500/10 text-green-500 px-3 py-1 rounded-full text-sm font-medium">
                                        <CheckCircle2 className="w-4 h-4" /> Delivered
                                    </div>
                                )}
                            </div>

                            <div className="p-6">
                                <div className="space-y-3 mb-6">
                                    {order.items.map((item, i) => (
                                        <div key={i} className="flex justify-between items-center text-sm">
                                            <div className="flex gap-3">
                                                <span className="text-brand-gold font-medium">{item.quantity}x</span>
                                                <span className="text-gray-700">{item.name}</span>
                                            </div>
                                            <span className="text-gray-500">₹{item.price * item.quantity}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="border-t border-gray-100 pt-4 flex justify-between items-center">
                                    <div>
                                        <p className="text-sm text-gray-500">Order ID: #{order._id.slice(-6).toUpperCase()}</p>
                                        <p className="text-xs text-brand-primary mt-1">
                                            {order.tableNumber && order.tableNumber.includes("Home Delivery") ? "Home Delivery" : `Table ${order.tableNumber || "Takeaway"}`}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-500">Total Paid</p>
                                        <p className="text-xl font-bold text-gray-900">₹{order.totalAmount}</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default OrderHistory;
