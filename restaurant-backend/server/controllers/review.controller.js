const Review = require("../models/review.model");
const Restaurant = require("../models/restaurant.model");

// POST /api/reviews — Customer submits review after order delivered
exports.submitReview = async (req, res) => {
    try {
        const { orderId, restaurantId, rating, comment, userName } = req.body;
        if (!orderId || !restaurantId || !rating) {
            return res.status(400).json({ message: "orderId, restaurantId and rating are required" });
        }

        // Check if review already exists for this order
        const existing = await Review.findOne({ orderId });
        if (existing) return res.status(400).json({ message: "Review already submitted for this order" });

        const review = await Review.create({
            orderId,
            restaurantId,
            userId: req.user._id,
            rating,
            comment: comment || "",
            userName: userName || req.user.name || "Customer"
        });

        res.status(201).json({ message: "Review submitted", review });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// GET /api/reviews/:restaurantId — Get all reviews for a restaurant
exports.getRestaurantReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ restaurantId: req.params.restaurantId })
            .sort({ createdAt: -1 })
            .limit(50);

        // Calculate average rating
        const avg = reviews.length
            ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
            : null;

        res.json({ reviews, avgRating: parseFloat(avg) || 0, count: reviews.length });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// GET /api/reviews/check/:orderId — Check if customer already reviewed this order
exports.checkOrderReview = async (req, res) => {
    try {
        const review = await Review.findOne({ orderId: req.params.orderId, userId: req.user._id });
        res.json({ reviewed: !!review, review });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
