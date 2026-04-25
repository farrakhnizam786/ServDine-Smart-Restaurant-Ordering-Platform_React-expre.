const express = require("express");
const router = express.Router();

const { protect, authorize } = require("../middleware/auth.middleware");

const {
    generateTableQR,
    generateMultipleQR,
    downloadQR,
} = require("../controllers/qr.controller");

// 🔐 Admin access
router.post("/generate", protect, authorize("admin", "superadmin"), generateTableQR);
router.post("/generate-multiple", protect, authorize("admin"), generateMultipleQR);
router.get("/download", protect, authorize("admin"), downloadQR);

module.exports = router;