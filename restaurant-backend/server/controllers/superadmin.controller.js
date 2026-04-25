const User = require("../models/user.model");
const Restaurant = require("../models/restaurant.model");
const bcrypt = require("bcryptjs");

// 🔥 Create Restaurant + SuperAdmin
exports.createRestaurantWithSuperAdmin = async (req, res) => {
    try {
        const { name, email, password, restaurantName, coordinates, address, image, category, since } = req.body;

        const hashed = await bcrypt.hash(password, 10);

        const restaurant = await Restaurant.create({
            name: restaurantName,
            address,
            image,
            category,
            since,
            location: {
                type: "Point",
                coordinates,
            },
        });

        const superadmin = await User.create({
            name,
            email,
            password: hashed,
            role: "superadmin",
            restaurantId: restaurant._id,
        });

        res.json({
            message: "Restaurant + SuperAdmin created",
            restaurant,
            superadmin,
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


// 🔥 SuperAdmin creates Admin
exports.createAdmin = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const hashed = await bcrypt.hash(password, 10);

        const admin = await User.create({
            name,
            email,
            password: hashed,
            role: "admin",
            restaurantId: req.user.restaurantId,
        });

        res.json({ message: "Admin created", admin });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// 🔥 SuperAdmin gets all admins
exports.getAllAdmins = async (req, res) => {
    try {
        const admins = await User.find({ restaurantId: req.user.restaurantId, role: "admin" }).select("-password");
        res.json(admins);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// 🔥 SuperAdmin deletes user (admin or staff)
exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findOneAndDelete({ _id: id, restaurantId: req.user.restaurantId, role: { $ne: "superadmin" } });
        if (!user) {
            return res.status(404).json({ message: "User not found or not authorized" });
        }
        res.json({ message: "User deleted" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// 🔥 SuperAdmin updates user password (admin or staff)
exports.updateUserPassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { password } = req.body;
        
        // Ensure the user belongs to the superadmin's restaurant
        const user = await User.findOne({ _id: id, restaurantId: req.user.restaurantId, role: { $ne: "superadmin" } });
        if (!user) {
            return res.status(404).json({ message: "User not found or not authorized" });
        }

        const hashed = await bcrypt.hash(password, 10);
        user.password = hashed;
        await user.save();
        
        res.json({ message: "Password updated successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// 🔥 SuperAdmin gets all users
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find({ restaurantId: req.user.restaurantId, role: { $ne: "superadmin" } }).select("-password");
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const Order = require("../models/order.model");
const Menu = require("../models/menu.model");

// 🔥 SuperAdmin Dashboard Analytics
exports.getDashboardStats = async (req, res) => {
    try {
        const restaurantId = req.user.restaurantId;
        
        // Staff Count
        const staffCount = await User.countDocuments({ restaurantId, role: { $in: ["admin", "staff", "kitchen"] } });
        
        // Menu Count
        const menuItems = await Menu.find({ restaurantId });
        const menuCount = menuItems.length;

        // Date boundaries
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        // Orders
        const todayOrders = await Order.find({ restaurantId, createdAt: { $gte: today } });
        const monthOrders = await Order.find({ restaurantId, createdAt: { $gte: firstDayOfMonth } });

        const dailyRevenue = todayOrders.filter(o => o.status === "delivered").reduce((sum, o) => sum + o.totalAmount, 0);
        const monthlyRevenue = monthOrders.filter(o => o.status === "delivered").reduce((sum, o) => sum + o.totalAmount, 0);
        const dailyCustomers = todayOrders.length;

        res.json({
            staffCount,
            menuCount,
            dailyRevenue,
            monthlyRevenue,
            dailyCustomers,
            menuItems: menuItems.map(m => m.name)
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};