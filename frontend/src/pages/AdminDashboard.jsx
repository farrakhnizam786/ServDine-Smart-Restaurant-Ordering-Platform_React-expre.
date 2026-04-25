import { useState, useEffect } from "react";
import API from "../api/axios";
import { toast } from "react-toastify";
import { io } from "socket.io-client";
import { TrendingUp, Package, IndianRupee, Store, Users, Key, Trash2, Power, UtensilsCrossed } from "lucide-react";
import { motion } from "framer-motion";

function AdminDashboard() {
    const [stats, setStats] = useState({ 
        staffCount: 0, 
        dailyOrderCount: 0, 
        menuCount: 0, 
        dailyRevenue: 0, 
        monthlyRevenue: 0 
    });
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("overview"); // overview, staff, coupons
    const [coupons, setCoupons] = useState([]);
    const [couponCode, setCouponCode] = useState("");
    const [couponDiscount, setCouponDiscount] = useState("");
    const [creatingCoupon, setCreatingCoupon] = useState(false);
    
    // Form state for creating staff
    const [staffName, setStaffName] = useState("");
    const [staffEmail, setStaffEmail] = useState("");
    const [staffPassword, setStaffPassword] = useState("");
    const [staffRole, setStaffRole] = useState("staff");
    const [creating, setCreating] = useState(false);
    const [isRestaurantOpen, setIsRestaurantOpen] = useState(true);
    const [togglingOpen, setTogglingOpen] = useState(false);

    const fetchData = async () => {
        try {
            const [statsRes, staffRes, couponsRes] = await Promise.all([
                API.get("/admin/dashboard"),
                API.get("/admin/staff"),
                API.get("/admin/coupons")
            ]);
            setStats(statsRes.data);
            setStaff(staffRes.data);
            setCoupons(couponsRes.data);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load dashboard data");
        } finally {
            setLoading(false);
        }
    };

    const toggleRestaurantOpen = async () => {
        setTogglingOpen(true);
        try {
            const res = await API.put("/restaurant/toggle-open");
            setIsRestaurantOpen(res.data.isOpen);
            toast.success(res.data.isOpen ? "🟢 Restaurant is now OPEN" : "🔴 Restaurant is now CLOSED");
        } catch (err) {
            toast.error("Failed to update restaurant status");
        } finally {
            setTogglingOpen(false);
        }
    };

    useEffect(() => {
        fetchData();
        // Auto-refresh staff every 20 seconds to catch availability changes
        const poll = setInterval(() => {
            API.get("/admin/staff").then(r => setStaff(r.data)).catch(() => {});
        }, 20000);

        // Socket for real-time availability updates
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        const socket = io("http://localhost:5000");
        if (user?.restaurantId) {
            socket.emit("joinRestaurant", user.restaurantId);
            socket.on("staffAvailabilityChanged", ({ staffId, isAvailable }) => {
                setStaff(prev => prev.map(s => s._id === staffId ? { ...s, isAvailable } : s));
            });
            socket.on("restaurantStatusChanged", ({ isOpen }) => {
                setIsRestaurantOpen(isOpen);
            });
            // Fetch initial open status
            API.get(`/restaurant/${user.restaurantId}`).then(r => setIsRestaurantOpen(r.data.isOpen !== false)).catch(() => {});
        }
        return () => { clearInterval(poll); socket.disconnect(); };
    }, []);

    const handleCreateStaff = async (e) => {
        e.preventDefault();
        setCreating(true);
        try {
            await API.post("/admin/staff", {
                name: staffName,
                email: staffEmail,
                password: staffPassword,
                role: staffRole
            });
            toast.success("User created successfully!");
            setStaffName("");
            setStaffEmail("");
            setStaffPassword("");
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to create staff");
        } finally {
            setCreating(false);
        }
    };

    const handleDeleteStaff = async (id) => {
        if (!window.confirm("Are you sure you want to remove this staff member?")) return;
        try {
            await API.delete(`/admin/staff/${id}`);
            toast.success("Staff removed successfully");
            fetchData();
        } catch (err) {
            toast.error("Failed to delete staff");
        }
    };

    const handleChangePassword = async (id) => {
        const newPassword = window.prompt("Enter new password for this staff member:");
        if (!newPassword) return;
        try {
            await API.put(`/admin/staff/${id}/password`, { password: newPassword });
            toast.success("Password updated successfully");
        } catch (err) {
            toast.error("Failed to update password");
        }
    };

    const handleToggleStatus = async (id) => {
        try {
            await API.put(`/admin/staff/${id}/status`);
            fetchData();
            toast.success("Staff status updated");
        } catch (err) {
            toast.error("Failed to update status");
        }
    };

    const handleCreateCoupon = async (e) => {
        e.preventDefault();
        setCreatingCoupon(true);
        try {
            await API.post("/admin/coupons", {
                code: couponCode,
                discountPercentage: Number(couponDiscount)
            });
            toast.success("Coupon created successfully!");
            setCouponCode("");
            setCouponDiscount("");
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to create coupon");
        } finally {
            setCreatingCoupon(false);
        }
    };

    const handleDeleteCoupon = async (id) => {
        if (!window.confirm("Are you sure you want to delete this coupon?")) return;
        try {
            await API.delete(`/admin/coupons/${id}`);
            toast.success("Coupon deleted successfully");
            fetchData();
        } catch (err) {
            toast.error("Failed to delete coupon");
        }
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div></div>;
    }

    const user = JSON.parse(localStorage.getItem("user") || "{}");

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                <Store className="w-8 h-8 text-brand-primary" /> 
                Admin Dashboard {user.restaurantName ? `- ${user.restaurantName}` : ''}
            </h1>

            {/* Tabs */}
            <div className="flex bg-gray-500 p-1 rounded-xl border border-gray-100 w-max mb-8">
                <button
                    onClick={() => setActiveTab("overview")}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        activeTab === "overview" 
                        ? "bg-brand-primary text-gray-900 shadow-lg shadow-brand-primary/20" 
                        : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                >
                    <TrendingUp className="w-4 h-4" /> Overview
                </button>
                <button
                    onClick={() => setActiveTab("staff")}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        activeTab === "staff" 
                        ? "bg-brand-primary text-gray-900 shadow-lg shadow-brand-primary/20" 
                        : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                >
                    <Users className="w-4 h-4" /> Manage Staff
                </button>
                <button
                    onClick={() => setActiveTab("coupons")}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        activeTab === "coupons" 
                        ? "bg-brand-primary text-gray-900 shadow-lg shadow-brand-primary/20" 
                        : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                >
                    <Package className="w-4 h-4" /> Manage Coupons
                </button>
            </div>

            {activeTab === "overview" && (
                <>
                {/* Restaurant Status Banner */}
                <div className={`flex items-center justify-between p-4 rounded-xl border mb-2 ${
                    isRestaurantOpen
                    ? 'bg-green-500/10 border-green-500/20'
                    : 'bg-red-500/10 border-red-500/20'
                }`}>
                    <div className="flex items-center gap-3">
                        <span className={`w-3 h-3 rounded-full ${isRestaurantOpen ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                        <div>
                            <p className={`font-bold text-sm ${isRestaurantOpen ? 'text-green-300' : 'text-red-300'}`}>
                                Restaurant is currently {isRestaurantOpen ? 'OPEN' : 'CLOSED'}
                            </p>
                            <p className="text-gray-500 text-xs">{isRestaurantOpen ? 'Customers can see and order from your restaurant' : 'Customers see your restaurant as closed'}</p>
                        </div>
                    </div>
                    <button
                        onClick={toggleRestaurantOpen}
                        disabled={togglingOpen}
                        className={`px-5 py-2 rounded-xl font-bold text-sm transition-all border ${
                            isRestaurantOpen
                            ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
                            : 'bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20'
                        } disabled:opacity-50`}
                    >
                        {togglingOpen ? 'Updating...' : isRestaurantOpen ? '🔴 Close Restaurant' : '🟢 Open Restaurant'}
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                    <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="glass-panel p-6 flex flex-col justify-center items-center text-center">
                    <div className="w-12 h-12 rounded-xl bg-brand-gold/10 flex items-center justify-center mb-4">
                        <IndianRupee className="w-6 h-6 text-brand-gold" />
                    </div>
                    <p className="text-gray-500 text-sm font-medium mb-1">Daily Revenue</p>
                    <h3 className="text-2xl font-bold text-gray-900">₹{(stats?.dailyRevenue || 0).toFixed(2)}</h3>
                </motion.div>

                <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay: 0.1}} className="glass-panel p-6 flex flex-col justify-center items-center text-center">
                    <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center mb-4">
                        <TrendingUp className="w-6 h-6 text-green-500" />
                    </div>
                    <p className="text-gray-500 text-sm font-medium mb-1">Monthly Revenue</p>
                    <h3 className="text-2xl font-bold text-gray-900">₹{(stats?.monthlyRevenue || 0).toFixed(2)}</h3>
                </motion.div>

                <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay: 0.2}} className="glass-panel p-6 flex flex-col justify-center items-center text-center">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4">
                        <Package className="w-6 h-6 text-blue-500" />
                    </div>
                    <p className="text-gray-500 text-sm font-medium mb-1">Daily Orders</p>
                    <h3 className="text-2xl font-bold text-gray-900">{stats?.dailyOrderCount || 0}</h3>
                </motion.div>

                <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay: 0.3}} className="glass-panel p-6 flex flex-col justify-center items-center text-center">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4">
                        <UtensilsCrossed className="w-6 h-6 text-purple-500" />
                    </div>
                    <p className="text-gray-500 text-sm font-medium mb-1">Menu Items</p>
                    <h3 className="text-2xl font-bold text-gray-900">{stats?.menuCount || 0}</h3>
                </motion.div>

                <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay: 0.4}} className="glass-panel p-6 flex flex-col justify-center items-center text-center">
                    <div className="w-12 h-12 rounded-xl bg-brand-primary/10 flex items-center justify-center mb-4">
                        <Users className="w-6 h-6 text-brand-primary" />
                    </div>
                    <p className="text-gray-500 text-sm font-medium mb-1">Staff Count</p>
                    <h3 className="text-2xl font-bold text-gray-900">{stats?.staffCount || 0}</h3>
                </motion.div>
            </div>

            <div className="mt-8">
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-panel p-6 bg-gradient-to-br from-brand-card to-brand-primary/10 border-brand-primary/20">
                    <h3 className="font-bold text-gray-900 text-lg mb-4">Quick Links</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <a href="/staff-screen" className="glass-button text-center block !py-4 bg-brand-primary text-gray-900 border-brand-primary hover:bg-brand-primaryDark shadow-lg shadow-brand-primary/20">
                            Live Staff Screen
                        </a>
                        <a href="/orders" className="glass-button text-center block !py-4 bg-orange-500/20 text-orange-500 border-orange-500/30 hover:bg-orange-500/30">
                            Live Kitchen Screen
                        </a>
                        <a href="/admin/menu" className="glass-button text-center block !py-4 bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-brand-primary text-gray-700 hover:text-gray-900">
                            <UtensilsCrossed className="w-5 h-5 inline-block mr-2" /> Manage Menu
                        </a>
                        <a href="/admin/tables" className="glass-button text-center block !py-4 bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-brand-primary text-gray-700 hover:text-gray-900">
                            Manage Tables
                        </a>
                    </div>
                </motion.div>
            </div>
            </>
            )}

            {activeTab === "staff" && (
            <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Create Staff Form */}
                <div className="glass-panel p-6 lg:col-span-1 h-max">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Create Staff</h2>
                    <form onSubmit={handleCreateStaff} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Staff Name</label>
                            <input required type="text" value={staffName} onChange={e => setStaffName(e.target.value)} className="w-full bg-brand-light border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:border-brand-primary" placeholder="e.g. John Doe" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                            <input required type="email" value={staffEmail} onChange={e => setStaffEmail(e.target.value)} className="w-full bg-brand-light border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:border-brand-primary" placeholder="staff@restaurant.com" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                            <input required type="text" value={staffPassword} onChange={e => setStaffPassword(e.target.value)} className="w-full bg-brand-light border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:border-brand-primary" placeholder="Set a secure password" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                            <select value={staffRole} onChange={e => setStaffRole(e.target.value)} className="w-full bg-brand-light border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:border-brand-primary appearance-none">
                                <option value="staff">Staff (Table Service)</option>
                                <option value="kitchen">Kitchen (Kitchen Screen Only)</option>
                                <option value="delivery">Delivery Staff (Home Delivery & Takeaway)</option>
                            </select>
                        </div>
                        <button disabled={creating} type="submit" className="glass-button w-full !py-4 mt-4">
                            {creating ? "Creating..." : "Create User"}
                        </button>
                    </form>
                </div>

                {/* Staff List */}
                <div className="glass-panel p-6 lg:col-span-2">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">User Management</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-200 text-gray-500 text-sm">
                                    <th className="p-4 font-medium">Name</th>
                                    <th className="p-4 font-medium">Role</th>
                                    <th className="p-4 font-medium">Email</th>
                                    <th className="p-4 font-medium text-center">Account</th>
                                    <th className="p-4 font-medium text-center">On Duty</th>
                                    <th className="p-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {staff.length === 0 ? (
                                    <tr><td colSpan="5" className="p-4 text-center text-gray-500">No users found.</td></tr>
                                ) : (
                                    staff.map((u) => (
                                        <tr key={u._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                            <td className="p-4 text-gray-900 font-medium">{u.name}</td>
                                            <td className="p-4 text-gray-700 capitalize">
                                                <span className={`text-xs px-2 py-1 rounded-md ${
                                                u.role === 'kitchen' ? 'bg-orange-500/20 text-orange-500' 
                                                : u.role === 'delivery' ? 'bg-purple-500/20 text-purple-400'
                                                : 'bg-blue-500/20 text-blue-400'
                                            }`}>
                                                {u.role}
                                            </span>
                                            </td>
                                            <td className="p-4 text-gray-700">{u.email}</td>
                                            <td className="p-4 text-center">
                                                <button 
                                                    onClick={() => handleToggleStatus(u._id)} 
                                                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase transition-colors ${
                                                        u.isActive !== false ? 'bg-green-500/20 text-green-500 hover:bg-green-500/30' : 'bg-gray-500/20 text-gray-500 hover:bg-gray-500/30'
                                                    }`}
                                                    title="Toggle Account Status"
                                                >
                                                    {u.isActive !== false ? "Active" : "Disabled"}
                                                </button>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                                                    u.isAvailable !== false ? 'bg-green-400/10 text-green-400 border border-green-400/30' : 'bg-orange-500/10 text-orange-400 border border-orange-400/30'
                                                }`}>
                                                    {u.isAvailable !== false ? "🟢 On Duty" : "🔴 Off Duty"}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => handleChangePassword(u._id)} className="text-brand-primary hover:text-brand-gold transition-colors p-2 hover:bg-brand-primary/10 rounded-lg" title="Change Password">
                                                        <Key className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleDeleteStaff(u._id)} className="text-red-500 hover:text-red-400 transition-colors p-2 hover:bg-red-500/10 rounded-lg" title="Remove Staff">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </motion.div>
            )}

            {activeTab === "coupons" && (
            <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Create Coupon Form */}
                <div className="glass-panel p-6 lg:col-span-1 h-max">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Create Coupon</h2>
                    <form onSubmit={handleCreateCoupon} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Coupon Code</label>
                            <input required type="text" value={couponCode} onChange={e => setCouponCode(e.target.value)} className="w-full bg-brand-light border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:border-brand-primary uppercase" placeholder="e.g. SUMMER50" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Discount (%)</label>
                            <input required type="number" min="1" max="100" value={couponDiscount} onChange={e => setCouponDiscount(e.target.value)} className="w-full bg-brand-light border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:border-brand-primary" placeholder="e.g. 20" />
                        </div>
                        <button disabled={creatingCoupon} type="submit" className="glass-button w-full !py-4 mt-4">
                            {creatingCoupon ? "Creating..." : "Create Coupon"}
                        </button>
                    </form>
                </div>

                {/* Coupons List */}
                <div className="glass-panel p-6 lg:col-span-2">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Active Coupons</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-200 text-gray-500 text-sm">
                                    <th className="p-4 font-medium">Code</th>
                                    <th className="p-4 font-medium">Discount</th>
                                    <th className="p-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {coupons.length === 0 ? (
                                    <tr><td colSpan="3" className="p-4 text-center text-gray-500">No coupons found.</td></tr>
                                ) : (
                                    coupons.map((c) => (
                                        <tr key={c._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                            <td className="p-4 text-gray-900 font-bold tracking-wide">{c.code}</td>
                                            <td className="p-4 text-brand-gold font-medium">{c.discountPercentage}% OFF</td>
                                            <td className="p-4 text-right">
                                                <button onClick={() => handleDeleteCoupon(c._id)} className="text-red-500 hover:text-red-400 transition-colors p-2 hover:bg-red-500/10 rounded-lg" title="Delete Coupon">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </motion.div>
            )}
        </div>
    );
}

export default AdminDashboard;