import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { User, Mail, Phone, MapPin, Edit3, Save, X, ChevronLeft } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";

function Profile() {
    const { user } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    
    // In a real app, these would come from the backend or AuthContext
    const [profile, setProfile] = useState({
        name: user?.name || "Customer",
        email: user?.email || "customer@example.com",
        phone: "+91 9876543210",
        address: "123 Main Street, Cityville"
    });

    const [editForm, setEditForm] = useState({ ...profile });

    const handleSave = () => {
        setProfile(editForm);
        setIsEditing(false);
        toast.success("Profile updated successfully!");
        // Here you would typically make an API call to update the user
    };

    const navigate = useNavigate();

    return (
        <div className="min-h-screen p-6 max-w-3xl mx-auto pt-24 relative">
            <button onClick={() => navigate(-1)} className="absolute top-8 left-6 text-gray-500 hover:text-gray-900 font-bold flex items-center gap-2 text-sm transition-colors bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100">
                <ChevronLeft className="w-4 h-4"/> Back
            </button>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
            <p className="text-gray-500 mb-8">Manage your account information</p>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel overflow-hidden"
            >
                <div className="p-8 border-b border-gray-100 bg-brand-light/50 relative">
                    <div className="flex items-center gap-6">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-brand-primary to-brand-gold flex items-center justify-center shadow-[0_0_20px_rgba(230,57,70,0.4)]">
                            <User className="w-10 h-10 text-gray-900" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-1">{profile.name}</h2>
                            <p className="text-gray-500 flex items-center gap-2"><Mail className="w-4 h-4" /> {profile.email}</p>
                        </div>
                    </div>
                    
                    {!isEditing && (
                        <button 
                            onClick={() => setIsEditing(true)}
                            className="absolute top-8 right-8 w-10 h-10 rounded-full bg-gray-100 hover:bg-white/20 flex items-center justify-center text-gray-900 transition-colors"
                        >
                            <Edit3 className="w-4 h-4" />
                        </button>
                    )}
                </div>

                <div className="p-8">
                    {isEditing ? (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-2">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                    <input
                                        type="text"
                                        value={editForm.name}
                                        onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                                        className="w-full bg-brand-light border border-gray-200 rounded-xl pl-12 pr-4 py-3 text-gray-900 focus:outline-none focus:border-brand-primary"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-2">Phone Number</label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                    <input
                                        type="text"
                                        value={editForm.phone}
                                        onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                                        className="w-full bg-brand-light border border-gray-200 rounded-xl pl-12 pr-4 py-3 text-gray-900 focus:outline-none focus:border-brand-primary"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-2">Default Address</label>
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-3 w-5 h-5 text-gray-500" />
                                    <textarea
                                        value={editForm.address}
                                        onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                                        rows="3"
                                        className="w-full bg-brand-light border border-gray-200 rounded-xl pl-12 pr-4 py-3 text-gray-900 focus:outline-none focus:border-brand-primary resize-none"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-4 pt-4 border-t border-gray-100">
                                <button onClick={() => setIsEditing(false)} className="flex-1 glass-button flex items-center justify-center gap-2">
                                    <X className="w-4 h-4" /> Cancel
                                </button>
                                <button onClick={handleSave} className="flex-1 bg-brand-primary hover:bg-brand-primaryDark text-gray-900 font-medium rounded-xl flex items-center justify-center gap-2 transition-colors py-3">
                                    <Save className="w-4 h-4" /> Save Changes
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
                                    <Phone className="w-5 h-5 text-brand-gold" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Phone Number</p>
                                    <p className="font-medium text-gray-900">{profile.phone}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
                                    <MapPin className="w-5 h-5 text-brand-gold" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Default Delivery Address</p>
                                    <p className="font-medium text-gray-900">{profile.address}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}

export default Profile;
