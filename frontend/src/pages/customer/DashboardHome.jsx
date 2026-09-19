import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { HomeIcon, CheckCircle2, Clock, XCircle, PlusCircle, AlertTriangle } from "lucide-react";
import { api } from "@/lib/apiClient";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

export default function DashboardHome() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, live: 0, pending: 0, rejected: 0 });
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    api.get("/my/stats").then((r) => setStats(r.data)).catch(() => {});
    api.get("/my/notifications").then((r) => setNotes(r.data.slice(0, 4))).catch(() => {});
  }, []);

  const cards = [
    { label: "My Properties", value: stats.total, icon: HomeIcon, color: "text-slate-900" },
    { label: "Live Properties", value: stats.live, icon: CheckCircle2, color: "text-emerald-600" },
    { label: "Pending Approval", value: stats.pending, icon: Clock, color: "text-amber-600" },
    { label: "Rejected", value: stats.rejected, icon: XCircle, color: "text-red-600" },
  ];

  return (
    <div data-testid="dashboard-home">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <h1 className="font-serif text-3xl font-bold text-slate-900">Welcome, {user?.name || "Owner"}</h1>
        <Link to="/dashboard/add-property"><Button className="bg-amber-500 text-slate-950 hover:bg-amber-400 font-semibold" data-testid="dash-add-cta"><PlusCircle className="h-4 w-4 mr-2" />List Your Property</Button></Link>
      </div>

      {!user?.email_verified && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-amber-300 bg-[#FAF5E8] p-4 text-sm text-slate-700" data-testid="verify-banner">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
          <span>Please verify your email address. Once our email service is live you'll receive a verification link. You can still list properties in the meantime.</span>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-xl border border-slate-200 p-5" data-testid={`stat-${c.label.toLowerCase().replace(/\s+/g, "-")}`}>
            <c.icon className={`h-6 w-6 ${c.color} mb-3`} />
            <div className="font-serif text-3xl font-bold text-slate-900">{c.value}</div>
            <div className="text-sm text-slate-500 mt-1">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="font-serif text-xl font-semibold text-slate-900 mb-4">Recent Notifications</h2>
        {notes.length === 0 ? <p className="text-slate-500 text-sm">No notifications yet.</p> : (
          <ul className="space-y-3">
            {notes.map((n) => (
              <li key={n.id} className="flex items-start gap-3 text-sm text-slate-700 border-b border-slate-100 pb-3 last:border-0">
                <span className="text-lg">🔔</span><div><p>{n.message}</p><span className="text-xs text-slate-400">{new Date(n.created_at).toLocaleString()}</span></div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
