const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth.middleware");
const { submitReview, getRestaurantReviews, checkOrderReview } = require("../controllers/review.controller");

// Customer submits review (only delivered orders — enforced on frontend)
router.post("/", protect, authorize("customer"), submitReview);

// Public: get all reviews for a restaurant
router.get("/:restaurantId", getRestaurantReviews);

// Customer: check if already reviewed a specific order
router.get("/check/:orderId", protect, authorize("customer"), checkOrderReview);

module.exports = router;
