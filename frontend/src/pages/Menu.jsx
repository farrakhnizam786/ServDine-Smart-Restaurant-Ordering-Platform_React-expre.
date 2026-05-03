import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import API from "../api/axios";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Star, Info, Plus, Minus, Search, UtensilsCrossed, MessageCircle, Send, X, BellRing, Heart } from "lucide-react";
import { io } from "socket.io-client";
import Cart from "./Cart";

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
    const [chatMsg, setChatMsg] = useState("");
    const [messages, setMessages] = useState([]);
    const [socket, setSocket] = useState(null);
    const chatEndRef = useRef(null);
    const [recommendations, setRecommendations] = useState({ popular: [], todaySpecials: [], highlyRecommended: [] });

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isChatOpen]);

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
                setMenu(menuRes.data.menu || menuRes.data);
                setRestaurant(restRes.data);
                setRecommendations(recRes.data);
            } catch (err) {
                console.error(err);
                toast.error("Failed to load menu");
            } finally {
                setLoading(false);
            }
        };

        fetchData();

        const newSocket = io("http://localhost:5000");
        setSocket(newSocket);
        newSocket.emit("joinRestaurant", restaurantId);

        // 🔥 Real-time price update — admin changes price, all customers see it instantly
        newSocket.on("menuItemUpdated", ({ item }) => {
            setMenu(prev => prev.map(m => m._id === item._id ? { ...m, ...item } : m));
            toast.info(`Menu updated: ${item.name} is now ₹${item.price}`, { autoClose: 3000 });
        });

        if (table) {
            newSocket.emit("joinTable", { restaurantId, table });
            newSocket.on("receiveTableMessage", (msg) => {
                setMessages(prev => [...prev, msg]);
            });
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
    
    const filteredMenu = menu.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = activeCategory === "All" || item.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    if (loading) {
        return (
            <div className="min-h-screen p-6 max-w-7xl mx-auto space-y-8 animate-pulse pt-20">
                <div className="h-64 bg-gray-500 rounded-2xl" />
                <div className="flex gap-4 overflow-x-auto pb-4">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-10 w-24 bg-gray-500 rounded-full shrink-0" />)}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-72 bg-gray-500 rounded-2xl" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-24 relative">
            {/* Restaurant Header */}
            {restaurant && (
                <div className="relative h-64 md:h-80 w-full mb-8">
                    <img 
                        src={restaurant.image || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=2000"} 
                        alt={restaurant.name}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/50 to-transparent" />
                    
                    <div className="absolute bottom-0 left-0 w-full p-6 md:p-12">
                        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                {table && (
                                    <div className="inline-flex items-center gap-2 bg-brand-primary text-gray-900 px-3 py-1 rounded-full text-sm font-medium mb-4 shadow-lg">
                                        <Info className="w-4 h-4" /> Table {table}
                                    </div>
                                )}
                                <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-2 tracking-tight drop-shadow-lg">
                                    {restaurant.name}
                                </h1>
                                <div className="flex items-center gap-4 text-gray-700">
                                    <span className="flex items-center gap-1 bg-gray-100 px-2.5 py-1 rounded-lg backdrop-blur-md">
                                        <Star className="w-4 h-4 text-brand-gold fill-current" />
                                        4.5 (500+ ratings)
                                    </span>
                                    <span>•</span>
                                    <span>{restaurant.address || "Main Street"}</span>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto px-6">
                {/* Filters & Search */}
                <div className="sticky top-20 z-40 bg-brand-light/80 backdrop-blur-xl py-4 mb-8 border-b border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center -mx-6 px-6">
                    <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 hide-scrollbar">
                        {categories.map(category => (
                            <button
                                key={category}
                                onClick={() => setActiveCategory(category)}
                                className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-medium transition-all ${
                                    activeCategory === category 
                                    ? "bg-brand-primary text-gray-900 shadow-[0_0_15px_rgba(230,57,70,0.3)]" 
                                    : "bg-gray-500 text-gray-500 hover:text-gray-900 hover:bg-gray-100 border border-gray-100"
                                }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>

                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search menu..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-gray-500 border border-gray-200 rounded-full pl-9 pr-4 py-2 text-sm text-gray-900 focus:outline-none focus:border-brand-primary transition-colors"
                        />
                    </div>
                </div>

                {/* Recommendation Sections */}
                {recommendations.highlyRecommended?.length > 0 && (
                    <div className="mb-10">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="text-2xl">⭐</span> Highly Recommended
                        </h2>
                        <div className="flex gap-4 overflow-x-auto pb-3 hide-scrollbar">
                            {recommendations.highlyRecommended.map(item => (
                                <motion.div key={item._id} whileHover={{ scale: 1.03 }}
                                    className="shrink-0 w-44 glass-panel overflow-hidden group cursor-pointer"
                                    onClick={() => addToCart(item)}>
                                    <div className="h-28 overflow-hidden bg-gray-100">
                                        {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" /> : <div className="w-full h-full flex items-center justify-center"><UtensilsCrossed className="w-8 h-8 text-gray-300" /></div>}
                                    </div>
                                    <div className="p-3">
                                        <h4 className="font-semibold text-gray-900 text-sm truncate">{item.name}</h4>
                                        <div className="flex items-center justify-between mt-1">
                                            <span className="text-brand-primary font-bold text-sm">₹{item.price}</span>
                                            <span className="text-xs text-brand-gold">+ Add</span>
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
                                <motion.div key={item._id} whileHover={{ scale: 1.03 }}
                                    className="shrink-0 w-44 glass-panel overflow-hidden group cursor-pointer border border-brand-primary/20"
                                    onClick={() => addToCart(item)}>
                                    <div className="h-28 overflow-hidden bg-gray-100 relative">
                                        {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" /> : <div className="w-full h-full flex items-center justify-center"><UtensilsCrossed className="w-8 h-8 text-gray-300" /></div>}
                                        {item.orderCount > 0 && <span className="absolute bottom-2 left-2 bg-brand-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{item.orderCount}x ordered</span>}
                                    </div>
                                    <div className="p-3">
                                        <h4 className="font-semibold text-gray-900 text-sm truncate">{item.name}</h4>
                                        <div className="flex items-center justify-between mt-1">
                                            <span className="text-brand-primary font-bold text-sm">₹{item.price}</span>
                                            <span className="text-xs text-brand-gold">+ Add</span>
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
                                <motion.div key={item._id} whileHover={{ scale: 1.03 }}
                                    className="shrink-0 w-44 glass-panel overflow-hidden group cursor-pointer border border-brand-gold/30"
                                    onClick={() => addToCart(item)}>
                                    <div className="h-28 overflow-hidden bg-gray-100">
                                        {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" /> : <div className="w-full h-full flex items-center justify-center"><UtensilsCrossed className="w-8 h-8 text-gray-300" /></div>}
                                    </div>
                                    <div className="p-3">
                                        <h4 className="font-semibold text-gray-900 text-sm truncate">{item.name}</h4>
                                        <div className="flex items-center justify-between mt-1">
                                            <span className="text-brand-gold font-bold text-sm">₹{item.price}</span>
                                            <span className="text-xs bg-brand-gold/20 text-brand-gold px-1.5 py-0.5 rounded text-[10px] font-bold">NEW</span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}

                {/* All Items heading */}
                <h2 className="text-xl font-bold text-gray-900 mb-4">Full Menu</h2>

                {/* Menu Grid */}
                {filteredMenu.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                            <Info className="w-8 h-8 text-gray-500" />
                        </div>
                        <h3 className="text-xl font-medium text-gray-700">No items found</h3>
                    </div>
                ) : (
                    <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        <AnimatePresence>
                            {filteredMenu.map((item, i) => (
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.2 }}
                                    key={item._id}
                                    className="glass-panel overflow-hidden group flex flex-col"
                                >
                                    <div className="h-48 overflow-hidden relative bg-white">
                                        {item.image ? (
                                            <img 
                                                src={item.image} 
                                                alt={item.name}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gray-500">
                                                <UtensilsCrossed className="w-12 h-12 text-gray-900/20" />
                                            </div>
                                        )}
                                        {item.category && (
                                            <span className="absolute top-3 left-3 bg-brand-light/80 backdrop-blur-md px-2 py-1 rounded-md text-xs font-medium border border-gray-200">
                                                {item.category}
                                            </span>
                                        )}
                                        <button 
                                            onClick={() => toggleWishlist(item._id)}
                                            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-brand-light/80 backdrop-blur-md flex items-center justify-center hover:bg-brand-light transition-colors border border-gray-200"
                                        >
                                            <Heart className={`w-4 h-4 transition-colors ${wishlist.includes(item._id) ? 'fill-red-500 text-red-500' : 'text-gray-500'}`} />
                                        </button>
                                    </div>
                                    
                                    <div className="p-5 flex-1 flex flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="text-lg font-bold text-gray-900 leading-tight">{item.name}</h3>
                                            </div>
                                            <p className="text-sm text-gray-500 line-clamp-2 mb-4">
                                                {item.description || "A delicious culinary experience prepared with fresh ingredients."}
                                            </p>
                                        </div>
                                        
                                        <div className="flex items-center justify-between mt-auto">
                                            <span className="text-xl font-bold text-brand-primary">
                                                ₹{item.price}
                                            </span>
                                            <button
                                                onClick={() => addToCart(item)}
                                                className="w-10 h-10 rounded-full bg-gray-50 hover:bg-brand-primary hover:text-gray-900 border border-gray-200 flex items-center justify-center transition-all duration-300 transform active:scale-95"
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

            {/* Floating Cart Button */}
            <AnimatePresence>
                {cartCount > 0 && !isCartOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="fixed bottom-8 right-6 z-[100]"
                    >
                        <button
                            onClick={() => setIsCartOpen(true)}
                            className="glass-button !py-4 !px-6 shadow-[0_10px_30px_rgba(230,57,70,0.5)] !rounded-full group"
                        >
                            <div className="relative">
                                <ShoppingBag className="w-6 h-6 group-hover:-translate-y-1 transition-transform" />
                                <span className="absolute -top-2 -right-2 bg-white text-brand-primary w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center shadow-md">
                                    {cartCount}
                                </span>
                            </div>
                            <span className="font-bold ml-2">View Cart</span>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Call Staff Button */}
            {table && (
                <AnimatePresence>
                    {!isChatOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 50 }}
                            className="fixed bottom-8 left-6 z-[100]"
                        >
                            <button
                                onClick={() => setIsChatOpen(true)}
                                className="bg-brand-light/90 backdrop-blur-md border border-gray-200 text-gray-900 !py-4 !px-6 shadow-[0_10px_30px_rgba(0,0,0,0.5)] !rounded-full flex items-center gap-2 hover:bg-brand-light transition-colors"
                            >
                                <BellRing className="w-5 h-5 text-brand-gold animate-bounce" />
                                <span className="font-bold">Call Staff</span>
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            )}

            {/* Chat Modal */}
            <AnimatePresence>
                {isChatOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-brand-light border border-gray-200 rounded-2xl w-full max-w-md h-[500px] flex flex-col relative overflow-hidden shadow-2xl"
                        >
                            <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <BellRing className="w-5 h-5 text-brand-gold" />
                                    <h3 className="font-bold text-gray-900">Ask Staff for Help</h3>
                                </div>
                                <button onClick={() => setIsChatOpen(false)} className="text-gray-500 hover:text-gray-900 transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {messages.length === 0 && (
                                    <p className="text-center text-gray-500 mt-4 text-sm">Send a message to ask for water, menu suggestions, or changes to your order.</p>
                                )}
                                {messages.map((msg, i) => (
                                    <div key={i} className={`flex ${msg.sender === 'customer' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${msg.sender === 'customer' ? 'bg-brand-primary text-gray-900 rounded-br-sm' : 'bg-gray-100 text-gray-800 rounded-bl-sm'}`}>
                                            {msg.text}
                                        </div>
                                    </div>
                                ))}
                                <div ref={chatEndRef} />
                            </div>

                            <form onSubmit={sendTableMessage} className="p-3 bg-gray-50 border-t border-gray-200 flex gap-2">
                                <input 
                                    type="text" 
                                    value={chatMsg}
                                    onChange={(e) => setChatMsg(e.target.value)}
                                    placeholder="Type your request..." 
                                    className="flex-1 bg-brand-light border border-gray-200 rounded-full px-4 py-2 text-sm text-gray-900 focus:outline-none focus:border-brand-primary"
                                />
                                <button type="submit" className="w-10 h-10 rounded-full bg-brand-primary flex items-center justify-center text-gray-900 shrink-0 hover:bg-brand-primaryDark transition-colors">
                                    <Send className="w-4 h-4" />
                                </button>
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