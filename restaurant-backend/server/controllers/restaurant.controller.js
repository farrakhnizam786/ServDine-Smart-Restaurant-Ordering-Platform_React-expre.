const Restaurant = require("../models/restaurant.model");
const Coupon = require("../models/coupon.model");

exports.getNearbyRestaurants = async (req, res) => {
    try {
        const { lat, lng } = req.query;

        let restaurants = await Restaurant.find({
            location: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [parseFloat(lng), parseFloat(lat)],
                    },
                    $maxDistance: 50000,
                },
            },
        }).catch(() => []); // Ignore index errors

        if (!restaurants || restaurants.length === 0) {
            restaurants = await Restaurant.find({});
        }

        res.json(restaurants);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getRestaurant = async (req, res) => {
    try {
        const { id } = req.params;
        const restaurant = await Restaurant.findById(id);
        if (!restaurant) {
            return res.status(404).json({ message: "Restaurant not found" });
        }
        res.json(restaurant);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getRestaurantCoupons = async (req, res) => {
    try {
        const { id } = req.params;
        const coupons = await Coupon.find({ restaurantId: id });
        res.json(coupons);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getAllCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.find().populate("restaurantId", "name");
        res.json(coupons);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.toggleOpen = async (req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.user.restaurantId);
        if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });
        restaurant.isOpen = !restaurant.isOpen;
        await restaurant.save();
        // Broadcast to all customers via socket
        const io = req.app.get("io");
        io.emit("restaurantStatusChanged", { restaurantId: restaurant._id, isOpen: restaurant.isOpen });
        res.json({ message: "Status updated", isOpen: restaurant.isOpen });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// 🔥 Admin updates GST & Tax settings
exports.updateTaxSettings = async (req, res) => {
    try {
        const { gstPercentage, serviceChargePercentage, gstNumber } = req.body;
        const restaurant = await Restaurant.findByIdAndUpdate(
            req.user.restaurantId,
            { gstPercentage, serviceChargePercentage, gstNumber },
            { new: true }
        );
        if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });
        res.json({ message: "Tax settings updated successfully", restaurant });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// 🔥 Get Tax Settings (for cart calculation)
exports.getTaxSettings = async (req, res) => {
    try {
        const { id } = req.params;
        const restaurant = await Restaurant.findById(id).select("gstPercentage serviceChargePercentage gstNumber");
        if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });
        res.json(restaurant);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// 🔥 SuperAdmin updates Payment Settings
exports.updatePaymentSettings = async (req, res) => {
    try {
        const { razorpayKeyId, razorpayKeySecret, upiId, bankName, bankAccountNumber, bankIfscCode, paymentMode } = req.body;
        const restaurant = await Restaurant.findByIdAndUpdate(
            req.user.restaurantId,
            { razorpayKeyId, razorpayKeySecret, upiId, bankName, bankAccountNumber, bankIfscCode, paymentMode },
            { new: true }
        );
        if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });
        // Don't return sensitive keys to client — just confirm
        res.json({ message: "Payment settings updated successfully", paymentMode: restaurant.paymentMode });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// 🔥 Get Payment Settings for SuperAdmin view
exports.getPaymentSettings = async (req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.user.restaurantId)
            .select("razorpayKeyId upiId bankName bankAccountNumber bankIfscCode paymentMode");
        if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });
        res.json(restaurant);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};