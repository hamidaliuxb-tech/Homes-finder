import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api } from "@/lib/apiClient";

const AuthContext = createContext(null);

export function formatApiErrorDetail(detail) {
  if (detail == null) return "Something went wrong. Please try again.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail.map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e))).filter(Boolean).join(" ");
  if (detail && typeof detail.msg === "string") return detail.msg;
  return String(detail);
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const cached = localStorage.getItem("hf_user");
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(() => {
    try {
      return !localStorage.getItem("hf_user") && !!localStorage.getItem("hf_token");
    } catch {
      return false;
    }
  });

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem("hf_token");
    if (!token && !localStorage.getItem("hf_user")) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await api.get("/auth/me");
      setUser(res.data);
      try { localStorage.setItem("hf_user", JSON.stringify(res.data)); } catch {}
    } catch {
      try { localStorage.removeItem("hf_user"); } catch {}
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { checkAuth(); }, [checkAuth]);

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    if (res.data?.token) {
      try {
        localStorage.setItem("hf_token", res.data.token);
        localStorage.setItem("hf_user", JSON.stringify(res.data));
      } catch {}
    }
    setUser(res.data);
    return res.data;
  };

  const logout = async () => {
    try {
      localStorage.removeItem("hf_token");
      localStorage.removeItem("hf_user");
    } catch {}
    try { await api.post("/auth/logout"); } catch {}
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, checkAuth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
