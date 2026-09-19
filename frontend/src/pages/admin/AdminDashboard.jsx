import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Building2, Home, Users, Settings as SettingsIcon, ClipboardCheck, BarChart3, LogOut, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import PropertiesTab from "@/pages/admin/PropertiesTab";
import LeadsTab from "@/pages/admin/LeadsTab";
import SettingsTab from "@/pages/admin/SettingsTab";
import ApprovalsTab from "@/pages/admin/ApprovalsTab";
import CustomersTab from "@/pages/admin/CustomersTab";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/apiClient";

const TABS = [
  { key: "approvals", label: "Approvals", icon: ClipboardCheck },
  { key: "properties", label: "Properties", icon: Home },
  { key: "customers", label: "Customers", icon: Users },
  { key: "leads", label: "Leads / CRM", icon: Users },
  { key: "content", label: "Website Content", icon: SettingsIcon },
];

function StatsBar() {
  const [period, setPeriod] = useState("all");
  const [s, setS] = useState(null);
  useEffect(() => { api.get("/admin/stats", { params: { period } }).then((r) => setS(r.data)).catch(() => {}); }, [period]);
  const cards = s ? [
    { l: "Total Customers", v: s.total_customers }, { l: "New Customers", v: s.new_customers },
    { l: "Total Properties", v: s.total_properties }, { l: "Pending Approval", v: s.pending },
    { l: "Live Properties", v: s.live }, { l: "For Sale", v: s.for_sale },
    { l: "For Rent", v: s.for_rent }, { l: "New Enquiries", v: s.new_leads },
  ] : [];
  return (
    <div className="mb-8" data-testid="admin-stats">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h2 className="font-serif text-lg font-semibold text-slate-900 flex items-center gap-2"><BarChart3 className="h-5 w-5 text-amber-500" />Overview</h2>
        <div className="flex gap-1">
          {[["all", "All"], ["today", "Today"], ["week", "Week"], ["month", "Month"]].map(([k, lbl]) => (
            <button key={k} onClick={() => setPeriod(k)} className={`text-xs px-3 py-1.5 rounded-full border ${period === k ? "bg-slate-900 text-white border-slate-900" : "border-slate-300 text-slate-600"}`} data-testid={`stats-period-${k}`}>{lbl}</button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map((c) => (
          <div key={c.l} className="bg-white rounded-xl border border-slate-200 p-4"><div className="font-serif text-2xl font-bold text-slate-900">{c.v}</div><div className="text-xs text-slate-500 mt-1">{c.l}</div></div>
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [tab, setTab] = useState("approvals");
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const doLogout = async () => { await logout(); navigate("/admin/login"); };

  return (
    <div className="min-h-screen bg-[#FAFAFA]" data-testid="admin-dashboard">
      <header className="bg-slate-900 text-white sticky top-0 z-40 border-b border-amber-500/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/admin" className="flex items-center gap-2">
            <img src="/homes-finder-icon.png" alt="Homes Finder" className="h-7 w-auto" />
            <span className="font-serif text-lg font-bold">Homes Finder <span className="text-amber-400 font-normal text-sm">Admin</span></span>
          </Link>
          <div className="flex items-center gap-3">
            <a href="/" target="_blank" rel="noopener noreferrer" className="hidden sm:flex items-center gap-1.5 text-sm text-slate-300 hover:text-amber-400"><ExternalLink className="h-4 w-4" />View Site</a>
            <span className="hidden md:block text-sm text-slate-400">{user?.email}</span>
            <Button variant="outline" size="sm" onClick={doLogout} className="border-white/20 bg-transparent text-white hover:bg-white hover:text-slate-900" data-testid="admin-logout-btn"><LogOut className="h-4 w-4 mr-1.5" />Logout</Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <StatsBar />
        <div className="flex gap-2 mb-8 border-b border-slate-200 overflow-x-auto">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} data-testid={`admin-tab-${t.key}`}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${tab === t.key ? "border-amber-500 text-slate-900" : "border-transparent text-slate-500 hover:text-slate-800"}`}>
              <t.icon className="h-4 w-4" />{t.label}
            </button>
          ))}
        </div>

        {tab === "approvals" && <ApprovalsTab />}
        {tab === "properties" && <PropertiesTab />}
        {tab === "customers" && <CustomersTab />}
        {tab === "leads" && <LeadsTab />}
        {tab === "content" && <SettingsTab />}
      </div>
    </div>
  );
}
