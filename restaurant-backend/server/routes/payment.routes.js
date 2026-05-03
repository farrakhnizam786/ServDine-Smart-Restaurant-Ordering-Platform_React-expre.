const express = require("express");
const router = express.Router();
const Razorpay = require("razorpay");
const crypto = require("crypto");
const { protect, authorize } = require("../middleware/auth.middleware");
const Restaurant = require("../models/restaurant.model");

// 🔥 Create Razorpay Order — uses the restaurant's own keys
router.post("/create-order", protect, authorize("customer"), async (req, res) => {
    try {
        const { amount, restaurantId } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ message: "Invalid amount" });
        }

        // Fetch restaurant to get its Razorpay keys
        const restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant) {
            return res.status(404).json({ message: "Restaurant not found" });
        }

        // Use restaurant keys if set, otherwise fall back to test keys
        const keyId = restaurant.razorpayKeyId || process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder";
        const keySecret = restaurant.razorpayKeySecret || process.env.RAZORPAY_KEY_SECRET || "placeholder_secret";

        if (!keyId || keyId === "rzp_test_placeholder") {
            return res.status(400).json({ 
                message: "Razorpay not configured. SuperAdmin must add Razorpay keys in Payment Settings." 
            });
        }

        const instance = new Razorpay({ key_id: keyId, key_secret: keySecret });

        const order = await instance.orders.create({
            amount: Math.round(amount * 100), // paise
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
        });

        res.json({ 
            orderId: order.id, 
            amount: order.amount, 
            currency: order.currency,
            keyId // send public key to frontend
        });

    } catch (err) {
        console.error("Razorpay create-order error:", err);
        res.status(500).json({ message: err.message || "Failed to create payment order" });
    }
});

// 🔥 Verify Razorpay Payment Signature
router.post("/verify", protect, authorize("customer"), async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, restaurantId } = req.body;

        const restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });

        const keySecret = restaurant.razorpayKeySecret || process.env.RAZORPAY_KEY_SECRET || "";

        // Verify signature
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", keySecret)
            .update(body)
            .digest("hex");

        if (expectedSignature === razorpay_signature) {
            res.json({ success: true, paymentId: razorpay_payment_id });
        } else {
            res.status(400).json({ success: false, message: "Payment verification failed" });
        }
    } catch (err) {
        console.error("Razorpay verify error:", err);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;