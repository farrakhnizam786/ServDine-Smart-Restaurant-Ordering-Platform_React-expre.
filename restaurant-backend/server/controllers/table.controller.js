const Table = require("../models/table.model");

const mongoose = require("mongoose");

exports.deleteTable = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid table ID" });
        }

        const table = await Table.findById(id);

        if (!table) {
            return res.status(404).json({ message: "Table not found" });
        }

        // 🔒 Ensure same restaurant
        if (table.restaurantId.toString() !== req.user.restaurantId.toString()) {
            return res.status(403).json({ message: "Not authorized" });
        }

        await table.deleteOne();

        res.json({ message: "Table deleted successfully" });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// 🔥 Create table
exports.createTable = async (req, res) => {
    try {
        const { tableNumber, name } = req.body;

        const table = await Table.create({
            tableNumber,
            name,
            restaurantId: req.user.restaurantId,
        });

        res.json({ message: "Table created", table });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


// 🔥 Get tables
exports.getTables = async (req, res) => {
    const tables = await Table.find({
        restaurantId: req.user.restaurantId,
    });

    res.json(tables);
};
