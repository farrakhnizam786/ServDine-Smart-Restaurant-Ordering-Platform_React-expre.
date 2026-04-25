const User = require("../models/user.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const generateToken = (id) => {
    return jwt.sign({ id }, "secretkey", { expiresIn: "7d" });
};

// REGISTER
exports.register = async (req, res) => {
    try {
        const { name, email, password, role, restaurantId } = req.body;

        const exists = await User.findOne({ email });
        if (exists) {
            return res.status(400).json({ message: "User already exists" });
        }

        const hashed = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            password: hashed,
            role,
            restaurantId, // 🔥 IMPORTANT
        });

        res.json({
            message: "User registered",
            user,
            token: generateToken(user._id),
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


// LOGIN
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email }).populate("restaurantId");

        if (!user) return res.status(400).json({ message: "Invalid email" });
        if (user.isActive === false) return res.status(403).json({ message: "Your account has been deactivated" });

        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(400).json({ message: "Invalid password" });

        res.json({
            message: "Login success",
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                restaurantId: user.restaurantId ? user.restaurantId._id : null, // keep backward compat
                restaurantName: user.restaurantId ? user.restaurantId.name : null,
            },
            token: generateToken(user._id),
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};