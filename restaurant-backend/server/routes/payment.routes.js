const express = require("express");
const router = express.Router();
const Razorpay = require("razorpay");

const instance = new Razorpay({
    key_id: "YOUR_KEY",
    key_secret: "YOUR_SECRET",
});

router.post("/create-order", async (req, res) => {
    const { amount } = req.body;

    const order = await instance.orders.create({
        amount: amount * 100,
        currency: "INR",
    });

    res.json(order);
});

module.exports = router;