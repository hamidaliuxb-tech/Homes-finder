import React, { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/apiClient";
import { useAuth } from "@/context/AuthContext";

export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuth();
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;
    const hash = location.hash || window.location.hash;
    const match = hash.match(/session_id=([^&]+)/);
    const sessionId = match ? match[1] : null;
    if (!sessionId) { navigate("/admin/login"); return; }

    (async () => {
      try {
        const res = await api.post("/auth/session", { session_id: sessionId });
        if (res.data?.session_token) {
          localStorage.setItem("session_token", res.data.session_token);
        }
        setUser(res.data);
        window.history.replaceState(null, "", "/admin");
        if (res.data.role === "admin") navigate("/admin", { state: { user: res.data } });
        else navigate("/admin/login?denied=1");
      } catch {
        navigate("/admin/login?error=1");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
      <div className="text-center">
        <Loader2 className="h-10 w-10 animate-spin text-amber-400 mx-auto" />
        <p className="mt-4 text-slate-300">Signing you in…</p>
      </div>
    </div>
  );
}
