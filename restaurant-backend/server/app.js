const express = require("express");
const cors = require("cors");

const app = express();
const authRoutes = require("./routes/auth.routes");
const testRoutes = require("./routes/test.routes");
const superadminRoutes = require("./routes/superadmin.routes");
const adminRoutes = require("./routes/admin.routes");
const menuRoutes = require("./routes/menu.routes");
const orderRoutes = require("./routes/order.routes");
const qrRoutes = require("./routes/qr.routes");
const tableRoutes = require("./routes/table.routes");
const paymentRoutes = require("./routes/payment.routes");
const restaurantRoutes = require("./routes/restaurant.routes");
const editorAdminRoutes = require("./routes/editoradmin.routes");
const reviewRoutes = require("./routes/review.routes");




app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);

app.use("/api/tables", tableRoutes);

app.use("/api/qr", qrRoutes);

app.use("/api/superadmin", superadminRoutes);

app.use("/api/admin", adminRoutes);

app.use("/api/menu", menuRoutes);

app.use("/api/orders", orderRoutes);
app.use("/api/payment", paymentRoutes);

app.use("/api/test", testRoutes);
app.use("/api/restaurant", restaurantRoutes);
app.use("/api/editoradmin", editorAdminRoutes);
app.use("/api/reviews", reviewRoutes);

app.get("/", (req, res) => {
    res.send("API Running...");
});

module.exports = app;
