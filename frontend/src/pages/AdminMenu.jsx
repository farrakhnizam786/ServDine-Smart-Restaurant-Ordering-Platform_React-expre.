import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import { toast } from "react-toastify";
import { UtensilsCrossed, Plus, Trash2, Edit, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function AdminMenu() {
    const navigate = useNavigate();
    const [menu, setMenu] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [name, setName] = useState("");
    const [price, setPrice] = useState("");
    const [category, setCategory] = useState("veg");
    const [description, setDescription] = useState("");
    const [image, setImage] = useState("");

    const [editingItem, setEditingItem] = useState(null);

    const fetchMenu = async () => {
        try {
            const user = JSON.parse(localStorage.getItem("user"));
            const res = await API.get(`/menu/${user.restaurantId}`);
            setMenu(res.data.menu || res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMenu();
    }, []);

    const addItem = async (e) => {
        e.preventDefault();
        try {
            const res = await API.post("/menu", { name, price: Number(price), category, description, image });
            toast.success("Item added successfully");
            setMenu([...menu, res.data.item]);
            setName(""); setPrice(""); setCategory("veg"); setDescription(""); setImage("");
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to add item");
        }
    };

    const updateItem = async (e) => {
        e.preventDefault();
        try {
            const res = await API.put(`/menu/${editingItem._id}`, editingItem);
            toast.success("Item updated successfully");
            setMenu(menu.map(m => m._id === editingItem._id ? res.data.item : m));
            setEditingItem(null);
        } catch (err) {
            toast.error("Failed to update item");
        }
    };

    const deleteItem = async (id) => {
        try {
            await API.delete(`/menu/${id}`);
            setMenu(menu.filter(m => m._id !== id));
            toast.info("Item deleted");
        } catch (err) {
            toast.error("Failed to delete item");
        }
    };

    if (loading) return <div className="min-h-screen flex justify-center items-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div></div>;

    const user = JSON.parse(localStorage.getItem("user") || "{}");

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="p-2 bg-white hover:bg-gray-50 rounded-xl transition-colors border border-gray-200 shadow-sm">
                    <ChevronLeft className="w-6 h-6 text-gray-700" />
                </button>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                    <UtensilsCrossed className="w-8 h-8 text-brand-primary" /> 
                    Menu Management {user.restaurantName ? `- ${user.restaurantName}` : ''}
                </h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form */}
                <motion.div className="glass-panel p-6 lg:col-span-1 h-fit sticky top-24">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Add New Item</h2>
                    <form onSubmit={addItem} className="space-y-4">
                        <div>
                            <label className="block text-sm text-gray-500 mb-1">Item Name</label>
                            <input required className="input-field" value={name} onChange={(e) => setName(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-500 mb-1">Price (₹)</label>
                            <input required type="number" className="input-field" value={price} onChange={(e) => setPrice(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-500 mb-1">Category</label>
                            <select className="input-field bg-brand-light" value={category} onChange={(e) => setCategory(e.target.value)}>
                                <option value="veg">Veg</option>
                                <option value="non-veg">Non-Veg</option>
                                <option value="drinks">Drinks</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-500 mb-1">Image URL</label>
                            <input className="input-field" value={image} onChange={(e) => setImage(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-500 mb-1">Description</label>
                            <textarea className="input-field" value={description} onChange={(e) => setDescription(e.target.value)} />
                        </div>
                        <button type="submit" className="glass-button w-full"><Plus className="w-4 h-4"/> Add Item</button>
                    </form>
                </motion.div>

                {/* List */}
                <div className="lg:col-span-2">
                    <div className="glass-panel p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">Current Menu Items ({menu.length})</h2>
                        <div className="space-y-4">
                            {menu.map(item => (
                                <div key={item._id} className="flex justify-between items-center bg-gray-50 border border-gray-100 p-4 rounded-xl">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 bg-brand-light rounded-lg overflow-hidden shrink-0">
                                            {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-100 flex items-center justify-center"><UtensilsCrossed className="w-6 h-6 text-gray-900/30" /></div>}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900">{item.name}</h4>
                                            <p className="text-brand-primary text-sm font-medium">₹{item.price} • <span className="uppercase text-gray-500 text-xs">{item.category}</span></p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => setEditingItem(item)} className="p-2 text-blue-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors">
                                            <Edit className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => deleteItem(item._id)} className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            <AnimatePresence>
                {editingItem && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="glass-panel p-6 max-w-md w-full relative">
                            <button onClick={() => setEditingItem(null)} className="absolute top-4 right-4 text-gray-500 hover:text-gray-900">✕</button>
                            <h2 className="text-xl font-bold text-gray-900 mb-6">Edit Menu Item</h2>
                            
                            <form onSubmit={updateItem} className="space-y-4">
                                <div>
                                    <label className="block text-sm text-gray-700 mb-1">Item Name</label>
                                    <input required type="text" value={editingItem.name || ""} onChange={e => setEditingItem({...editingItem, name: e.target.value})} className="w-full bg-brand-light border border-gray-200 rounded-lg px-4 py-2.5 text-gray-900" />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-700 mb-1">Price</label>
                                    <input required type="number" value={editingItem.price || ""} onChange={e => setEditingItem({...editingItem, price: e.target.value})} className="w-full bg-brand-light border border-gray-200 rounded-lg px-4 py-2.5 text-gray-900" />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-700 mb-1">Category</label>
                                    <select value={editingItem.category || "veg"} onChange={e => setEditingItem({...editingItem, category: e.target.value})} className="w-full bg-brand-light border border-gray-200 rounded-lg px-4 py-2.5 text-gray-900">
                                        <option value="veg">Veg</option>
                                        <option value="non-veg">Non-Veg</option>
                                        <option value="drinks">Drinks</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-700 mb-1">Image URL</label>
                                    <input type="text" value={editingItem.image || ""} onChange={e => setEditingItem({...editingItem, image: e.target.value})} className="w-full bg-brand-light border border-gray-200 rounded-lg px-4 py-2.5 text-gray-900" />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-700 mb-1">Description</label>
                                    <textarea value={editingItem.description || ""} onChange={e => setEditingItem({...editingItem, description: e.target.value})} className="w-full bg-brand-light border border-gray-200 rounded-lg px-4 py-2.5 text-gray-900" />
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

export default AdminMenu;
