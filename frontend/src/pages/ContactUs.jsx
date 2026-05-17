import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Send } from "lucide-react";

function ContactUs() {
    return (
        <div className="min-h-[calc(100vh-4rem)] p-6 max-w-7xl mx-auto pt-12">
            <div className="text-center mb-16">
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">Get in Touch</h1>
                <p className="text-gray-500 text-lg max-w-2xl mx-auto">Have questions about ServDine or want to partner with us? We'd love to hear from you.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-8"
                >
                    <div className="glass-panel p-8">
                        <h3 className="text-2xl font-bold text-gray-900 mb-6">Contact Information</h3>
                        <div className="space-y-6 text-gray-700">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-brand-primary/10 flex items-center justify-center shrink-0">
                                    <Phone className="w-5 h-5 text-brand-primary" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Phone Number</p>
                                    <p className="font-medium text-gray-900">+1 (800) 123-4567</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-brand-primary/10 flex items-center justify-center shrink-0">
                                    <Mail className="w-5 h-5 text-brand-primary" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Email Address</p>
                                    <p className="font-medium text-gray-900">support@servdine.com</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-brand-primary/10 flex items-center justify-center shrink-0">
                                    <MapPin className="w-5 h-5 text-brand-primary" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Location</p>
                                    <p className="font-medium text-gray-900">123 Tech Valley, San Francisco, CA 94107</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="glass-panel p-8"
                >
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">Send a Message</h3>
                    <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">First Name</label>
                                <input type="text" className="input-field" placeholder="John" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">Last Name</label>
                                <input type="text" className="input-field" placeholder="Doe" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">Email</label>
                            <input type="email" className="input-field" placeholder="john@example.com" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">Message</label>
                            <textarea className="input-field min-h-[150px] resize-y" placeholder="How can we help you?"></textarea>
                        </div>
                        <button className="glass-button w-full mt-4">
                            <Send className="w-5 h-5" /> Send Message
                        </button>
                    </form>
                </motion.div>
            </div>
        </div>
    );
}

export default ContactUs;
