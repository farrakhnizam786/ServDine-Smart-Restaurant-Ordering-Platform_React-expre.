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