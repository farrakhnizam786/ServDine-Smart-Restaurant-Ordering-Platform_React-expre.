const User = require("../models/user.model");
const Restaurant = require("../models/restaurant.model");
const bcrypt = require("bcryptjs");

exports.getAllData = async (req, res) => {
    try {
        const restaurants = await Restaurant.find();
        const users = await User.find().select("-password").populate("restaurantId", "name");
        
        res.json({
            restaurants,
            users
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        await User.findByIdAndDelete(id);
        res.json({ message: "User deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateUserPassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { password } = req.body;
        
        const hashed = await bcrypt.hash(password, 10);
        await User.findByIdAndUpdate(id, { password: hashed });
        
        res.json({ message: "Password updated successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteRestaurant = async (req, res) => {
    try {
        const { id } = req.params;
        await Restaurant.findByIdAndDelete(id);
        // Also delete all users associated with this restaurant
        await User.deleteMany({ restaurantId: id });
        res.json({ message: "Restaurant and associated users deleted" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateRestaurant = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, address, image, category, since } = req.body;
        
        await Restaurant.findByIdAndUpdate(id, {
            name, address, image, category, since
        });
        res.json({ message: "Restaurant updated successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
