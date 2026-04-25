import { createContext, useState, useContext } from "react";

export const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    // Check local storage for user state on initial load
    const [user, setUser] = useState(() => {
        const token = localStorage.getItem("token");
        if (token) {
            // Ideally decode token or fetch user, but as a mock we return a user object if token exists
            return JSON.parse(localStorage.getItem("user")) || null;
        }
        return null;
    });

    const login = (data) => {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        setUser(data.user);
    };

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};