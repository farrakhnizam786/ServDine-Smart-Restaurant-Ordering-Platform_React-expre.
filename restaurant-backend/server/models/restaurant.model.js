const mongoose = require("mongoose");

const restaurantSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        address: {
            type: String,
        },

        image: {
            type: String,
        },

        category: {
            type: String,
        },

        since: {
            type: String,
        },

        // 🔥 Geo location for nearby search
        location: {
            type: {
                type: String,
                enum: ["Point"],
                default: "Point",
            },
            coordinates: {
                type: [Number], // [lng, lat]
                required: true,
            },
        },

        isOpen: {
            type: Boolean,
            default: true,
        },

        // 🔥 GST & Tax Settings (Admin configurable)
        gstPercentage: {
            type: Number,
            default: 0,
            min: 0,
            max: 100,
        },
        serviceChargePercentage: {
            type: Number,
            default: 0,
            min: 0,
            max: 100,
        },
        gstNumber: {
            type: String,
            default: "",
        },

        // 🔥 Payment Settings (SuperAdmin configurable)
        razorpayKeyId: {
            type: String,
            default: "",
        },
        razorpayKeySecret: {
            type: String,
            default: "",
        },
        upiId: {
            type: String,
            default: "",
        },
        bankName: {
            type: String,
            default: "",
        },
        bankAccountNumber: {
            type: String,
            default: "",
        },
        bankIfscCode: {
            type: String,
            default: "",
        },
        paymentMode: {
            type: String,
            enum: ["razorpay", "upi", "bank", "cash"],
            default: "cash",
        },

        // 🔥 Banners and Offers (Festival posters, flash cards)
        banners: [
            {
                url: { type: String, required: true },
                title: { type: String },
                isActive: { type: Boolean, default: true }
            }
        ],

        // 🔥 Category wise discounts (Timed)
        categoryDiscounts: [
            {
                category: { type: String, required: true },
                discountPercentage: { type: Number, required: true },
                expiresAt: { type: Date, required: true }
            }
        ]
    },
    { timestamps: true }
);

// 🔥 Geo index (VERY IMPORTANT)
restaurantSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Restaurant", restaurantSchema);