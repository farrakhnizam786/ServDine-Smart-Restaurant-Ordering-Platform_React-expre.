import { Share2, Gift, Users, Copy, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

function ShareEarn() {
    const [copied, setCopied] = useState(false);
    const referralCode = "DINE" + Math.floor(Math.random() * 10000);

    const copyCode = () => {
        navigator.clipboard.writeText(referralCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="min-h-screen p-6 max-w-4xl mx-auto pt-24 text-center">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel p-8 md:p-12"
            >
                <div className="w-24 h-24 bg-brand-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Gift className="w-12 h-12 text-brand-primary" />
                </div>
                <h1 className="text-4xl font-black text-gray-900 mb-4">Invite Friends, Earn Rewards!</h1>
                <p className="text-gray-500 max-w-lg mx-auto mb-10 text-lg">
                    Share your love for great food. Give your friends ₹100 off their first order and get ₹100 when they order.
                </p>

                <div className="bg-brand-light rounded-2xl p-6 md:p-8 max-w-md mx-auto border border-gray-200 mb-10 shadow-xl">
                    <p className="text-sm text-gray-500 mb-2 font-medium uppercase tracking-wider">Your Referral Code</p>
                    <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <span className="text-2xl font-black text-brand-gold tracking-widest">{referralCode}</span>
                        <button 
                            onClick={copyCode}
                            className="bg-brand-primary hover:bg-brand-primaryDark text-gray-900 p-3 rounded-lg transition-colors shadow-lg"
                        >
                            {copied ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-8 text-left border-t border-gray-200 pt-10 mt-10">
                    <div className="flex flex-col items-center text-center">
                        <Share2 className="w-8 h-8 text-brand-primary mb-4" />
                        <h3 className="font-bold text-gray-900 mb-2">1. Share Code</h3>
                        <p className="text-sm text-gray-500">Send your unique code to friends and family.</p>
                    </div>
                    <div className="flex flex-col items-center text-center">
                        <Users className="w-8 h-8 text-brand-primary mb-4" />
                        <h3 className="font-bold text-gray-900 mb-2">2. Friends Join</h3>
                        <p className="text-sm text-gray-500">They get ₹100 off their first order.</p>
                    </div>
                    <div className="flex flex-col items-center text-center">
                        <Gift className="w-8 h-8 text-brand-gold mb-4" />
                        <h3 className="font-bold text-gray-900 mb-2">3. You Earn</h3>
                        <p className="text-sm text-gray-500">You get ₹100 in your wallet for every successful referral.</p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

export default ShareEarn;
