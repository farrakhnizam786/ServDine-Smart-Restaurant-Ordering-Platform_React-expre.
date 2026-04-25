import { ChevronDown, MessageCircleQuestion } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

function FAQ() {
    const [openIdx, setOpenIdx] = useState(null);

    const faqs = [
        {
            q: "How do I track my order?",
            a: "You can track your order in real-time by going to 'Order Status & Live Chat' from your profile menu. You'll see updates as your food is prepared and ready."
        },
        {
            q: "How do I call staff to my table?",
            a: "When viewing the menu for a specific table, simply click the floating 'Call Staff' button at the bottom left of your screen. This will alert available staff immediately."
        },
        {
            q: "Can I chat directly with the restaurant?",
            a: "Yes! If you have an active order, go to the Order Tracking page where you'll find a 'Live Chat' feature to communicate directly with the staff handling your order."
        },
        {
            q: "Where do I apply my coupons?",
            a: "You can apply coupon codes at checkout. You can view all your available coupons in the 'Coupons & Offers' section of your profile."
        },
        {
            q: "How does the Share and Earn program work?",
            a: "Share your unique referral code with friends. When they use it for their first order, they get a discount, and you get reward credits added to your account!"
        }
    ];

    return (
        <div className="min-h-screen p-6 max-w-3xl mx-auto pt-24">
            <div className="text-center mb-12">
                <MessageCircleQuestion className="w-16 h-16 text-brand-primary mx-auto mb-4" />
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h1>
                <p className="text-gray-500">Need help? We've got answers.</p>
            </div>

            <div className="space-y-4">
                {faqs.map((faq, idx) => (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        key={idx} 
                        className="glass-panel overflow-hidden"
                    >
                        <button
                            onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
                            className="w-full p-6 flex items-center justify-between text-left hover:bg-gray-50 transition-colors focus:outline-none"
                        >
                            <span className="font-bold text-gray-900 pr-8">{faq.q}</span>
                            <ChevronDown className={`w-5 h-5 text-brand-primary transition-transform duration-300 shrink-0 ${openIdx === idx ? 'rotate-180' : ''}`} />
                        </button>
                        <AnimatePresence>
                            {openIdx === idx && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <div className="p-6 pt-0 text-gray-500 border-t border-gray-100 leading-relaxed">
                                        {faq.a}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                ))}
            </div>
            
            <div className="mt-12 text-center">
                <p className="text-gray-500 mb-4">Still have questions?</p>
                <button className="glass-button">Contact Support</button>
            </div>
        </div>
    );
}

export default FAQ;
