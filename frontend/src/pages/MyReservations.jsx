import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarCheck, Clock, Users, Phone, MapPin, ChevronRight, X, CheckCircle2 } from "lucide-react";

const STATUS_CONFIG = {
    pending:   { label: "Pending",   color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
    confirmed: { label: "Confirmed", color: "bg-blue-100 text-blue-700 border-blue-200" },
    seated:    { label: "Seated",    color: "bg-purple-100 text-purple-700 border-purple-200" },
    completed: { label: "Completed", color: "bg-green-100 text-green-700 border-green-200" },
    cancelled: { label: "Cancelled", color: "bg-red-100 text-red-600 border-red-200" },
};

function MyReservations() {
    const navigate = useNavigate();
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cancelling, setCancelling] = useState(null);

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        const fetchReservations = async () => {
            try {
                const res = await API.get(`/reservations/my`);
                setReservations(res.data);
            } catch (err) {
                console.error(err);
                toast.error("Failed to load reservations");
            } finally {
                setLoading(false);
            }
        };
        fetchReservations();
    }, []);

    const cancelReservation = async (id) => {
        setCancelling(id);
        try {
            await API.put(`/reservations/${id}/cancel`);
            setReservations(prev => prev.map(r => r._id === id ? { ...r, status: "cancelled" } : r));
            toast.success("Reservation cancelled");
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to cancel");
        } finally {
            setCancelling(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen pt-24 px-4">
                <div className="max-w-2xl mx-auto space-y-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-40 bg-gray-100 rounded-2xl animate-pulse" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                            <CalendarCheck className="w-5 h-5 text-blue-600" />
                        </div>
                        <h1 className="text-2xl font-black text-gray-900">My Reservations</h1>
                    </div>
                    <p className="text-gray-500 text-sm ml-13">Track and manage your table bookings</p>
                </div>

                {reservations.length === 0 ? (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
                        <CalendarCheck className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-gray-700 mb-2">No reservations yet</h3>
                        <p className="text-gray-400 text-sm mb-6">Book a table at your favourite restaurant</p>
                        <button onClick={() => navigate("/")}
                            className="inline-flex items-center gap-2 bg-brand-primary text-white font-semibold px-6 py-2.5 rounded-full hover:opacity-90 transition-all">
                            Discover Restaurants <ChevronRight className="w-4 h-4" />
                        </button>
                    </motion.div>
                ) : (
                    <AnimatePresence>
                        {reservations.map((res, i) => {
                            const cfg = STATUS_CONFIG[res.status] || STATUS_CONFIG.pending;
                            const resDate = new Date(res.reservationDate);
                            const isPast = resDate < new Date() && res.status !== "cancelled";
                            return (
                                <motion.div key={res._id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-4 overflow-hidden">
                                    {/* Top bar */}
                                    <div className="px-5 py-4 flex justify-between items-start border-b border-gray-50">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-bold text-gray-900 text-lg">
                                                    {res.restaurantId?.name || "Restaurant"}
                                                </h3>
                                                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border capitalize ${cfg.color}`}>
                                                    {cfg.label}
                                                </span>
                                                {isPast && res.status === "confirmed" && (
                                                    <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium">Past due</span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-400 font-mono">#{res._id.slice(-8).toUpperCase()}</p>
                                        </div>
                                        {res.restaurantId && (
                                            <button
                                                onClick={() => navigate(`/menu/${res.restaurantId._id || res.restaurantId}`)}
                                                className="flex items-center gap-1 text-xs font-semibold text-brand-primary hover:underline"
                                            >
                                                View Menu <ChevronRight className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>

                                    {/* Details */}
                                    <div className="px-5 py-4 grid grid-cols-2 gap-3">
                                        <div className="flex items-center gap-2 text-sm text-gray-700">
                                            <CalendarCheck className="w-4 h-4 text-gray-400 shrink-0" />
                                            <span className="font-medium">
                                                {resDate.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-700">
                                            <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                                            <span className="font-medium">{res.reservationTime}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-700">
                                            <Users className="w-4 h-4 text-gray-400 shrink-0" />
                                            <span>{res.partySize} {res.partySize === 1 ? "guest" : "guests"}</span>
                                        </div>
                                        {res.occasion && res.occasion !== "none" && (
                                            <div className="flex items-center gap-2 text-sm text-gray-700 capitalize">
                                                <span className="text-base">🎉</span>
                                                <span>{res.occasion}</span>
                                            </div>
                                        )}
                                        {res.tablePreference && res.tablePreference !== "any" && (
                                            <div className="flex items-center gap-2 text-sm text-gray-500 capitalize">
                                                <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                                                <span>{res.tablePreference} seat</span>
                                            </div>
                                        )}
                                    </div>

                                    {res.specialRequests && (
                                        <div className="mx-5 mb-3 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 text-xs text-amber-700 italic">
                                            "{res.specialRequests}"
                                        </div>
                                    )}

                                    {/* Footer: call + cancel */}
                                    <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3">
                                        <a href={`tel:${res.restaurantId?.phone || ''}`}
                                            className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700">
                                            <Phone className="w-4 h-4" /> Call Restaurant
                                        </a>

                                        {res.status === "pending" || res.status === "confirmed" ? (
                                            <button
                                                onClick={() => cancelReservation(res._id)}
                                                disabled={cancelling === res._id}
                                                className="flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-full transition-all border border-red-100"
                                            >
                                                {cancelling === res._id
                                                    ? <span className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" />
                                                    : <X className="w-3.5 h-3.5" />
                                                }
                                                Cancel Booking
                                            </button>
                                        ) : res.status === "completed" ? (
                                            <span className="flex items-center gap-1 text-xs text-green-600 font-semibold">
                                                <CheckCircle2 className="w-4 h-4" /> Completed
                                            </span>
                                        ) : null}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
}

export default MyReservations;
