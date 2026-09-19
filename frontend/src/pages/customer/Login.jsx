import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Building2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, formatApiErrorDetail } from "@/context/AuthContext";
import { api } from "@/lib/apiClient";
import SEO from "@/components/SEO";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgot, setForgot] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const u = await login(email.trim(), password);
      toast.success("Welcome back!");
      navigate(u.role === "admin" ? "/admin" : "/dashboard");
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || "Login failed");
    } finally { setLoading(false); }
  };

  const sendReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email: email.trim() });
      toast.success("If an account exists, a reset link has been sent to your email.");
      setForgot(false);
    } catch { toast.error("Something went wrong"); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-10" data-testid="login-page">
      <SEO title="Sign In | Homes Finder" description="Sign in to your Homes Finder account to list and manage your properties." path="/login" />
      <div className="w-full max-w-md bg-slate-900 border border-amber-500/20 rounded-2xl p-8">
        <Link to="/" className="flex items-center justify-center gap-2 mb-6">
          <img src="/homes-finder-icon.png" alt="Homes Finder" className="h-9 w-auto" />
          <span className="font-serif text-2xl font-bold text-white">Homes Finder</span>
        </Link>
        <h1 className="font-serif text-2xl font-bold text-white text-center">{forgot ? "Reset Your Password" : "Sign In"}</h1>
        <p className="text-slate-400 text-sm text-center mt-2 mb-6">{forgot ? "Enter your email to receive a reset link." : "Access your dashboard to list and manage properties."}</p>

        <form onSubmit={forgot ? sendReset : submit} className="space-y-4">
          <div>
            <Label className="text-slate-300">Email</Label>
            <Input data-testid="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5 h-11 bg-slate-800 border-slate-700 text-white" required />
          </div>
          {!forgot && (
            <div>
              <Label className="text-slate-300">Password</Label>
              <Input data-testid="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1.5 h-11 bg-slate-800 border-slate-700 text-white" required />
            </div>
          )}
          <Button type="submit" disabled={loading} data-testid="login-submit" className="w-full h-12 bg-amber-500 text-slate-950 hover:bg-amber-400 font-semibold">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : forgot ? "Send Reset Link" : "Sign In"}
          </Button>
        </form>

        <div className="mt-5 flex items-center justify-between text-sm">
          <button onClick={() => setForgot(!forgot)} className="text-amber-400 hover:underline" data-testid="forgot-toggle">
            {forgot ? "← Back to sign in" : "Forgot Password?"}
          </button>
          <Link to="/register" className="text-slate-300 hover:text-amber-400" data-testid="to-register">Create Account</Link>
        </div>
        <Link to="/" className="block mt-6 text-center text-sm text-slate-500 hover:text-amber-400">← Back to website</Link>
      </div>
    </div>
  );
}
