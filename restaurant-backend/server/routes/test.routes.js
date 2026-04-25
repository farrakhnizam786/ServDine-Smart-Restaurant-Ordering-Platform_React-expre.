const express = require("express");
const router = express.Router();

const { protect, authorize } = require("../middleware/auth.middleware");

// Only admin
router.get("/admin", protect, authorize("admin"), (req, res) => {
    res.json({ message: "Welcome Admin" });
});

// Admin + staff
router.get("/staff", protect, authorize("admin", "staff"), (req, res) => {
    res.json({ message: "Welcome Staff/Admin" });
});

module.exports = router;