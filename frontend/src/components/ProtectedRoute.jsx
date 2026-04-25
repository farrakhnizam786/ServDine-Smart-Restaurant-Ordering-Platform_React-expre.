import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute({ children, allowedRoles }) {
    const { user } = useAuth();

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Redirect to appropriate dashboard or home based on role
        if (user.role === 'customer') return <Navigate to="/" replace />;
        if (user.role === 'admin') return <Navigate to="/admin" replace />;
        if (user.role === 'superadmin') return <Navigate to="/superadmin" replace />;
        if (user.role === 'editoradmin') return <Navigate to="/editoradmin" replace />;
        if (user.role === 'staff') return <Navigate to="/staff-screen" replace />;
        if (user.role === 'kitchen') return <Navigate to="/orders" replace />;
        return <Navigate to="/" replace />;
    }

    return children;
}

export default ProtectedRoute;
