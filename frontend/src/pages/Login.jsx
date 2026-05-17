import { useState, useContext, useEffect } from "react";
import API from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { Mail, Lock, LogIn, Eye, EyeOff, QrCode, Smartphone } from "lucide-react";
import { motion } from "framer-motion";
import logo from "../assets/logo.png";

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

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

    // Determine role type from current pathname to show/hide Forgot Password
    const isCustomerPage = !window.location.pathname.includes("admin");

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await API.post("/auth/login", { email, password, rememberMe });
            login(res.data);
            toast.success("Welcome back to ServDine! 🍽️");

            const role = res.data.user.role;
            if (role === "admin") navigate("/admin");
            else if (role === "staff") navigate("/staff-screen");
            else if (role === "kitchen") navigate("/orders");
            else if (role === "delivery") navigate("/delivery");
            else if (role === "superadmin") navigate("/superadmin");
            else if (role === "editoradmin") navigate("/editoradmin");
            else navigate("/restaurants");

        } catch (err) {
            toast.error(err.response?.data?.message || "Login failed");
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
                <div className="absolute top-1/2 right-[-40px] w-40 h-40 rounded-full bg-white/5 pointer-events-none" />

                {/* Logo */}
                <div className="flex items-center gap-3 relative z-10">
                    <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center shadow-lg">
                        <img src={logo} alt="ServDine" className="w-8 h-8 object-contain" />
                    </div>
                    <span className="text-white text-2xl font-black tracking-tight">ServDine</span>
                </div>

                {/* Hero Text */}
                <div className="relative z-10 space-y-8">
                    <div>
                        <h2 className="text-white text-4xl font-black leading-tight mb-4">
                            The Future of<br />Dining is Smart.
                        </h2>
                        <p className="text-white/80 text-base leading-relaxed max-w-sm">
                            Join thousands of restaurants leveraging QR and NFC technology to streamline orders, reduce wait times, and delight customers.
                        </p>
                    </div>

                    {/* Feature Cards */}
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
            <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 bg-gray-50 lg:bg-white relative">
                {/* Mobile Orange Top Banner */}
                <div className="absolute top-0 left-0 w-full h-80 bg-gradient-to-br from-[#f97316] via-[#ea580c] to-[#c2410c] lg:hidden rounded-b-[40px] shadow-lg" />

                {/* Mobile logo */}
                <div className="flex items-center gap-3 mb-8 lg:hidden relative z-10">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-xl">
                        <img src={logo} alt="ServDine" className="w-8 h-8 object-contain" />
                    </div>
                    <span className="text-white text-3xl font-black tracking-tight drop-shadow-md">ServDine</span>
                </div>

                <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="w-full max-w-[420px] relative z-10 bg-white lg:bg-transparent p-8 lg:p-0 rounded-3xl shadow-2xl lg:shadow-none"
                >
                    <div className="mb-8">
                        <h1 className="text-3xl font-black text-gray-900 mb-2">Welcome back</h1>
                        <p className="text-gray-500 text-sm">Sign in to continue to your dashboard</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5">
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

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    className="w-full pl-12 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#f97316] focus:ring-2 focus:ring-[#f97316]/20 transition-all"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Remember Me + Forgot Password row */}
                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <div
                                    onClick={() => setRememberMe(!rememberMe)}
                                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all cursor-pointer ${rememberMe ? "bg-[#f97316] border-[#f97316]" : "border-gray-300 bg-white group-hover:border-[#f97316]"}`}
                                >
                                    {rememberMe && <span className="text-white text-[11px] font-bold leading-none">✓</span>}
                                </div>
                                <span className="text-sm text-gray-600 font-medium">Remember me</span>
                            </label>
                            {/* Forgot Password — shown for customer login path only */}
                            <Link
                                to="/forgot-password"
                                className="text-sm text-[#f97316] font-semibold hover:text-[#ea580c] transition-colors"
                            >
                                Forgot password?
                            </Link>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#f97316] hover:bg-[#ea580c] text-white font-bold py-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-orange-500/30 active:scale-[0.98] disabled:opacity-60 mt-2"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                    Signing in...
                                </span>
                            ) : (
                                <>Sign In <LogIn className="w-5 h-5" /></>
                            )}
                        </button>
                    </form>

                    <p className="text-center text-gray-500 mt-6 text-sm">
                        Don't have an account?{" "}
                        <button onClick={() => navigate("/register")} className="text-[#f97316] hover:text-[#ea580c] font-bold transition-colors">
                            Create account
                        </button>
                    </p>

                    <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                        <p className="text-xs text-gray-400">
                            Terms of Service · Privacy Policy · Cookie Settings
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

export default Login;
