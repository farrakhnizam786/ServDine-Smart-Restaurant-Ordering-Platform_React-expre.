import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LogOut, Store, User as UserIcon } from "lucide-react";
import { toast } from "react-toastify";
import logo from "../assets/logo.png";

function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();

    const handleLogout = () => {
        logout();
        toast.info("Logged out successfully");
        navigate("/login");
    };

    return (
        <nav className="fixed top-0 left-0 w-full z-50 glass-panel border-x-0 border-t-0 rounded-none bg-brand-light/80 px-3 sm:px-6 py-4 transition-all duration-300">
            <div className="max-w-7xl mx-auto flex justify-between items-center gap-2">
                
                {/* Logo */}
                <div 
                    className="flex items-center gap-3 cursor-pointer group"
                    onClick={() => navigate("/")}
                >
                    <img 
                        src={logo} 
                        alt="ServDine" 
                        className="h-8 sm:h-10 w-auto object-contain group-hover:scale-105 transition-transform drop-shadow-md shrink-0"
                    />
                    <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight hidden sm:block">
                        Serv<span className="text-brand-primary">Dine</span>
                    </h1>
                </div>

                {/* Navigation Links */}
                <div className="flex items-center gap-3 sm:gap-6 shrink-0">
                    {user ? (
                        <>
                            {user.role === 'customer' && (
                                <button 
                                    onClick={() => navigate("/restaurants")} 
                                    className={`flex items-center gap-2 text-sm font-medium transition-colors ${location.pathname === '/restaurants' ? 'text-brand-primary' : 'text-gray-700 hover:text-gray-900'}`}
                                >
                                    <Store className="w-4 h-4" /> Discover
                                </button>
                            )}

                            {['admin', 'superadmin', 'staff', 'kitchen', 'editoradmin'].includes(user.role) && (
                                <button 
                                    onClick={() => {
                                        if (user.role === 'editoradmin') navigate("/editoradmin");
                                        else if (user.role === 'superadmin') navigate("/superadmin");
                                        else if (user.role === 'staff') navigate("/staff-screen");
                                        else if (user.role === 'kitchen') navigate("/orders");
                                        else navigate("/admin");
                                    }} 
                                    className={`flex items-center gap-2 text-sm font-medium transition-colors ${['/admin', '/superadmin', '/orders', '/staff-screen', '/editoradmin'].includes(location.pathname) ? 'text-brand-primary' : 'text-gray-700 hover:text-gray-900'}`}
                                >
                                    <Store className="w-4 h-4" /> <span className="hidden sm:inline">Dashboard</span>
                                </button>
                            )}

                            <div className="h-6 w-px bg-gray-100 mx-2"></div>
                            {/* Profile Dropdown */}
                            <div className="relative group">
                                <button className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full hover:bg-gray-50 transition-colors shadow-sm">
                                    <UserIcon className="w-4 h-4 text-brand-primary shrink-0" />
                                    <span className="text-sm font-semibold text-gray-700 truncate max-w-[80px] sm:max-w-none">{user.name || "Profile"}</span>
                                </button>
                                
                                <div className="absolute right-0 top-full mt-2 w-56 bg-brand-light/95 backdrop-blur-md border border-gray-200 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.5)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-[100] flex flex-col py-2 transform origin-top-right scale-95 group-hover:scale-100">
                                    {user.role === 'customer' && (
                                        <>
                                            <button onClick={() => navigate("/profile")} className="text-left px-4 py-2.5 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors">Profile Information</button>
                                            <button onClick={() => navigate("/my-reservations")} className="text-left px-4 py-2.5 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors flex items-center gap-2">
                                                📅 My Reservations
                                            </button>
                                            <button onClick={() => navigate("/orders/status")} className="text-left px-4 py-2.5 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors">Order Status & Live Chat</button>
                                            <button onClick={() => navigate("/orders/history")} className="text-left px-4 py-2.5 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors">Order History & Bills</button>
                                            <button onClick={() => navigate("/coupons")} className="text-left px-4 py-2.5 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors">Coupons & Offers</button>
                                            <button onClick={() => navigate("/share-earn")} className="text-left px-4 py-2.5 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors">Share and Earn</button>
                                            <button onClick={() => navigate("/language")} className="text-left px-4 py-2.5 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors">Language Settings</button>
                                            <button onClick={() => navigate("/about-us")} className="text-left px-4 py-2.5 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors">About Us</button>
                                            <button onClick={() => navigate("/faq")} className="text-left px-4 py-2.5 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors">FAQ</button>
                                            <div className="h-px w-full bg-gray-100 my-1"></div>
                                        </>
                                    )}
                                    {user.role === 'admin' && (
                                        <>
                                            <button onClick={() => navigate("/admin")} className="text-left px-4 py-2.5 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors">Dashboard</button>
                                            <button onClick={() => navigate("/admin/menu")} className="text-left px-4 py-2.5 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors">Manage Menu</button>
                                            <button onClick={() => navigate("/admin/tables")} className="text-left px-4 py-2.5 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors">Manage Tables</button>
                                            <div className="h-px w-full bg-gray-100 my-1"></div>
                                        </>
                                    )}
                                    <button 
                                        onClick={handleLogout} 
                                        className="text-left px-4 py-2.5 text-sm text-brand-primary hover:bg-brand-primary/10 transition-colors flex items-center gap-2 font-medium"
                                    >
                                        <LogOut className="w-4 h-4" /> Logout
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex gap-4">
                            <button 
                                onClick={() => navigate("/login")}
                                className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
                            >
                                Sign In
                            </button>
                            <button 
                                onClick={() => navigate("/register")}
                                className="glass-button !py-1.5 !px-5"
                            >
                                Sign Up
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}

export default Navbar;