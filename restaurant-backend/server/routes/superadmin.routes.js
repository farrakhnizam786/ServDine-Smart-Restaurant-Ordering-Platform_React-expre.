const express = require("express");
const router = express.Router();

const { protect, authorize } = require("../middleware/auth.middleware");

const {
    createRestaurantWithSuperAdmin,
    createAdmin,
    getAllAdmins,
    deleteUser,
    updateUserPassword,
    getAllUsers,
    getDashboardStats,
    getRevenueAnalytics
} = require("../controllers/superadmin.controller");

// 🔥 PUBLIC → create first restaurant + superadmin
router.post("/create-restaurant", createRestaurantWithSuperAdmin);

// 🔒 Protected (only superadmin)
router.use(protect, authorize("superadmin"));

// Create admin
router.post("/create-admin", createAdmin);

// Get admins
router.get("/admins", getAllAdmins);

// Delete user
router.delete("/user/:id", deleteUser);

// Update user password
router.put("/user/:id/password", updateUserPassword);

// Get users
router.get("/users", getAllUsers);

// Get Dashboard Stats
router.get("/dashboard", getDashboardStats);

// 🔥 Revenue Analytics with filter
router.get("/revenue", getRevenueAnalytics);

module.exports = router;