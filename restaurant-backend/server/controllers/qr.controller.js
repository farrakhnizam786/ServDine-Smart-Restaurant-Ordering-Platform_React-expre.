const QRCode = require("qrcode");
const mongoose = require("mongoose");


// 🔥 Generate QR for single table
exports.generateTableQR = async (req, res) => {
    try {
        const { restaurantId, tableNumber } = req.body;

        // ✅ Validation
        if (!restaurantId || !tableNumber) {
            return res.status(400).json({ message: "RestaurantId and tableNumber required" });
        }

        if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
            return res.status(400).json({ message: "Invalid restaurant ID" });
        }

        // 🔥 Frontend URL
        const url = `http://localhost:3000/menu?restaurantId=${restaurantId}&table=${tableNumber}`;

        // ✅ Generate QR
        const qrImage = await QRCode.toDataURL(url);

        res.json({
            message: "QR generated successfully",
            data: {
                tableNumber,
                url,
                qrImage,
            },
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};



// 🔥 Generate QR for multiple tables
exports.generateMultipleQR = async (req, res) => {
    try {
        const { restaurantId, totalTables } = req.body;

        if (!restaurantId || !totalTables) {
            return res.status(400).json({ message: "RestaurantId and totalTables required" });
        }

        if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
            return res.status(400).json({ message: "Invalid restaurant ID" });
        }

        const qrList = [];

        for (let i = 1; i <= totalTables; i++) {
            const url = `http://localhost:3000/menu?restaurantId=${restaurantId}&table=${i}`;
            const qrImage = await QRCode.toDataURL(url);

            qrList.push({
                table: i,
                url,
                qrImage,
            });
        }

        res.json({
            message: "QRs generated",
            count: qrList.length,
            qrList,
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};



// 🔥 Download QR (image directly)
exports.downloadQR = async (req, res) => {
    try {
        const { restaurantId, tableNumber } = req.query;

        if (!restaurantId || !tableNumber) {
            return res.status(400).json({ message: "Missing query params" });
        }

        const url = `http://localhost:3000/menu?restaurantId=${restaurantId}&table=${tableNumber}`;

        res.setHeader("Content-Type", "image/png");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename=table-${tableNumber}.png`
        );

        await QRCode.toFileStream(res, url);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};