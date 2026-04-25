import { useState, useEffect } from "react";
import API from "../api/axios";
import { toast } from "react-toastify";
import { Store, Plus, MapPin, Image as ImageIcon, Users, Trash2, Key, Search, Edit } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function EditorAdminDashboard() {
    const [activeTab, setActiveTab] = useState("add"); // add, restaurants, users
    const [restaurants, setRestaurants] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Form states
    const [name, setName] = useState("");
    const [address, setAddress] = useState("");
    const [image, setImage] = useState("");
    const [category, setCategory] = useState("");
    const [since, setSince] = useState("");
    
    // Create Superadmin state
    const [saEmail, setSaEmail] = useState("");
    const [saPassword, setSaPassword] = useState("");
    const [saName, setSaName] = useState("Super Admin");

    // Search state
    const [userSearchTerm, setUserSearchTerm] = useState("");

    // Edit Restaurant Modal State
    const [editingRest, setEditingRest] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await API.get("/editoradmin/data");
            setRestaurants(res.data.restaurants || []);
            setUsers(res.data.users || []);
        } catch (err) {
            toast.error("Failed to fetch platform data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const addRestaurantAndSuperAdmin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await API.post("/superadmin/create-restaurant", {
                restaurantName: name,
                address,
                image,
                category,
                since,
                name: saName,
                email: saEmail,
                password: saPassword,
                coordinates: [77.1, 28.7] // Default coordinates
            });
            toast.success(`Restaurant ${name} onboarded with SuperAdmin!`);
            setName(""); setAddress(""); setImage(""); setCategory(""); setSince("");
            setSaEmail(""); setSaPassword(""); setSaName("Super Admin");
            fetchData();
            setActiveTab("restaurants");
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to onboard restaurant");
        } finally {
            setLoading(false);
        }
    };

    const handleEditRestaurant = async (e) => {
        e.preventDefault();
        try {
            await API.put(`/editoradmin/restaurant/${editingRest._id}`, editingRest);
            toast.success("Restaurant updated!");
            setEditingRest(null);
            fetchData();
        } catch (err) {
            toast.error("Failed to update restaurant");
        }
    };

    const deleteUser = async (id) => {
        if (!window.confirm("Are you sure you want to delete this user?")) return;
        try {
            await API.delete(`/editoradmin/user/${id}`);
            toast.success("User deleted");
            fetchData();
        } catch (err) {
            toast.error("Failed to delete user");
        }
    };

    const changePassword = async (id) => {
        const newPassword = window.prompt("Enter new password for this user:");
        if (!newPassword) return;
        try {
            await API.put(`/editoradmin/user/${id}/password`, { password: newPassword });
            toast.success("Password updated successfully");
        } catch (err) {
            toast.error("Failed to update password");
        }
    };

    const deleteRestaurant = async (id) => {
        if (!window.confirm("WARNING: This will delete the restaurant and ALL associated users. Continue?")) return;
        try {
            await API.delete(`/editoradmin/restaurant/${id}`);
            toast.success("Restaurant deleted");
            fetchData();
        } catch (err) {
            toast.error("Failed to delete restaurant");
        }
    };

    const filteredUsers = users.filter(u => {
        if (u.role === 'editoradmin') return false;
        const matchName = u.name?.toLowerCase().includes(userSearchTerm.toLowerCase());
        const matchEmail = u.email?.toLowerCase().includes(userSearchTerm.toLowerCase());
        const matchRestName = u.restaurantId?.name?.toLowerCase().includes(userSearchTerm.toLowerCase());
        return matchName || matchEmail || matchRestName;
    });

    if (loading && restaurants.length === 0) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div></div>;

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8 min-h-screen">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                <Store className="w-8 h-8 text-brand-primary" /> Editor Admin Console
            </h1>

            {/* Tabs */}
            <div className="flex bg-gray-500 p-1 rounded-xl border border-gray-100 w-max overflow-x-auto max-w-full">
                {[
                    { id: "add", label: "Onboard Restaurant", icon: Plus },
                    { id: "restaurants", label: "Restaurants Data", icon: Store },
                    { id: "users", label: "Users Data", icon: Users }
                ].map(tab => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                                activeTab === tab.id 
                                ? "bg-brand-primary text-gray-900 shadow-lg shadow-brand-primary/20" 
                                : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                            }`}
                        >
                            <Icon className="w-4 h-4" /> {tab.label}
                        </button>
                    )
                })}
            </div>

            {/* Tab Contents */}
            <AnimatePresence mode="wait">
                {activeTab === "add" && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="glass-panel p-8 max-w-3xl">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">Onboard New Restaurant & SuperAdmin</h2>
                        <form onSubmit={addRestaurantAndSuperAdmin} className="space-y-6">
                            
                            <div className="space-y-4 p-5 border border-gray-200 rounded-xl bg-gray-50">
                                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Restaurant Details</h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Restaurant Name</label>
                                        <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-brand-light border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:border-brand-primary" placeholder="e.g. Spice Symphony" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                                        <input type="text" value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-brand-light border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:border-brand-primary" placeholder="e.g. Fast Food, Fine Dining" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Location / Full Address</label>
                                        <input required type="text" value={address} onChange={e => setAddress(e.target.value)} className="w-full bg-brand-light border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:border-brand-primary" placeholder="123 Main St, City" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Image URL</label>
                                        <input type="text" value={image} onChange={e => setImage(e.target.value)} className="w-full bg-brand-light border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:border-brand-primary" placeholder="https://..." />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Since (Year Established)</label>
                                        <input type="text" value={since} onChange={e => setSince(e.target.value)} className="w-full bg-brand-light border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:border-brand-primary" placeholder="e.g. 1998" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 p-5 border border-gray-200 rounded-xl bg-brand-primary/5">
                                <h3 className="text-sm font-bold text-brand-primary uppercase tracking-wider">SuperAdmin Credentials</h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">SuperAdmin Email (Login ID)</label>
                                        <input required type="email" value={saEmail} onChange={e => setSaEmail(e.target.value)} className="w-full bg-brand-light border border-brand-primary/20 rounded-xl px-4 py-3 text-gray-900 focus:border-brand-primary" placeholder="admin@restaurant.com" />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                                        <input required type="text" value={saPassword} onChange={e => setSaPassword(e.target.value)} className="w-full bg-brand-light border border-brand-primary/20 rounded-xl px-4 py-3 text-gray-900 focus:border-brand-primary" placeholder="Set a strong password" />
                                    </div>
                                </div>
                            </div>

                            <button disabled={loading} type="submit" className="glass-button w-full !py-4 text-lg mt-4 shadow-[0_0_20px_rgba(230,57,70,0.3)] hover:shadow-[0_0_30px_rgba(230,57,70,0.5)]">
                                {loading ? "Onboarding..." : <><Plus className="w-5 h-5" /> Create Restaurant & Admin</>}
                            </button>
                        </form>
                    </motion.div>
                )}

                {activeTab === "restaurants" && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {restaurants.map(rest => {
                                const sa = users.find(u => u.restaurantId?._id === rest._id && u.role === 'superadmin');
                                return (
                                    <div key={rest._id} className="glass-panel p-6 border-t-4 border-t-brand-primary relative">
                                        <button onClick={() => setEditingRest(rest)} className="absolute top-4 right-4 p-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-700 transition-colors">
                                            <Edit className="w-4 h-4" />
                                        </button>

                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="font-bold text-2xl text-gray-900">{rest.name}</h3>
                                                <p className="text-gray-500 text-sm mt-1">{rest.category || "Uncategorized"} • Since {rest.since || "N/A"}</p>
                                                <p className="text-gray-500 text-sm">{rest.address || "No address provided"}</p>
                                            </div>
                                            <span className="bg-green-500/10 text-green-500 px-3 py-1 rounded-full text-xs font-bold uppercase mt-1">Active</span>
                                        </div>
                                        
                                        {/* SuperAdmin Details injected directly into Restaurant Card */}
                                        <div className="mt-4 mb-6 p-4 bg-purple-500/10 rounded-xl border border-purple-500/20">
                                            <h4 className="text-purple-400 text-xs font-bold uppercase mb-2 flex items-center gap-2"><Users className="w-4 h-4"/> Attached SuperAdmin</h4>
                                            {sa ? (
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-gray-900 font-medium">{sa.email}</p>
                                                        <p className="text-gray-500 text-xs">Password: [Hidden]</p>
                                                    </div>
                                                    <button onClick={() => changePassword(sa._id)} className="px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg text-xs font-medium transition-colors">
                                                        Change Password
                                                    </button>
                                                </div>
                                            ) : (
                                                <p className="text-gray-500 text-sm italic">No SuperAdmin found for this restaurant.</p>
                                            )}
                                        </div>
                                        
                                        <div className="pt-4 border-t border-gray-100 flex justify-end">
                                            <button onClick={() => deleteRestaurant(rest._id)} className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-sm font-medium transition-colors">
                                                <Trash2 className="w-4 h-4" /> Delete Restaurant Data
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}

                {activeTab === "users" && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                        
                        {/* Search Bar */}
                        <div className="relative max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <input 
                                type="text" 
                                value={userSearchTerm}
                                onChange={(e) => setUserSearchTerm(e.target.value)}
                                placeholder="Search users by name, email, or restaurant..." 
                                className="w-full bg-brand-light/50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-gray-900 focus:border-brand-primary"
                            />
                        </div>

                        <div className="glass-panel overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-sm">
                                            <th className="p-4 font-medium">Name</th>
                                            <th className="p-4 font-medium">Email</th>
                                            <th className="p-4 font-medium">Role</th>
                                            <th className="p-4 font-medium">Restaurant</th>
                                            <th className="p-4 font-medium">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredUsers.map(user => (
                                            <tr key={user._id} className="border-b border-gray-100 hover:bg-gray-50">
                                                <td className="p-4 font-medium text-gray-900">{user.name}</td>
                                                <td className="p-4 text-gray-700">{user.email}</td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase
                                                        ${user.role === 'superadmin' ? 'bg-purple-500/20 text-purple-400' : 
                                                          user.role === 'admin' ? 'bg-blue-500/20 text-blue-400' : 
                                                          user.role === 'staff' ? 'bg-yellow-500/20 text-yellow-400' : 
                                                          'bg-gray-500/20 text-gray-500'}`}
                                                    >
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-brand-gold">{user.restaurantId?.name || "None"}</td>
                                                <td className="p-4">
                                                    <div className="flex gap-2">
                                                        <button onClick={() => changePassword(user._id)} className="p-2 bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary rounded-lg transition-colors" title="Change Password">
                                                            <Key className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={() => deleteUser(user._id)} className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors" title="Delete User">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {filteredUsers.length === 0 && (
                                    <div className="p-8 text-center text-gray-500">No users found matching your search.</div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Edit Modal */}
            <AnimatePresence>
                {editingRest && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="glass-panel p-6 max-w-lg w-full relative">
                            <button onClick={() => setEditingRest(null)} className="absolute top-4 right-4 text-gray-500 hover:text-gray-900">✕</button>
                            <h2 className="text-xl font-bold text-gray-900 mb-6">Edit Restaurant Details</h2>
                            
                            <form onSubmit={handleEditRestaurant} className="space-y-4">
                                <div>
                                    <label className="block text-sm text-gray-700 mb-1">Name</label>
                                    <input required type="text" value={editingRest.name || ""} onChange={e => setEditingRest({...editingRest, name: e.target.value})} className="w-full bg-brand-light border border-gray-200 rounded-lg px-4 py-2.5 text-gray-900" />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-700 mb-1">Category</label>
                                    <input type="text" value={editingRest.category || ""} onChange={e => setEditingRest({...editingRest, category: e.target.value})} className="w-full bg-brand-light border border-gray-200 rounded-lg px-4 py-2.5 text-gray-900" />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-700 mb-1">Address</label>
                                    <input required type="text" value={editingRest.address || ""} onChange={e => setEditingRest({...editingRest, address: e.target.value})} className="w-full bg-brand-light border border-gray-200 rounded-lg px-4 py-2.5 text-gray-900" />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-700 mb-1">Image URL</label>
                                    <input type="text" value={editingRest.image || ""} onChange={e => setEditingRest({...editingRest, image: e.target.value})} className="w-full bg-brand-light border border-gray-200 rounded-lg px-4 py-2.5 text-gray-900" />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-700 mb-1">Since (Year)</label>
                                    <input type="text" value={editingRest.since || ""} onChange={e => setEditingRest({...editingRest, since: e.target.value})} className="w-full bg-brand-light border border-gray-200 rounded-lg px-4 py-2.5 text-gray-900" />
                                </div>
                                
                                <button type="submit" className="glass-button w-full mt-4">Save Changes</button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default EditorAdminDashboard;
