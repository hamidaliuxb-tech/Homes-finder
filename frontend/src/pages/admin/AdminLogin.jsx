import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ShieldCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, formatApiErrorDetail } from "@/context/AuthContext";

export default function AdminLogin() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user?.role === "admin") navigate("/admin");
  }, [user, loading, navigate]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const u = await login(email.trim(), password);
      if (u.role === "admin") navigate("/admin");
      else setError("This account does not have admin access.");
    } catch (err) {
      setError(formatApiErrorDetail(err.response?.data?.detail) || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4" data-testid="admin-login-page">
      <div className="w-full max-w-md bg-slate-900 border border-amber-500/20 rounded-2xl p-8 text-center">
        <Link to="/" className="inline-flex items-center gap-2 mb-6">
          <img src="/homes-finder-icon.png" alt="Homes Finder" className="h-9 w-auto" />
          <span className="font-serif text-2xl font-bold text-white">Homes Finder</span>
        </Link>
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
          <ShieldCheck className="h-7 w-7 text-amber-400" />
        </div>
        <h1 className="font-serif text-2xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-slate-400 text-sm mt-2 mb-6">Sign in with your admin credentials to manage properties, leads and website content.</p>

        <form onSubmit={submit} className="space-y-4 text-left">
          <div>
            <Label className="text-slate-300">Email</Label>
            <Input data-testid="admin-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" className="mt-1.5 h-11 bg-slate-800 border-slate-700 text-white" required />
          </div>
          <div>
            <Label className="text-slate-300">Password</Label>
            <Input data-testid="admin-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="mt-1.5 h-11 bg-slate-800 border-slate-700 text-white" required />
          </div>
          {error && <p className="text-red-400 text-sm" data-testid="login-error">{error}</p>}
          <Button type="submit" disabled={submitting} data-testid="admin-login-btn" className="w-full h-12 bg-amber-500 text-slate-950 hover:bg-amber-400 font-semibold">
            {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign In"}
          </Button>
        </form>

        <Link to="/" className="block mt-6 text-sm text-slate-500 hover:text-amber-400">← Back to website</Link>
      </div>
    </div>
  );
}
