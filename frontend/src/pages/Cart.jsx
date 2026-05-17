import { useState, useEffect, useCallback } from "react";
import API from "../api/axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { createPortal } from "react-dom";
import {
    ArrowLeft, Trash2, Plus, Minus, ShoppingBag, Receipt,
    CreditCard, QrCode, SmartphoneNfc, X, Tag, IndianRupee,
    Loader2, CheckCircle2, Banknote
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Load Razorpay script dynamically
const loadRazorpayScript = () =>
    new Promise((resolve) => {
        if (document.getElementById("razorpay-script")) {
            resolve(true);
            return;
        }
        const script = document.createElement("script");
        script.id = "razorpay-script";
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });

function Cart({ isOpen, onClose, restaurantId, table, onCartUpdate }) {
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(false);
    const [restaurantInfo, setRestaurantInfo] = useState(null);
    const [availableCoupons, setAvailableCoupons] = useState([]);
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [couponInput, setCouponInput] = useState("");
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (!restaurantId || !isOpen) return;
        const storedCart = JSON.parse(localStorage.getItem(`cart_${restaurantId}`)) || [];
        setCart(storedCart);

        const init = async () => {
            try {
                const [couponRes, restRes] = await Promise.all([
                    API.get(`/restaurant/${restaurantId}/coupons`),
                    API.get(`/restaurant/${restaurantId}`)
                ]);
                setAvailableCoupons(couponRes.data);
                setRestaurantInfo(restRes.data);
            } catch (e) {
                console.error("Cart init error", e);
            }
        };
        init();
    }, [restaurantId, isOpen]);

    const updateQuantity = (index, delta) => {
        if (!restaurantId) return;
        const newCart = [...cart];
        newCart[index].quantity += delta;
        if (newCart[index].quantity <= 0) newCart.splice(index, 1);
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
        toast.info("Item removed");
    };

    // Price calculations
    const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
    const discountAmount = appliedCoupon ? (subtotal * appliedCoupon.discountPercentage) / 100 : 0;
    const afterDiscount = subtotal - discountAmount;
    const gstPct = restaurantInfo?.gstPercentage || 5;
    const serviceChargePct = restaurantInfo?.serviceChargePercentage || 0;
    const gstAmount = (afterDiscount * gstPct) / 100;
    const serviceAmount = (afterDiscount * serviceChargePct) / 100;
    const total = afterDiscount + gstAmount + serviceAmount;

    const handleApplyCoupon = () => {
        if (!couponInput) return;
        const found = availableCoupons.find(c => c.code === couponInput.toUpperCase());
        if (found) {
            setAppliedCoupon(found);
            toast.success(`Coupon ${found.code} applied! ${found.discountPercentage}% off 🎉`);
        } else {
            toast.error("Invalid coupon code");
        }
    };

    // 🔥 Confirm & save order to DB after payment
    const confirmOrder = async (paymentMethod, paymentId = null) => {
        setLoading(true);
        try {
            const res = await API.post("/orders", {
                restaurantId,
                tableNumber: table || "Home Delivery",
                items: cart.map(item => ({
                    menuItemId: item._id,
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price,
                })),
                paymentMethod,
                paymentId,
                couponCode: appliedCoupon?.code || null,
                discountAmount,
            });

            setPaymentSuccess(true);
            localStorage.removeItem(`cart_${restaurantId}`);
            setCart([]);
            window.dispatchEvent(new Event("storage"));

            setTimeout(() => {
                navigate(`/orders/tracking/${res.data.order._id}`);
            }, 1500);
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to place order");
        } finally {
            setLoading(false);
        }
    };

    // 🔥 Razorpay Payment Flow
    const handleRazorpayPayment = async () => {
        const paymentMode = restaurantInfo?.paymentMode;

        // If restaurant uses cash/UPI/bank → skip Razorpay, place order directly
        if (paymentMode !== "razorpay") {
            await confirmOrder(paymentMode || "cash");
            return;
        }

        setLoading(true);
        try {
            const loaded = await loadRazorpayScript();
            if (!loaded) {
                toast.error("Razorpay failed to load. Check your internet connection.");
                setLoading(false);
                return;
            }

            // Create Razorpay order on backend
            const { data } = await API.post("/payment/create-order", {
                amount: total,
                restaurantId,
            });

            const user = JSON.parse(localStorage.getItem("user") || "{}");

            const options = {
                key: data.keyId,
                amount: data.amount,
                currency: data.currency,
                name: restaurantInfo?.name || "ServDine",
                description: `Order for Table ${table || "Home Delivery"}`,
                image: "/favicon.svg",
                order_id: data.orderId,
                handler: async (response) => {
                    // Verify signature on backend
                    try {
                        const verifyRes = await API.post("/payment/verify", {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            restaurantId,
                        });

                        if (verifyRes.data.success) {
                            toast.success("Payment successful! 🎉");
                            await confirmOrder("razorpay", response.razorpay_payment_id);
                        } else {
                            toast.error("Payment verification failed. Contact support.");
                        }
                    } catch {
                        toast.error("Verification error. Contact support.");
                    }
                },
                prefill: {
                    name: user.name || "",
                    email: user.email || "",
                },
                theme: {
                    color: "#e63946",
                },
                modal: {
                    ondismiss: () => {
                        toast.info("Payment cancelled");
                        setLoading(false);
                    },
                },
            };

            const razorpay = new window.Razorpay(options);
            razorpay.open();

        } catch (err) {
            console.error("Razorpay error:", err);
            toast.error(err.response?.data?.message || "Payment failed. Try again.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const paymentMode = restaurantInfo?.paymentMode || "cash";
    const paymentLabel = {
        razorpay: "💳 Pay via Razorpay",
        upi: `📱 Pay via UPI (${restaurantInfo?.upiId || ""})`,
        bank: "🏦 Bank Transfer",
        cash: "💵 Cash on Delivery / At Counter",
    }[paymentMode] || "Pay Now";

    // Payment success screen
    if (paymentSuccess) {
        return createPortal(
            <div className="fixed inset-y-0 right-0 w-full max-w-md bg-brand-light border-l border-gray-200 z-[9999] shadow-2xl flex flex-col items-center justify-center p-8 text-center">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
                    <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="w-12 h-12 text-green-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Placed! 🎉</h2>
                    <p className="text-gray-500">Redirecting to order tracking...</p>
                </motion.div>
            </div>,
            document.body
        );
    }

    // Empty cart
    if (cart.length === 0) {
        return createPortal(
            <AnimatePresence>
                <motion.div
                    initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
                    className="fixed inset-y-0 right-0 w-full max-w-md bg-brand-light border-l border-gray-200 z-[9999] shadow-2xl flex flex-col"
                >
                    <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900">Your Cart</h2>
                        <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-900 rounded-full hover:bg-gray-50 transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                            <ShoppingBag className="w-10 h-10 text-gray-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
                        <p className="text-gray-500 mb-8">Add items from the menu to get started.</p>
                        <button onClick={onClose} className="glass-button">
                            <ArrowLeft className="w-4 h-4" /> Back to Menu
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
                initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
                className="fixed inset-y-0 right-0 w-full max-w-md bg-brand-light/95 backdrop-blur-xl border-l border-gray-200 z-[9999] shadow-2xl flex flex-col"
            >
                {/* Header */}
                <div className="p-5 border-b border-gray-200 flex items-center gap-4 bg-brand-light sticky top-0 z-10">
                    <button onClick={onClose} className="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:bg-gray-100 transition-colors border border-gray-100">
                        <ArrowLeft className="w-5 h-5 text-gray-700" />
                    </button>
                    <h2 className="text-xl font-bold text-gray-900 tracking-tight">Your Order</h2>
                    {table && (
                        <span className="ml-auto bg-brand-primary/20 text-brand-primary px-3 py-1 rounded-md text-sm font-medium border border-brand-primary/30">
                            Table {table}
                        </span>
                    )}
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4 hide-scrollbar">
                    <AnimatePresence>
                        {cart.map((item, i) => (
                            <motion.div
                                key={`${item._id}-${i}`}
                                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                                className="glass-panel p-4 flex gap-4 items-center"
                            >
                                <div className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden shrink-0 border border-gray-100">
                                    {item.image
                                        ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                        : <div className="w-full h-full flex items-center justify-center"><ShoppingBag className="w-6 h-6 text-gray-400" /></div>
                                    }
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-gray-900">{item.name}</h3>
                                    <p className="text-brand-primary font-semibold text-sm">₹{(item.price * item.quantity).toFixed(2)}</p>
                                    <p className="text-gray-400 text-xs">₹{item.price} each</p>
                                </div>
                                <div className="flex flex-col items-end gap-2 shrink-0">
                                    <button onClick={() => removeItem(i)} className="text-gray-400 hover:text-brand-primary transition-colors p-1">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                    <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1 border border-gray-100">
                                        <button onClick={() => updateQuantity(i, -1)} className="w-6 h-6 rounded bg-white flex items-center justify-center hover:bg-gray-100 border border-gray-100">
                                            <Minus className="w-3 h-3 text-gray-900" />
                                        </button>
                                        <span className="w-5 text-center font-bold text-gray-900 text-sm">{item.quantity}</span>
                                        <button onClick={() => updateQuantity(i, 1)} className="w-6 h-6 rounded bg-white flex items-center justify-center hover:bg-gray-100 border border-gray-100">
                                            <Plus className="w-3 h-3 text-gray-900" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* Bottom Bill + Checkout */}
                <div className="p-5 border-t border-gray-200 bg-brand-light sticky bottom-0 z-10 space-y-4">

                    {/* Coupon */}
                    <div>
                        {appliedCoupon ? (
                            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 flex items-center justify-between">
                                <div className="flex items-center gap-2 text-green-400">
                                    <Tag className="w-4 h-4" />
                                    <span className="font-bold text-sm">{appliedCoupon.code}</span>
                                    <span className="text-xs">({appliedCoupon.discountPercentage}% OFF)</span>
                                </div>
                                <button onClick={() => { setAppliedCoupon(null); setCouponInput(""); }} className="text-gray-500 hover:text-gray-900">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <div className="flex gap-2">
                                    <input
                                        type="text" value={couponInput}
                                        onChange={e => setCouponInput(e.target.value)}
                                        onKeyDown={e => e.key === "Enter" && handleApplyCoupon()}
                                        placeholder="Enter Coupon Code"
                                        className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:border-brand-primary uppercase"
                                    />
                                    <button onClick={handleApplyCoupon} className="bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary border border-brand-primary/30 px-4 rounded-lg text-sm font-semibold transition-colors">
                                        Apply
                                    </button>
                                </div>
                                {availableCoupons.length > 0 && (
                                    <div className="flex gap-2 overflow-x-auto hide-scrollbar">
                                        {availableCoupons.map(c => (
                                            <button key={c._id}
                                                onClick={() => { setCouponInput(c.code); setTimeout(handleApplyCoupon, 0); }}
                                                className="shrink-0 bg-brand-gold/10 border border-brand-gold/20 text-brand-gold px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap hover:bg-brand-gold/20 transition-colors"
                                            >
                                                {c.code} ({c.discountPercentage}%)
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Bill Summary */}
                    <div className="glass-panel p-4">
                        <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <Receipt className="w-4 h-4 text-brand-primary" /> Bill Summary
                        </h3>
                        <div className="space-y-1.5 text-sm">
                            <div className="flex justify-between text-gray-600">
                                <span>Item Total</span>
                                <span>₹{subtotal.toFixed(2)}</span>
                            </div>
                            {appliedCoupon && (
                                <div className="flex justify-between text-green-400">
                                    <span>Discount ({appliedCoupon.discountPercentage}%)</span>
                                    <span>-₹{discountAmount.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-gray-600">
                                <span>GST ({gstPct}%)</span>
                                <span>₹{gstAmount.toFixed(2)}</span>
                            </div>
                            {serviceChargePct > 0 && (
                                <div className="flex justify-between text-gray-600">
                                    <span>Service Charge ({serviceChargePct}%)</span>
                                    <span>₹{serviceAmount.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="h-px bg-gray-200 my-2" />
                            <div className="flex justify-between font-bold text-base text-gray-900">
                                <span>To Pay</span>
                                <span className="text-brand-gold">₹{total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Payment Mode Info */}
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center gap-3 text-sm text-gray-600">
                        {paymentMode === "razorpay" && <CreditCard className="w-4 h-4 text-blue-500 shrink-0" />}
                        {paymentMode === "upi" && <SmartphoneNfc className="w-4 h-4 text-green-500 shrink-0" />}
                        {paymentMode === "bank" && <IndianRupee className="w-4 h-4 text-purple-500 shrink-0" />}
                        {paymentMode === "cash" && <Banknote className="w-4 h-4 text-brand-gold shrink-0" />}
                        <span>{paymentMode === "razorpay" ? "Secure card payment via Razorpay" : paymentMode === "upi" ? `UPI: ${restaurantInfo?.upiId || "Scan QR at counter"}` : paymentMode === "bank" ? "Bank transfer — details on next screen" : "Pay cash at counter or on delivery"}</span>
                    </div>

                    {/* Place Order Button */}
                    <button
                        onClick={handleRazorpayPayment}
                        disabled={loading || cart.length === 0}
                        className="glass-button w-full py-4 text-base font-bold disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {loading
                            ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
                            : <><CreditCard className="w-5 h-5" /> {paymentLabel}</>
                        }
                    </button>

                    {paymentMode === "razorpay" && (
                        <p className="text-center text-xs text-gray-400">
                            🔒 Secured by Razorpay · Test card: <strong>4111 1111 1111 1111</strong>
                        </p>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>,
        document.body
    );
}

export default Cart;
