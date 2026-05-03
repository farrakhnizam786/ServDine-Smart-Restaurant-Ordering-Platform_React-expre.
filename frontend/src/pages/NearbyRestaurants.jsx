import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";
import { MapPin, Search, Star, Navigation, MessageCircleHeart, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function NearbyRestaurants() {
    const [restaurants, setRestaurants] = useState([]);
    const [ratings, setRatings] = useState({}); // { restaurantId: { avg, count } }
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [cityFilter, setCityFilter] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [userCity, setUserCity] = useState("");
    const [locationStatus, setLocationStatus] = useState("getting");
    const searchRef = useRef(null);
    const navigate = useNavigate();

    // Fetch all restaurants
    const fetchRestaurants = async (lat, lng) => {
        try {
            const res = await axios.get(`http://localhost:5000/api/restaurant/nearby?lat=${lat}&lng=${lng}`);
            setRestaurants(res.data);
            // Fetch ratings for all restaurants
            res.data.forEach(r => {
                axios.get(`http://localhost:5000/api/reviews/${r._id}`)
                    .then(rv => setRatings(prev => ({ ...prev, [r._id]: { avg: rv.data.avgRating, count: rv.data.count } })))
                    .catch(() => {});
            });
        } catch (err) {
            console.error("Error fetching restaurants:", err);
        } finally {
            setLoading(false);
        }
    };

    // Reverse geocode to get city name (Nominatim - free)
    const getCityFromCoords = async (lat, lng) => {
        try {
            const res = await axios.get(
                `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
                { headers: { "Accept-Language": "en" } }
            );
            const addr = res.data.address;
            const city = addr.city || addr.town || addr.village || addr.county || "";
            setUserCity(city);
            setCityFilter(city); // Immediately apply the city filter so only local shows
            return city;
        } catch {
            return "";
        }
    };

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (pos) => {
                    setLocationStatus("granted");
                    const lat = pos.coords.latitude;
                    const lng = pos.coords.longitude;
                    await getCityFromCoords(lat, lng);
                    fetchRestaurants(lat, lng);
                },
                () => {
                    setLocationStatus("denied");
                    fetchRestaurants(28.7041, 77.1025);
                }
            );
        } else {
            fetchRestaurants(28.7041, 77.1025);
        }

        // Real-time open/close updates
        const socket = io("http://localhost:5000");
        socket.on("restaurantStatusChanged", ({ restaurantId, isOpen }) => {
            setRestaurants(prev => prev.map(r => r._id === restaurantId ? { ...r, isOpen } : r));
        });
        return () => socket.disconnect();
    }, []);

    // Build city autocomplete suggestions from DB
    useEffect(() => {
        if (cityFilter.length < 2) {
            setSuggestions([]);
            return;
        }
        const keyword = cityFilter.toLowerCase();
        // Extract cities from restaurant addresses
        const allCities = restaurants
            .map(r => {
                if (!r.address) return null;
                // Try to extract city: "123 Street, City, State" → "City"
                const parts = r.address.split(",").map(p => p.trim());
                return parts.find(p => p.toLowerCase().includes(keyword)) || null;
            })
            .filter(Boolean);
        const unique = [...new Set(allCities)].slice(0, 6);
        setSuggestions(unique);
        setShowSuggestions(true);
    }, [cityFilter, restaurants]);

    // Close suggestions on outside click
    useEffect(() => {
        const handleClick = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    // Filter restaurants
    const filtered = restaurants.filter(r => {
        const nameMatch = r.name.toLowerCase().includes(search.toLowerCase());
        const cityMatch = cityFilter
            ? (r.address || "").toLowerCase().includes(cityFilter.toLowerCase())
            : true;
        return nameMatch && cityMatch;
    });

    const renderStars = (avg) => {
        const filled = Math.round(avg || 0);
        return (
            <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map(i => (
                    <Star key={i} className={`w-3.5 h-3.5 ${i <= filled ? 'fill-brand-gold text-brand-gold' : 'text-gray-600'}`} />
                ))}
            </div>
        );
    };

    return (
        <div className="min-h-screen pt-12 pb-24 px-6 max-w-7xl mx-auto">

            {/* Header */}
            <div className="text-center mb-12 space-y-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="inline-flex items-center gap-2 bg-brand-primary/10 text-brand-primary px-4 py-2 rounded-full border border-brand-primary/20"
                >
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm font-medium tracking-wide uppercase">
                        {userCity ? `Restaurants near ${userCity}` : "Discover Near You"}
                    </span>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="text-5xl md:text-6xl font-bold tracking-tight"
                >
                    Craving something <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-gold">delicious?</span>
                </motion.h1>

                {/* Search Bars */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto mt-8"
                >
                    {/* Name search */}
                    <div className="flex-1 relative">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                            <Search className="text-gray-500 w-5 h-5" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search by restaurant name..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-white/80 border border-gray-200 text-gray-900 rounded-full pl-12 pr-6 py-4 focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all shadow-xl backdrop-blur-md"
                        />
                    </div>

                    {/* City filter with autocomplete */}
                    <div className="relative sm:w-64" ref={searchRef}>
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                            <MapPin className="text-gray-500 w-5 h-5" />
                        </div>
                        <input
                            type="text"
                            placeholder="Filter by city (Delhi, Mohali...)"
                            value={cityFilter}
                            onChange={(e) => { setCityFilter(e.target.value); setShowSuggestions(true); }}
                            onFocus={() => cityFilter.length >= 2 && setShowSuggestions(true)}
                            className="w-full bg-white/80 border border-gray-200 text-gray-900 rounded-full pl-12 pr-10 py-4 focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all shadow-xl backdrop-blur-md"
                        />
                        {cityFilter && (
                            <button onClick={() => { setCityFilter(""); setSuggestions([]); }} className="absolute inset-y-0 right-4 flex items-center text-gray-500 hover:text-gray-900">
                                <X className="w-4 h-4" />
                            </button>
                        )}

                        {/* Autocomplete dropdown */}
                        <AnimatePresence>
                            {showSuggestions && suggestions.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                                    className="absolute top-full mt-2 left-0 right-0 bg-brand-light border border-gray-200 rounded-2xl overflow-hidden shadow-2xl z-50"
                                >
                                    {suggestions.map((s, i) => (
                                        <button
                                            key={i}
                                            onClick={() => { setCityFilter(s); setShowSuggestions(false); }}
                                            className="w-full text-left px-5 py-3 text-sm text-gray-800 hover:bg-brand-primary/10 hover:text-gray-900 transition-colors flex items-center gap-3"
                                        >
                                            <MapPin className="w-4 h-4 text-brand-primary shrink-0" />
                                            {s}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            </div>

            {/* Location denied banner */}
            {locationStatus === "denied" && (
                <div className="mb-6 flex items-center gap-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3">
                    <MapPin className="w-5 h-5 text-yellow-400 shrink-0" />
                    <p className="text-yellow-300 text-sm">
                        Location access denied — showing all restaurants.{" "}
                        <button className="underline hover:text-yellow-100" onClick={() => window.location.reload()}>
                            Allow location
                        </button>{" "}
                        for nearby results.
                    </p>
                </div>
            )}

            {/* Results count */}
            {!loading && (
                <p className="text-gray-500 text-sm mb-6">
                    {cityFilter
                        ? `${filtered.length} restaurant${filtered.length !== 1 ? 's' : ''} found in "${cityFilter}"`
                        : `${filtered.length} partner restaurant${filtered.length !== 1 ? 's' : ''} available`}
                </p>
            )}

            {/* Restaurant Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1, 2, 3].map(i => <div key={i} className="glass-panel h-72 animate-pulse" />)}
                </div>
            ) : filtered.length === 0 ? (
                <div className="py-12">
                    <div className="text-center mb-12">
                        <div className="w-20 h-20 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <MapPin className="w-8 h-8 text-brand-primary" />
                        </div>
                        <h3 className="text-3xl font-bold text-gray-900">Coming soon to {cityFilter || "your area"}!</h3>
                        <p className="text-gray-500 mt-2 text-lg">
                            We don't have partner restaurants here just yet, but we're expanding fast.
                        </p>
                    </div>
                    
                    <div className="mt-8">
                        <h4 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <Star className="text-brand-gold w-5 h-5 fill-current" />
                            Explore other popular restaurants
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {restaurants.slice(0, 6).map((restaurant, i) => {
                                const rating = ratings[restaurant._id];
                                return (
                                    <motion.div
                                        key={restaurant._id}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: i * 0.07 }}
                                        onClick={() => navigate(`/menu/${restaurant._id}`)}
                                        className={`glass-panel overflow-hidden cursor-pointer group hover:border-brand-primary/50 transition-all duration-500 hover:shadow-[0_0_30px_rgba(203,32,45,0.15)] flex flex-col ${restaurant.isOpen === false ? 'opacity-70' : ''}`}
                                    >
                                        <div className="h-48 overflow-hidden relative">
                                            <img
                                                src={restaurant.image || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1000"}
                                                alt={restaurant.name}
                                                className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${restaurant.isOpen === false ? 'grayscale-[40%]' : ''}`}
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 to-transparent" />

                                            {/* Open/Closed badge */}
                                            <div className={`absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm border ${
                                                restaurant.isOpen === false
                                                ? 'bg-red-900/80 text-red-300 border-red-500/30'
                                                : 'bg-green-900/80 text-green-300 border-green-500/30'
                                            }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${restaurant.isOpen === false ? 'bg-red-400' : 'bg-green-400 animate-pulse'}`} />
                                                {restaurant.isOpen === false ? 'Closed' : 'Open Now'}
                                            </div>

                                            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                                                <h2 className="text-2xl font-bold text-gray-900 group-hover:text-brand-primary transition-colors drop-shadow-md">
                                                    {restaurant.name}
                                                </h2>
                                                <div className="flex items-center gap-1 bg-gray-900/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-gray-100 text-sm font-medium text-brand-gold">
                                                    <Star className="w-3.5 h-3.5 fill-current" />
                                                    <span>{rating?.avg ? rating.avg.toFixed(1) : "New"}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-5 flex-1 flex flex-col justify-between">
                                            <div>
                                                <p className="text-gray-500 text-sm flex items-start gap-2 line-clamp-2">
                                                    <Navigation className="w-4 h-4 shrink-0 mt-0.5 text-gray-500" />
                                                    {restaurant.address || "Main Street, City Center"}
                                                </p>

                                                {/* Real star rating row */}
                                                {rating?.count > 0 && (
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <div className="flex gap-0.5">
                                                            {[1, 2, 3, 4, 5].map(star => (
                                                                <Star key={star} className={`w-3.5 h-3.5 ${star <= Math.round(rating.avg) ? 'fill-brand-gold text-brand-gold' : 'text-gray-300'}`} />
                                                            ))}
                                                        </div>
                                                        <span className="text-gray-500 text-xs">({rating.count} review{rating.count !== 1 ? 's' : ''})</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                                                <span className="text-sm text-gray-500">
                                                    {restaurant.category || "Restaurant"}
                                                </span>
                                                <span className={`text-sm font-medium group-hover:translate-x-1 transition-transform inline-block ${restaurant.isOpen === false ? 'text-gray-500' : 'text-brand-primary'}`}>
                                                    {restaurant.isOpen === false ? "Currently Closed" : "View Menu →"}
                                                </span>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filtered.map((restaurant, i) => {
                        const rating = ratings[restaurant._id];
                        return (
                            <motion.div
                                key={restaurant._id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.07 }}
                                onClick={() => navigate(`/menu/${restaurant._id}`)}
                                className={`glass-panel overflow-hidden cursor-pointer group hover:border-brand-primary/50 transition-all duration-500 hover:shadow-[0_0_30px_rgba(230,57,70,0.15)] flex flex-col ${restaurant.isOpen === false ? 'opacity-70' : ''}`}
                            >
                                <div className="h-48 overflow-hidden relative">
                                    <img
                                        src={restaurant.image || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1000"}
                                        alt={restaurant.name}
                                        className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${restaurant.isOpen === false ? 'grayscale-[40%]' : ''}`}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/90 to-transparent" />

                                    {/* Open/Closed badge */}
                                    <div className={`absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm border ${
                                        restaurant.isOpen === false
                                        ? 'bg-red-900/80 text-red-300 border-red-500/30'
                                        : 'bg-green-900/80 text-green-300 border-green-500/30'
                                    }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${restaurant.isOpen === false ? 'bg-red-400' : 'bg-green-400 animate-pulse'}`} />
                                        {restaurant.isOpen === false ? 'Closed' : 'Open Now'}
                                    </div>

                                    <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                                        <h2 className="text-2xl font-bold text-gray-900 group-hover:text-brand-primary transition-colors drop-shadow-md">
                                            {restaurant.name}
                                        </h2>
                                        <div className="flex items-center gap-1 bg-brand-light/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-gray-200 text-sm font-medium text-brand-gold">
                                            <Star className="w-3.5 h-3.5 fill-current" />
                                            <span>{rating?.avg ? rating.avg.toFixed(1) : "New"}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-5 flex-1 flex flex-col justify-between">
                                    <div>
                                        <p className="text-gray-500 text-sm flex items-start gap-2 line-clamp-2">
                                            <Navigation className="w-4 h-4 shrink-0 mt-0.5 text-gray-500" />
                                            {restaurant.address || "Main Street, City Center"}
                                        </p>

                                        {/* Real star rating row */}
                                        {rating?.count > 0 && (
                                            <div className="flex items-center gap-2 mt-2">
                                                {renderStars(rating.avg)}
                                                <span className="text-gray-500 text-xs">({rating.count} review{rating.count !== 1 ? 's' : ''})</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                                        <span className="text-sm text-gray-500">
                                            {locationStatus === "granted" ? "📍 Nearby" : restaurant.category || "Restaurant"}
                                        </span>
                                        <span className={`text-sm font-medium group-hover:translate-x-1 transition-transform inline-block ${restaurant.isOpen === false ? 'text-gray-500' : 'text-brand-primary'}`}>
                                            {restaurant.isOpen === false ? "Currently Closed" : "View Menu →"}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Live Community Reviews */}
            <div className="mt-24">
                <div className="flex items-center gap-3 mb-8">
                    <MessageCircleHeart className="w-8 h-8 text-brand-primary" />
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Community Reviews</h2>
                        <p className="text-gray-500 mt-1">Real feedback from ServDine customers</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                        { name: "Rahul S.", date: "Just now", restro: "Khana Khazana", rating: 5, text: "Amazing food and super fast delivery. The 'Call Staff' feature is a game changer!" },
                        { name: "Priya M.", date: "2 mins ago", restro: "Spice Route", rating: 4, text: "Loved the ambience and the seamless ordering experience. Highly recommend the Biryani." },
                        { name: "Amit K.", date: "15 mins ago", restro: "Burger Hub", rating: 5, text: "Best burgers in town. Tracked my order easily using ServDine." },
                    ].map((review, idx) => (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
                            key={idx}
                            className="glass-panel p-6 border-l-4 border-brand-primary/50 relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <MessageCircleHeart className="w-16 h-16 text-brand-primary" />
                            </div>
                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <div>
                                    <h4 className="font-bold text-gray-900 text-lg">{review.name}</h4>
                                    <p className="text-xs text-gray-500">{review.date}</p>
                                </div>
                                <div className="flex gap-1 text-brand-gold">
                                    {[...Array(review.rating)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
                                </div>
                            </div>
                            <p className="text-sm text-brand-primary font-medium mb-2 relative z-10">@ {review.restro}</p>
                            <p className="text-gray-700 text-sm leading-relaxed relative z-10">"{review.text}"</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default NearbyRestaurants;
