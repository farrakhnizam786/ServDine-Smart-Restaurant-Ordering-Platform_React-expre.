const express = require("express");
const router = express.Router();

const { protect, authorize } = require("../middleware/auth.middleware");

const {
    createTable,
    getTables,
    deleteTable,
} = require("../controllers/table.controller");


// 🔥 Create table (Admin only)
router.post("/", protect, authorize("admin"), createTable);


// 🔥 Get all tables of restaurant
router.get("/", protect, authorize("admin"), getTables);


// 🔥 Delete table
router.delete("/:id", protect, authorize("admin"), deleteTable);


module.exports = router;