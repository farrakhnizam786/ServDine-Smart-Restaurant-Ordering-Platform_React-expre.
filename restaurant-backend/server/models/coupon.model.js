const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: true,
            uppercase: true,
        },
        discountPercentage: {
            type: Number,
            required: true,
            min: 1,
            max: 100,
        },
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

couponSchema.index({ code: 1, restaurantId: 1 }, { unique: true });

module.exports = mongoose.model("Coupon", couponSchema);
