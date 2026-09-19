import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/apiClient";
import { useAuth } from "@/context/AuthContext";

export default function ProfileSettings() {
  const { user, checkAuth } = useAuth();
  const [f, setF] = useState({ name: "", mobile: "", country: "", emirate: "", location: "", company: "", user_type: "" });
  const [pw, setPw] = useState({ current_password: "", new_password: "" });

  useEffect(() => { if (user) setF({ name: user.name || "", mobile: user.mobile || "", country: user.country || "", emirate: user.emirate || "", location: user.location || "", company: user.company || "", user_type: user.user_type || "" }); }, [user]);

  const saveProfile = async () => {
    try { await api.put("/auth/profile", f); toast.success("Profile updated"); checkAuth(); }
    catch { toast.error("Failed to update profile"); }
  };
  const changePw = async () => {
    try { await api.put("/auth/change-password", pw); toast.success("Password changed"); setPw({ current_password: "", new_password: "" }); }
    catch (e) { toast.error(e.response?.data?.detail || "Failed"); }
  };

  return (
    <div data-testid="profile-settings" className="space-y-6 max-w-2xl">
      <h1 className="font-serif text-3xl font-bold text-slate-900">Profile &amp; Settings</h1>

      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <h2 className="font-serif text-xl font-semibold">Account Details</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <F label="Full Name"><Input data-testid="pf-name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></F>
          <F label="Email"><Input value={user?.email || ""} disabled className="bg-slate-100" /></F>
          <F label="Mobile"><Input value={f.mobile} onChange={(e) => setF({ ...f, mobile: e.target.value })} /></F>
          <F label="Company"><Input value={f.company} onChange={(e) => setF({ ...f, company: e.target.value })} /></F>
          <F label="Emirate"><Input value={f.emirate} onChange={(e) => setF({ ...f, emirate: e.target.value })} /></F>
          <F label="Location"><Input value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} /></F>
        </div>
        <Button onClick={saveProfile} className="bg-amber-500 text-slate-950 hover:bg-amber-400 font-semibold" data-testid="save-profile">Save Changes</Button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <h2 className="font-serif text-xl font-semibold">Change Password</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <F label="Current Password"><Input data-testid="cp-current" type="password" value={pw.current_password} onChange={(e) => setPw({ ...pw, current_password: e.target.value })} /></F>
          <F label="New Password"><Input data-testid="cp-new" type="password" value={pw.new_password} onChange={(e) => setPw({ ...pw, new_password: e.target.value })} /></F>
        </div>
        <Button onClick={changePw} className="bg-slate-900 text-white hover:bg-slate-800" data-testid="change-password-btn">Update Password</Button>
      </div>
    </div>
  );
}
const F = ({ label, children }) => (<div><Label className="text-slate-700 text-sm">{label}</Label><div className="mt-1.5">{children}</div></div>);
