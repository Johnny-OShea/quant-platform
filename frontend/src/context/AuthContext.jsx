import { createContext, useContext, useMemo, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        try { return JSON.parse(localStorage.getItem("authUser") || "null"); }
        catch { return null; }
    });

    const signIn = (u) => {
        setUser(u);
        localStorage.setItem("authUser", JSON.stringify(u));
    };
    const signOut = () => {
        setUser(null);
        localStorage.removeItem("authUser");
    };

    const updateUser = (patch) => {
        setUser(prev => {
            const next = { ...(prev || {}), ...(patch || {}) };
            try { localStorage.setItem("authUser", JSON.stringify(next)); } catch {}
            return next;
        });
    };

    const value = useMemo(() => ({ user, isAuthed: !!user, signIn, signOut, updateUser }), [user]);
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    return useContext(AuthContext);
}
