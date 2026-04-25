const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        email: {
            type: String,
            required: true,
            unique: true, // ✅ this already creates index
            lowercase: true,
            trim: true,
        },

        password: {
            type: String,
            required: true,
        },

        role: {
            type: String,
            enum: [
                "superadmin",
                "admin",
                "staff",
                "kitchen",
                "delivery",
                "customer",
                "editoradmin",
            ],
            default: "customer",
        },

        isActive: {
            type: Boolean,
            default: true,
        },

        isAvailable: {
            type: Boolean,
            default: true,
        },

        // 🔥 Multi-tenant system
        restaurantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Restaurant",
        },
    },
    { timestamps: true }
);

// ❌ REMOVE THIS (causes duplicate warning)
// userSchema.index({ email: 1 });

module.exports = mongoose.model("User", userSchema);