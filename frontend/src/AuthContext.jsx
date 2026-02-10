import { createContext, useContext, useState, useEffect } from "react";
import { api } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const stored = localStorage.getItem("cc_session");
        if (stored) {
            try { setUser(JSON.parse(stored)); } catch { /* invalid */ }
        }
        setLoading(false);
    }, []);

    async function login(username, password) {
        const res = await api("/auth/login", {
            method: "POST",
            body: JSON.stringify({ username, password }),
        });
        const session = {
            username: res.user.username,
            role: res.user.role,
            name: res.user.firstName || res.user.username,
            token: res.token,
        };
        localStorage.setItem("cc_session", JSON.stringify(session));
        setUser(session);
        return session;
    }

    function logout() {
        localStorage.removeItem("cc_session");
        setUser(null);
    }

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
