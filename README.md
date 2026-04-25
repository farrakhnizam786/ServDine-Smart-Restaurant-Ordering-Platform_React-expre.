# 🍽️ ServDine — Smart Restaurant Ordering Platform 🚀

![GitHub stars](https://img.shields.io/github/stars/your-username/ServDine?style=social)
![Tech](https://img.shields.io/badge/Stack-MERN-green)
![Status](https://img.shields.io/badge/Status-Active-success)

> A modern QR-based multi-restaurant ordering and management system  
> Built for real-world scalability, speed, and seamless dining experience

---

## 🌟 Overview

**ServDine** is a full-stack restaurant platform that enables customers to discover nearby restaurants, scan QR codes, browse menus, place orders, and track them in real-time — while restaurants manage everything from a powerful admin dashboard.

---

## 🔥 Key Features

### 👤 Customer App
- 📍 Nearby restaurant discovery (location-based)
- 📱 QR code ordering system
- 🍔 Dynamic menu browsing (veg / non-veg / drinks)
- 🛒 Smart cart & checkout
- 📦 Real-time order tracking (Socket.IO)

---

### 🏪 Restaurant Panel (Admin)
- 📊 Dashboard with live orders
- 🍽️ Menu management (Add / Edit / Delete)
- 🧾 Order control (pending → preparing → delivered)
- 🪑 Table management + QR generation
- 👨‍🍳 Staff management

---

### 👑 SuperAdmin System
- 🏢 Multi-restaurant management
- 👥 Admin creation per restaurant
- 🔐 Role-based access control

---

## ⚡ Tech Stack

### 💻 Frontend
- React + Vite ⚛️  
- Tailwind CSS 🎨  
- Axios 🔗  

### 🧠 Backend
- Node.js + Express 🚀  
- MongoDB + Mongoose 🍃  
- JWT Authentication 🔐  
- Socket.IO (Real-time updates) ⚡  

---

## 🧩 Architecture
Customer → QR/Menu → Order → Backend → Restaurant Admin → Kitchen
↓
Real-time updates


---

## 🔐 Roles

- SuperAdmin 👑  
- Admin 🏪  
- Staff 👨‍🍳  
- Customer 👤  

---

## 🌍 Core Concepts

- Multi-tenant system (restaurant-based isolation)
- Real-time communication (Socket rooms per restaurant)
- Scalable architecture for SaaS product

---

## 🚀 Getting Started

### 1️⃣ Clone Repo
```bash
git clone https://github.com/your-username/ServDine.git
cd ServDine

2️⃣ Backend Setup
cd server
npm install
npm run dev
3️⃣ Frontend Setup
cd frontend
npm install
npm run dev
⚙️ Environment Variables

Create .env file in server:

PORT=5000
MONGO_URI=your_mongodb_url
JWT_SECRET=your_secret
📸 Screenshots (Coming Soon)
Customer UI
Admin Dashboard
Order System
🚀 Future Scope
💳 Payment Integration (Razorpay)
📊 Analytics Dashboard
🔔 Notifications system
🌐 Deployment & scaling
🤝 Contributing

Contributions are welcome! Feel free to fork and improve 🚀

📌 Author

👨‍💻 Mohd Farrakh Nizam
B.Tech CSE (AIML)

⭐ Support

If you like this project, give it a ⭐ on GitHub!

🔥 Tagline

"Simplifying dining, empowering restaurants."
