import { useState, useContext, useEffect } from "react";
import API from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Mail, Lock, User, Eye, EyeOff, QrCode, Smartphone, UserPlus } from "lucide-react";
import { motion } from "framer-motion";
import logo from "../assets/logo.png";

function Register() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [isRestaurantPartner, setIsRestaurantPartner] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const { login, user } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            const role = user.role;
            if (role === "admin") navigate("/admin", { replace: true });
            else if (role === "staff") navigate("/staff-screen", { replace: true });
            else if (role === "kitchen") navigate("/orders", { replace: true });
            else if (role === "delivery") navigate("/delivery", { replace: true });
            else if (role === "superadmin") navigate("/superadmin", { replace: true });
            else if (role === "editoradmin") navigate("/editoradmin", { replace: true });
            else navigate("/restaurants", { replace: true });
        }
    }, [user, navigate]);

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await API.post("/auth/register", { name, email, password, phone });
            login(res.data);
            toast.success("Account created successfully! 🎉");
            navigate("/restaurants");
        } catch (err) {
            toast.error(err.response?.data?.message || "Registration failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex overflow-hidden">
            {/* ── Left Panel ── */}
            <div className="hidden lg:flex flex-col justify-between w-[52%] bg-gradient-to-br from-[#f97316] via-[#ea580c] to-[#c2410c] p-12 relative overflow-hidden">
                {/* Decorative circles */}
                <div className="absolute top-[-80px] left-[-80px] w-80 h-80 rounded-full bg-white/10 pointer-events-none" />
                <div className="absolute bottom-[-60px] right-[-60px] w-64 h-64 rounded-full bg-white/10 pointer-events-none" />

                {/* Logo */}
                <div className="flex items-center gap-3 relative z-10">
                    <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center shadow-lg">
                        <img src={logo} alt="ServDine" className="w-8 h-8 object-contain" />
                    </div>
                    <span className="text-white text-2xl font-black tracking-tight">ServDine</span>
                </div>

                {/* Hero */}
                <div className="relative z-10 space-y-8">
                    <div>
                        <h2 className="text-white text-4xl font-black leading-tight mb-4">
                            Start your journey<br />towards smarter dining.
                        </h2>
                        <p className="text-white/80 text-base leading-relaxed max-w-sm">
                            Join thousands of restaurants leveraging QR and NFC technology to streamline orders, reduce wait times, and delight customers.
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-5 border border-white/20">
                            <QrCode className="w-8 h-8 text-white mb-3" />
                            <p className="text-white font-bold text-sm">Instant Access</p>
                            <p className="text-white/70 text-xs mt-1">Customers scan to view menu & order in seconds.</p>
                        </div>
                        <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-5 border border-white/20">
                            <Smartphone className="w-8 h-8 text-white mb-3" />
                            <p className="text-white font-bold text-sm">NFC Tapping</p>
                            <p className="text-white/70 text-xs mt-1">Contactless payments and service requests.</p>
                        </div>
                    </div>
                </div>

                {/* Social proof */}
                <div className="relative z-10 flex items-center gap-3">
                    <div className="flex -space-x-2">
                        {["🧑‍🍳", "👩‍💼", "👨‍💻"].map((emoji, i) => (
                            <div key={i} className="w-9 h-9 rounded-full bg-white/20 backdrop-blur border border-white/30 flex items-center justify-center text-sm">
                                {emoji}
                            </div>
                        ))}
                    </div>
                    <p className="text-white/90 text-sm font-medium">500+ restaurants joined this week</p>
                </div>
            </div>

            {/* ── Right Panel ── */}
            <div className="flex-1 flex flex-col justify-center items-center px-8 py-12 bg-white overflow-y-auto">
                {/* Mobile logo */}
                <div className="flex items-center gap-2 mb-6 lg:hidden">
                    <div className="w-9 h-9 bg-[#f97316] rounded-xl flex items-center justify-center">
                        <img src={logo} alt="ServDine" className="w-6 h-6 object-contain" />
                    </div>
                    <span className="text-gray-900 text-xl font-black">ServDine</span>
                </div>

                <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="w-full max-w-[420px]"
                >
                    <div className="mb-7">
                        <h1 className="text-3xl font-black text-gray-900 mb-1">Create your account</h1>
                        <p className="text-gray-500 text-sm">Start your journey towards a smarter dining experience.</p>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-4">
                        {/* Name */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    required
                                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#f97316] focus:ring-2 focus:ring-[#f97316]/20 transition-all"
                                    placeholder="John Doe"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="email"
                                    required
                                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#f97316] focus:ring-2 focus:ring-[#f97316]/20 transition-all"
                                    placeholder="john@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Phone + Password row */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                                <input
                                    type="tel"
                                    className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#f97316] focus:ring-2 focus:ring-[#f97316]/20 transition-all"
                                    placeholder="+1 234 567"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        className="w-full pl-4 pr-10 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#f97316] focus:ring-2 focus:ring-[#f97316]/20 transition-all"
                                        placeholder="•••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Restaurant Partner Toggle */}
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-[#f97316]/10 rounded-xl flex items-center justify-center">
                                    <span className="text-xl">🏪</span>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900">Register as Restaurant Partner</p>
                                    <p className="text-xs text-gray-500">Unlock merchant dashboard features</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsRestaurantPartner(!isRestaurantPartner)}
                                className={`relative w-12 h-6 rounded-full transition-colors ${isRestaurantPartner ? "bg-[#f97316]" : "bg-gray-200"}`}
                            >
                                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${isRestaurantPartner ? "translate-x-6" : "translate-x-0.5"}`} />
                            </button>
                        </div>

                        {/* Remember Me */}
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <div
                                onClick={() => setRememberMe(!rememberMe)}
                                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all cursor-pointer ${rememberMe ? "bg-[#f97316] border-[#f97316]" : "border-gray-300 bg-white group-hover:border-[#f97316]"}`}
                            >
                                {rememberMe && <span className="text-white text-[11px] font-bold leading-none">✓</span>}
                            </div>
                            <span className="text-sm text-gray-600 font-medium">Remember me</span>
                        </label>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#f97316] hover:bg-[#ea580c] text-white font-bold py-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-orange-500/30 active:scale-[0.98] disabled:opacity-60"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                    Creating...
                                </span>
                            ) : (
                                <>Create Account <UserPlus className="w-5 h-5" /></>
                            )}
                        </button>
                    </form>

                    <p className="text-center text-gray-500 mt-5 text-sm">
                        Already have an account?{" "}
                        <button onClick={() => navigate("/login")} className="text-[#f97316] hover:text-[#ea580c] font-bold transition-colors">
                            Log In
                        </button>
                    </p>

                    <div className="mt-6 pt-5 border-t border-gray-100 text-center">
                        <p className="text-xs text-gray-400">
                            Terms of Service · Privacy Policy · Cookie Settings
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

export default Register;
