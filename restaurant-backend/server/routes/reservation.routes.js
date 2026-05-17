const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth.middleware");
const {
    createReservation,
    getRestaurantReservations,
    updateReservationStatus,
    getMyReservations,
    cancelReservation,
} = require("../controllers/reservation.controller");

// Public — customers book a table (optionally authenticated)
router.post("/", createReservation);

// Protected — kitchen/admin sees all reservations
router.get(
    "/restaurant",
    protect,
    authorize("admin", "superadmin", "kitchen", "staff"),
    getRestaurantReservations
);

// Protected — update status (confirm / seat / complete / cancel)
router.put(
    "/:id/status",
    protect,
    authorize("admin", "superadmin", "kitchen", "staff"),
    updateReservationStatus
);

// Public — customer tracks their reservations by phone
router.get("/my", getMyReservations);

// Cancel a reservation
router.put("/:id/cancel", cancelReservation);

module.exports = router;
