const express = require("express");
const router = express.Router();

const { protect, authorize } = require("../middleware/auth.middleware");

const {
    addMenuItem,
    getMenu,
    deleteMenuItem,
    updateMenuItem,
} = require("../controllers/menu.controller");


// ✅ Admin + Superadmin can add
router.post("/", protect, authorize("admin", "superadmin"), addMenuItem);

// ✅ Public
router.get("/:restaurantId", getMenu);

// ✅ Update
router.put("/:id", protect, authorize("admin", "superadmin"), updateMenuItem);

// ✅ Delete
router.delete("/:id", protect, authorize("admin", "superadmin"), deleteMenuItem);

module.exports = router;