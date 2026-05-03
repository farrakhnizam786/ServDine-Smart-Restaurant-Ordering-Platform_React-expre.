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

// 🔥 Smart Recommendations — popular items + category affinity
exports.getRecommendations = async (req, res) => {
    try {
        const { restaurantId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
            return res.status(400).json({ message: "Invalid restaurant ID" });
        }

        // Get all menu items
        const allItems = await Menu.find({ restaurantId }).select("-__v");

        // Get last 30 days of delivered orders to calculate popularity
        const since = new Date();
        since.setDate(since.getDate() - 30);

        const recentOrders = await Order.find({
            restaurantId,
            status: "delivered",
            createdAt: { $gte: since }
        });

        // Count item frequency
        const itemFrequency = {};
        recentOrders.forEach(order => {
            (order.items || []).forEach(item => {
                const key = item.menuItemId?.toString() || item.name;
                itemFrequency[key] = (itemFrequency[key] || 0) + (item.quantity || 1);
            });
        });

        // Enrich items with order count
        const enriched = allItems.map(item => ({
            ...item.toObject(),
            orderCount: itemFrequency[item._id.toString()] || 0
        }));

        // Sort by order count desc — top 8 = "Most Popular"
        const popular = [...enriched]
            .sort((a, b) => b.orderCount - a.orderCount)
            .slice(0, 8);

        // Today's specials = recently added items (last 7 days) with at least some orders OR new items
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const todaySpecials = enriched
            .filter(i => new Date(i.createdAt) >= sevenDaysAgo)
            .slice(0, 6);

        // Highly recommended = intersection of popular + good description
        const highlyRecommended = enriched
            .filter(i => i.orderCount >= 1 || (i.description && i.description.length > 10))
            .sort((a, b) => b.orderCount - a.orderCount)
            .slice(0, 6);

        res.json({ popular, todaySpecials, highlyRecommended });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};