import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ShieldCheck, Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, formatApiErrorDetail } from "@/context/AuthContext";

export default function AdminLogin() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [forgot, setForgot] = useState(false);
  const [resetSent, setResetSent] = useState(false);

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

  const sendAdminReset = async (e) => {
    if (e) e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError("Please enter your admin email address");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const res = await api.post("/auth/forgot-password", { email: cleanEmail });
      setResetSent(true);
    } catch (err) {
      setError(formatApiErrorDetail(err.response?.data?.detail) || "Failed to send reset link");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-10" data-testid="admin-login-page">
      <div className="w-full max-w-md bg-slate-900 border border-amber-500/20 rounded-2xl p-8 text-center">
        <Link to="/" className="inline-flex items-center gap-2.5 mb-6 group text-left">
          <img src="/homes-finder-icon.png" alt="Homes Finder" className="h-8 w-auto object-contain" />
          <div className="leading-none">
            <span className="font-serif text-xl font-bold text-white block">Homes Finder</span>
            <span className="block text-[8.5px] sm:text-[9px] font-semibold tracking-[0.14em] text-amber-400 uppercase mt-0.5">Find it · Love it · Live it</span>
          </div>
        </Link>
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
          <ShieldCheck className="h-7 w-7 text-amber-400" />
        </div>
        <h1 className="font-serif text-2xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-slate-400 text-sm mt-2 mb-6">
          {forgot ? "Enter your admin email to receive a password reset link." : "Sign in with your admin credentials to manage properties, leads and website content."}
        </p>

        {resetSent ? (
          <div className="text-center py-2 space-y-4">
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 text-left space-y-1">
              <div className="font-semibold text-white text-sm mb-1">Reset Link Sent</div>
              <div>If an admin account exists with <strong className="text-white">{email}</strong>, a password reset link has been dispatched.</div>
              <div>• Check your inbox and spam folder.</div>
              <div>• Link is valid for 2 hours.</div>
            </div>
            <div className="space-y-2">
              <Button
                type="button"
                onClick={() => { setResetSent(false); setForgot(false); }}
                className="w-full h-11 bg-amber-500 text-slate-950 hover:bg-amber-400 font-semibold"
              >
                Return to Admin Sign In
              </Button>
              <button
                type="button"
                onClick={sendAdminReset}
                disabled={submitting}
                className="text-xs text-amber-400 hover:underline pt-1 block mx-auto"
              >
                Didn't receive email? Click to resend
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={forgot ? sendAdminReset : submit} className="space-y-4 text-left">
            <div>
              <Label className="text-slate-300">Admin Email</Label>
              <Input data-testid="admin-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="hamid.a@homesfinder.ae" className="mt-1.5 h-11 bg-slate-800 border-slate-700 text-white" required />
            </div>
            {!forgot && (
              <div>
                <Label className="text-slate-300">Password</Label>
                <div className="relative mt-1.5">
                  <Input
                    data-testid="admin-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-11 bg-slate-800 border-slate-700 text-white pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}
            {error && <p className="text-red-400 text-sm" data-testid="login-error">{error}</p>}
            <Button type="submit" disabled={submitting} data-testid="admin-login-btn" className="w-full h-12 bg-amber-500 text-slate-950 hover:bg-amber-400 font-semibold">
              {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : forgot ? "Send Reset Link" : "Sign In"}
            </Button>

            <div className="pt-2 text-center text-sm">
              <button
                type="button"
                onClick={() => { setForgot(!forgot); setError(""); }}
                className="text-xs text-amber-400 hover:underline"
              >
                {forgot ? "← Back to admin sign in" : "Forgot Password?"}
              </button>
            </div>
          </form>
        )}

        <Link to="/" className="block mt-6 text-sm text-slate-500 hover:text-amber-400">← Back to website</Link>
      </div>
    </div>
  );
}
