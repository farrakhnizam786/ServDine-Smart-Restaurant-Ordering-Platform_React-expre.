const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");

const User = require("./server/models/user.model");
const Restaurant = require("./server/models/restaurant.model");
const Menu = require("./server/models/menu.model");
const Table = require("./server/models/table.model");

dotenv.config();

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/myRestro");
        console.log("MongoDB Connected for Seeding");

        // Clear existing
        await User.deleteMany();
        await Restaurant.deleteMany();
        await Menu.deleteMany();
        await Table.deleteMany();

        const passwordHash = await bcrypt.hash("123456", 10);

        // 1. Create Restaurants
        const rests = await Restaurant.insertMany([
            { name: "Spice Symphony", address: "Downtown Manhattan", location: { type: "Point", coordinates: [77.1025, 28.7041] }, image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1000" },
            { name: "Burger Bistro", address: "Brooklyn St 12", location: { type: "Point", coordinates: [77.1020, 28.7045] }, image: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&q=80&w=1000" },
            { name: "Sushi Central", address: "Queens Road 45", location: { type: "Point", coordinates: [77.1030, 28.7035] }, image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&q=80&w=1000" }
        ]);

        const rest1 = rests[0]._id;
        const rest2 = rests[1]._id;

        // 2. Create Users
        await User.insertMany([
            { name: "Super Boss", email: "superadmin@system.com", password: passwordHash, role: "superadmin", restaurantId: rest1 },
            { name: "Admin John", email: "adminA@gmail.com", password: passwordHash, role: "admin", restaurantId: rest1 },
            { name: "Admin Jane", email: "adminB@gmail.com", password: passwordHash, role: "admin", restaurantId: rest2 },
            { name: "Staff Mike", email: "staff@gmail.com", password: passwordHash, role: "staff", restaurantId: rest1 },
            { name: "Customer Alice", email: "customer@gmail.com", password: passwordHash, role: "customer" }
        ]);

        // 3. Create Tables
        await Table.insertMany([
            { tableNumber: "1", name: "Window Table 1", restaurantId: rest1 },
            { tableNumber: "2", name: "Window Table 2", restaurantId: rest1 },
            { tableNumber: "3", name: "Booth 1", restaurantId: rest1 },
            { tableNumber: "1", name: "Patio 1", restaurantId: rest2 }
        ]);

        // 4. Create Menu Items
        const menuItems = [];
        const categories = ["veg", "non-veg", "drinks"];
        
        // Add ~15 items per restaurant
        rests.forEach(rest => {
            for(let i=1; i<=15; i++) {
                menuItems.push({
                    name: `Delicious Item ${i} (${rest.name})`,
                    price: 100 + (Math.floor(Math.random() * 50) * 10),
                    description: "A wonderful premium dish crafted by our top chefs.",
                    category: categories[i % 3],
                    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=1000",
                    restaurantId: rest._id
                });
            }
        });
        
        await Menu.insertMany(menuItems);

        console.log("Demo Data Seeded Successfully!");
        process.exit();

    } catch (err) {
        console.error("Seeding Error:", err);
        process.exit(1);
    }
};

seedData();
