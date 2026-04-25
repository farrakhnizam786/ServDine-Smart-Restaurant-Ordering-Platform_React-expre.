import { useState, useEffect } from "react";
import API from "../api/axios";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { createPortal } from "react-dom";
import { ArrowLeft, Trash2, Plus, Minus, ShoppingBag, Receipt, CreditCard, QrCode, SmartphoneNfc, X, Tag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function Cart({ isOpen, onClose, restaurantId, table, onCartUpdate }) {
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState("");
    const [availableCoupons, setAvailableCoupons] = useState([]);
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [couponInput, setCouponInput] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        if (!restaurantId || !isOpen) return;
        const storedCart = JSON.parse(localStorage.getItem(`cart_${restaurantId}`)) || [];
        setCart(storedCart);
        
        // Fetch coupons
        const fetchCoupons = async () => {
            try {
                const res = await API.get(`/restaurant/${restaurantId}/coupons`);
                setAvailableCoupons(res.data);
            } catch (e) {
                console.error("Failed to fetch coupons", e);
            }
        };
        fetchCoupons();
    }, [restaurantId, isOpen]);

    const updateQuantity = (index, delta) => {
        if (!restaurantId) return;
        const newCart = [...cart];
        newCart[index].quantity += delta;
        if (newCart[index].quantity <= 0) {
            newCart.splice(index, 1);
        }
        setCart(newCart);
        localStorage.setItem(`cart_${restaurantId}`, JSON.stringify(newCart));
        if (onCartUpdate) onCartUpdate();
        window.dispatchEvent(new Event("storage"));
    };

    const removeItem = (index) => {
        if (!restaurantId) return;
        const newCart = [...cart];
        newCart.splice(index, 1);
        setCart(newCart);
        localStorage.setItem(`cart_${restaurantId}`, JSON.stringify(newCart));
        if (onCartUpdate) onCartUpdate();
        window.dispatchEvent(new Event("storage"));
        toast.info("Item removed from cart");
    };

    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const discountAmount = appliedCoupon ? (subtotal * appliedCoupon.discountPercentage) / 100 : 0;
    const discountedSubtotal = subtotal - discountAmount;
    const tax = discountedSubtotal * 0.05; // 5% tax
    const total = discountedSubtotal + tax;

    const handleApplyCoupon = () => {
        if (!couponInput) return;
        const coupon = availableCoupons.find(c => c.code === couponInput.toUpperCase());
        if (coupon) {
            setAppliedCoupon(coupon);
            toast.success(`Coupon ${coupon.code} applied!`);
        } else {
            toast.error("Invalid coupon code");
        }
    };

    const handleCheckout = (method) => {
        setPaymentMethod(method);
        setShowPaymentModal(true);
    };

    const placeOrder = async () => {
        if (!restaurantId) {
            toast.error("Restaurant information missing!");
            return;
        }

        setLoading(true);
        try {
            const res = await API.post("/orders", {
                restaurantId,
                tableNumber: table || "Home Delivery",
                items: cart.map((item) => ({
                    menuItemId: item._id,
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price,
                })),
                paymentMethod, // 'nfc' or 'qr' or 'card'
                couponCode: appliedCoupon ? appliedCoupon.code : null,
                discountAmount
            });

            toast.success("Order placed successfully!");
            localStorage.removeItem(`cart_${restaurantId}`);
            setCart([]);
            window.dispatchEvent(new Event("storage"));

            // Navigate to order tracking page
            navigate(`/orders/tracking/${res.data.order._id}`);

        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to place order");
        } finally {
            setLoading(false);
            setShowPaymentModal(false);
        }
    };




    if (!isOpen) return null;

    if (cart.length === 0) {
        return createPortal(
            <AnimatePresence>
                <motion.div 
                    initial={{ x: "100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "100%" }}
                    className="fixed inset-y-0 right-0 w-full max-w-md bg-brand-light border-l border-gray-200 z-[9999] shadow-2xl flex flex-col"
                >
                    <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900">Your Cart</h2>
                        <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-900 rounded-full hover:bg-gray-50 transition-colors">
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                        <div className="w-24 h-24 bg-gray-500 rounded-full flex items-center justify-center mb-6 shadow-xl border border-gray-100">
                            <ShoppingBag className="w-10 h-10 text-gray-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
                        <p className="text-gray-500 mb-8 max-w-sm">Looks like you haven't added anything to your cart yet.</p>
                        <button 
                            onClick={onClose}
                            className="glass-button"
                        >
                            <ArrowLeft className="w-4 h-4" /> Go Back to Menu
                        </button>
                    </div>
                </motion.div>
            </AnimatePresence>,
            document.body
        );
    }

    return createPortal(
        <AnimatePresence>
            <motion.div 
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                className="fixed inset-y-0 right-0 w-full max-w-md bg-brand-light/95 backdrop-blur-xl border-l border-gray-200 z-[9999] shadow-2xl flex flex-col"
            >
                <div className="p-6 border-b border-gray-200 flex items-center gap-4 bg-brand-light sticky top-0 z-10">
                    <button 
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:bg-gray-100 transition-colors border border-gray-100"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-700" />
                    </button>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Your Order</h2>
                    {table && (
                        <span className="ml-auto bg-brand-primary/20 text-brand-primary px-3 py-1 rounded-md text-sm font-medium border border-brand-primary/30">
                            Table {table}
                        </span>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 hide-scrollbar">
                    <div className="space-y-4">
                    <AnimatePresence>
                        {cart.map((item, i) => (
                            <motion.div 
                                key={`${item._id}-${i}`}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="glass-panel p-4 flex gap-4 items-center group"
                            >
                                <div className="w-20 h-20 bg-brand-light rounded-xl overflow-hidden shrink-0 border border-gray-100">
                                    {item.image ? (
                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-500">
                                            <ShoppingBag className="w-6 h-6 text-gray-600" />
                                        </div>
                                    )}
                                </div>
                                
                                <div className="flex-1">
                                    <h3 className="font-bold text-gray-900 text-lg">{item.name}</h3>
                                    <p className="text-brand-primary font-medium">₹{item.price}</p>
                                </div>

                                <div className="flex flex-col items-end gap-3 shrink-0">
                                    <button 
                                        onClick={() => removeItem(i)}
                                        className="text-gray-500 hover:text-brand-primary transition-colors p-1"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                    
                                    <div className="flex items-center gap-3 bg-brand-light rounded-lg p-1 border border-gray-100">
                                        <button 
                                            onClick={() => updateQuantity(i, -1)}
                                            className="w-7 h-7 rounded bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors"
                                        >
                                            <Minus className="w-3 h-3 text-gray-900" />
                                        </button>
                                        <span className="w-4 text-center font-medium text-gray-900 text-sm">{item.quantity}</span>
                                        <button 
                                            onClick={() => updateQuantity(i, 1)}
                                            className="w-7 h-7 rounded bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors"
                                        >
                                            <Plus className="w-3 h-3 text-gray-900" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    </div>
                </div>

                <div className="p-6 border-t border-gray-200 bg-brand-light sticky bottom-0 z-10">
                    <div className="glass-panel p-4 mb-4">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Receipt className="w-4 h-4 text-brand-primary" /> Bill Summary
                        </h3>
                        
                        <div className="space-y-2 text-sm mb-4">
                            <div className="flex justify-between text-gray-700">
                                <span>Item Total</span>
                                <span>₹{subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-gray-700">
                                <span>Taxes (5%)</span>
                                <span>₹{tax.toFixed(2)}</span>
                            </div>
                            <div className="h-px w-full bg-gray-100 my-2" />
                            <div className="flex justify-between text-gray-900 font-bold text-lg">
                                <span>To Pay</span>
                                <span className="text-brand-gold">₹{total.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Coupons Section */}
                        <div className="mb-4 pt-4 border-t border-gray-200">
                            {appliedCoupon ? (
                                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-green-400">
                                        <Tag className="w-4 h-4" />
                                        <span className="font-bold">{appliedCoupon.code}</span>
                                        <span className="text-sm">({appliedCoupon.discountPercentage}% OFF)</span>
                                    </div>
                                    <button 
                                        onClick={() => setAppliedCoupon(null)}
                                        className="text-gray-500 hover:text-gray-900"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            value={couponInput}
                                            onChange={e => setCouponInput(e.target.value)}
                                            placeholder="Enter Coupon Code" 
                                            className="flex-1 bg-brand-light border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:border-brand-primary uppercase"
                                        />
                                        <button 
                                            onClick={handleApplyCoupon}
                                            className="bg-gray-100 hover:bg-white/20 text-gray-900 px-4 rounded-lg text-sm font-medium transition-colors"
                                        >
                                            Apply
                                        </button>
                                    </div>
                                    {availableCoupons.length > 0 && (
                                        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                                            {availableCoupons.map(c => (
                                                <button 
                                                    key={c._id}
                                                    onClick={() => { setCouponInput(c.code); handleApplyCoupon(); }}
                                                    className="shrink-0 bg-brand-gold/10 border border-brand-gold/20 text-brand-gold px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap hover:bg-brand-gold/20 transition-colors"
                                                >
                                                    {c.code}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => handleCheckout("nfc")}
                                className="glass-button w-full py-3 text-base bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border-blue-500/30"
                            >
                                <SmartphoneNfc className="w-5 h-5" /> Tap to Pay (NFC)
                            </button>
                            <button
                                onClick={() => handleCheckout("qr")}
                                className="glass-button w-full py-3 text-base"
                            >
                                <QrCode className="w-5 h-5" /> Pay via QR
                            </button>
                        </div>
                    </div>
                </div>

            {/* Payment Modal */}
            <AnimatePresence>
                {showPaymentModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-brand-light border border-gray-200 rounded-2xl p-8 max-w-md w-full relative"
                        >
                            <button onClick={() => setShowPaymentModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-gray-900">
                                <X className="w-6 h-6" />
                            </button>
                            
                            <div className="text-center mb-8">
                                {paymentMethod === "qr" ? (
                                    <>
                                        <QrCode className="w-16 h-16 text-brand-primary mx-auto mb-4" />
                                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Scan to Pay</h3>
                                        <p className="text-gray-500">Scan this code with any UPI app to pay ₹{total.toFixed(2)}</p>
                                        <div className="mt-6 bg-white p-4 rounded-xl inline-block">
                                            <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=dineflow@upi" alt="UPI QR" className="w-48 h-48" />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <SmartphoneNfc className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-pulse" />
                                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Tap Phone to Pay</h3>
                                        <p className="text-gray-500">Hold your NFC-enabled device near the terminal to pay ₹{total.toFixed(2)}</p>
                                        <div className="mt-8 relative w-32 h-32 mx-auto">
                                            <div className="absolute inset-0 border-4 border-blue-500/30 rounded-full animate-ping"></div>
                                            <div className="absolute inset-4 border-4 border-blue-500/50 rounded-full animate-pulse"></div>
                                        </div>
                                    </>
                                )}
                            </div>

                            <button
                                onClick={placeOrder}
                                disabled={loading}
                                className="glass-button w-full py-4 text-lg"
                            >
                                {loading ? "Processing..." : "Simulate Payment Success"}
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            </motion.div>
        </AnimatePresence>,
        document.body
    );
}

export default Cart;