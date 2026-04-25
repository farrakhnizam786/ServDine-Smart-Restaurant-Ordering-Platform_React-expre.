const mongoose = require("mongoose");

const menuSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },

        price: {
            type: Number,
            required: true,
        },

        description: String,

        category: {
            type: String,
            enum: ["veg", "non-veg", "drinks"],
            default: "veg",
        },

        image: String,

        restaurantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Restaurant",
            required: true,
        },
    },
    { timestamps: true }
);

// 🔥 Index for faster filtering
menuSchema.index({ restaurantId: 1 });

module.exports = mongoose.model("Menu", menuSchema);