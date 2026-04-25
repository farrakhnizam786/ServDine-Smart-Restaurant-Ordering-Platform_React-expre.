const Order = require("../models/order.model");
const mongoose = require("mongoose");
const Coupon = require("../models/coupon.model");
const Restaurant = require("../models/restaurant.model");


// 🔥 Place Order (Customer)
exports.placeOrder = async (req, res) => {
    try {
        const { items, restaurantId, tableNumber } = req.body;

        // ✅ Validate inputs
        if (!items || items.length === 0) {
            return res.status(400).json({ message: "No items in order" });
        }

        if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
            return res.status(400).json({ message: "Invalid restaurant ID" });
        }

        // 🔴 Block orders if restaurant is closed
        const restaurant = await Restaurant.findById(restaurantId);
        if (restaurant && restaurant.isOpen === false) {
            return res.status(403).json({ message: "Restaurant is currently closed and not accepting orders" });
        }

        // ✅ Calculate total safely
        let subtotal = items.reduce((sum, item) => {
            if (!item.price || !item.quantity) return sum;
            return sum + item.price * item.quantity;
        }, 0);
        
        let discountAmount = 0;
        if (req.body.couponCode) {
            const coupon = await Coupon.findOne({ code: req.body.couponCode.toUpperCase(), restaurantId });
            if (coupon) {
                discountAmount = (subtotal * coupon.discountPercentage) / 100;
            }
        }
        
        const discountedSubtotal = subtotal - discountAmount;
        const tax = discountedSubtotal * 0.05;
        const totalAmount = discountedSubtotal + tax;

        const order = await Order.create({
            userId: req.user._id,
            restaurantId,
            items,
            totalAmount,
            tableNumber,
        });

        // 🔥 SOCKET EMIT (NEW ORDER)
        const io = req.app.get("io");
        io.to(restaurantId.toString()).emit("newOrder", order);

        res.status(201).json({
            message: "Order placed",
            order: {
                _id: order._id,
                items: order.items,
                totalAmount: order.totalAmount,
                status: order.status,
                tableNumber: order.tableNumber,
                createdAt: order.createdAt,
            },
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};



// 🔥 Get Orders (Admin/Staff/Kitchen/Delivery)
exports.getOrders = async (req, res) => {
    try {
        let query = {};
        if (req.user.role !== "superadmin" && req.user.role !== "editoradmin") {
            if (!req.user.restaurantId) {
                return res.status(400).json({ message: "User not linked to restaurant" });
            }
            query.restaurantId = req.user.restaurantId;
        }

        // 🚚 Delivery staff: only see home delivery + takeaway marked for delivery
        if (req.user.role === "delivery") {
            query.$or = [
                { tableNumber: { $regex: /home delivery/i }, deliveryType: { $ne: "self_pickup" } },
                { tableNumber: "Takeaway", deliveryType: "out_for_delivery" }
            ];
        }

        // 🤵 Regular staff: exclude home delivery/takeaway AND only see their own accepted orders + unassigned pending dine-in orders
        if (req.user.role === "staff") {
            query.$and = [
                { tableNumber: { $not: { $regex: /home delivery|takeaway/i } } }, // No delivery orders
                {
                    $or: [
                        { status: "pending", staffId: null }, // Unaccepted dine-in orders
                        { staffId: req.user._id }             // Their own accepted orders
                    ]
                }
            ];
        }

        const orders = await Order.find(query)
            .select("-__v")
            .sort({ createdAt: -1 });

        res.json({ count: orders.length, orders });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// 🔥 Set Delivery Type (Kitchen decision: self_pickup or out_for_delivery)
exports.setDeliveryType = async (req, res) => {
    try {
        const { id } = req.params;
        const { deliveryType } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid order ID" });
        }
        if (!["self_pickup", "out_for_delivery"].includes(deliveryType)) {
            return res.status(400).json({ message: "Invalid delivery type" });
        }

        const order = await Order.findById(id);
        if (!order) return res.status(404).json({ message: "Order not found" });
        if (req.user.role !== "superadmin" && order.restaurantId.toString() !== req.user.restaurantId?.toString()) {
            return res.status(403).json({ message: "Not authorized" });
        }

        order.deliveryType = deliveryType;
        await order.save();

        // Notify via socket
        const io = req.app.get("io");
        io.to(order.restaurantId.toString()).emit("orderUpdated", order);

        res.json({ message: "Delivery type set", order });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};



// 🔥 Update Order Status (Admin/Staff)
exports.updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // ✅ Validate ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid order ID" });
        }

        // ✅ Validate status
        const allowedStatus = ["pending", "preparing", "ready", "delivered"];
        if (!allowedStatus.includes(status)) {
            return res.status(400).json({ message: "Invalid status value" });
        }

        const order = await Order.findById(id);

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        // 🔒 Ownership check
        if (
            !order.restaurantId ||
            (req.user.role !== "superadmin" && req.user.role !== "editoradmin" && order.restaurantId.toString() !== req.user.restaurantId?.toString())
        ) {
            return res.status(403).json({ message: "Not authorized" });
        }

        order.status = status;
        if (["preparing", "ready", "delivered"].includes(status)) {
            if (["staff", "admin", "superadmin", "delivery"].includes(req.user.role)) {
                order.staffId = req.user._id;
            }
            if (status === "delivered") {
                order.deliveredAt = new Date();
            }
        } else {
            // Revert logic
            order.staffId = null;
            order.deliveredAt = null;
        }
        await order.save();

        // 🔥 SOCKET EMIT (STATUS UPDATE)
        const io = req.app.get("io");
        io.to(order.restaurantId.toString()).emit("orderUpdated", order);

        res.json({
            message: "Order updated",
            order: {
                _id: order._id,
                status: order.status,
                updatedAt: order.updatedAt,
                staffId: order.staffId,
                deliveredAt: order.deliveredAt,
            },
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// 🔥 Get Customer Orders (Customer)
exports.getCustomerOrders = async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.user._id })
            .populate("restaurantId", "name image")
            .select("-__v")
            .sort({ createdAt: -1 });

        res.json({
            count: orders.length,
            orders,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// 🔥 Cancel Order (Customer - pending orders only)
exports.cancelOrder = async (req, res) => {
    try {
        const order = await Order.findOne({ _id: req.params.id, userId: req.user._id });
        if (!order) return res.status(404).json({ message: "Order not found" });
        if (order.status !== "pending") {
            return res.status(400).json({ message: "Only pending orders can be cancelled" });
        }
        order.status = "cancelled";
        await order.save();

        // Notify restaurant
        const io = req.app.get("io");
        io.to(order.restaurantId.toString()).emit("orderUpdated", { _id: order._id, status: "cancelled" });

        res.json({ message: "Order cancelled successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};