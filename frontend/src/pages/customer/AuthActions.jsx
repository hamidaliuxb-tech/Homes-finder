import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { api } from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export function VerifyEmail() {
  const [params] = useSearchParams();
  const [state, setState] = useState("loading");
  useEffect(() => {
    const token = params.get("token");
    if (!token) { setState("error"); return; }
    api.post("/auth/verify-email", { token }).then(() => setState("ok")).catch(() => setState("error"));
  }, [params]);
  return (
    <Shell>
      {state === "loading" && <Loader2 className="h-10 w-10 animate-spin text-amber-400 mx-auto" />}
      {state === "ok" && <><CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" /><h1 className="font-serif text-2xl font-bold text-white mt-4">Email Verified</h1><p className="text-slate-400 mt-2">Your HomesFinder account is now active.</p><Link to="/login"><Button className="mt-6 bg-amber-500 text-slate-950 hover:bg-amber-400 font-semibold">Sign In</Button></Link></>}
      {state === "error" && <><XCircle className="h-12 w-12 text-red-500 mx-auto" /><h1 className="font-serif text-2xl font-bold text-white mt-4">Verification Failed</h1><p className="text-slate-400 mt-2">This link is invalid or has expired.</p><Link to="/dashboard"><Button variant="outline" className="mt-6 border-white/20 text-white">Go to Dashboard</Button></Link></>}
    </Shell>
  );
}

export function ResetPassword() {
  const [params] = useSearchParams();
  const [pw, setPw] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try { await api.post("/auth/reset-password", { token: params.get("token"), password: pw }); setDone(true); }
    catch (err) { toast.error(err.response?.data?.detail || "Reset failed"); }
    finally { setLoading(false); }
  };
  return (
    <Shell>
      {done ? <><CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" /><h1 className="font-serif text-2xl font-bold text-white mt-4">Password Reset</h1><p className="text-slate-400 mt-2">You can now sign in with your new password.</p><Link to="/login"><Button className="mt-6 bg-amber-500 text-slate-950 hover:bg-amber-400 font-semibold">Sign In</Button></Link></> : (
        <form onSubmit={submit} className="text-left">
          <h1 className="font-serif text-2xl font-bold text-white text-center">Set a New Password</h1>
          <Input data-testid="reset-password" type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="New password" className="mt-6 h-11 bg-slate-800 border-slate-700 text-white" required />
          <Button type="submit" disabled={loading} data-testid="reset-submit" className="w-full mt-4 h-12 bg-amber-500 text-slate-950 hover:bg-amber-400 font-semibold">{loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Reset Password"}</Button>
        </form>
      )}
    </Shell>
  );
}

const Shell = ({ children }) => (
  <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
    <div className="w-full max-w-md bg-slate-900 border border-amber-500/20 rounded-2xl p-8 text-center">{children}</div>
  </div>
);
