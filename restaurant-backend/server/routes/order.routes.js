const express = require("express");
const router = express.Router();

const { protect, authorize } = require("../middleware/auth.middleware");

const {
    placeOrder,
    getOrders,
    updateOrderStatus,
    getCustomerOrders,
    setDeliveryType,
    cancelOrder
} = require("../controllers/order.controller");

// Customer places order
router.post("/", protect, authorize("customer"), placeOrder);

// Customer views own orders - MUST be before /:id
router.get("/customer", protect, authorize("customer"), getCustomerOrders);

// Admin, Staff, Kitchen, Delivery view orders
router.get("/", protect, authorize("admin", "staff", "superadmin", "kitchen", "delivery"), getOrders);

// Update order status
router.put("/:id", protect, authorize("admin", "staff", "superadmin", "kitchen", "delivery"), updateOrderStatus);

// Customer cancels their own pending order
router.patch("/:id/cancel", protect, authorize("customer"), cancelOrder);

// Kitchen sets delivery type for takeaway/home-delivery orders
router.patch("/:id/delivery-type", protect, authorize("admin", "kitchen", "superadmin"), setDeliveryType);

module.exports = router;