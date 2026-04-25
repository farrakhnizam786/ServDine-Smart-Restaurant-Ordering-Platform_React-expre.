const mongoose = require("mongoose");

const tableSchema = new mongoose.Schema(
    {
        tableNumber: {
            type: Number,
            required: true,
        },

        name: String,

        restaurantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Restaurant",
            required: true,
        },

        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

// 🔥 Prevent duplicate table numbers per restaurant
tableSchema.index({ tableNumber: 1, restaurantId: 1 }, { unique: true });

module.exports = mongoose.model("Table", tableSchema);