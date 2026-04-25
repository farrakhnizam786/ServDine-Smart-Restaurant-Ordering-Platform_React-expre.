const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        restaurantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Restaurant",
            required: true,
        },

        items: [
            {
                menuItemId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Menu",
                },
                name: String,
                quantity: Number,
                price: Number,
            },
        ],

        totalAmount: {
            type: Number,
            required: true,
        },

        tableNumber: {
            type: String, // e.g., "Table 1" or "Home Delivery"
        },

        customerNote: {
            type: String,
            default: "",
        },

        staffNote: {
            type: String,
            default: "",
        },

        status: {
            type: String,
            enum: ["pending", "preparing", "ready", "delivered", "cancelled"],
            default: "pending",
        },

        tableNumber: String,
        
        // For takeaway / home delivery orders: null = pending decision, self_pickup = customer collects, out_for_delivery = delivery staff dispatched
        deliveryType: {
            type: String,
            enum: [null, "self_pickup", "out_for_delivery"],
            default: null
        },

        staffId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        
        deliveredAt: {
            type: Date
        }
    },
    { timestamps: true }
);

// 🔥 Index for fast order lookup
orderSchema.index({ restaurantId: 1, status: 1 });

module.exports = mongoose.model("Order", orderSchema);