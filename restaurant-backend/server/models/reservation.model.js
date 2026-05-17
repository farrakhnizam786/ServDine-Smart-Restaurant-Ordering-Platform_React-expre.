const mongoose = require("mongoose");

const reservationSchema = new mongoose.Schema(
    {
        restaurantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Restaurant",
            required: true,
        },
        customerName: {
            type: String,
            required: true,
            trim: true,
        },
        customerEmail: {
            type: String,
            trim: true,
            lowercase: true,
        },
        customerPhone: {
            type: String,
            required: true,
            trim: true,
        },
        partySize: {
            type: Number,
            required: true,
            min: 1,
            max: 50,
        },
        reservationDate: {
            type: Date,
            required: true,
        },
        reservationTime: {
            type: String,
            required: true, // e.g. "19:30"
        },
        specialRequests: {
            type: String,
            default: "",
        },
        tablePreference: {
            type: String,
            enum: ["indoor", "outdoor", "window", "private", "any"],
            default: "any",
        },
        occasion: {
            type: String,
            enum: ["birthday", "anniversary", "business", "date", "family", "other", "none"],
            default: "none",
        },
        status: {
            type: String,
            enum: ["pending", "confirmed", "seated", "completed", "cancelled"],
            default: "pending",
        },
        // Payment tracking
        paymentStatus: {
            type: String,
            enum: ["not_required", "pending", "paid", "refunded"],
            default: "not_required",
        },
        advanceAmount: {
            type: Number,
            default: 0,
        },
        paymentId: {
            type: String,
            default: "",
        },
        // Reference to customer user if logged in
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Reservation", reservationSchema);
