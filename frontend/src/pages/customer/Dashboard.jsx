import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate, useLocation, Routes, Route } from "react-router-dom";
import { Building2, LayoutDashboard, Home as HomeIcon, PlusCircle, User, Lock, Bell, LogOut, ExternalLink, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import DashboardHome from "@/pages/customer/DashboardHome";
import MyProperties from "@/pages/customer/MyProperties";
import AddProperty from "@/pages/customer/AddProperty";
import ProfileSettings from "@/pages/customer/ProfileSettings";
import Notifications from "@/pages/customer/Notifications";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/dashboard/properties", label: "My Properties", icon: HomeIcon },
  { to: "/dashboard/add-property", label: "Add Property", icon: PlusCircle },
  { to: "/dashboard/notifications", label: "Notifications", icon: Bell },
  { to: "/dashboard/profile", label: "Profile & Settings", icon: User },
];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const doLogout = async () => { await logout(); navigate("/login"); };

  return (
    <div className="min-h-screen bg-[#FAFAFA]" data-testid="customer-dashboard">
      <header className="bg-slate-900 text-white sticky top-0 z-40 border-b border-amber-500/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2">
            <img src="/homes-finder-icon.png" alt="Homes Finder" className="h-8 w-auto" />
            <span className="font-serif text-lg font-bold">Homes Finder</span>
          </Link>
          <div className="flex items-center gap-3">
            <a href="/" className="hidden sm:flex items-center gap-1.5 text-sm text-slate-300 hover:text-amber-400"><ExternalLink className="h-4 w-4" />View Site</a>
            <span className="hidden md:block text-sm text-slate-400">{user?.name || user?.email}</span>
            <Button variant="outline" size="sm" onClick={doLogout} className="border-white/20 bg-transparent text-white hover:bg-white hover:text-slate-900" data-testid="dashboard-logout"><LogOut className="h-4 w-4 mr-1.5" />Logout</Button>
            <button className="lg:hidden p-2" onClick={() => setOpen(!open)}><Menu className="h-5 w-5" /></button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 grid lg:grid-cols-[240px_1fr] gap-8">
        <aside className={`${open ? "block" : "hidden"} lg:block`}>
          <nav className="bg-white rounded-xl border border-slate-200 p-3 lg:sticky lg:top-24 space-y-1">
            {NAV.map((n) => {
              const active = n.end ? location.pathname === n.to : location.pathname.startsWith(n.to);
              return (
                <Link key={n.to} to={n.to} onClick={() => setOpen(false)} data-testid={`dash-nav-${n.label.toLowerCase().replace(/[^a-z]+/g, "-").replace(/-$/, "")}`}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${active ? "bg-slate-900 text-amber-400" : "text-slate-600 hover:bg-slate-100"}`}>
                  <n.icon className="h-4 w-4" />{n.label}
                </Link>
              );
            })}
            <button onClick={doLogout} className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100"><LogOut className="h-4 w-4" />Logout</button>
          </nav>
        </aside>

        <main>
          <Routes>
            <Route index element={<DashboardHome />} />
            <Route path="properties" element={<MyProperties />} />
            <Route path="add-property" element={<AddProperty />} />
            <Route path="edit-property/:id" element={<AddProperty />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="profile" element={<ProfileSettings />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
