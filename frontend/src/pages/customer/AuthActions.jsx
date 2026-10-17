import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2, Eye, EyeOff, ShieldCheck, KeyRound, AlertCircle } from "lucide-react";
import { api } from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import SEO from "@/components/SEO";

export function VerifyEmail() {
  const [params] = useSearchParams();
  const [state, setState] = useState("loading");

  useEffect(() => {
    const token = params.get("token");
    if (!token) { setState("error"); return; }
    api.post("/auth/verify-email", { token })
      .then(() => setState("ok"))
      .catch(() => setState("error"));
  }, [params]);

  return (
    <Shell>
      <SEO title="Verify Email | Homes Finder" description="Verify your email address to activate your Homes Finder account." path="/verify-email" />
      {state === "loading" && (
        <div className="py-8">
          <Loader2 className="h-10 w-10 animate-spin text-amber-400 mx-auto" />
          <p className="text-slate-400 mt-4 text-sm">Verifying your email address…</p>
        </div>
      )}
      {state === "ok" && (
        <div className="py-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-8 w-8 text-emerald-400" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-white">Email Verified</h1>
          <p className="text-slate-400 text-sm mt-2">Your HomesFinder account is now active and ready to use.</p>
          <Link to="/login">
            <Button className="mt-6 w-full h-11 bg-amber-500 text-slate-950 hover:bg-amber-400 font-semibold">
              Sign In to Dashboard
            </Button>
          </Link>
        </div>
      )}
      {state === "error" && (
        <div className="py-4">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <XCircle className="h-8 w-8 text-red-400" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-white">Verification Failed</h1>
          <p className="text-slate-400 text-sm mt-2">This verification link is invalid or has already expired.</p>
          <div className="flex gap-2 mt-6">
            <Link to="/login" className="flex-1">
              <Button variant="outline" className="w-full border-slate-700 text-white hover:bg-slate-800">Sign In</Button>
            </Link>
            <Link to="/register" className="flex-1">
              <Button className="w-full bg-amber-500 text-slate-950 hover:bg-amber-400 font-semibold">Create Account</Button>
            </Link>
          </div>
        </div>
      )}
    </Shell>
  );
}

export function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";

  const [tokenStatus, setTokenStatus] = useState("checking"); // "checking" | "valid" | "invalid"
  const [tokenError, setTokenError] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) {
      setTokenStatus("invalid");
      setTokenError("No password reset token was provided in the link. Please request a new link.");
      return;
    }
    // Verify token validity with backend
    api.get(`/auth/verify-reset-token?token=${encodeURIComponent(token)}`)
      .then(() => {
        setTokenStatus("valid");
      })
      .catch((err) => {
        setTokenStatus("invalid");
        setTokenError(err.response?.data?.detail || "This password reset link is invalid or has expired.");
      });
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      toast.error("Password must be at least 8 characters and include a letter and a number");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, password });
      setDone(true);
      toast.success("Password has been reset successfully!");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Shell>
      <SEO title="Reset Password | Homes Finder" description="Set a new password for your Homes Finder account." path="/reset-password" />

      {done ? (
        <div className="py-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-8 w-8 text-emerald-400" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-white">Password Reset Successful</h1>
          <p className="text-slate-400 text-sm mt-2">Your password has been securely updated. You can now sign in with your new credentials.</p>
          <Link to="/login" className="block mt-6">
            <Button className="w-full h-12 bg-amber-500 text-slate-950 hover:bg-amber-400 font-semibold" data-testid="reset-success-signin">
              Sign In to Your Account
            </Button>
          </Link>
        </div>
      ) : tokenStatus === "checking" ? (
        <div className="py-8">
          <Loader2 className="h-10 w-10 animate-spin text-amber-400 mx-auto" />
          <p className="text-slate-400 mt-4 text-sm">Verifying reset link…</p>
        </div>
      ) : tokenStatus === "invalid" ? (
        <div className="py-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <XCircle className="h-8 w-8 text-red-400" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-white">Invalid or Expired Link</h1>
          <p className="text-slate-400 text-sm mt-2">{tokenError}</p>
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 mt-4 text-left">
            Password reset links expire after 2 hours for your security. Please request a fresh reset link from the sign-in page.
          </div>
          <Link to="/login" className="block mt-6">
            <Button className="w-full h-11 bg-amber-500 text-slate-950 hover:bg-amber-400 font-semibold">
              Back to Sign In
            </Button>
          </Link>
        </div>
      ) : (
        <div className="text-left">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-3">
            <KeyRound className="h-6 w-6 text-amber-400" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-white text-center">Set a New Password</h1>
          <p className="text-slate-400 text-sm text-center mt-1 mb-6">Choose a strong password for your Homes Finder account.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-slate-300 text-sm">New Password</Label>
              <div className="relative mt-1.5">
                <Input
                  data-testid="new-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters with letter & number"
                  className="h-11 bg-slate-800 border-slate-700 text-white pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <Label className="text-slate-300 text-sm">Confirm New Password</Label>
              <div className="relative mt-1.5">
                <Input
                  data-testid="confirm-password"
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your new password"
                  className="h-11 bg-slate-800 border-slate-700 text-white pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="text-xs text-slate-400 space-y-1 pt-1">
              <div className={`flex items-center gap-1.5 ${password.length >= 8 ? "text-emerald-400" : ""}`}>
                <span>•</span> At least 8 characters long
              </div>
              <div className={`flex items-center gap-1.5 ${/[A-Za-z]/.test(password) && /\d/.test(password) ? "text-emerald-400" : ""}`}>
                <span>•</span> Contains both letters and numbers
              </div>
              {password && confirmPassword && (
                <div className={`flex items-center gap-1.5 ${password === confirmPassword ? "text-emerald-400" : "text-red-400"}`}>
                  <span>•</span> {password === confirmPassword ? "Passwords match" : "Passwords do not match"}
                </div>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading || !password || !confirmPassword || password !== confirmPassword}
              data-testid="reset-submit-btn"
              className="w-full mt-4 h-12 bg-amber-500 text-slate-950 hover:bg-amber-400 font-semibold disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Save New Password"}
            </Button>
          </form>

          <Link to="/login" className="block text-center text-sm text-slate-400 hover:text-amber-400 mt-6">
            ← Back to Sign In
          </Link>
        </div>
      )}
    </Shell>
  );
}

const Shell = ({ children }) => (
  <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-10">
    <div className="w-full max-w-md bg-slate-900 border border-amber-500/20 rounded-2xl p-6 sm:p-8 text-center">
      <Link to="/" className="inline-flex items-center justify-center gap-2.5 mb-6 group text-left">
        <img src="/homes-finder-icon.png" alt="Homes Finder" className="h-8 w-auto object-contain" />
        <div className="leading-none">
          <span className="font-serif text-xl font-bold text-white block">Homes Finder</span>
          <span className="block text-[8.5px] sm:text-[9px] font-semibold tracking-[0.14em] text-amber-400 uppercase mt-0.5">Find it · Love it · Live it</span>
        </div>
      </Link>
      {children}
    </div>
  </div>
);
