import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/axios";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { Calendar, Clock, Users, ChevronLeft, ChevronRight, CreditCard, Phone, Mail, User, Utensils, Gift, MessageSquare, CheckCircle, X } from "lucide-react";
import logo from "../assets/logo.png";

const TIME_SLOTS = [
    "11:00","11:30","12:00","12:30","13:00","13:30","14:00","14:30",
    "15:00","15:30","16:00","16:30","17:00","17:30","18:00","18:30",
    "19:00","19:30","20:00","20:30","21:00","21:30","22:00"
];

const OCCASIONS = [
    { value: "none", label: "No Special Occasion", emoji: "🍽️" },
    { value: "birthday", label: "Birthday", emoji: "🎂" },
    { value: "anniversary", label: "Anniversary", emoji: "💑" },
    { value: "business", label: "Business Meal", emoji: "💼" },
    { value: "date", label: "Date Night", emoji: "❤️" },
    { value: "family", label: "Family Gathering", emoji: "👨‍👩‍👧" },
    { value: "other", label: "Other", emoji: "✨" },
];

const TABLE_PREFS = [
    { value: "any", label: "No Preference", emoji: "🪑" },
    { value: "indoor", label: "Indoor", emoji: "🏠" },
    { value: "outdoor", label: "Outdoor", emoji: "🌿" },
    { value: "window", label: "Window Seat", emoji: "🪟" },
    { value: "private", label: "Private Room", emoji: "🔒" },
];

function Reservation() {
    const { restaurantId } = useParams();
    const navigate = useNavigate();
    const [restaurant, setRestaurant] = useState(null);
    const [step, setStep] = useState(1); // 1=details, 2=confirm, 3=success

    const today = new Date();
    const [form, setForm] = useState({
        customerName: "",
        customerEmail: "",
        customerPhone: "",
        partySize: 2,
        reservationDate: today.toISOString().split("T")[0],
        reservationTime: "19:00",
        specialRequests: "",
        tablePreference: "any",
        occasion: "none",
        advanceAmount: 0,
        paymentId: "",
    });
    const [submitting, setSubmitting] = useState(false);
    const [confirmed, setConfirmed] = useState(null);

    // Pre-fill if logged-in customer
    useEffect(() => {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        if (user?.name) setForm(f => ({ ...f, customerName: user.name }));
        if (user?.email) setForm(f => ({ ...f, customerEmail: user.email }));
        if (restaurantId) {
            API.get(`/restaurant/${restaurantId}`)
                .then(r => setRestaurant(r.data))
                .catch(() => {});
        }
    }, [restaurantId]);

    const set = (key, value) => setForm(f => ({ ...f, [key]: value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = { ...form, restaurantId };
            const res = await API.post("/reservations", payload);
            setConfirmed(res.data.reservation);
            setStep(3);
            toast.success("Reservation confirmed! 🎉");
        } catch (err) {
            toast.error(err.response?.data?.message || "Reservation failed");
        } finally {
            setSubmitting(false);
        }
    };

    // ── Step 1 — Details form ──────────────────────────
    const renderStep1 = () => (
        <form onSubmit={e => { e.preventDefault(); setStep(2); }} className="space-y-6">
            {/* Party size */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Number of Guests</label>
                <div className="flex items-center gap-4">
                    <button type="button" onClick={() => set("partySize", Math.max(1, form.partySize - 1))}
                        className="w-11 h-11 rounded-xl border-2 border-gray-200 flex items-center justify-center text-xl font-bold text-gray-700 hover:border-[#f97316] hover:text-[#f97316] transition-all">
                        −
                    </button>
                    <div className="flex-1 text-center">
                        <span className="text-4xl font-black text-gray-900">{form.partySize}</span>
                        <p className="text-sm text-gray-500">{form.partySize === 1 ? "guest" : "guests"}</p>
                    </div>
                    <button type="button" onClick={() => set("partySize", Math.min(20, form.partySize + 1))}
                        className="w-11 h-11 rounded-xl border-2 border-gray-200 flex items-center justify-center text-xl font-bold text-gray-700 hover:border-[#f97316] hover:text-[#f97316] transition-all">
                        +
                    </button>
                </div>
            </div>

            {/* Date + Time */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2"><Calendar className="inline w-4 h-4 mr-1" />Date</label>
                    <input type="date" required value={form.reservationDate} min={today.toISOString().split("T")[0]}
                        onChange={e => set("reservationDate", e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-[#f97316] focus:ring-2 focus:ring-[#f97316]/20 transition-all" />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2"><Clock className="inline w-4 h-4 mr-1" />Time</label>
                    <select required value={form.reservationTime} onChange={e => set("reservationTime", e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-[#f97316] transition-all">
                        {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-1 gap-4">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2"><User className="inline w-4 h-4 mr-1" />Full Name</label>
                    <input type="text" required value={form.customerName} onChange={e => set("customerName", e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-[#f97316] focus:ring-2 focus:ring-[#f97316]/20"
                        placeholder="Your full name" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2"><Phone className="inline w-4 h-4 mr-1" />Phone</label>
                        <input type="tel" required value={form.customerPhone} onChange={e => set("customerPhone", e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-[#f97316] focus:ring-2 focus:ring-[#f97316]/20"
                            placeholder="+1 234 567" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2"><Mail className="inline w-4 h-4 mr-1" />Email</label>
                        <input type="email" value={form.customerEmail} onChange={e => set("customerEmail", e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-[#f97316] focus:ring-2 focus:ring-[#f97316]/20"
                            placeholder="Optional" />
                    </div>
                </div>
            </div>

            {/* Occasion */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3"><Gift className="inline w-4 h-4 mr-1" />Occasion</label>
                <div className="grid grid-cols-4 gap-2">
                    {OCCASIONS.map(o => (
                        <button key={o.value} type="button" onClick={() => set("occasion", o.value)}
                            className={`p-2.5 rounded-xl border-2 text-center transition-all text-xs font-medium ${form.occasion === o.value ? "border-[#f97316] bg-orange-50 text-[#f97316]" : "border-gray-200 hover:border-orange-200"}`}>
                            <div className="text-2xl mb-1">{o.emoji}</div>
                            {o.label.split(" ")[0]}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table Preference */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3"><Utensils className="inline w-4 h-4 mr-1" />Table Preference</label>
                <div className="flex flex-wrap gap-2">
                    {TABLE_PREFS.map(p => (
                        <button key={p.value} type="button" onClick={() => set("tablePreference", p.value)}
                            className={`px-4 py-2 rounded-full border-2 text-sm font-medium transition-all ${form.tablePreference === p.value ? "border-[#f97316] bg-orange-50 text-[#f97316]" : "border-gray-200 hover:border-orange-200"}`}>
                            {p.emoji} {p.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Special Requests */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2"><MessageSquare className="inline w-4 h-4 mr-1" />Special Requests</label>
                <textarea rows={3} value={form.specialRequests} onChange={e => set("specialRequests", e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-[#f97316] focus:ring-2 focus:ring-[#f97316]/20 resize-none"
                    placeholder="Allergies, high chair needed, preferred seating..." />
            </div>

            <button type="submit"
                className="w-full bg-[#f97316] hover:bg-[#ea580c] text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2">
                Continue to Review <ChevronRight className="w-5 h-5" />
            </button>
        </form>
    );

    // ── Step 2 — Confirm ──────────────────────────
    const renderStep2 = () => (
        <div className="space-y-6">
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 space-y-3">
                <h3 className="font-bold text-gray-900 text-lg">Reservation Summary</h3>
                {[
                    { label: "Name", value: form.customerName },
                    { label: "Phone", value: form.customerPhone },
                    { label: "Guests", value: `${form.partySize} ${form.partySize === 1 ? "guest" : "guests"}` },
                    { label: "Date", value: new Date(form.reservationDate).toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) },
                    { label: "Time", value: form.reservationTime },
                    { label: "Occasion", value: OCCASIONS.find(o => o.value === form.occasion)?.label || "None" },
                    { label: "Table Pref.", value: TABLE_PREFS.find(p => p.value === form.tablePreference)?.label || "Any" },
                    ...(form.specialRequests ? [{ label: "Requests", value: form.specialRequests }] : []),
                ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between text-sm">
                        <span className="text-gray-500 font-medium">{label}</span>
                        <span className="text-gray-900 font-semibold text-right max-w-[60%]">{value}</span>
                    </div>
                ))}
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex items-center gap-3">
                <CreditCard className="w-6 h-6 text-[#f97316]" />
                <div>
                    <p className="text-sm font-bold text-gray-900">Payment at Restaurant</p>
                    <p className="text-xs text-gray-500">No advance payment required. Pay when you arrive.</p>
                </div>
            </div>

            <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 py-4 border-2 border-gray-200 rounded-xl font-bold text-gray-700 hover:border-gray-300 transition-all flex items-center justify-center gap-2">
                    <ChevronLeft className="w-5 h-5" /> Edit
                </button>
                <button onClick={handleSubmit} disabled={submitting}
                    className="flex-1 bg-[#f97316] hover:bg-[#ea580c] text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2 disabled:opacity-60">
                    {submitting ? <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <><CheckCircle className="w-5 h-5" /> Confirm Booking</>}
                </button>
            </div>
        </div>
    );

    // ── Step 3 — Success ──────────────────────────
    const renderStep3 = () => (
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-6 space-y-6">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
            <div>
                <h2 className="text-2xl font-black text-gray-900 mb-2">Reservation Confirmed! 🎉</h2>
                <p className="text-gray-500">We look forward to seeing you, <strong>{confirmed?.customerName}</strong>!</p>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 text-left space-y-2">
                <p className="text-sm font-bold text-gray-900 mb-3">Your Booking Details</p>
                <p className="text-sm text-gray-700"><strong>Date:</strong> {new Date(confirmed?.reservationDate).toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
                <p className="text-sm text-gray-700"><strong>Time:</strong> {confirmed?.reservationTime}</p>
                <p className="text-sm text-gray-700"><strong>Guests:</strong> {confirmed?.partySize}</p>
                <p className="text-sm text-gray-700"><strong>Booking ID:</strong> <span className="font-mono text-[#f97316]">#{confirmed?._id?.slice(-8).toUpperCase()}</span></p>
            </div>
            <div className="flex gap-3">
                <button onClick={() => navigate("/")}
                    className="flex-1 py-3 border-2 border-gray-200 rounded-xl font-bold text-gray-700 hover:border-gray-300 transition-all">
                    Go Home
                </button>
                <button onClick={() => navigate(`/menu/${restaurantId}`)}
                    className="flex-1 bg-[#f97316] hover:bg-[#ea580c] text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-orange-500/30">
                    View Menu
                </button>
            </div>
        </motion.div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white pt-20 pb-12 px-4">
            <div className="max-w-xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    {restaurant && (
                        <p className="text-[#f97316] font-semibold text-sm mb-2">{restaurant.name}</p>
                    )}
                    <h1 className="text-3xl font-black text-gray-900 mb-2">Make a Reservation</h1>
                    <p className="text-gray-500">Reserve your table in seconds</p>

                    {/* Steps indicator */}
                    {step < 3 && (
                        <div className="flex items-center justify-center gap-2 mt-5">
                            {[1, 2].map(s => (
                                <div key={s} className="flex items-center gap-2">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step >= s ? "bg-[#f97316] text-white" : "bg-gray-200 text-gray-400"}`}>
                                        {s}
                                    </div>
                                    {s < 2 && <div className={`w-12 h-1 rounded-full ${step > s ? "bg-[#f97316]" : "bg-gray-200"}`} />}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 md:p-8">
                    {step === 1 && renderStep1()}
                    {step === 2 && renderStep2()}
                    {step === 3 && renderStep3()}
                </div>
            </div>
        </div>
    );
}

export default Reservation;
