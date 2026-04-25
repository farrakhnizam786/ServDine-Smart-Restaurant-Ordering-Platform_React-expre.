import { useState, useContext } from "react";
import API from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Store, Mail, Lock, LogIn } from "lucide-react";
import { motion } from "framer-motion";

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await API.post("/auth/login", { email, password });
            login(res.data);
            toast.success("Welcome back to DineFlow!");

            const role = res.data.user.role;
            if (role === "admin") navigate("/admin");
            else if (role === "staff") navigate("/staff-screen");
            else if (role === "kitchen") navigate("/orders");
            else if (role === "delivery") navigate("/delivery");
            else if (role === "superadmin") navigate("/superadmin");
            else if (role === "editoradmin") navigate("/editoradmin");
            else navigate("/");

        } catch (err) {
            toast.error(err.response?.data?.message || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-primary/20 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-gold/10 rounded-full blur-[100px] pointer-events-none" />

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel w-full max-w-md p-8 relative z-10"
            >
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-tr from-brand-primary to-brand-gold rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(230,57,70,0.3)]">
                        <Store className="w-8 h-8 text-gray-900" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Sign In</h2>
                    <p className="text-gray-500 mt-2">Welcome back to DineFlow</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">Email Address</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                <Mail className="w-5 h-5 text-gray-500" />
                            </div>
                            <input
                                type="email"
                                required
                                className="input-field !pl-11"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">Password</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                <Lock className="w-5 h-5 text-gray-500" />
                            </div>
                            <input
                                type="password"
                                required
                                className="input-field !pl-11"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="glass-button w-full mt-8 py-3.5 text-lg disabled:opacity-50"
                    >
                        {loading ? "Signing in..." : (
                            <>
                                Sign In <LogIn className="w-5 h-5 ml-1" />
                            </>
                        )}
                    </button>
                </form>

                <p className="text-center text-gray-500 mt-6 text-sm">
                    Don't have an account?{" "}
                    <button onClick={() => navigate("/register")} className="text-brand-primary hover:text-gray-900 transition-colors font-medium">
                        Create account
                    </button>
                </p>
            </motion.div>
        </div>
    );
}

export default Login;