import React, { useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Turnstile from "@/components/Turnstile";
import SEO from "@/components/SEO";
import { useAuth, formatApiErrorDetail } from "@/context/AuthContext";
import { api } from "@/lib/apiClient";
import { EMIRATES } from "@/data/site";

const USER_TYPES = ["Property Owner", "Landlord", "Seller", "Agent / Broker", "Investor", "Tenant", "Other"];

export default function Register() {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [f, setF] = useState({ name: "", email: "", mobile: "", country: "United Arab Emirates", emirate: "Dubai",
    location: "", password: "", confirm: "", company: "", user_type: "Property Owner", preferred_contact: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [consent, setConsent] = useState(false);
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const onToken = useCallback((t) => setToken(t), []);

  const submit = async (e) => {
    e.preventDefault();
    if (f.password !== f.confirm) { toast.error("Passwords do not match"); return; }
    if (f.password.length < 8 || !/[A-Za-z]/.test(f.password) || !/\d/.test(f.password)) {
      toast.error("Password must be at least 8 characters with a letter and a number"); return;
    }
    if (!token) { toast.error("Please complete the anti-bot verification"); return; }
    setLoading(true);
    try {
      const res = await api.post("/auth/register", {
        name: f.name, email: f.email, mobile: f.mobile, country: f.country, emirate: f.emirate,
        location: f.location, password: f.password, company: f.company, user_type: f.user_type,
        preferred_contact: f.preferred_contact, consent, turnstile_token: token,
      });
      setUser(res.data);
      toast.success("Account created! Welcome to Homes Finder.");
      navigate("/dashboard");
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || "Registration failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10" data-testid="register-page">
      <SEO title="Create Your HomesFinder Account | Register" description="Register with HomesFinder to list, manage and track your properties across the UAE." path="/register" />
      <div className="w-full max-w-2xl mx-auto bg-slate-900 border border-amber-500/20 rounded-2xl p-6 sm:p-8">
        <Link to="/" className="flex items-center justify-center gap-2 mb-5">
          <img src="/homes-finder-icon.png" alt="Homes Finder" className="h-9 w-auto" />
          <span className="font-serif text-2xl font-bold text-white">Homes Finder</span>
        </Link>
        <h1 className="font-serif text-3xl font-bold text-white text-center">Create Your HomesFinder Account</h1>
        <p className="text-slate-400 text-sm text-center mt-2 mb-6">Register with HomesFinder to list, manage and track your properties.</p>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Full Name *"><Input data-testid="reg-name" value={f.name} onChange={set("name")} required className="bg-slate-800 border-slate-700 text-white" /></Field>
            <Field label="Email Address *"><Input data-testid="reg-email" type="email" value={f.email} onChange={set("email")} required className="bg-slate-800 border-slate-700 text-white" /></Field>
            <Field label="Mobile Number *"><Input data-testid="reg-mobile" value={f.mobile} onChange={set("mobile")} required placeholder="+971 5X XXX XXXX" className="bg-slate-800 border-slate-700 text-white" /></Field>
            <Field label="Country *"><Input data-testid="reg-country" value={f.country} onChange={set("country")} required className="bg-slate-800 border-slate-700 text-white" /></Field>
            <Field label="Emirate *">
              <Select value={f.emirate} onValueChange={(v) => setF({ ...f, emirate: v })}>
                <SelectTrigger data-testid="reg-emirate" className="bg-slate-800 border-slate-700 text-white"><SelectValue /></SelectTrigger>
                <SelectContent>{EMIRATES.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Location / Area *"><Input data-testid="reg-location" value={f.location} onChange={set("location")} required className="bg-slate-800 border-slate-700 text-white" /></Field>
            <Field label="Password *">
              <div className="relative">
                <Input
                  data-testid="reg-password"
                  type={showPassword ? "text" : "password"}
                  value={f.password}
                  onChange={set("password")}
                  required
                  className="bg-slate-800 border-slate-700 text-white pr-10"
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
            </Field>
            <Field label="Confirm Password *">
              <div className="relative">
                <Input
                  data-testid="reg-confirm"
                  type={showConfirm ? "text" : "password"}
                  value={f.confirm}
                  onChange={set("confirm")}
                  required
                  className="bg-slate-800 border-slate-700 text-white pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>
            <Field label="Company Name"><Input data-testid="reg-company" value={f.company} onChange={set("company")} className="bg-slate-800 border-slate-700 text-white" /></Field>
            <Field label="User Type">
              <Select value={f.user_type} onValueChange={(v) => setF({ ...f, user_type: v })}>
                <SelectTrigger data-testid="reg-usertype" className="bg-slate-800 border-slate-700 text-white"><SelectValue /></SelectTrigger>
                <SelectContent>{USER_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Preferred Contact Method">
              <Select value={f.preferred_contact || "any"} onValueChange={(v) => setF({ ...f, preferred_contact: v === "any" ? "" : v })}>
                <SelectTrigger data-testid="reg-contact" className="bg-slate-800 border-slate-700 text-white"><SelectValue placeholder="Any" /></SelectTrigger>
                <SelectContent><SelectItem value="any">Any</SelectItem><SelectItem value="Phone">Phone</SelectItem><SelectItem value="WhatsApp">WhatsApp</SelectItem><SelectItem value="Email">Email</SelectItem></SelectContent>
              </Select>
            </Field>
          </div>

          <Turnstile onToken={onToken} />

          <label className="flex items-start gap-3 text-sm text-slate-300">
            <Checkbox checked={consent} onCheckedChange={setConsent} data-testid="reg-consent" className="mt-0.5 border-slate-500" />
            <span>I agree to the <Link to="/legal/terms" target="_blank" className="text-amber-400 underline">Terms &amp; Conditions</Link> and <Link to="/legal/privacy-policy" target="_blank" className="text-amber-400 underline">Privacy Policy</Link>.</span>
          </label>

          <Button type="submit" disabled={loading || !consent} data-testid="reg-submit" className="w-full h-12 bg-amber-500 text-slate-950 hover:bg-amber-400 font-semibold disabled:opacity-50">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Create Account"}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-400">Already have an account? <Link to="/login" className="text-amber-400 hover:underline" data-testid="to-login">Sign In</Link></p>
      </div>
    </div>
  );
}

const Field = ({ label, children }) => (
  <div><Label className="text-slate-300 text-sm">{label}</Label><div className="mt-1.5">{children}</div></div>
);
