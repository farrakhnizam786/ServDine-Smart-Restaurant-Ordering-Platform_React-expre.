import { createContext, useState, useContext, useCallback } from "react";

export const AuthContext = createContext(null);

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
    return ctx;
};

function getInitialUser() {
    try {
        const token = localStorage.getItem("token");
        const user = localStorage.getItem("user");
        if (token && user) return JSON.parse(user);
    } catch {
        // corrupted storage
    }
    return null;
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(getInitialUser);

    const login = useCallback((data) => {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        setUser(data.user);
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
    }, []);

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}