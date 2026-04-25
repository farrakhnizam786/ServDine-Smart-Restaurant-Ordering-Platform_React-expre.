import { Info, Heart, Award, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

function AboutUs() {
    return (
        <div className="min-h-screen p-6 max-w-4xl mx-auto pt-24">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-16"
            >
                <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">Redefining the Dining Experience</h1>
                <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
                    DineFlow is built on the belief that great food deserves a seamless, modern experience. We connect food lovers with their favorite restaurants, making ordering, tracking, and dining better than ever before.
                </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8 mb-16">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="glass-panel p-8 text-center border-t-4 border-brand-primary"
                >
                    <Heart className="w-10 h-10 text-brand-primary mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Made with Love</h3>
                    <p className="text-gray-500 text-sm">Every feature is designed to bring you closer to the food you love with zero friction.</p>
                </motion.div>
                
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="glass-panel p-8 text-center border-t-4 border-brand-gold"
                >
                    <Award className="w-10 h-10 text-brand-gold mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Premium Quality</h3>
                    <p className="text-gray-500 text-sm">We partner with top-rated restaurants to ensure you always get the best culinary experience.</p>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="glass-panel p-8 text-center border-t-4 border-blue-500"
                >
                    <ShieldCheck className="w-10 h-10 text-blue-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Secure & Reliable</h3>
                    <p className="text-gray-500 text-sm">Your data and payments are always protected with industry-leading security.</p>
                </motion.div>
            </div>

            <div className="glass-panel p-8 md:p-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Story</h2>
                <div className="space-y-4 text-gray-700 leading-relaxed">
                    <p>
                        Started in 2026, DineFlow emerged from a simple frustration: dining out and ordering in shouldn't be complicated. We set out to create a platform that bridges the gap between hungry customers and hard-working restaurant staff.
                    </p>
                    <p>
                        Today, DineFlow serves thousands of customers daily, providing real-time tracking, seamless table communication, and an interface that feels like magic. We're not just an app; we're your digital dining companion.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default AboutUs;
