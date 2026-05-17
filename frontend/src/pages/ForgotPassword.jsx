import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, ArrowLeft, Send } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import logo from "../assets/logo.png";

function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // API call placeholder — connect to your backend password reset endpoint
            await new Promise(r => setTimeout(r, 1200));
            setSent(true);
            toast.success("Reset link sent! Check your email.");
        } catch {
            toast.error("Failed to send reset link. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-white px-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
                <div className="flex items-center gap-3 justify-center mb-8">
                    <div className="w-12 h-12 bg-[#f97316] rounded-2xl flex items-center justify-center shadow-lg">
                        <img src={logo} alt="ServDine" className="w-8 h-8 object-contain" />
                    </div>
                    <span className="text-2xl font-black text-gray-900">ServDine</span>
                </div>

                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                    {!sent ? (
                        <>
                            <h2 className="text-2xl font-black text-gray-900 mb-1">Forgot Password?</h2>
                            <p className="text-gray-500 text-sm mb-6">Enter your email and we'll send you a reset link.</p>
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="email" required value={email}
                                            onChange={e => setEmail(e.target.value)}
                                            className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#f97316] focus:ring-2 focus:ring-[#f97316]/20 transition-all"
                                            placeholder="john@example.com"
                                        />
                                    </div>
                                </div>
                                <button type="submit" disabled={loading}
                                    className="w-full bg-[#f97316] hover:bg-[#ea580c] text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/30 disabled:opacity-60">
                                    {loading ? <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <><Send className="w-5 h-5" /> Send Reset Link</>}
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="text-center py-4">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-3xl">📧</span>
                            </div>
                            <h2 className="text-xl font-black text-gray-900 mb-2">Check Your Email</h2>
                            <p className="text-gray-500 text-sm">We've sent a password reset link to <strong>{email}</strong>. Please check your inbox.</p>
                        </div>
                    )}
                    <button onClick={() => navigate("/login")} className="mt-6 w-full flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors font-medium">
                        <ArrowLeft className="w-4 h-4" /> Back to Sign In
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

export default ForgotPassword;
