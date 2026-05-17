import { useState, useEffect, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { motion, useMotionValue, useSpring, AnimatePresence } from "framer-motion";
import { QrCode, Smartphone, Zap, Star, ArrowRight, ChefHat, Truck, Bell, CheckCircle, Play, Users, TrendingUp, Shield } from "lucide-react";
import logo from "../assets/logo.png";

const FEATURES = [
  { icon: QrCode, title: "QR & NFC Ordering", desc: "Customers scan & order instantly. No app download needed.", color: "from-orange-500 to-red-500", emoji: "📱" },
  { icon: Zap, title: "Realtime Kitchen", desc: "Orders hit the kitchen screen the instant they're placed.", color: "from-yellow-500 to-orange-500", emoji: "⚡" },
  { icon: Truck, title: "Live Order Tracking", desc: "Customers track every step from kitchen to table.", color: "from-green-500 to-teal-500", emoji: "🛵" },
  { icon: Bell, title: "Instant Notifications", desc: "Staff alerts, order updates and table calls in real-time.", color: "from-blue-500 to-purple-500", emoji: "🔔" },
  { icon: Shield, title: "Multi-Tenant SaaS", desc: "Each restaurant gets its own isolated, secure environment.", color: "from-purple-500 to-pink-500", emoji: "🏢" },
  { icon: TrendingUp, title: "Smart Analytics", desc: "Revenue trends, popular items, and daily insights.", color: "from-cyan-500 to-blue-500", emoji: "📊" },
];

const STEPS = [
  { n: "01", title: "Find a Table", desc: "Discover nearby restaurants and book your table instantly." },
  { n: "02", title: "Scan / Tap to Order", desc: "Use the QR code on the table or NFC tap to browse the menu." },
  { n: "03", title: "Enjoy Your Meal", desc: "Track your order live and get notified when it's ready." },
];

const REVIEWS = [
  { name: "Rahul S.", text: "The QR ordering is seamless. No waiting, no paper menus!", stars: 5 },
  { name: "Priya M.", text: "Loved the realtime tracking. I knew exactly when my food was coming.", stars: 5 },
  { name: "Amit K.", text: "As a restaurant owner, the kitchen screen changed everything.", stars: 5 },
];

// Animated floating food emoji
function FloatEmoji({ emoji, x, y, delay }) {
  return (
    <motion.div
      className="absolute text-4xl select-none pointer-events-none"
      style={{ left: x, top: y }}
      animate={{ y: [-12, 12, -12], rotate: [-8, 8, -8], opacity: [0.5, 0.8, 0.5] }}
      transition={{ duration: 5, repeat: Infinity, delay, ease: "easeInOut" }}
    >
      {emoji}
    </motion.div>
  );
}

// Animated order status pill
function LiveOrderPill({ label, status, delay }) {
  const colors = { preparing: "bg-yellow-100 text-yellow-700 border-yellow-200", ready: "bg-green-100 text-green-700 border-green-200", delivered: "bg-blue-100 text-blue-700 border-blue-200" };
  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.5 }}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border bg-white shadow-sm ${colors[status]}`}
    >
      <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
      <span className="font-semibold text-sm">{label}</span>
      <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full border capitalize ${colors[status]}`}>{status}</span>
    </motion.div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 60, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 60, damping: 20 });
  const heroRef = useRef(null);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setCurrentStep(s => (s + 1) % 3), 2500);
    return () => clearInterval(t);
  }, []);

  const handleMouseMove = (e) => {
    const rect = heroRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set(((e.clientX - rect.left) / rect.width - 0.5) * 30);
    mouseY.set(((e.clientY - rect.top) / rect.height - 0.5) * 30);
  };

  return (
    <div className="min-h-screen bg-white overflow-x-hidden font-sans">

      {/* ── NAVBAR ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <img src={logo} alt="ServDine" className="h-9 w-auto" />
            <span className="text-xl font-black text-gray-900">Serv<span className="text-orange-500">Dine</span></span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <a href="#features" className="hover:text-orange-500 transition-colors">Features</a>
            <a href="#how" className="hover:text-orange-500 transition-colors">How it works</a>
            <a href="#reviews" className="hover:text-orange-500 transition-colors">Reviews</a>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <button onClick={() => {
                  const r = user.role;
                  if(r==='admin') navigate('/admin');
                  else if(r==='staff') navigate('/staff-screen');
                  else if(r==='kitchen') navigate('/orders');
                  else if(r==='delivery') navigate('/delivery');
                  else if(r==='superadmin') navigate('/superadmin');
                  else if(r==='editoradmin') navigate('/editoradmin');
                  else navigate('/restaurants');
              }} className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-5 py-2 rounded-full text-sm transition-all shadow-lg shadow-orange-500/30">
                Go to Dashboard →
              </button>
            ) : (
              <>
                <button onClick={() => navigate("/login")} className="text-gray-700 font-semibold text-sm hover:text-orange-500 transition-colors">Sign In</button>
                <button onClick={() => navigate("/register")} className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-5 py-2 rounded-full text-sm transition-all shadow-lg shadow-orange-500/30">
                  Get Started →
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section
        ref={heroRef}
        onMouseMove={handleMouseMove}
        className="relative min-h-screen flex items-center justify-center pt-20 pb-12 overflow-hidden bg-gradient-to-br from-orange-50 via-white to-red-50"
      >
        {/* bg blobs */}
        <motion.div style={{ x: springX, y: springY }} className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-96 h-96 bg-orange-400/20 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-red-400/15 rounded-full blur-3xl" />
        </motion.div>

        {/* floating food emojis */}
        <FloatEmoji emoji="🍔" x="8%" y="20%" delay={0} />
        <FloatEmoji emoji="🍕" x="85%" y="15%" delay={0.5} />
        <FloatEmoji emoji="🍜" x="75%" y="65%" delay={1} />
        <FloatEmoji emoji="🌮" x="12%" y="70%" delay={1.5} />
        <FloatEmoji emoji="🍣" x="50%" y="8%" delay={2} />

        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center relative z-10">
          {/* left */}
          <div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 bg-orange-100 text-orange-600 px-4 py-2 rounded-full text-sm font-bold mb-6 border border-orange-200">
              <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" /> Transforming Dining — NFC & QR Powered
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="text-5xl md:text-6xl lg:text-7xl font-black text-gray-900 leading-tight mb-6">
              The Future of<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500">Smart Dining</span><br />
              is Here.
            </motion.h1>

            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="text-xl text-gray-500 mb-10 leading-relaxed max-w-lg">
              Seamless ordering, real-time tracking, and affordable restaurant management powered by next-gen NFC and QR technology.
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="flex flex-wrap gap-4">
              <button onClick={() => {
                  if (user) {
                      const r = user.role;
                      if(r==='admin') navigate('/admin');
                      else if(r==='staff') navigate('/staff-screen');
                      else if(r==='kitchen') navigate('/orders');
                      else if(r==='delivery') navigate('/delivery');
                      else if(r==='superadmin') navigate('/superadmin');
                      else if(r==='editoradmin') navigate('/editoradmin');
                      else navigate('/restaurants');
                  } else {
                      navigate("/restaurants");
                  }
              }}
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-4 rounded-2xl text-lg transition-all shadow-xl shadow-orange-500/40 hover:scale-105 active:scale-95">
                {user && user.role !== 'customer' ? 'Go to Dashboard' : 'Explore Menu'} <ArrowRight className="w-5 h-5" />
              </button>
              {!user && (
                  <button onClick={() => navigate("/login")}
                    className="flex items-center gap-2 bg-white border-2 border-gray-200 text-gray-700 font-bold px-8 py-4 rounded-2xl text-lg hover:border-orange-500 hover:text-orange-500 transition-all">
                    For Restaurants
                  </button>
              )}
            </motion.div>

            {/* social proof */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
              className="flex items-center gap-6 mt-10">
              <div className="flex -space-x-3">
                {["🧑", "👩", "👨", "🧑‍🍳"].map((e, i) => (
                  <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-400 border-2 border-white flex items-center justify-center text-lg">{e}</div>
                ))}
              </div>
              <div>
                <div className="flex text-yellow-400">{[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-current" />)}</div>
                <p className="text-gray-500 text-sm mt-0.5">Loved by 500+ diners & restaurant owners</p>
              </div>
            </motion.div>
          </div>

          {/* right — animated dashboard mockup */}
          <motion.div initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }}
            style={{ rotateX: springY, rotateY: springX }}
            className="relative">
            <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden p-6">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-3 h-3 bg-red-400 rounded-full" /><div className="w-3 h-3 bg-yellow-400 rounded-full" /><div className="w-3 h-3 bg-green-400 rounded-full" />
                <span className="ml-3 text-xs font-bold text-gray-400 uppercase tracking-widest">Live Order Tracking</span>
                <span className="ml-auto flex items-center gap-1 text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> LIVE
                </span>
              </div>

              <div className="space-y-3">
                <LiveOrderPill label="Table 4 — Grilled Salmon" status="preparing" delay={0.5} />
                <LiveOrderPill label="Table 12 — Wagyu Sliders" status="ready" delay={0.8} />
                <LiveOrderPill label="Table 7 — Ribeye Steak" status="delivered" delay={1.1} />
              </div>

              {/* QR scan animation */}
              <div className="mt-5 bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-5 flex items-center gap-4 border border-orange-100">
                <motion.div
                  animate={{ scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-16 h-16 bg-orange-500 rounded-xl flex items-center justify-center text-white flex-shrink-0">
                  <QrCode className="w-9 h-9" />
                </motion.div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">QR Code Ordering</p>
                  <p className="text-gray-500 text-xs mt-1">Scan to instantly access menu & order</p>
                  <motion.div
                    animate={{ width: ["0%", "100%", "0%"] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="h-1 bg-orange-500 rounded-full mt-2" />
                </div>
              </div>

              {/* revenue bar */}
              <div className="mt-4 grid grid-cols-3 gap-3">
                {[{ label: "Revenue", val: "₹12.4K", up: true }, { label: "Orders", val: "18 Live", live: true }, { label: "Satisfaction", val: "4.8/5" }].map((s, i) => (
                  <div key={i} className={`rounded-xl p-3 text-center ${s.live ? 'bg-orange-500 text-white' : 'bg-gray-50'}`}>
                    <p className={`text-lg font-black ${s.live ? 'text-white' : 'text-gray-900'}`}>{s.val}</p>
                    <p className={`text-xs mt-0.5 ${s.live ? 'text-orange-100' : 'text-gray-500'}`}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* floating badge */}
            <motion.div
              animate={{ y: [-8, 0, -8] }} transition={{ duration: 3, repeat: Infinity }}
              className="absolute -top-4 -right-4 bg-orange-500 text-white font-bold px-4 py-2 rounded-2xl shadow-xl text-sm">
              🔥 Order Placed!
            </motion.div>
            <motion.div
              animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, delay: 1 }}
              className="absolute -bottom-4 -left-4 bg-green-500 text-white font-bold px-4 py-2 rounded-2xl shadow-xl text-sm">
              ✅ Ready to Serve
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-orange-500 font-bold text-sm uppercase tracking-widest">Why ServDine</span>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mt-3">Everything your restaurant needs</h2>
            <p className="text-gray-500 mt-4 text-lg max-w-2xl mx-auto">One platform to manage orders, staff, tables and customer experience — all in realtime.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURES.map((f, i) => (
              <motion.div key={f.title}
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                whileHover={{ y: -6, scale: 1.02 }}
                className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all cursor-default group">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center text-2xl mb-5 group-hover:scale-110 transition-transform`}>
                  {f.emoji}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-500 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" className="py-24 bg-gradient-to-br from-gray-950 to-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-orange-400 font-bold text-sm uppercase tracking-widest">Simple Process</span>
            <h2 className="text-4xl md:text-5xl font-black mt-3">Experience Dining in 3 Steps</h2>
            <p className="text-gray-400 mt-4 text-lg">Scan, tap, and enjoy. That's it.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {STEPS.map((s, i) => (
              <motion.div key={s.n}
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                className="relative bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm">
                <div className="text-6xl font-black text-orange-500/30 mb-4">{s.n}</div>
                <h3 className="text-2xl font-bold text-white mb-3">{s.title}</h3>
                <p className="text-gray-400 leading-relaxed">{s.desc}</p>
                {i < 2 && <div className="hidden md:block absolute top-1/2 -right-4 text-gray-600 text-2xl z-10">→</div>}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── REVIEWS ── */}
      <section id="reviews" className="py-24 bg-orange-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-orange-500 font-bold text-sm uppercase tracking-widest">Testimonials</span>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mt-3">Loved by Diners & Owners</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {REVIEWS.map((r, i) => (
              <motion.div key={r.name}
                initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="bg-white rounded-3xl p-8 shadow-sm border border-orange-100">
                <div className="flex text-yellow-400 mb-4">{[...Array(r.stars)].map((_, j) => <Star key={j} className="w-5 h-5 fill-current" />)}</div>
                <p className="text-gray-700 text-lg leading-relaxed mb-6">"{r.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-400 flex items-center justify-center text-white font-bold">{r.name[0]}</div>
                  <span className="font-bold text-gray-900">{r.name}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 bg-gradient-to-r from-orange-500 to-red-500 text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-4xl md:text-6xl font-black mb-6">
            Ready to transform your restaurant?
          </motion.h2>
          <p className="text-orange-100 text-xl mb-10">Join hundreds of restaurants already using ServDine.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            {!user && (
                <button onClick={() => navigate("/register")}
                  className="bg-white text-orange-500 font-black px-10 py-4 rounded-2xl text-lg hover:scale-105 transition-all shadow-xl">
                  Start Free →
                </button>
            )}
            <button onClick={() => navigate("/restaurants")}
              className="border-2 border-white text-white font-bold px-10 py-4 rounded-2xl text-lg hover:bg-white/10 transition-all">
              Browse Restaurants
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-gray-950 text-gray-400 py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <img src={logo} alt="ServDine" className="h-8 w-auto" />
            <span className="font-black text-white text-lg">Serv<span className="text-orange-500">Dine</span></span>
          </div>
          <p className="text-sm">© {new Date().getFullYear()} ServDine Technologies. All rights reserved.</p>
          <div className="flex gap-6 text-sm">
            <a href="#" className="hover:text-orange-400 transition-colors">Privacy</a>
            <a href="#" className="hover:text-orange-400 transition-colors">Terms</a>
            <a href="#" className="hover:text-orange-400 transition-colors">Contact Us</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
