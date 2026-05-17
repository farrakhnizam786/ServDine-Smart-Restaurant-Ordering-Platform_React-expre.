const Reservation = require("../models/reservation.model");

// ──────────────────────────────────────────────
// PUBLIC — Create a Reservation (customer booking)
// ──────────────────────────────────────────────
exports.createReservation = async (req, res) => {
    try {
        const {
            restaurantId,
            customerName,
            customerEmail,
            customerPhone,
            partySize,
            reservationDate,
            reservationTime,
            specialRequests,
            tablePreference,
            occasion,
            advanceAmount,
            paymentId,
        } = req.body;

        const reservation = await Reservation.create({
            restaurantId,
            customerName,
            customerEmail,
            customerPhone,
            partySize,
            reservationDate,
            reservationTime,
            specialRequests,
            tablePreference,
            occasion,
            advanceAmount: advanceAmount || 0,
            paymentId: paymentId || "",
            paymentStatus: advanceAmount > 0 && paymentId ? "paid" : "not_required",
            userId: req.user?._id || null,
        });

        // Emit socket event if available
        if (req.app.get("io")) {
            req.app.get("io").to(restaurantId).emit("newReservation", reservation);
        }

        res.status(201).json({ success: true, reservation });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to create reservation", error: err.message });
    }
};

// ──────────────────────────────────────────────
// KITCHEN / ADMIN — Get all reservations for a restaurant
// ──────────────────────────────────────────────
exports.getRestaurantReservations = async (req, res) => {
    try {
        const user = req.user;
        if (!user.restaurantId) return res.status(403).json({ message: "No restaurant assigned" });

        const { date, status } = req.query;
        const filter = { restaurantId: user.restaurantId };

        if (date) {
            const start = new Date(date);
            start.setHours(0, 0, 0, 0);
            const end = new Date(date);
            end.setHours(23, 59, 59, 999);
            filter.reservationDate = { $gte: start, $lte: end };
        }

        if (status) filter.status = status;

        const reservations = await Reservation.find(filter)
            .sort({ reservationDate: 1, reservationTime: 1 })
            .lean();

        res.json(reservations);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch reservations" });
    }
};

// ──────────────────────────────────────────────
// KITCHEN / ADMIN — Update reservation status
// ──────────────────────────────────────────────
exports.updateReservationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const reservation = await Reservation.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );

        if (!reservation) return res.status(404).json({ message: "Reservation not found" });

        // Emit socket event
        if (req.app.get("io")) {
            req.app.get("io").to(reservation.restaurantId.toString()).emit("reservationUpdated", reservation);
        }

        res.json({ success: true, reservation });
    } catch (err) {
        res.status(500).json({ message: "Failed to update status" });
    }
};

// ──────────────────────────────────────────────
// PUBLIC — Get reservations by phone (customer tracking)
// ──────────────────────────────────────────────
exports.getMyReservations = async (req, res) => {
    try {
        const { phone, restaurantId } = req.query;
        const filter = {};
        if (phone) filter.customerPhone = phone;
        if (restaurantId) filter.restaurantId = restaurantId;
        if (req.user?._id) filter.userId = req.user._id;

        const reservations = await Reservation.find(filter)
            .populate("restaurantId", "name phone")
            .sort({ reservationDate: -1 })
            .lean();

        res.json(reservations);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch reservations" });
    }
};

// ──────────────────────────────────────────────
// Cancel a reservation (customer or admin)
// ──────────────────────────────────────────────
exports.cancelReservation = async (req, res) => {
    try {
        const { id } = req.params;
        const reservation = await Reservation.findByIdAndUpdate(
            id,
            { status: "cancelled" },
            { new: true }
        );
        if (!reservation) return res.status(404).json({ message: "Reservation not found" });
        res.json({ success: true, reservation });
    } catch (err) {
        res.status(500).json({ message: "Failed to cancel reservation" });
    }
};
