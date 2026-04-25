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
    },
    { timestamps: true }
);

// 🔥 Geo index (VERY IMPORTANT)
restaurantSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Restaurant", restaurantSchema);