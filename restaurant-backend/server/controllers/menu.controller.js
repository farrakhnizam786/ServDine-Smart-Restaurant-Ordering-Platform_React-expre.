const Menu = require("../models/menu.model");
const Order = require("../models/order.model");
const mongoose = require("mongoose");


// 🔥 Add food item (Admin / Superadmin)
exports.addMenuItem = async (req, res) => {
    try {
        const { name, price, description, category, image } = req.body;

        // ✅ Validation
        if (!name || !price) {
            return res.status(400).json({ message: "Name and price are required" });
        }

        if (!req.user.restaurantId) {
            return res.status(400).json({ message: "User not linked to restaurant" });
        }

        const item = await Menu.create({
            name,
            price,
            description,
            category,
            image,
            restaurantId: req.user.restaurantId,
        });

        res.status(201).json({
            message: "Menu item added",
            item
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};



// 🔥 Get menu by restaurant (Public)
exports.getMenu = async (req, res) => {
    try {
        const { restaurantId } = req.params;

        // ✅ Validate ID
        if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
            return res.status(400).json({ message: "Invalid restaurant ID" });
        }

        const menu = await Menu.find({ restaurantId })
            .select("-__v")
            .sort({ createdAt: -1 });

        res.json({
            count: menu.length,
            menu,
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};



// 🔥 Delete menu item (Admin only)
exports.deleteMenuItem = async (req, res) => {
    try {
        const { id } = req.params;

        // ✅ Validate ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid item ID" });
        }

        const item = await Menu.findById(id);

        if (!item) {
            return res.status(404).json({ message: "Item not found" });
        }

        // 🔒 Ensure admin deletes only their restaurant items
        if (item.restaurantId.toString() !== req.user.restaurantId.toString()) {
            return res.status(403).json({ message: "Not authorized" });
        }

        await item.deleteOne();

        res.json({ message: "Item deleted successfully" });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};



// 🔥 Update menu item — emits socket event so all customers see the new price
exports.updateMenuItem = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid item ID" });
        }

        const item = await Menu.findById(id);

        if (!item) {
            return res.status(404).json({ message: "Item not found" });
        }

        // 🔒 Ownership check
        if (
            !item.restaurantId ||
            item.restaurantId.toString() !== req.user.restaurantId?.toString()
        ) {
            return res.status(403).json({ message: "Not authorized" });
        }

        const updatedItem = await Menu.findByIdAndUpdate(
            id,
            req.body,
            { new: true }
        ).select("-__v");

        // 🔥 Real-time price broadcast — all customers on this restaurant's menu see the update
        const io = req.app.get("io");
        if (io && req.user.restaurantId) {
            io.to(req.user.restaurantId.toString()).emit("menuItemUpdated", {
                item: updatedItem
            });
        }

        res.json({
            message: "Item updated",
            item: updatedItem,
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// 🔥 Smart Recommendations — popularity-based with daily thresholds
exports.getRecommendations = async (req, res) => {
    try {
        const { restaurantId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
            return res.status(400).json({ message: "Invalid restaurant ID" });
        }

        const allItems = await Menu.find({ restaurantId }).select("-__v");

        // All-time orders (delivered)
        const allOrders = await Order.find({ restaurantId, status: "delivered" });

        // Today's orders (delivered)
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayOrders = await Order.find({
            restaurantId,
            status: "delivered",
            createdAt: { $gte: todayStart }
        });

        // Count all-time frequency
        const totalFreq = {};
        allOrders.forEach(order => {
            (order.items || []).forEach(item => {
                const key = item.menuItemId?.toString() || item.name;
                totalFreq[key] = (totalFreq[key] || 0) + (item.quantity || 1);
            });
        });

        // Count today's frequency
        const todayFreq = {};
        todayOrders.forEach(order => {
            (order.items || []).forEach(item => {
                const key = item.menuItemId?.toString() || item.name;
                todayFreq[key] = (todayFreq[key] || 0) + (item.quantity || 1);
            });
        });

        // Enrich items
        const enriched = allItems.map(item => ({
            ...item.toObject(),
            orderCount: totalFreq[item._id.toString()] || 0,
            todayCount: todayFreq[item._id.toString()] || 0,
        }));

        // Today's Specials: ordered MORE than 20 times today
        const todaySpecials = enriched
            .filter(i => i.todayCount > 20)
            .sort((a, b) => b.todayCount - a.todayCount)
            .slice(0, 8);

        // Highly Recommended: ordered MORE than 50 times total OR MORE than 30 times today
        const highlyRecommended = enriched
            .filter(i => i.orderCount > 50 || i.todayCount > 30)
            .sort((a, b) => (b.orderCount + b.todayCount * 2) - (a.orderCount + a.todayCount * 2))
            .slice(0, 8);

        // Most Popular: top ordered overall (excludes items already in highlyRecommended)
        const hrIds = new Set(highlyRecommended.map(i => i._id.toString()));
        const popular = enriched
            .filter(i => i.orderCount > 0 && !hrIds.has(i._id.toString()))
            .sort((a, b) => b.orderCount - a.orderCount)
            .slice(0, 8);

        res.json({ popular, todaySpecials, highlyRecommended });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};