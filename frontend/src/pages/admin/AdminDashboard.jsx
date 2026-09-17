import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Building2, Home, Users, Settings as SettingsIcon, LogOut, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import PropertiesTab from "@/pages/admin/PropertiesTab";
import LeadsTab from "@/pages/admin/LeadsTab";
import SettingsTab from "@/pages/admin/SettingsTab";
import { useAuth } from "@/context/AuthContext";

const TABS = [
  { key: "properties", label: "Properties", icon: Home },
  { key: "leads", label: "Leads / CRM", icon: Users },
  { key: "content", label: "Website Content", icon: SettingsIcon },
];

export default function AdminDashboard() {
  const [tab, setTab] = useState("properties");
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
            <a href="/" target="_blank" rel="noopener noreferrer" className="hidden sm:flex items-center gap-1.5 text-sm text-slate-300 hover:text-amber-400" data-testid="view-site-link"><ExternalLink className="h-4 w-4" />View Site</a>
            <span className="hidden md:block text-sm text-slate-400">{user?.email}</span>
            <Button variant="outline" size="sm" onClick={doLogout} className="border-white/20 bg-transparent text-white hover:bg-white hover:text-slate-900" data-testid="admin-logout-btn"><LogOut className="h-4 w-4 mr-1.5" />Logout</Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-2 mb-8 border-b border-slate-200 overflow-x-auto">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} data-testid={`admin-tab-${t.key}`}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${tab === t.key ? "border-amber-500 text-slate-900" : "border-transparent text-slate-500 hover:text-slate-800"}`}>
              <t.icon className="h-4 w-4" />{t.label}
            </button>
          ))}
        </div>

        {tab === "properties" && <PropertiesTab />}
        {tab === "leads" && <LeadsTab />}
        {tab === "content" && <SettingsTab />}
      </div>
    </div>
  );
}
