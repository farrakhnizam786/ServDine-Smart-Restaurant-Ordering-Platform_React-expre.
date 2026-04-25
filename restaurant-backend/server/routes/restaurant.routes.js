const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth.middleware");

const { getNearbyRestaurants, getRestaurant, getRestaurantCoupons, getAllCoupons, toggleOpen } = require("../controllers/restaurant.controller");

// 🔥 Public
router.get("/nearby", getNearbyRestaurants);
router.get("/all/coupons", getAllCoupons);
router.get("/:id", getRestaurant);
router.get("/:id/coupons", getRestaurantCoupons);

// 🔥 Protected (kitchen/admin can toggle open/close)
router.put("/toggle-open", protect, authorize("admin", "kitchen", "superadmin"), toggleOpen);

module.exports = router;