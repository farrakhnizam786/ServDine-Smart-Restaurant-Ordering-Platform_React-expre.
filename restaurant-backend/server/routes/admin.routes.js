const express = require("express");
const router = express.Router();

const { protect, authorize } = require("../middleware/auth.middleware");
const { 
    createStaff, 
    getStaff, 
    deleteStaff, 
    getDashboardStats, 
    updateStaffPassword, 
    toggleStaffStatus,
    toggleStaffAvailability,
    getActiveStaff,
    createCoupon,
    getCoupons,
    deleteCoupon
} = require("../controllers/admin.controller");

// 🔥 Staff Management
router.post("/staff", protect, authorize("admin"), createStaff);
router.get("/staff/active", protect, authorize("admin", "kitchen"), getActiveStaff);  // ⚠️ Must be before /:id
router.get("/staff", protect, authorize("admin", "superadmin"), getStaff);
router.delete("/staff/:id", protect, authorize("admin"), deleteStaff);
router.put("/staff/:id/password", protect, authorize("admin"), updateStaffPassword);
router.put("/staff/:id/status", protect, authorize("admin"), toggleStaffStatus);
router.put("/staff/:id/availability", protect, authorize("admin", "staff", "kitchen"), toggleStaffAvailability);

router.get("/dashboard", protect, authorize("admin", "superadmin", "staff"), getDashboardStats);

router.post("/coupons", protect, authorize("admin", "superadmin"), createCoupon);
router.get("/coupons", protect, authorize("admin", "superadmin"), getCoupons);
router.delete("/coupons/:id", protect, authorize("admin", "superadmin"), deleteCoupon);

module.exports = router;