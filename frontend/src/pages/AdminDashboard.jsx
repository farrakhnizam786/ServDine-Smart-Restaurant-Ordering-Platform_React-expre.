import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import { toast } from "react-toastify";
import { io } from "socket.io-client";
import { motion } from "framer-motion";
import {
  LayoutDashboard, UtensilsCrossed, Grid3X3, Users,
  BarChart3, Trash2, Key, Power,
  IndianRupee, Package, Receipt, Star,
  BellRing, CircleDot, LogOut, ChevronLeft, ChevronRight, TrendingUp, ShoppingBag
} from "lucide-react";
import logo from "../assets/logo.png";

const NAV = [
  { id: "overview", label: "Dashboard",      icon: LayoutDashboard },
  { id: "menu",     label: "Menu Management", icon: UtensilsCrossed, href: "/admin/menu" },
  { id: "tables",   label: "Tables & QR",     icon: Grid3X3,         href: "/admin/tables" },
  { id: "staff",    label: "Staff",           icon: Users },
  { id: "coupons",  label: "Coupons",         icon: Package },
  { id: "banners",  label: "Banners & Offers",icon: ShoppingBag },
  { id: "tax",      label: "Tax & Analytics", icon: BarChart3 },
];

function Sidebar({ active, setActive, navigate, open, setOpen }) {
  const logout = () => { localStorage.clear(); navigate("/login"); };
  return (
    <motion.aside
      animate={{ width: open ? 240 : 64 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className="fixed left-0 top-0 h-screen bg-white border-r border-gray-100 flex flex-col z-40 shadow-sm overflow-hidden"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <div className={`flex items-center ${open ? 'justify-start' : 'justify-center'} gap-2 ${open ? 'px-4' : 'px-0'} py-5 border-b border-gray-100 overflow-hidden`}>
        <img src={logo} alt="ServDine" className="h-8 w-auto shrink-0" />
        {open && <span className="font-black text-gray-900 text-lg whitespace-nowrap">Serv<span className="text-orange-500">Dine</span></span>}
        {open && <span className="ml-auto text-[10px] font-bold text-orange-500 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full whitespace-nowrap">Hub</span>}
      </div>

      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {NAV.map(({ id, label, icon: Icon, href }) => (
          <button key={id}
            onClick={() => href ? navigate(href) : setActive(id)}
            title={!open ? label : undefined}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all ${
              active === id ? "bg-orange-500 text-white shadow-md shadow-orange-500/30" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}>
            <Icon className="w-4 h-4 shrink-0" />
            {open && <span className="whitespace-nowrap">{label}</span>}
          </button>
        ))}
      </nav>

      <div className="px-2 pb-4 border-t border-gray-100 pt-3">
        <button onClick={logout} title={!open ? "Logout" : undefined}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-all">
          <LogOut className="w-4 h-4 shrink-0" />
          {open && <span className="whitespace-nowrap">Logout</span>}
        </button>
      </div>
    </motion.aside>
  );
}

function StatCard({ label, value, sub, icon: Icon, color, live }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-gray-100 p-5 flex items-start gap-4 shadow-sm">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{label}</p>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-2xl font-black text-gray-900">{value}</p>
          {live && <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full"><CircleDot className="w-2.5 h-2.5" />LIVE</span>}
        </div>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </motion.div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [active, setActive] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState({ staffCount:0, dailyOrderCount:0, menuCount:0, dailyRevenue:0, monthlyRevenue:0 });
  // Category GST rates
  const [catGst, setCatGst] = useState({ veg: 5, nonVeg: 5, drinks: 12 });
  const [staff, setStaff] = useState([]);
  const [orders, setOrders] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(true);
  const [toggling, setToggling] = useState(false);

  // Staff form
  const [sName, setSName] = useState(""); const [sEmail, setSEmail] = useState("");
  const [sPass, setSPass] = useState(""); const [sRole, setSRole] = useState("staff");
  const [creating, setCreating] = useState(false);

  // Coupon form
  const [cCode, setCCode] = useState(""); const [cDisc, setCDisc] = useState("");
  const [creatingC, setCreatingC] = useState(false);

  // Tax
  const [gst, setGst] = useState(0); const [sc, setSc] = useState(0);
  const [gstin, setGstin] = useState(""); const [savingTax, setSavingTax] = useState(false);

  // Banners & Offers
  const [banners, setBanners] = useState([]);
  const [bUrl, setBUrl] = useState("");
  const [bTitle, setBTitle] = useState("");
  const [catDiscounts, setCatDiscounts] = useState([]);
  const [cdCat, setCdCat] = useState("All");
  const [cdPct, setCdPct] = useState(10);
  const [cdExp, setCdExp] = useState("");
  const [savingOffers, setSavingOffers] = useState(false);

  const fetchAll = async () => {
    try {
      const [s, st, c, o] = await Promise.all([
        API.get("/admin/dashboard"), API.get("/admin/staff"),
        API.get("/admin/coupons"), API.get("/orders")
      ]);
      setStats(s.data); setStaff(st.data); setCoupons(c.data);
      setOrders((o.data.orders || o.data).slice(0, 3));
    } catch { toast.error("Failed to load dashboard"); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchAll();
    if (user?.restaurantId) {
      API.get(`/restaurant/${user.restaurantId}`).then(r => {
        setIsOpen(r.data.isOpen !== false);
        setBanners(r.data.banners || []);
        setCatDiscounts(r.data.categoryDiscounts || []);
        setGst(r.data.gstPercentage || 0);
        setSc(r.data.serviceChargePercentage || 0);
        setGstin(r.data.gstNumber || "");
      }).catch(() => {});
    }
    const socket = io(`http://${window.location.hostname}:5000`);
    if (user?.restaurantId) {
      socket.emit("joinRestaurant", user.restaurantId);
      socket.on("staffAvailabilityChanged", ({ staffId, isAvailable }) =>
        setStaff(p => p.map(s => s._id === staffId ? { ...s, isAvailable } : s)));
      socket.on("restaurantStatusChanged", ({ isOpen }) => setIsOpen(isOpen));
    }
    return () => socket.disconnect();
  }, []);

  const toggleOpen = async () => {
    setToggling(true);
    try {
      const r = await API.put("/restaurant/toggle-open");
      setIsOpen(r.data.isOpen);
      toast.success(r.data.isOpen ? "🟢 Restaurant OPEN" : "🔴 Restaurant CLOSED");
    } catch { toast.error("Failed"); } finally { setToggling(false); }
  };

  const deleteStaff = async (id) => {
    if (!window.confirm("Remove this user?")) return;
    await API.delete(`/admin/staff/${id}`).then(() => { toast.success("Removed"); fetchAll(); }).catch(() => toast.error("Failed"));
  };

  const changePass = async (id) => {
    const np = window.prompt("Enter new password:");
    if (!np) return;
    await API.put(`/admin/staff/${id}/password`, { newPassword: np }).then(() => toast.success("Password updated")).catch(() => toast.error("Failed"));
  };

  const toggleStatus = async (id) => {
    await API.put(`/admin/staff/${id}/toggle`).then(() => fetchAll()).catch(() => toast.error("Failed"));
  };

  const createStaff = async (e) => {
    e.preventDefault(); setCreating(true);
    try { await API.post("/admin/staff", { name: sName, email: sEmail, password: sPass, role: sRole }); toast.success("User created!"); setSName(""); setSEmail(""); setSPass(""); fetchAll(); }
    catch (err) { toast.error(err.response?.data?.message || "Failed"); } finally { setCreating(false); }
  };

  const createCoupon = async (e) => {
    e.preventDefault(); setCreatingC(true);
    try { await API.post("/admin/coupons", { code: cCode, discountPercentage: Number(cDisc) }); toast.success("Coupon created!"); setCCode(""); setCDisc(""); fetchAll(); }
    catch (err) { toast.error(err.response?.data?.message || "Failed"); } finally { setCreatingC(false); }
  };

  const deleteCoupon = async (id) => {
    if (!window.confirm("Delete coupon?")) return;
    await API.delete(`/admin/coupons/${id}`).then(() => { toast.success("Deleted"); fetchAll(); });
  };

  const saveOffers = async (newBanners, newCatDiscounts) => {
    setSavingOffers(true);
    try {
      await API.put("/restaurant/offers", { banners: newBanners, categoryDiscounts: newCatDiscounts });
      setBanners(newBanners);
      setCatDiscounts(newCatDiscounts);
      toast.success("Offers updated successfully!");
    } catch { toast.error("Failed to update offers"); }
    finally { setSavingOffers(false); }
  };

  const inp = "w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 transition-all";
  const btn = "w-full py-3 rounded-xl font-bold text-sm bg-orange-500 hover:bg-orange-600 text-white transition-all shadow-md shadow-orange-500/20 disabled:opacity-60";

  if (loading) return (
    <div className="flex h-screen">
      <Sidebar active={active} setActive={setActive} user={user} navigate={navigate} open={sidebarOpen} setOpen={setSidebarOpen} />
      <div className="ml-16 flex-1 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );

  const activeOrders = orders.filter(o => ["pending","preparing","ready"].includes(o.status));
  const statusColor = { pending:"bg-yellow-100 text-yellow-700 border-yellow-200", preparing:"bg-orange-100 text-orange-700 border-orange-200", ready:"bg-green-100 text-green-700 border-green-200", delivered:"bg-blue-100 text-blue-700 border-blue-200", cancelled:"bg-red-100 text-red-600 border-red-200" };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar active={active} setActive={setActive} user={user} navigate={navigate} open={sidebarOpen} setOpen={setSidebarOpen} />

      <div className="ml-16 flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-100 px-4 md:px-8 py-4 flex items-center justify-between shrink-0 gap-2">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors border border-gray-200">
                <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-black text-gray-900">
                {active === "overview" && "Dashboard"}
                {active === "staff" && "Staff Management"}
                {active === "coupons" && "Coupons"}
                {active === "banners" && "Banners & Offers"}
                {active === "tax" && "Analytics & Tax"}
              </h1>
              {user.restaurantName && <p className="text-xs text-gray-400 mt-0.5">{user.restaurantName}</p>}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={toggleOpen} disabled={toggling}
              className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                isOpen ? "bg-green-50 border-green-200 text-green-700 hover:bg-green-100" : "bg-red-50 border-red-200 text-red-600 hover:bg-red-100"
              }`}>
              <span className={`w-2 h-2 rounded-full shrink-0 ${isOpen ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
              <span className="hidden sm:inline">{isOpen ? "Open" : "Closed"}</span>
            </button>

            <div className="flex items-center gap-2 pl-3 border-l border-gray-100">
              <div onClick={() => navigate("/profile")} className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-red-400 flex items-center justify-center text-white font-bold text-sm cursor-pointer hover:opacity-80 transition-opacity" title="Edit Profile">
                {(user.name || "A")[0].toUpperCase()}
              </div>
              <div className="mr-2 md:mr-3 hidden sm:block">
                <p className="text-sm font-bold text-gray-900 truncate max-w-[100px] md:max-w-none">{user.name || "Admin"}</p>
                <p className="text-xs text-gray-400">Manager</p>
              </div>
              <div className="pl-3 border-l border-gray-100 flex items-center">
                  <button onClick={() => { localStorage.clear(); navigate("/login"); }} className="text-red-500 hover:text-red-700 font-bold flex items-center gap-1.5 text-sm transition-colors px-2 py-1.5 rounded-lg hover:bg-red-50">
                      <LogOut className="w-4 h-4"/> <span className="hidden md:inline">Sign Out</span>
                  </button>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">

          {/* ── OVERVIEW ── */}
          {active === "overview" && (
            <div className="space-y-8">
              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-5">
                <StatCard label="Total Revenue" value={`₹${(stats.dailyRevenue||0).toFixed(0)}`} sub="vs yesterday" icon={IndianRupee} color="bg-orange-100 text-orange-600" />
                <StatCard label="Active Orders" value={`${stats.dailyOrderCount||0} live`} live icon={ShoppingBag} color="bg-purple-100 text-purple-600" />
                <StatCard label="Menu Items" value={stats.menuCount||0} sub="items available" icon={UtensilsCrossed} color="bg-blue-100 text-blue-600" />
                <StatCard label="Staff Count" value={stats.staffCount||0} sub="team members" icon={Users} color="bg-green-100 text-green-600" />
              </div>

              <div className="grid xl:grid-cols-3 gap-6">
                {/* Weekly Analytics Bar Chart */}
                <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-orange-500" /> Weekly Orders Trend
                    </h2>
                  </div>
                  <div className="flex items-end gap-4 h-56 mt-8 border-b border-gray-100 pb-2 px-2">
                    {[
                      { day: "Mon", val: 40 }, { day: "Tue", val: 30 }, { day: "Wed", val: 55 }, 
                      { day: "Thu", val: 45 }, { day: "Fri", val: 80 }, { day: "Sat", val: 120 }, { day: "Sun", val: 90 }
                    ].map((d, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                        <div className="w-full relative flex justify-center h-full items-end">
                          <span className="absolute -top-6 text-xs font-bold text-gray-400 group-hover:text-orange-500 transition-colors opacity-0 group-hover:opacity-100">{d.val}</span>
                          <motion.div initial={{ height: 0 }} animate={{ height: `${(d.val/120)*100}%` }} transition={{ duration: 0.5, delay: i*0.1 }} className="w-full max-w-[40px] bg-orange-100 group-hover:bg-orange-500 rounded-t-lg transition-colors" />
                        </div>
                        <span className="text-xs font-medium text-gray-500">{d.day}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Sellers + Quick Links */}
                <div className="space-y-5">
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h2 className="text-base font-black text-gray-900 mb-4 flex items-center gap-2">
                      <Star className="w-4 h-4 text-orange-500 fill-orange-500" /> Top Sellers
                    </h2>
                    <div className="space-y-3 text-sm text-gray-600">
                      <p className="text-xs text-gray-400">View in Menu Management</p>
                      <button onClick={() => navigate("/admin/menu")} className="w-full text-left text-orange-500 font-bold text-xs hover:underline">View Full Menu Analytics →</button>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h2 className="text-sm font-black text-gray-900 mb-3">Quick Actions</h2>
                    <div className="space-y-2">
                      {[
                        { label: "🍽️ Kitchen Screen", href: "/orders" },
                        { label: "👥 Staff Screen", href: "/staff-screen" },
                        { label: "📋 Manage Menu", href: "/admin/menu" },
                        { label: "🪑 Manage Tables", href: "/admin/tables" },
                      ].map(q => (
                        <button key={q.href} onClick={() => navigate(q.href)}
                          className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-orange-50 hover:text-orange-600 border border-gray-100 transition-all">
                          {q.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── STAFF ── */}
          {active === "staff" && (
            <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} className="grid lg:grid-cols-3 gap-8">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 h-max">
                <h2 className="text-base font-black text-gray-900 mb-5">Create User</h2>
                <form onSubmit={createStaff} className="space-y-4">
                  <input required className={inp} placeholder="Full Name" value={sName} onChange={e => setSName(e.target.value)} />
                  <input required type="email" className={inp} placeholder="Email" value={sEmail} onChange={e => setSEmail(e.target.value)} />
                  <input required className={inp} placeholder="Password" value={sPass} onChange={e => setSPass(e.target.value)} />
                  <select className={inp} value={sRole} onChange={e => setSRole(e.target.value)}>
                    <option value="staff">Staff (Table Service)</option>
                    <option value="kitchen">Kitchen</option>
                    <option value="delivery">Delivery</option>
                  </select>
                  <button disabled={creating} type="submit" className={btn}>{creating ? "Creating..." : "Create User"}</button>
                </form>
              </div>

              <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-base font-black text-gray-900 mb-5">Team Members</h2>
                <div className="space-y-3">
                  {staff.length === 0 ? <p className="text-gray-400 text-sm text-center py-8">No staff yet.</p> : staff.map(u => (
                    <div key={u._id} className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-orange-200 bg-gray-50 transition-all">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-400 flex items-center justify-center text-white font-bold shrink-0">
                        {(u.name||"U")[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 text-sm">{u.name}</p>
                        <p className="text-xs text-gray-400 truncate">{u.email}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full border capitalize ${
                        u.role==="kitchen"?"bg-orange-100 text-orange-700 border-orange-200":u.role==="delivery"?"bg-purple-100 text-purple-700 border-purple-200":"bg-blue-100 text-blue-700 border-blue-200"
                      }`}>{u.role}</span>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${u.isAvailable!==false?"bg-green-100 text-green-700":"bg-gray-100 text-gray-500"}`}>
                        {u.isAvailable!==false?"🟢 On Duty":"⚫ Off"}
                      </span>
                      <div className="flex gap-1">
                        <button onClick={() => toggleStatus(u._id)} title="Toggle Account" className="p-2 rounded-lg hover:bg-orange-50 text-gray-400 hover:text-orange-500 transition-colors"><Power className="w-4 h-4"/></button>
                        <button onClick={() => changePass(u._id)} title="Change Password" className="p-2 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-500 transition-colors"><Key className="w-4 h-4"/></button>
                        <button onClick={() => deleteStaff(u._id)} title="Remove" className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4"/></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── COUPONS ── */}
          {active === "coupons" && (
            <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} className="grid lg:grid-cols-3 gap-8">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 h-max">
                <h2 className="text-base font-black text-gray-900 mb-5">Create Coupon</h2>
                <form onSubmit={createCoupon} className="space-y-4">
                  <input required className={inp} placeholder="COUPON CODE" value={cCode} onChange={e => setCCode(e.target.value.toUpperCase())} />
                  <input required type="number" min="1" max="100" className={inp} placeholder="Discount (%)" value={cDisc} onChange={e => setCDisc(e.target.value)} />
                  <button disabled={creatingC} type="submit" className={btn}>{creatingC?"Creating...":"Create Coupon"}</button>
                </form>
              </div>
              <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-base font-black text-gray-900 mb-5">Active Coupons</h2>
                <div className="space-y-3">
                  {coupons.length===0 ? <p className="text-gray-400 text-sm text-center py-8">No coupons yet.</p> : coupons.map(c => (
                    <div key={c._id} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50">
                      <div>
                        <p className="font-black text-gray-900 tracking-widest">{c.code}</p>
                        <p className="text-sm text-orange-500 font-bold">{c.discountPercentage}% OFF</p>
                      </div>
                      <button onClick={() => deleteCoupon(c._id)} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4"/></button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── BANNERS & OFFERS ── */}
          {active === "banners" && (
            <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} className="grid lg:grid-cols-2 gap-8">
              
              {/* Promotional Banners */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-base font-black text-gray-900 mb-5 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-orange-500" /> Flash Banners & Posters
                </h2>
                <form onSubmit={e => {
                  e.preventDefault();
                  saveOffers([...banners, { url: bUrl, title: bTitle }], catDiscounts);
                  setBUrl(""); setBTitle("");
                }} className="space-y-4 mb-6">
                  <input required className={inp} placeholder="Image URL (Poster)" value={bUrl} onChange={e => setBUrl(e.target.value)} />
                  <input className={inp} placeholder="Title (Optional)" value={bTitle} onChange={e => setBTitle(e.target.value)} />
                  <button disabled={savingOffers} type="submit" className={btn}>Add Banner</button>
                </form>
                
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {banners.map((b, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50">
                      <img src={b.url} alt="banner" className="w-16 h-12 object-cover rounded-lg" />
                      <div className="flex-1">
                        <p className="font-bold text-sm text-gray-900 truncate">{b.title || "Banner"}</p>
                      </div>
                      <button onClick={() => saveOffers(banners.filter((_, idx) => idx !== i), catDiscounts)} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4"/></button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Category Discounts */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-base font-black text-gray-900 mb-5 flex items-center gap-2">
                  <Star className="w-4 h-4 text-orange-500" /> Category Timed Discounts
                </h2>
                <form onSubmit={e => {
                  e.preventDefault();
                  saveOffers(banners, [...catDiscounts, { category: cdCat, discountPercentage: Number(cdPct), expiresAt: cdExp }]);
                  setCdCat("All"); setCdPct(10); setCdExp("");
                }} className="space-y-4 mb-6">
                  <input required className={inp} placeholder="Category (e.g. Starters)" value={cdCat} onChange={e => setCdCat(e.target.value)} />
                  <div className="flex gap-4">
                    <input required type="number" min="1" max="100" className={inp} placeholder="Discount (%)" value={cdPct} onChange={e => setCdPct(e.target.value)} />
                    <input required type="datetime-local" className={inp} value={cdExp} onChange={e => setCdExp(e.target.value)} />
                  </div>
                  <button disabled={savingOffers} type="submit" className={btn}>Add Discount</button>
                </form>

                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {catDiscounts.map((c, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50">
                      <div>
                        <p className="font-bold text-sm text-gray-900">{c.category}</p>
                        <p className="text-xs text-orange-500 font-bold">{c.discountPercentage}% OFF until {new Date(c.expiresAt).toLocaleString()}</p>
                      </div>
                      <button onClick={() => saveOffers(banners, catDiscounts.filter((_, idx) => idx !== i))} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4"/></button>
                    </div>
                  ))}
                </div>
              </div>

            </motion.div>
          )}

          {/* ── TAX / ANALYTICS ── */}
          {active === "tax" && (
            <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} className="max-w-lg">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-base font-black text-gray-900 mb-5 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-orange-500" /> GST & Tax Settings
                </h2>
                <form onSubmit={async e => {
                  e.preventDefault(); setSavingTax(true);
                  try { await API.put("/restaurant/tax-settings", { gstPercentage: Number(gst), serviceChargePercentage: Number(sc), gstNumber: gstin, categoryGst: { veg: Number(catGst.veg), nonVeg: Number(catGst.nonVeg), drinks: Number(catGst.drinks) } }); toast.success("Saved!"); }
                  catch { toast.error("Failed"); } finally { setSavingTax(false); }
                }} className="space-y-4">
                  <input className={inp} placeholder="GSTIN (e.g. 22AAAAA0000A1Z5)" value={gstin} onChange={e => setGstin(e.target.value)} />
                  <input type="number" min="0" max="100" step="0.5" className={inp} placeholder="Default GST %" value={gst} onChange={e => setGst(e.target.value)} />
                  
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
                    <p className="text-xs font-bold text-gray-900 uppercase">Category Specific GST</p>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Veg (%)</label>
                        <input type="number" className={inp} value={catGst.veg} onChange={e => setCatGst(p => ({...p, veg: e.target.value}))} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Non-Veg (%)</label>
                        <input type="number" className={inp} value={catGst.nonVeg} onChange={e => setCatGst(p => ({...p, nonVeg: e.target.value}))} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Drinks (%)</label>
                        <input type="number" className={inp} value={catGst.drinks} onChange={e => setCatGst(p => ({...p, drinks: e.target.value}))} />
                      </div>
                    </div>
                  </div>

                  <input type="number" min="0" max="100" step="0.5" className={inp} placeholder="Service Charge %" value={sc} onChange={e => setSc(e.target.value)} />
                  <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 text-sm">
                    <p className="font-bold text-gray-900 mb-1">Preview on ₹500 order (Default)</p>
                    <p className="text-gray-600">GST: ₹{((Number(gst)/100)*500).toFixed(2)}</p>
                    <p className="text-gray-600">Service: ₹{((Number(sc)/100)*500).toFixed(2)}</p>
                    <p className="font-black text-gray-900 mt-1">Total: ₹{(500+(Number(gst)/100)*500+(Number(sc)/100)*500).toFixed(2)}</p>
                  </div>
                  <button disabled={savingTax} type="submit" className={btn}>{savingTax?"Saving...":"💾 Save Settings"}</button>
                </form>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
