import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import API from "../api/axios";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Star, Info, Plus, Search, UtensilsCrossed, MessageCircle, Send, X, BellRing, Heart, Calendar, ChevronLeft } from "lucide-react";
import { io } from "socket.io-client";
import Cart from "./Cart";

// Floating food emoji particles
const FOOD_ICONS = ["🍔", "🍜", "🍕", "🌮", "🍣", "🥘", "🍱", "🥗"];

function FloatingIcon({ emoji, style }) {
    return (
        <motion.div
            className="absolute text-3xl select-none pointer-events-none opacity-20"
            style={style}
            animate={{ y: [-10, 10, -10], rotate: [-8, 8, -8] }}
            transition={{ duration: 4 + Math.random() * 3, repeat: Infinity, ease: "easeInOut", delay: Math.random() * 2 }}
        >
            {emoji}
        </motion.div>
    );
}

function Menu() {
    const { restaurantId } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const table = searchParams.get("table");

    const [restaurant, setRestaurant] = useState(null);
    const [menu, setMenu] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [activeCategory, setActiveCategory] = useState("All");
    const [cartCount, setCartCount] = useState(0);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [wishlist, setWishlist] = useState([]);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isCallMenuOpen, setIsCallMenuOpen] = useState(false);
    const [chatMsg, setChatMsg] = useState("");
    const [messages, setMessages] = useState([]);
    const [socket, setSocket] = useState(null);
    const chatEndRef = useRef(null);
    const [recommendations, setRecommendations] = useState({ popular: [], todaySpecials: [], highlyRecommended: [] });

    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isChatOpen]);

    useEffect(() => {
        if (!restaurantId) return;
        const updateCartCount = () => {
            const cart = JSON.parse(localStorage.getItem(`cart_${restaurantId}`)) || [];
            setCartCount(cart.reduce((acc, item) => acc + item.quantity, 0));
        };
        updateCartCount();
        const storedWishlist = JSON.parse(localStorage.getItem(`wishlist`)) || [];
        setWishlist(storedWishlist);
        window.addEventListener("storage", updateCartCount);
        return () => window.removeEventListener("storage", updateCartCount);
    }, [restaurantId]);

    const toggleWishlist = (itemId) => {
        let newWishlist = [...wishlist];
        if (newWishlist.includes(itemId)) {
            newWishlist = newWishlist.filter(id => id !== itemId);
            toast.info("Removed from wishlist");
        } else {
            newWishlist.push(itemId);
            toast.success("Added to wishlist");
        }
        setWishlist(newWishlist);
        localStorage.setItem(`wishlist`, JSON.stringify(newWishlist));
    };

    useEffect(() => {
        if (!restaurantId) return;
        const fetchData = async () => {
            try {
                const [menuRes, restRes, recRes] = await Promise.all([
                    API.get(`/menu/${restaurantId}`),
                    API.get(`/restaurant/${restaurantId}`),
                    API.get(`/menu/${restaurantId}/recommendations`).catch(() => ({ data: { popular: [], todaySpecials: [], highlyRecommended: [] } }))
                ]);
                const allMenu = menuRes.data.menu || menuRes.data;
                const baseRecs = recRes.data || { popular: [], todaySpecials: [], highlyRecommended: [] };
                
                // Add logic for ordered > 20 -> Today's Special, > 30 -> Highly Recommended
                allMenu.forEach(item => {
                    // Using orderCount if available, otherwise defaulting to 0
                    const count = item.orderCount || 0;
                    if (count >= 30) {
                        if (!baseRecs.highlyRecommended.find(i => i._id === item._id)) baseRecs.highlyRecommended.push(item);
                    } else if (count >= 20) {
                        if (!baseRecs.todaySpecials.find(i => i._id === item._id)) baseRecs.todaySpecials.push(item);
                    }
                });

                setMenu(allMenu);
                setRestaurant(restRes.data);
                setRecommendations(baseRecs);
            } catch (err) {
                console.error(err);
                toast.error("Failed to load menu");
            } finally { setLoading(false); }
        };
        fetchData();

        const newSocket = io(`http://${window.location.hostname}:5000`);
        setSocket(newSocket);
        newSocket.emit("joinRestaurant", restaurantId);
        newSocket.on("menuItemUpdated", ({ item }) => {
            setMenu(prev => prev.map(m => m._id === item._id ? { ...m, ...item } : m));
            toast.info(`Menu updated: ${item.name} is now ₹${item.price}`, { autoClose: 3000 });
        });
        if (table) {
            newSocket.emit("joinTable", { restaurantId, table });
            newSocket.on("receiveTableMessage", (msg) => { setMessages(prev => [...prev, msg]); });
        }
        return () => newSocket.disconnect();
    }, [restaurantId, table]);

    const sendTableMessage = (e) => {
        e.preventDefault();
        if (!chatMsg.trim() || !socket || !table) {
            if (!table) toast.error("Table number required to call staff");
            return;
        }
        const newMsg = { text: chatMsg, sender: "customer", timestamp: new Date() };
        socket.emit("sendTableMessage", { restaurantId, table, message: newMsg });
        setMessages(prev => [...prev, newMsg]);
        setChatMsg("");
    };

    const alertStaff = () => {
        if (!socket || !table) return;
        const newMsg = { text: "🔔 Customer requested immediate staff assistance at table", sender: "customer", timestamp: new Date() };
        socket.emit("sendTableMessage", { restaurantId, table, message: newMsg });
        setMessages(prev => [...prev, newMsg]);
        toast.success("Staff has been alerted!");
        setIsCallMenuOpen(false);
    };

    const addToCart = (item) => {
        if (!restaurantId) return;
        const cart = JSON.parse(localStorage.getItem(`cart_${restaurantId}`)) || [];
        const existing = cart.find((i) => i._id === item._id);
        if (existing) existing.quantity += 1;
        else cart.push({ ...item, quantity: 1 });
        localStorage.setItem(`cart_${restaurantId}`, JSON.stringify(cart));
        setCartCount(prev => prev + 1);
        toast.success(`Added ${item.name} to cart`);
        window.dispatchEvent(new Event("storage"));
    };

    const categories = ["All", ...new Set(menu.map(item => item.category).filter(Boolean))];
    const filteredMenu = menu.map(item => {
        // Apply category discount if active
        let finalPrice = item.price;
        let activeDiscount = null;
        if (restaurant?.categoryDiscounts) {
            const cd = restaurant.categoryDiscounts.find(c => c.category === item.category && new Date(c.expiresAt) > new Date());
            if (cd) {
                activeDiscount = cd;
                finalPrice = item.price - (item.price * (cd.discountPercentage / 100));
            }
        }
        return { ...item, originalPrice: item.price, price: Math.round(finalPrice), activeDiscount };
    }).filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = activeCategory === "All" || item.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    if (loading) {
        return (
            <div className="min-h-screen p-6 max-w-7xl mx-auto space-y-8 animate-pulse pt-20">
                <div className="h-64 bg-gray-300 rounded-2xl" />
                <div className="flex gap-4 overflow-x-auto pb-4">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-10 w-24 bg-gray-300 rounded-full shrink-0" />)}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-72 bg-gray-300 rounded-2xl" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-24 relative bg-white">
            {/* Restaurant Header */}
            {restaurant && (
                <div className="relative h-72 md:h-96 w-full mb-8 overflow-hidden">
                    {/* Back Button */}
                    <button onClick={() => navigate(-1)} className="absolute top-6 left-6 z-20 px-4 py-2 rounded-xl bg-black/40 backdrop-blur-md flex items-center gap-2 text-white hover:bg-black/60 transition-colors border border-white/10 shadow-lg">
                        <ChevronLeft className="w-5 h-5" />
                        <span className="text-sm font-semibold tracking-wide">Back</span>
                    </button>

                    {/* Clear background image */}
                    <img
                        src={restaurant.image || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=2000"}
                        alt={restaurant.name}
                        className="w-full h-full object-cover"
                    />
                    {/* Dark gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />

                    {/* Floating food icons animation */}
                    {FOOD_ICONS.map((emoji, i) => (
                        <FloatingIcon key={i} emoji={emoji} style={{
                            right: `${8 + (i % 4) * 22}%`,
                            top: `${10 + (i % 3) * 25}%`,
                        }} />
                    ))}



                    {/* Restaurant info at bottom */}
                    <div className="absolute bottom-0 left-0 w-full p-6 md:p-10 z-10">
                        <div className="max-w-7xl mx-auto">
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                                {table && (
                                    <div className="inline-flex items-center gap-2 bg-brand-primary text-white px-3 py-1 rounded-full text-sm font-medium mb-3 shadow-lg">
                                        <Info className="w-4 h-4" /> Table {table}
                                    </div>
                                )}
                                <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-white mb-3 tracking-tight drop-shadow-2xl">
                                    {restaurant.name}
                                </h1>
                                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-white/90">
                                    <span className="flex items-center gap-1 bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-lg shrink-0">
                                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                        <span className="font-semibold">4.5</span>
                                        <span className="text-white/70 text-sm">(500+ ratings)</span>
                                    </span>
                                    <span className="text-white/60">•</span>
                                    <span className="text-white/80 text-sm">{restaurant.address || "Main Street"}</span>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            )}

            {/* FIXED action bar — Reservation + Cart, bottom on mobile, top on desktop */}
            <div className="fixed bottom-6 right-4 md:bottom-auto md:top-[90px] md:right-8 z-[90] flex items-center gap-2 md:gap-3 shadow-2xl md:shadow-none rounded-full p-1 bg-white/50 md:bg-transparent backdrop-blur-md md:backdrop-blur-none border border-white/20 md:border-none">
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate(`/reservation/${restaurantId}`)}
                    className="flex items-center gap-2 bg-white border border-gray-200 text-gray-800 font-bold px-4 py-3 md:py-2 rounded-full text-sm hover:bg-gray-50 transition-all shadow-md"
                >
                    <Calendar className="w-4 h-4 text-brand-primary" />
                    Reserve
                </motion.button>

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsCartOpen(true)}
                    className="relative flex items-center gap-2 bg-brand-primary text-white font-bold px-5 py-3 md:py-2 rounded-full text-sm hover:opacity-90 transition-all shadow-lg"
                >
                    <ShoppingBag className="w-4 h-4" />
                    Cart
                    {cartCount > 0 && (
                        <span className="absolute -top-2 -right-2 bg-white text-brand-primary w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center shadow">
                            {cartCount}
                        </span>
                    )}
                </motion.button>
            </div>

            <div className="max-w-7xl mx-auto px-6">

                {/* BANNERS / OFFERS (Flash cards) */}
                {restaurant?.banners?.length > 0 && (
                    <div className="mb-8 flex gap-4 overflow-x-auto pb-4 hide-scrollbar snap-x">
                        {restaurant.banners.map((b, i) => (
                            <motion.div key={i} whileHover={{ scale: 1.02 }} className="shrink-0 w-80 md:w-96 h-40 md:h-48 rounded-3xl overflow-hidden relative shadow-xl snap-center border border-gray-100">
                                <img src={b.url} alt={b.title} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-5">
                                    <h3 className="text-white font-black text-xl mb-1">{b.title || "Special Offer!"}</h3>
                                    <div className="w-12 h-1 bg-brand-primary rounded-full"></div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Filters & Search */}
                <div className="sticky top-16 z-40 bg-white/90 backdrop-blur-xl py-4 mb-8 border-b border-gray-200 flex flex-col md:flex-row gap-4 justify-between items-center -mx-6 px-6">
                    <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 hide-scrollbar">
                        {categories.map(category => (
                            <button
                                key={category}
                                onClick={() => setActiveCategory(category)}
                                className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-medium transition-all ${
                                    activeCategory === category
                                    ? "bg-brand-primary text-white shadow-[0_0_15px_rgba(230,57,70,0.3)]"
                                    : "bg-gray-100 text-gray-700 hover:text-gray-900 hover:bg-gray-200 border border-gray-200"
                                }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search menu..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-full pl-9 pr-4 py-2 text-sm text-gray-900 focus:outline-none focus:border-brand-primary transition-colors"
                        />
                    </div>
                </div>

                {/* Recommendation Sections */}
                {recommendations.highlyRecommended?.length > 0 && (
                    <div className="mb-10">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="text-2xl">⭐</span>
                            <span className="bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">Highly Recommended</span>
                        </h2>
                        <div className="flex gap-4 overflow-x-auto pb-3 hide-scrollbar">
                            {recommendations.highlyRecommended.map(item => (
                                <motion.div key={item._id} whileHover={{ scale: 1.04, y: -4 }}
                                    className="shrink-0 w-44 bg-white rounded-2xl shadow-md overflow-hidden group cursor-pointer border border-yellow-100"
                                    onClick={() => addToCart(item)}>
                                    <div className="h-28 overflow-hidden bg-gray-100">
                                        {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" /> : <div className="w-full h-full flex items-center justify-center"><UtensilsCrossed className="w-8 h-8 text-gray-300" /></div>}
                                    </div>
                                    <div className="p-3">
                                        <h4 className="font-semibold text-gray-900 text-sm truncate">{item.name}</h4>
                                        <div className="flex items-center justify-between mt-1">
                                            <span className="text-brand-primary font-bold text-sm">₹{item.price}</span>
                                            <span className="text-xs text-orange-500 font-semibold">+ Add</span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}

                {recommendations.popular?.length > 0 && (
                    <div className="mb-10">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="text-2xl">🔥</span> Most Popular
                        </h2>
                        <div className="flex gap-4 overflow-x-auto pb-3 hide-scrollbar">
                            {recommendations.popular.map(item => (
                                <motion.div key={item._id} whileHover={{ scale: 1.04, y: -4 }}
                                    className="shrink-0 w-44 bg-white rounded-2xl shadow-md overflow-hidden group cursor-pointer border border-red-100"
                                    onClick={() => addToCart(item)}>
                                    <div className="h-28 overflow-hidden bg-gray-100 relative">
                                        {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" /> : <div className="w-full h-full flex items-center justify-center"><UtensilsCrossed className="w-8 h-8 text-gray-300" /></div>}
                                        {item.orderCount > 0 && <span className="absolute bottom-2 left-2 bg-brand-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{item.orderCount}x ordered</span>}
                                    </div>
                                    <div className="p-3">
                                        <h4 className="font-semibold text-gray-900 text-sm truncate">{item.name}</h4>
                                        <div className="flex items-center justify-between mt-1">
                                            <span className="text-brand-primary font-bold text-sm">₹{item.price}</span>
                                            <span className="text-xs text-orange-500 font-semibold">+ Add</span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}

                {recommendations.todaySpecials?.length > 0 && (
                    <div className="mb-10">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="text-2xl">🍽️</span> Today's Specials
                        </h2>
                        <div className="flex gap-4 overflow-x-auto pb-3 hide-scrollbar">
                            {recommendations.todaySpecials.map(item => (
                                <motion.div key={item._id} whileHover={{ scale: 1.04, y: -4 }}
                                    className="shrink-0 w-44 bg-white rounded-2xl shadow-md overflow-hidden group cursor-pointer border border-amber-100"
                                    onClick={() => addToCart(item)}>
                                    <div className="h-28 overflow-hidden bg-gray-100">
                                        {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" /> : <div className="w-full h-full flex items-center justify-center"><UtensilsCrossed className="w-8 h-8 text-gray-300" /></div>}
                                    </div>
                                    <div className="p-3">
                                        <h4 className="font-semibold text-gray-900 text-sm truncate">{item.name}</h4>
                                        <div className="flex items-center justify-between mt-1">
                                            <span className="text-amber-500 font-bold text-sm">₹{item.price}</span>
                                            <span className="text-xs bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded font-bold">SPECIAL</span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}

                <h2 className="text-xl font-bold text-gray-900 mb-4">Full Menu</h2>

                {filteredMenu.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Info className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-medium text-gray-600">No items found</h3>
                    </div>
                ) : (
                    <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        <AnimatePresence>
                            {filteredMenu.map((item) => (
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.2 }}
                                    whileHover={{ y: -4 }}
                                    key={item._id}
                                    className="bg-white rounded-2xl shadow-sm hover:shadow-xl overflow-hidden group flex flex-col border border-gray-100 transition-shadow duration-300"
                                >
                                    <div className="h-48 overflow-hidden relative bg-gray-50">
                                        {item.image ? (
                                            <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                                <UtensilsCrossed className="w-12 h-12 text-gray-300" />
                                            </div>
                                        )}
                                        {item.category && (
                                            <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2 py-1 rounded-md text-xs font-medium text-gray-700 border border-gray-200">
                                                {item.category}
                                            </span>
                                        )}
                                        <button
                                            onClick={() => toggleWishlist(item._id)}
                                            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center hover:bg-white transition-colors border border-gray-200 shadow-sm"
                                        >
                                            <Heart className={`w-4 h-4 transition-colors ${wishlist.includes(item._id) ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                                        </button>
                                    </div>

                                    <div className="p-5 flex-1 flex flex-col justify-between">
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900 leading-tight mb-1">{item.name}</h3>
                                            <p className="text-sm text-gray-500 line-clamp-2 mb-4">
                                                {item.description || "A delicious culinary experience prepared with fresh ingredients."}
                                            </p>
                                        </div>
                                        <div className="flex items-center justify-between mt-auto">
                                            <div className="flex flex-col">
                                                {item.activeDiscount && (
                                                    <span className="text-xs text-gray-400 line-through">₹{item.originalPrice}</span>
                                                )}
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xl font-bold text-brand-primary">₹{item.price}</span>
                                                    {item.activeDiscount && (
                                                        <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold uppercase animate-pulse">
                                                            {item.activeDiscount.discountPercentage}% OFF
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => addToCart(item)}
                                                className="w-10 h-10 rounded-full bg-gray-50 hover:bg-brand-primary hover:text-white border border-gray-200 flex items-center justify-center transition-all duration-300 transform active:scale-95 text-gray-700"
                                            >
                                                <Plus className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                )}
            </div>

            {/* Call Staff Button & Menu */}
            {table && (
                <AnimatePresence>
                    {!isChatOpen && (
                        <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="fixed bottom-8 left-6 z-[100]">
                            <AnimatePresence>
                                {isCallMenuOpen && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 20, scale: 0.9 }} 
                                        animate={{ opacity: 1, y: 0, scale: 1 }} 
                                        exit={{ opacity: 0, y: 20, scale: 0.9 }} 
                                        className="mb-3 bg-white p-2 rounded-2xl shadow-xl border border-gray-200 flex flex-col gap-2 w-48"
                                    >
                                        <button onClick={alertStaff} className="flex items-center gap-3 px-4 py-3 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl transition-colors font-bold text-sm">
                                            <BellRing className="w-4 h-4 animate-ping" /> Alert Staff Now
                                        </button>
                                        <button onClick={() => { setIsChatOpen(true); setIsCallMenuOpen(false); }} className="flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl transition-colors font-bold text-sm">
                                            <MessageCircle className="w-4 h-4" /> Message Staff
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            <button
                                onClick={() => setIsCallMenuOpen(!isCallMenuOpen)}
                                className={`py-3 px-5 shadow-lg rounded-full flex items-center gap-2 transition-all ${isCallMenuOpen ? 'bg-amber-500 text-white shadow-amber-500/30' : 'bg-white border border-gray-200 text-gray-900 hover:bg-gray-50'}`}
                            >
                                {isCallMenuOpen ? <X className="w-5 h-5" /> : <BellRing className="w-5 h-5 text-amber-500 animate-bounce" />}
                                <span className="font-bold text-sm">{isCallMenuOpen ? "Close" : "Call Staff"}</span>
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            )}

            {/* Chat Modal */}
            <AnimatePresence>
                {isChatOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-white border border-gray-200 rounded-2xl w-full max-w-md h-[500px] flex flex-col relative overflow-hidden shadow-2xl"
                        >
                            <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <BellRing className="w-5 h-5 text-amber-500" />
                                    <h3 className="font-bold text-gray-900">Ask Staff for Help</h3>
                                </div>
                                <button onClick={() => setIsChatOpen(false)} className="text-gray-400 hover:text-gray-700 transition-colors"><X className="w-5 h-5" /></button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {messages.length === 0 && <p className="text-center text-gray-400 mt-4 text-sm">Send a message to ask for water, menu suggestions, or changes to your order.</p>}
                                {messages.map((msg, i) => (
                                    <div key={i} className={`flex ${msg.sender === 'customer' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${msg.sender === 'customer' ? 'bg-brand-primary text-white rounded-br-sm' : 'bg-gray-100 text-gray-800 rounded-bl-sm'}`}>{msg.text}</div>
                                    </div>
                                ))}
                                <div ref={chatEndRef} />
                            </div>
                            <form onSubmit={sendTableMessage} className="p-3 bg-gray-50 border-t border-gray-100 flex gap-2">
                                <input type="text" value={chatMsg} onChange={(e) => setChatMsg(e.target.value)} placeholder="Type your request..." className="flex-1 bg-white border border-gray-200 rounded-full px-4 py-2 text-sm text-gray-900 focus:outline-none focus:border-brand-primary" />
                                <button type="submit" className="w-10 h-10 rounded-full bg-brand-primary flex items-center justify-center text-white shrink-0 hover:bg-brand-primaryDark transition-colors"><Send className="w-4 h-4" /></button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <Cart
                isOpen={isCartOpen}
                onClose={() => setIsCartOpen(false)}
                restaurantId={restaurantId}
                table={table}
                onCartUpdate={() => {
                    const cart = JSON.parse(localStorage.getItem(`cart_${restaurantId}`)) || [];
                    setCartCount(cart.reduce((acc, item) => acc + item.quantity, 0));
                }}
            />
        </div>
    );
}

export default Menu;
