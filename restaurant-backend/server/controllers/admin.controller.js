const User = require("../models/user.model");
const bcrypt = require("bcryptjs");

// Create staff
exports.createStaff = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        const exists = await User.findOne({ email });
        if (exists) {
            return res.status(400).json({ message: "Staff already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const userRole = role === "kitchen" ? "kitchen" : role === "delivery" ? "delivery" : "staff";

        const staff = await User.create({
            name,
            email,
            password: hashedPassword,
            role: userRole,
            restaurantId: req.user.restaurantId, // 🔥 important
        });

        res.status(201).json({
            message: "Staff created",
            staff: {
                name: staff.name,
                email: staff.email,
                role: staff.role,
            },
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get staff
exports.getStaff = async (req, res) => {
    try {
        const staff = await User.find({ restaurantId: req.user.restaurantId, role: { $in: ["staff", "kitchen", "delivery"] } }).select("-password");
        res.json(staff);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Delete staff
exports.deleteStaff = async (req, res) => {
    try {
        const { id } = req.params;
        const staff = await User.findOneAndDelete({ _id: id, restaurantId: req.user.restaurantId, role: { $in: ["staff", "kitchen", "delivery"] } });
        if (!staff) {
            return res.status(404).json({ message: "Staff not found" });
        }
        res.json({ message: "Staff deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const Order = require("../models/order.model");
const Menu = require("../models/menu.model");
const Coupon = require("../models/coupon.model");

// Create Coupon
exports.createCoupon = async (req, res) => {
    try {
        const { code, discountPercentage } = req.body;
        const exists = await Coupon.findOne({ code: code.toUpperCase(), restaurantId: req.user.restaurantId });
        if (exists) {
            return res.status(400).json({ message: "Coupon code already exists" });
        }
        
        const coupon = await Coupon.create({
            code: code.toUpperCase(),
            discountPercentage,
            restaurantId: req.user.restaurantId
        });
        
        res.status(201).json({ message: "Coupon created", coupon });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get Coupons
exports.getCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.find({ restaurantId: req.user.restaurantId }).sort({ createdAt: -1 });
        res.json(coupons);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Delete Coupon
exports.deleteCoupon = async (req, res) => {
    try {
        const { id } = req.params;
        const coupon = await Coupon.findOneAndDelete({ _id: id, restaurantId: req.user.restaurantId });
        if (!coupon) return res.status(404).json({ message: "Coupon not found" });
        res.json({ message: "Coupon deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get Dashboard Stats
exports.getDashboardStats = async (req, res) => {
    try {
        const restaurantId = req.user.restaurantId;
        const orders = await Order.find({ restaurantId });
        
        // Staff Count (include delivery)
        const staffCount = await User.countDocuments({ restaurantId, role: { $in: ["staff", "kitchen", "delivery"] } });
        
        // Date boundaries
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        const todayOrders = await Order.find({ restaurantId, createdAt: { $gte: today } });
        const monthOrders = await Order.find({ restaurantId, createdAt: { $gte: firstDayOfMonth } });

        const dailyOrderCount = todayOrders.length;

        // Menu Count
        const menuCount = await Menu.countDocuments({ restaurantId });

        const dailyRevenue = todayOrders.filter(o => o.status === "delivered").reduce((sum, o) => sum + (o.totalAmount || 0), 0);
        const monthlyRevenue = monthOrders.filter(o => o.status === "delivered").reduce((sum, o) => sum + (o.totalAmount || 0), 0);
        const totalRevenue = orders.filter(o => o.status === "delivered").reduce((sum, o) => sum + (o.totalAmount || 0), 0);

        res.json({
            staffCount,
            dailyOrderCount,
            menuCount,
            dailyRevenue,
            monthlyRevenue,
            totalRevenue
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Update Staff Password
exports.updateStaffPassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { password } = req.body;
        
        const staff = await User.findOne({ _id: id, restaurantId: req.user.restaurantId, role: { $in: ["staff", "kitchen"] } });
        if (!staff) return res.status(404).json({ message: "User not found" });

        staff.password = await bcrypt.hash(password, 10);
        await staff.save();
        
        res.json({ message: "Password updated successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Toggle Staff Status
exports.toggleStaffStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const staff = await User.findOne({ _id: id, restaurantId: req.user.restaurantId, role: { $in: ["staff", "kitchen"] } });
        if (!staff) return res.status(404).json({ message: "User not found" });

        staff.isActive = !staff.isActive;
        await staff.save();
        
        res.json({ message: "Staff status updated", isActive: staff.isActive });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Toggle Staff Availability (Active/Inactive shift status)
exports.toggleStaffAvailability = async (req, res) => {
    try {
        const { id } = req.params;
        const { isAvailable } = req.body;
        const staff = await User.findOneAndUpdate(
            { _id: id, restaurantId: req.user.restaurantId },
            { isAvailable },
            { new: true }
        );
        if (!staff) return res.status(404).json({ message: "User not found" });

        // 🔥 Broadcast to restaurant room so kitchen/admin see it in real-time
        const io = req.app.get("io");
        if (io && req.user.restaurantId) {
            io.to(req.user.restaurantId.toString()).emit("staffAvailabilityChanged", {
                staffId: staff._id,
                name: staff.name,
                isAvailable: staff.isAvailable
            });
        }

        res.json({ message: "Availability updated", isAvailable: staff.isAvailable });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get Active (Available) Staff for KitchenScreen
exports.getActiveStaff = async (req, res) => {
    try {
        const staff = await User.find({
            restaurantId: req.user.restaurantId,
            role: { $in: ["staff", "delivery"] },
            isAvailable: true,
            isActive: true
        }).select("name email isAvailable role");
        res.json(staff);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};