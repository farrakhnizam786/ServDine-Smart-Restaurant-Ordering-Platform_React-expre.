import { Ticket, Copy, CheckCircle2, Store } from "lucide-react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import API from "../api/axios";

function Coupons() {
    const [copiedId, setCopiedId] = useState(null);
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCoupons = async () => {
            try {
                const res = await API.get("/restaurant/all/coupons");
                setCoupons(res.data);
            } catch (err) {
                console.error("Failed to fetch coupons", err);
            } finally {
                setLoading(false);
            }
        };
        fetchCoupons();
    }, []);

    const copyCode = (code, id) => {
        navigator.clipboard.writeText(code);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    return (
        <div className="min-h-screen p-6 max-w-4xl mx-auto pt-24">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Coupons & Offers</h1>
            <p className="text-gray-500 mb-8">Exclusive deals just for you</p>

            <div className="grid md:grid-cols-2 gap-6">
                {loading ? (
                    <div className="col-span-2 py-10 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div></div>
                ) : coupons.length === 0 ? (
                    <div className="col-span-2 py-10 text-center text-gray-500">No active coupons available at the moment.</div>
                ) : coupons.map((coupon, idx) => (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.1 }}
                        key={coupon._id} 
                        className="glass-panel overflow-hidden relative group"
                    >
                        <div className="h-2 absolute top-0 left-0 w-full bg-gradient-to-r from-brand-primary to-brand-gold" />
                        <div className="p-6 flex items-start gap-4">
                            <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center shrink-0 border border-gray-200">
                                <Ticket className="w-6 h-6 text-brand-gold transform -rotate-45" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2 bg-gray-50 inline-flex px-3 py-1 rounded-full border border-gray-200">
                                    <Store className="w-3 h-3 text-brand-primary" />
                                    <span className="text-xs font-bold text-gray-700">{coupon.restaurantId?.name || "All Restaurants"}</span>
                                </div>
                                <h3 className="text-xl font-black text-gray-900 mb-1">{coupon.discountPercentage}% OFF</h3>
                                <p className="text-sm text-gray-700 mb-4">Valid on your next order</p>
                                
                                <div className="flex items-center justify-between bg-brand-light rounded-lg p-3 border border-gray-200 border-dashed">
                                    <span className="font-mono font-bold text-brand-primary tracking-widest uppercase">{coupon.code}</span>
                                    <button 
                                        onClick={() => copyCode(coupon.code, coupon._id)}
                                        className="text-gray-500 hover:text-gray-900 transition-colors"
                                    >
                                        {copiedId === coupon._id ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 mt-4">Expires: {new Date(coupon.validUntil).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

export default Coupons;
