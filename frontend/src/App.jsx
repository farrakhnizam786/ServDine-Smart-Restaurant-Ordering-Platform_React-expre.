import { Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Login from "./pages/Login";
import Menu from "./pages/Menu";

import AdminDashboard from "./pages/AdminDashboard";
import KitchenScreen from "./pages/KitchenScreen";
import StaffScreen from "./pages/StaffScreen";
import DeliveryStaffScreen from "./pages/DeliveryStaffScreen";
import Register from "./pages/Register";
import NearbyRestaurants from "./pages/NearbyRestaurants";
import OrderTracking from "./pages/OrderTracking";
import ContactUs from "./pages/ContactUs";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import AdminMenu from "./pages/AdminMenu";
import AdminTables from "./pages/AdminTables";
import ProtectedRoute from "./components/ProtectedRoute";
import EditorAdminDashboard from "./pages/EditorAdminDashboard";

import Profile from "./pages/Profile";
import OrderStatusList from "./pages/OrderStatusList";
import OrderHistory from "./pages/OrderHistory";
import Coupons from "./pages/Coupons";
import ShareEarn from "./pages/ShareEarn";
import Language from "./pages/Language";
import AboutUs from "./pages/AboutUs";
import FAQ from "./pages/FAQ";

function App() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 w-full pt-16">
        <Routes>
          <Route path="/" element={<NearbyRestaurants />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/menu/:restaurantId" element={<Menu />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/about-us" element={<AboutUs />} />
          <Route path="/faq" element={<FAQ />} />
          
          <Route path="/profile" element={<ProtectedRoute allowedRoles={["customer"]}><Profile /></ProtectedRoute>} />
          <Route path="/orders/status" element={<ProtectedRoute allowedRoles={["customer"]}><OrderStatusList /></ProtectedRoute>} />
          <Route path="/orders/history" element={<ProtectedRoute allowedRoles={["customer"]}><OrderHistory /></ProtectedRoute>} />
          <Route path="/orders/tracking/:orderId" element={<ProtectedRoute allowedRoles={["customer"]}><OrderTracking /></ProtectedRoute>} />
          <Route path="/coupons" element={<ProtectedRoute allowedRoles={["customer"]}><Coupons /></ProtectedRoute>} />
          <Route path="/share-earn" element={<ProtectedRoute allowedRoles={["customer"]}><ShareEarn /></ProtectedRoute>} />
          <Route path="/language" element={<ProtectedRoute allowedRoles={["customer"]}><Language /></ProtectedRoute>} />

          <Route path="/editoradmin/login" element={<Login />} />
          <Route path="/editoradmin" element={<ProtectedRoute allowedRoles={["editoradmin"]}><EditorAdminDashboard /></ProtectedRoute>} />

          <Route path="/superadmin" element={<ProtectedRoute allowedRoles={["superadmin"]}><SuperAdminDashboard /></ProtectedRoute>} />
          
          <Route path="/admin" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/menu" element={<ProtectedRoute allowedRoles={["admin"]}><AdminMenu /></ProtectedRoute>} />
          <Route path="/admin/tables" element={<ProtectedRoute allowedRoles={["admin"]}><AdminTables /></ProtectedRoute>} />
          
          <Route path="/orders" element={<ProtectedRoute allowedRoles={["admin", "staff", "superadmin", "kitchen"]}><KitchenScreen /></ProtectedRoute>} />
          <Route path="/staff-screen" element={<ProtectedRoute allowedRoles={["admin", "staff", "superadmin"]}><StaffScreen /></ProtectedRoute>} />
          <Route path="/delivery" element={<ProtectedRoute allowedRoles={["admin", "delivery", "superadmin"]}><DeliveryStaffScreen /></ProtectedRoute>} />
        </Routes>
      </main>
      <Footer />
      <ToastContainer theme="dark" position="bottom-right" />
    </div>
  );
}

export default App;