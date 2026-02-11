import { createContext, useContext, useState, useEffect } from "react";
import { loginUser } from "./api";

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
        const userData = await loginUser(username, password);
        const session = {
            username: userData.username,
            role: userData.role,
            name: userData.name,
            token: userData.token,
        };
        localStorage.setItem("cc_session", JSON.stringify(session));
        setUser(session);
        return session;
    }

    function logout() {
        localStorage.removeItem("cc_session");
        setUser(null);
    }

    function updateUser(updates) {
        setUser((prev) => {
            const updated = { ...prev, ...updates };
            localStorage.setItem("cc_session", JSON.stringify(updated));
            return updated;
        });
    }

    return (
        <AuthContext.Provider value={{ user, login, logout, updateUser, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
