const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./server/models/user.model");
require("dotenv").config();

const addEditor = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/myRestro");
        
        const passwordHash = await bcrypt.hash("123@@123", 10);
        
        // Remove if exists
        await User.deleteOne({ email: "editoradmin1@gmail.com" });

        await User.create({
            name: "Editor Admin",
            email: "editoradmin1@gmail.com",
            password: passwordHash,
            role: "editoradmin"
        });

        console.log("✅ Editor Admin Created!");
        process.exit(0);
    } catch(err) {
        console.error(err);
        process.exit(1);
    }
};

addEditor();
