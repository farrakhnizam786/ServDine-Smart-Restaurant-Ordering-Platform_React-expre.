const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth.middleware");

const { 
    getNearbyRestaurants, 
    getRestaurant, 
    getRestaurantCoupons, 
    getAllCoupons, 
    toggleOpen,
    updateTaxSettings,
    getTaxSettings,
    updatePaymentSettings,
    getPaymentSettings
} = require("../controllers/restaurant.controller");

// 🔥 Public
router.get("/nearby", getNearbyRestaurants);
router.get("/all/coupons", getAllCoupons);
router.get("/:id", getRestaurant);
router.get("/:id/coupons", getRestaurantCoupons);
router.get("/:id/tax", getTaxSettings); // Public — cart needs this

// 🔥 Protected (admin can toggle open/close + update GST)
router.put("/toggle-open", protect, authorize("admin", "kitchen", "superadmin"), toggleOpen);
router.put("/tax-settings", protect, authorize("admin", "superadmin"), updateTaxSettings);

// 🔥 SuperAdmin only — payment settings
router.put("/payment-settings", protect, authorize("superadmin"), updatePaymentSettings);
router.get("/my/payment-settings", protect, authorize("superadmin"), getPaymentSettings);

module.exports = router;