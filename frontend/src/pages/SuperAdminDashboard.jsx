import { useEffect, useState } from "react";
import API from "../api/axios";
import { toast } from "react-toastify";
import { Users, Store, Trash2, Plus, ShieldCheck, IndianRupee, UtensilsCrossed, TrendingUp, Key } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";

function SuperAdminDashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Form state for creating admin
    const [adminName, setAdminName] = useState("");
    const [adminEmail, setAdminEmail] = useState("");
    const [adminPassword, setAdminPassword] = useState("");
    const [creating, setCreating] = useState(false);

    const fetchData = async () => {
        try {
            const [statsRes, usersRes] = await Promise.all([
                API.get("/superadmin/dashboard"),
                API.get("/superadmin/users")
            ]);
            setStats(statsRes.data);
            setUsers(usersRes.data);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load dashboard data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreateAdmin = async (e) => {
        e.preventDefault();
        setCreating(true);
        try {
            await API.post("/superadmin/create-admin", {
                name: adminName,
                email: adminEmail,
                password: adminPassword
            });
            toast.success("Admin created successfully!");
            setAdminName("");
            setAdminEmail("");
            setAdminPassword("");
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to create admin");
        } finally {
            setCreating(false);
        }
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm("Are you sure you want to remove this user from your restaurant?")) return;
        try {
            await API.delete(`/superadmin/user/${id}`);
            toast.success("User removed successfully");
            fetchData();
        } catch (err) {
            toast.error("Failed to delete user");
        }
    };

    const handleChangePassword = async (id) => {
        const newPassword = window.prompt("Enter new password for this user:");
        if (!newPassword) return;
        try {
            await API.put(`/superadmin/user/${id}/password`, { password: newPassword });
            toast.success("Password updated successfully");
        } catch (err) {
            toast.error("Failed to update password");
        }
    };

    if (loading) return <div className="min-h-screen flex justify-center items-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div></div>;

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8 min-h-screen">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                <ShieldCheck className="w-8 h-8 text-brand-primary" /> 
                SuperAdmin Overview {user?.restaurantName ? `- ${user.restaurantName}` : ''}
            </h1>

            {/* Dashboard Stats */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                    <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="glass-panel p-6 flex flex-col justify-center items-center text-center">
                        <div className="w-12 h-12 rounded-xl bg-brand-gold/10 flex items-center justify-center mb-4">
                            <IndianRupee className="w-6 h-6 text-brand-gold" />
                        </div>
                        <p className="text-gray-500 text-sm font-medium mb-1">Daily Revenue</p>
                        <h3 className="text-2xl font-bold text-gray-900">₹{stats.dailyRevenue.toFixed(2)}</h3>
                    </motion.div>

                    <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay: 0.1}} className="glass-panel p-6 flex flex-col justify-center items-center text-center">
                        <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center mb-4">
                            <TrendingUp className="w-6 h-6 text-green-500" />
                        </div>
                        <p className="text-gray-500 text-sm font-medium mb-1">Monthly Revenue</p>
                        <h3 className="text-2xl font-bold text-gray-900">₹{stats.monthlyRevenue.toFixed(2)}</h3>
                    </motion.div>

                    <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay: 0.2}} className="glass-panel p-6 flex flex-col justify-center items-center text-center">
                        <div className="w-12 h-12 rounded-xl bg-brand-primary/10 flex items-center justify-center mb-4">
                            <UtensilsCrossed className="w-6 h-6 text-brand-primary" />
                        </div>
                        <p className="text-gray-500 text-sm font-medium mb-1">Menu Items</p>
                        <h3 className="text-2xl font-bold text-gray-900">{stats.menuCount}</h3>
                    </motion.div>

                    <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay: 0.3}} className="glass-panel p-6 flex flex-col justify-center items-center text-center">
                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4">
                            <Users className="w-6 h-6 text-blue-500" />
                        </div>
                        <p className="text-gray-500 text-sm font-medium mb-1">Staff Count</p>
                        <h3 className="text-2xl font-bold text-gray-900">{stats.staffCount}</h3>
                    </motion.div>

                    <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay: 0.4}} className="glass-panel p-6 flex flex-col justify-center items-center text-center">
                        <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4">
                            <Users className="w-6 h-6 text-purple-500" />
                        </div>
                        <p className="text-gray-500 text-sm font-medium mb-1">Daily Customers</p>
                        <h3 className="text-2xl font-bold text-gray-900">{stats.dailyCustomers}</h3>
                    </motion.div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
                {/* Create Admin Form */}
                <div className="glass-panel p-6 lg:col-span-1 h-max">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Create Admin</h2>
                    <form onSubmit={handleCreateAdmin} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Admin Name</label>
                            <input required type="text" value={adminName} onChange={e => setAdminName(e.target.value)} className="w-full bg-brand-light border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:border-brand-primary" placeholder="e.g. John Doe" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                            <input required type="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} className="w-full bg-brand-light border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:border-brand-primary" placeholder="admin@restaurant.com" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                            <input required type="text" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} className="w-full bg-brand-light border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:border-brand-primary" placeholder="Set a secure password" />
                        </div>
                        <button disabled={creating} type="submit" className="glass-button w-full !py-4 mt-4">
                            {creating ? "Creating..." : "Create Admin"}
                        </button>
                    </form>
                </div>

                {/* Users List */}
                <div className="glass-panel p-6 lg:col-span-2">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Restaurant Staff & Admins</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-200 text-gray-500 text-sm">
                                    <th className="p-4 font-medium">Name</th>
                                    <th className="p-4 font-medium">Email</th>
                                    <th className="p-4 font-medium">Role</th>
                                    <th className="p-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.length === 0 ? (
                                    <tr><td colSpan="4" className="p-4 text-center text-gray-500">No staff or admins found.</td></tr>
                                ) : (
                                    users.map((u) => (
                                        <tr key={u._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                            <td className="p-4 text-gray-900 font-medium">{u.name}</td>
                                            <td className="p-4 text-gray-700">{u.email}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase ${
                                                    u.role === 'admin' ? 'bg-blue-500/20 text-blue-500' : 
                                                    'bg-brand-gold/20 text-brand-gold'
                                                }`}>
                                                    {u.role}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => handleChangePassword(u._id)} className="text-brand-primary hover:text-brand-gold transition-colors p-2 hover:bg-brand-primary/10 rounded-lg" title="Change Password">
                                                        <Key className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleDeleteUser(u._id)} className="text-red-500 hover:text-red-400 transition-colors p-2 hover:bg-red-500/10 rounded-lg" title="Remove User">
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
            </div>

            {/* Menu Items List */}
            {stats && stats.menuItems && stats.menuItems.length > 0 && (
                <div className="glass-panel p-6 mt-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <UtensilsCrossed className="w-5 h-5 text-brand-primary" /> Active Menu Items
                    </h2>
                    <div className="flex flex-wrap gap-3">
                        {stats.menuItems.map((item, idx) => (
                            <span key={idx} className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">
                                {item}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default SuperAdminDashboard;
