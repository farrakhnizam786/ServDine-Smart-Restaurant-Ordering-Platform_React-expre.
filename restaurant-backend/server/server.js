require("dotenv").config(); // 🔥 MUST be first — loads env vars before any module uses them

const app = require("./app");
const connectDB = require("./config/db");
const http = require("http");
const { Server } = require("socket.io");
const Order = require("./models/order.model");

const tableRoutes = require("./routes/table.routes");
const qrRoutes = require("./routes/qr.routes");

// 🔥 Connect DB
connectDB();

// 🔥 Create HTTP server
const server = http.createServer(app);

// 🔥 Socket.io setup
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "*",
        methods: ["GET", "POST"],
    },
});

// 🔥 Socket connection
io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // 🔥 Join restaurant room
    socket.on("joinRestaurant", (restaurantId) => {
        if (!restaurantId) return;

        socket.join(restaurantId.toString());
        console.log(`Socket ${socket.id} joined ${restaurantId}`);
    });

    // 🔥 Leave room (optional)
    socket.on("leaveRestaurant", (restaurantId) => {
        socket.leave(restaurantId);
    });

    socket.on("joinOrderRoom", (orderId) => {
        if (!orderId) return;
        socket.join(orderId.toString());
        console.log(`Socket ${socket.id} joined order room ${orderId}`);
    });

    // 🔥 Table specific chat
    socket.on("joinTable", ({ restaurantId, table }) => {
        if (!restaurantId || !table) return;
        const room = `table_${restaurantId}_${table}`;
        socket.join(room);
        console.log(`Socket ${socket.id} joined ${room}`);
    });

    socket.on("sendTableMessage", ({ restaurantId, table, message }) => {
        if (!restaurantId || !table) return;
        const room = `table_${restaurantId}_${table}`;
        // Broadcast to the table room so other customers at same table see it
        socket.to(room).emit("receiveTableMessage", message);
        // Broadcast to restaurant staff so they see the call
        socket.to(restaurantId.toString()).emit("receiveTableCall", { table, message });
    });

    socket.on("callStaff", ({ restaurantId, tableNumber, orderId }) => {
        if (!restaurantId) return;
        // Broadcast to restaurant staff
        socket.to(restaurantId.toString()).emit("receiveTableCall", { 
            table: tableNumber || "Unknown Table", 
            message: { text: `Customer requested assistance at ${tableNumber || "their table"}`, sender: "system", timestamp: new Date(), orderId } 
        });
    });

    socket.on("sendMessage", async ({ orderId, message, restaurantId, tableNumber }) => {
        if (!orderId) return;
        
        // Broadcast to the order room (staff who opened this chat see it)
        socket.to(orderId.toString()).emit("receiveMessage", { ...message, orderId });
        
        // Save message as note in the order
        try {
            if (message.sender === 'customer') {
                const updatedOrder = await Order.findByIdAndUpdate(
                    orderId, 
                    { customerNote: message.text },
                    { new: true }
                );
                
                // Emit orderUpdated to the restaurant so Kitchen/Staff see the note change instantly
                if (restaurantId && updatedOrder) {
                    socket.to(restaurantId.toString()).emit("orderUpdated", updatedOrder);
                }
            } else if (message.sender === 'staff' || message.sender === 'kitchen') {
                const updatedOrder = await Order.findByIdAndUpdate(
                    orderId, 
                    { staffNote: message.text },
                    { new: true }
                );
                
                // Emit orderUpdated to the specific order room so the customer sees the staff reply
                if (updatedOrder) {
                    io.to(orderId.toString()).emit("orderUpdated", updatedOrder);
                }
            }
        } catch (error) {
            console.error("Error saving customer note:", error);
        }
    });

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
    });

    // 🔥 Delivery staff broadcasts their live status to the customer's order room
    socket.on("deliveryStatusUpdate", ({ orderId, status, staffName, restaurantId }) => {
        if (!orderId) return;
        // Notify the specific order room (customer's OrderTracking page)
        io.to(orderId.toString()).emit("deliveryStatusUpdated", { orderId, status, staffName });
        // Also notify restaurant room so staff/admin can see
        if (restaurantId) {
            socket.to(restaurantId.toString()).emit("deliveryStatusUpdated", { orderId, status, staffName });
        }
        console.log(`Delivery status for order ${orderId}: ${status}`);
    });
});

// 🔥 Make io accessible in controllers
app.set("io", io);

// 🔥 Start server
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});