import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import { toast } from "react-toastify";
import { 
    Users, Trash2, Plus, ShieldCheck, IndianRupee, UtensilsCrossed, TrendingUp, Key,
    CreditCard, QrCode, Building2, Smartphone, BarChart3, Calendar, ChevronDown, LogOut, ChevronLeft
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";

const FILTERS = [
    { label: "Last 24h", value: "24h" },
    { label: "Last 7 Days", value: "7d" },
    { label: "Last 30 Days", value: "30d" },
    { label: "Last 1 Year", value: "1yr" },
    { label: "Custom", value: "custom" },
];

function SuperAdminDashboard() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("overview"); // overview | users | revenue | payments

    // Create Admin form
    const [adminName, setAdminName] = useState("");
    const [adminEmail, setAdminEmail] = useState("");
    const [adminPassword, setAdminPassword] = useState("");
    const [creating, setCreating] = useState(false);

    // Revenue analytics
    const [revenueFilter, setRevenueFilter] = useState("7d");
    const [customFrom, setCustomFrom] = useState("");
    const [customTo, setCustomTo] = useState("");
    const [revenueData, setRevenueData] = useState(null);
    const [revenueLoading, setRevenueLoading] = useState(false);

    // Payment settings
    const [paySettings, setPaySettings] = useState({
        paymentMode: "cash",
        razorpayKeyId: "",
        razorpayKeySecret: "",
        upiId: "",
        bankName: "",
        bankAccountNumber: "",
        bankIfscCode: ""
    });
    const [savingPay, setSavingPay] = useState(false);

    const fetchData = async () => {
        try {
            const [statsRes, usersRes] = await Promise.all([
                API.get("/superadmin/dashboard"),
                API.get("/superadmin/users")
            ]);
            setStats(statsRes.data);
            setUsers(usersRes.data);
        } catch (err) {
            toast.error("Failed to load dashboard data");
        } finally {
            setLoading(false);
        }
    };

    const fetchRevenue = async () => {
        setRevenueLoading(true);
        try {
            const params = { filter: revenueFilter };
            if (revenueFilter === "custom") { params.from = customFrom; params.to = customTo; }
            const res = await API.get("/superadmin/revenue", { params });
            setRevenueData(res.data);
        } catch (err) {
            toast.error("Failed to load revenue data");
        } finally {
            setRevenueLoading(false);
        }
    };

    const fetchPaymentSettings = async () => {
        try {
            const res = await API.get("/restaurant/my/payment-settings");
            setPaySettings(prev => ({ ...prev, ...res.data }));
        } catch {}
    };

    useEffect(() => { fetchData(); }, []);
    useEffect(() => { if (activeTab === "revenue") fetchRevenue(); }, [activeTab, revenueFilter]);
    useEffect(() => { if (activeTab === "payments") fetchPaymentSettings(); }, [activeTab]);

    const handleCreateAdmin = async (e) => {
        e.preventDefault();
        setCreating(true);
        try {
            await API.post("/superadmin/create-admin", { name: adminName, email: adminEmail, password: adminPassword });
            toast.success("Admin created successfully!");
            setAdminName(""); setAdminEmail(""); setAdminPassword("");
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to create admin");
        } finally { setCreating(false); }
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm("Remove this user?")) return;
        try {
            await API.delete(`/superadmin/user/${id}`);
            toast.success("User removed");
            fetchData();
        } catch { toast.error("Failed to delete user"); }
    };

    const handleChangePassword = async (id) => {
        const pw = window.prompt("Enter new password:");
        if (!pw) return;
        try {
            await API.put(`/superadmin/user/${id}/password`, { password: pw });
            toast.success("Password updated");
        } catch { toast.error("Failed to update password"); }
    };

    const handleSavePaymentSettings = async (e) => {
        e.preventDefault();
        setSavingPay(true);
        try {
            await API.put("/restaurant/payment-settings", paySettings);
            toast.success("Payment settings saved!");
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to save");
        } finally { setSavingPay(false); }
    };

    const maxRevenue = revenueData?.chartData?.length
        ? Math.max(...revenueData.chartData.map(d => d.revenue), 1)
        : 1;

    if (loading) return <div className="min-h-screen flex justify-center items-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary" /></div>;

    const tabs = [
        { id: "overview", label: "Overview", icon: TrendingUp },
        { id: "users", label: "Users", icon: Users },
        { id: "revenue", label: "Revenue Analytics", icon: BarChart3 },
        { id: "payments", label: "Payment Settings", icon: CreditCard },
    ];

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8 min-h-screen">
            {/* Top Navigation Bar */}
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-900 font-bold flex items-center gap-2 text-sm transition-colors">
                    <ChevronLeft className="w-4 h-4"/> Back
                </button>
                <div className="flex items-center gap-4">
                    <div onClick={() => navigate("/profile")} className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-red-400 flex items-center justify-center text-white font-bold text-xs cursor-pointer hover:opacity-80 transition-opacity" title="Edit Profile">
                        {(user?.name || "S")[0].toUpperCase()}
                    </div>
                    <button onClick={() => { localStorage.clear(); navigate("/login"); }} className="text-red-500 hover:text-red-700 font-bold flex items-center gap-2 text-sm transition-colors">
                        <LogOut className="w-4 h-4"/> Sign Out
                    </button>
                </div>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                <ShieldCheck className="w-8 h-8 text-brand-primary" />
                SuperAdmin {user?.restaurantName ? `— ${user.restaurantName}` : ''}
            </h1>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 bg-gray-100 p-1 rounded-xl w-max">
                {tabs.map(({ id, label, icon: Icon }) => (
                    <button key={id} onClick={() => setActiveTab(id)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                            activeTab === id ? "bg-brand-primary text-gray-900 shadow" : "text-gray-500 hover:text-gray-900"
                        }`}>
                        <Icon className="w-4 h-4" />{label}
                    </button>
                ))}
            </div>

            {/* OVERVIEW TAB */}
            {activeTab === "overview" && stats && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                    {[
                        { label: "Daily Revenue", value: `₹${stats.dailyRevenue?.toFixed(2)}`, icon: IndianRupee, color: "text-brand-gold", bg: "bg-brand-gold/10" },
                        { label: "Monthly Revenue", value: `₹${stats.monthlyRevenue?.toFixed(2)}`, icon: TrendingUp, color: "text-green-500", bg: "bg-green-500/10" },
                        { label: "Menu Items", value: stats.menuCount, icon: UtensilsCrossed, color: "text-brand-primary", bg: "bg-brand-primary/10" },
                        { label: "Staff Count", value: stats.staffCount, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
                        { label: "Daily Customers", value: stats.dailyCustomers, icon: Users, color: "text-purple-500", bg: "bg-purple-500/10" },
                    ].map(({ label, value, icon: Icon, color, bg }, i) => (
                        <motion.div key={label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                            className="glass-panel p-6 flex flex-col justify-center items-center text-center">
                            <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center mb-4`}>
                                <Icon className={`w-6 h-6 ${color}`} />
                            </div>
                            <p className="text-gray-500 text-sm font-medium mb-1">{label}</p>
                            <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
                        </motion.div>
                    ))}
                </motion.div>
            )}

            {/* USERS TAB */}
            {activeTab === "users" && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="glass-panel p-6 lg:col-span-1 h-max">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">Create Admin</h2>
                        <form onSubmit={handleCreateAdmin} className="space-y-4">
                            {[
                                { label: "Admin Name", val: adminName, set: setAdminName, type: "text", ph: "John Doe" },
                                { label: "Email", val: adminEmail, set: setAdminEmail, type: "email", ph: "admin@restaurant.com" },
                                { label: "Password", val: adminPassword, set: setAdminPassword, type: "text", ph: "Secure password" },
                            ].map(({ label, val, set, type, ph }) => (
                                <div key={label}>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
                                    <input required type={type} value={val} onChange={e => set(e.target.value)}
                                        className="w-full bg-brand-light border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:border-brand-primary"
                                        placeholder={ph} />
                                </div>
                            ))}
                            <button disabled={creating} type="submit" className="glass-button w-full !py-4 mt-4">
                                <Plus className="w-4 h-4" /> {creating ? "Creating..." : "Create Admin"}
                            </button>
                        </form>
                    </div>
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
                                    ) : users.map(u => (
                                        <tr key={u._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                            <td className="p-4 text-gray-900 font-medium">{u.name}</td>
                                            <td className="p-4 text-gray-700">{u.email}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase ${u.role === 'admin' ? 'bg-blue-500/20 text-blue-500' : 'bg-brand-gold/20 text-brand-gold'}`}>{u.role}</span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => handleChangePassword(u._id)} className="text-brand-primary hover:text-brand-gold p-2 hover:bg-brand-primary/10 rounded-lg" title="Change Password"><Key className="w-4 h-4" /></button>
                                                    <button onClick={() => handleDeleteUser(u._id)} className="text-red-500 p-2 hover:bg-red-500/10 rounded-lg" title="Remove"><Trash2 className="w-4 h-4" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* REVENUE ANALYTICS TAB */}
            {activeTab === "revenue" && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    {/* Filter Row */}
                    <div className="glass-panel p-4 flex flex-wrap gap-3 items-center">
                        <Calendar className="w-5 h-5 text-brand-primary" />
                        {FILTERS.map(f => (
                            <button key={f.value} onClick={() => setRevenueFilter(f.value)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${revenueFilter === f.value ? "bg-brand-primary text-gray-900 shadow" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                                {f.label}
                            </button>
                        ))}
                        {revenueFilter === "custom" && (
                            <div className="flex gap-2 items-center ml-2">
                                <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                                    className="bg-brand-light border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900" />
                                <span className="text-gray-400">→</span>
                                <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
                                    className="bg-brand-light border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900" />
                                <button onClick={fetchRevenue} className="glass-button !py-2 !px-4 text-sm">Apply</button>
                            </div>
                        )}
                    </div>

                    {revenueLoading ? (
                        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-primary" /></div>
                    ) : revenueData && (
                        <>
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {[
                                    { label: "Total Revenue", value: `₹${revenueData.totalRevenue?.toFixed(2)}`, icon: IndianRupee, color: "text-brand-gold", bg: "bg-brand-gold/10" },
                                    { label: "Dine-In", value: `₹${revenueData.dineInRevenue?.toFixed(2)}`, icon: UtensilsCrossed, color: "text-blue-500", bg: "bg-blue-500/10" },
                                    { label: "Takeaway", value: `₹${revenueData.takeawayRevenue?.toFixed(2)}`, icon: UtensilsCrossed, color: "text-green-500", bg: "bg-green-500/10" },
                                    { label: "Home Delivery", value: `₹${revenueData.deliveryRevenue?.toFixed(2)}`, icon: TrendingUp, color: "text-purple-500", bg: "bg-purple-500/10" },
                                ].map(({ label, value, icon: Icon, color, bg }, i) => (
                                    <motion.div key={label} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                                        className="glass-panel p-6 flex flex-col items-center text-center">
                                        <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center mb-3`}>
                                            <Icon className={`w-5 h-5 ${color}`} />
                                        </div>
                                        <p className="text-gray-500 text-sm mb-1">{label}</p>
                                        <h3 className="text-xl font-bold text-gray-900">{value}</h3>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Bar Chart */}
                            <div className="glass-panel p-6">
                                <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5 text-brand-primary" /> Revenue Over Time
                                </h2>
                                {revenueData.chartData?.length === 0 ? (
                                    <div className="text-center py-16 text-gray-500">No orders in this period.</div>
                                ) : (
                                    <div className="flex items-end gap-2 h-48 overflow-x-auto pb-2">
                                        {revenueData.chartData.map((day, i) => {
                                            const heightPct = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0;
                                            return (
                                                <div key={i} className="flex flex-col items-center gap-1 min-w-[48px] group">
                                                    <div className="relative w-full flex flex-col items-center">
                                                        <span className="text-xs text-brand-gold font-bold opacity-0 group-hover:opacity-100 transition-opacity mb-1">
                                                            ₹{day.revenue.toFixed(0)}
                                                        </span>
                                                        <motion.div
                                                            initial={{ height: 0 }}
                                                            animate={{ height: `${heightPct}%` }}
                                                            transition={{ duration: 0.5, delay: i * 0.03 }}
                                                            style={{ height: `${Math.max(heightPct, 2)}%`, maxHeight: "160px", minHeight: "4px" }}
                                                            className="w-8 bg-gradient-to-t from-brand-primary to-brand-gold rounded-t-md"
                                                        />
                                                    </div>
                                                    <span className="text-[10px] text-gray-500 truncate w-12 text-center">
                                                        {new Date(day.date).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                                <p className="text-sm text-gray-500 mt-4">Total Orders: <strong className="text-gray-900">{revenueData.totalOrders}</strong></p>
                            </div>
                        </>
                    )}
                </motion.div>
            )}

            {/* PAYMENT SETTINGS TAB */}
            {activeTab === "payments" && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="glass-panel p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-brand-primary" /> Payment Gateway Settings
                        </h2>
                        <p className="text-sm text-gray-500 mb-6">Configure how customers pay for their orders.</p>
                        <form onSubmit={handleSavePaymentSettings} className="space-y-5">
                            {/* Payment Mode */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Mode</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { value: "cash", label: "💵 Cash", icon: IndianRupee },
                                        { value: "razorpay", label: "💳 Razorpay", icon: CreditCard },
                                        { value: "upi", label: "📱 UPI", icon: Smartphone },
                                        { value: "bank", label: "🏦 Bank Transfer", icon: Building2 },
                                    ].map(opt => (
                                        <button key={opt.value} type="button"
                                            onClick={() => setPaySettings(p => ({ ...p, paymentMode: opt.value }))}
                                            className={`p-3 rounded-xl border text-sm font-medium transition-all ${paySettings.paymentMode === opt.value ? "bg-brand-primary text-gray-900 border-brand-primary shadow-lg" : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"}`}>
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Razorpay */}
                            {paySettings.paymentMode === "razorpay" && (
                                <div className="space-y-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                                    <div className="flex items-start gap-3">
                                        <span className="text-2xl">🔐</span>
                                        <div>
                                            <p className="text-sm font-bold text-blue-700">Razorpay Test Mode Setup</p>
                                            <p className="text-xs text-blue-600 mt-0.5">Go to <strong>dashboard.razorpay.com</strong> → Settings → API Keys → Generate Test Key</p>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Key ID <span className="text-blue-500 text-xs">(starts with rzp_test_)</span></label>
                                        <input type="text" value={paySettings.razorpayKeyId} onChange={e => setPaySettings(p => ({ ...p, razorpayKeyId: e.target.value }))}
                                            className="w-full bg-white border border-blue-200 rounded-xl px-4 py-3 text-gray-900 focus:border-blue-500 font-mono text-sm" placeholder="rzp_test_xxxxxxxxxxxxxxxx" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Key Secret</label>
                                        <input type="password" value={paySettings.razorpayKeySecret} onChange={e => setPaySettings(p => ({ ...p, razorpayKeySecret: e.target.value }))}
                                            className="w-full bg-white border border-blue-200 rounded-xl px-4 py-3 text-gray-900 focus:border-blue-500 font-mono text-sm" placeholder="Your secret key" />
                                    </div>
                                    <div className="bg-white border border-blue-100 rounded-xl p-3 space-y-1.5">
                                        <p className="text-xs font-bold text-blue-600">🧪 Test Payment Credentials (use these at checkout):</p>
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div><p className="text-gray-400">Card Number</p><p className="font-mono font-bold text-gray-900">4111 1111 1111 1111</p></div>
                                            <div><p className="text-gray-400">Expiry</p><p className="font-mono font-bold text-gray-900">Any future date</p></div>
                                            <div><p className="text-gray-400">CVV</p><p className="font-mono font-bold text-gray-900">Any 3 digits</p></div>
                                            <div><p className="text-gray-400">OTP</p><p className="font-mono font-bold text-gray-900">1234 (Razorpay test)</p></div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* UPI */}
                            {paySettings.paymentMode === "upi" && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">UPI ID</label>
                                    <input type="text" value={paySettings.upiId} onChange={e => setPaySettings(p => ({ ...p, upiId: e.target.value }))}
                                        className="w-full bg-brand-light border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:border-brand-primary" placeholder="yourname@upi" />
                                </div>
                            )}

                            {/* Bank */}
                            {paySettings.paymentMode === "bank" && (
                                <div className="space-y-4">
                                    {[
                                        { key: "bankName", label: "Bank Name", ph: "State Bank of India" },
                                        { key: "bankAccountNumber", label: "Account Number", ph: "XXXXXXXXXXXX" },
                                        { key: "bankIfscCode", label: "IFSC Code", ph: "SBIN0001234" },
                                    ].map(f => (
                                        <div key={f.key}>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                                            <input type="text" value={paySettings[f.key]} onChange={e => setPaySettings(p => ({ ...p, [f.key]: e.target.value }))}
                                                className="w-full bg-brand-light border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:border-brand-primary" placeholder={f.ph} />
                                        </div>
                                    ))}
                                </div>
                            )}

                            <button disabled={savingPay} type="submit" className="glass-button w-full !py-4">
                                {savingPay ? "Saving..." : "💾 Save Payment Settings"}
                            </button>
                        </form>
                    </div>

                    {/* QR Code Preview Info */}
                    <div className="glass-panel p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                            <QrCode className="w-5 h-5 text-brand-primary" /> QR Code & Info
                        </h2>
                        <p className="text-sm text-gray-500 mb-6">Your restaurant's QR codes are automatically generated when tables are created.</p>
                        <div className="space-y-4">
                            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                                <p className="text-xs text-gray-500 font-medium mb-1">Current Payment Mode</p>
                                <p className="text-lg font-bold text-gray-900 capitalize">{paySettings.paymentMode}</p>
                            </div>
                            {paySettings.paymentMode === "razorpay" && (
                                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                                    <p className="text-xs text-blue-500 font-semibold mb-2">🧪 Razorpay Test Mode Active</p>
                                    <p className="text-sm text-gray-600">Use Razorpay test card: <strong>4111 1111 1111 1111</strong></p>
                                    <p className="text-sm text-gray-600">CVV: any 3 digits, Expiry: any future date</p>
                                </div>
                            )}
                            {paySettings.paymentMode === "upi" && paySettings.upiId && (
                                <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                                    <p className="text-xs text-green-600 font-semibold mb-1">UPI ID</p>
                                    <p className="text-lg font-bold text-gray-900">{paySettings.upiId}</p>
                                </div>
                            )}
                            {paySettings.paymentMode === "bank" && (
                                <div className="space-y-2">
                                    {paySettings.bankName && <div className="bg-gray-50 border border-gray-100 rounded-xl p-3"><p className="text-xs text-gray-400">Bank</p><p className="font-semibold text-gray-900">{paySettings.bankName}</p></div>}
                                    {paySettings.bankAccountNumber && <div className="bg-gray-50 border border-gray-100 rounded-xl p-3"><p className="text-xs text-gray-400">Account</p><p className="font-semibold text-gray-900">{paySettings.bankAccountNumber}</p></div>}
                                    {paySettings.bankIfscCode && <div className="bg-gray-50 border border-gray-100 rounded-xl p-3"><p className="text-xs text-gray-400">IFSC</p><p className="font-semibold text-gray-900">{paySettings.bankIfscCode}</p></div>}
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
}

export default SuperAdminDashboard;
