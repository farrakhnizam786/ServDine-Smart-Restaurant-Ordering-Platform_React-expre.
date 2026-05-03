import { Store, Mail, Phone, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

function Footer() {
    return (
        <footer className="bg-brand-light border-t border-gray-100 pt-16 pb-8 mt-auto z-10 relative">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    
                    {/* Brand Info */}
                    <div className="col-span-1 md:col-span-1">
                        <Link to="/" className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-primary to-brand-gold flex items-center justify-center">
                                <Store className="text-gray-900 w-5 h-5" />
                            </div>
                            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                                Dine<span className="text-brand-primary">Flow</span>
                            </h1>
                        </Link>
                        <p className="text-gray-500 text-sm leading-relaxed mb-6">
                            Redefining the dining experience. Order, track, and enjoy seamlessly from your favorite local restaurants.
                        </p>
                        <div className="flex items-center gap-4 text-sm font-medium text-gray-500">
                            <a href="#" className="hover:text-brand-primary transition-colors">Facebook</a>
                            <a href="#" className="hover:text-brand-primary transition-colors">Twitter</a>
                            <a href="#" className="hover:text-brand-primary transition-colors">Instagram</a>
                            <a href="#" className="hover:text-brand-primary transition-colors">LinkedIn</a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="font-bold text-gray-900 mb-6">Quick Links</h3>
                        <ul className="space-y-4">
                            <li><Link to="/" className="text-gray-500 hover:text-brand-primary transition-colors text-sm">Discover</Link></li>
                            <li><Link to="/about-us" className="text-gray-500 hover:text-brand-primary transition-colors text-sm">About Us</Link></li>
                            <li><Link to="/contact" className="text-gray-500 hover:text-brand-primary transition-colors text-sm">Contact Support</Link></li>
                            <li><Link to="/faq" className="text-gray-500 hover:text-brand-primary transition-colors text-sm">FAQ</Link></li>
                        </ul>
                    </div>

                    {/* Legal & Licenses */}
                    <div>
                        <h3 className="font-bold text-gray-900 mb-6">Legal & Licenses</h3>
                        <ul className="space-y-4">
                            <li><a href="#" className="text-gray-500 hover:text-brand-primary transition-colors text-sm">Terms & Conditions</a></li>
                            <li><a href="#" className="text-gray-500 hover:text-brand-primary transition-colors text-sm">Privacy Policy</a></li>
                            <li><a href="#" className="text-gray-500 hover:text-brand-primary transition-colors text-sm">FSSAI License</a></li>
                            <li><a href="#" className="text-gray-500 hover:text-brand-primary transition-colors text-sm">Refund Policy</a></li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h3 className="font-bold text-gray-900 mb-6">Contact Us</h3>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3">
                                <MapPin className="w-5 h-5 text-brand-primary shrink-0 mt-0.5" />
                                <span className="text-gray-500 text-sm">123 Culinary Avenue, Food Tech Park, Bangalore 560001, India</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Phone className="w-5 h-5 text-brand-primary shrink-0" />
                                <span className="text-gray-500 text-sm">+91 1800 123 4567</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Mail className="w-5 h-5 text-brand-primary shrink-0" />
                                <span className="text-gray-500 text-sm">support@dineflow.com</span>
                            </li>
                        </ul>
                    </div>

                </div>

                <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-gray-500 text-sm">
                        &copy; {new Date().getFullYear()} ServDine Technologies Pvt. Ltd. All rights reserved.
                    </p>
                    <div className="flex gap-4 text-sm text-gray-500">
                        <span>FSSAI License No: 12345678901234</span>
                        <span className="hidden md:inline">•</span>
                        <span>CIN: U12345KA2026PTC123456</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
