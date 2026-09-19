import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Ban, CheckCircle2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/apiClient";

export default function CustomersTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => { setLoading(true); api.get("/admin/customers").then((r) => setItems(r.data)).catch(() => {}).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const toggle = async (c) => {
    const to = c.status === "disabled" ? "enable" : "disable";
    if (!window.confirm(`${to === "disable" ? "Disable" : "Enable"} ${c.name}'s account?`)) return;
    try { await api.post(`/admin/customers/${c.id}/status`, { reason: to }); toast.success(`Account ${to}d`); load(); }
    catch { toast.error("Failed"); }
  };

  return (
    <div data-testid="customers-tab">
      <h2 className="font-serif text-xl font-semibold text-slate-900 mb-6">Customers <span className="text-slate-400 text-base">({items.length})</span></h2>
      {loading ? <p className="text-slate-500">Loading…</p> : items.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">No customers registered yet.</div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-left"><tr>
              <th className="p-4 font-medium">Customer</th><th className="p-4 font-medium hidden md:table-cell">Type</th>
              <th className="p-4 font-medium hidden lg:table-cell">Verified</th><th className="p-4 font-medium">Properties</th>
              <th className="p-4 font-medium">Status</th><th className="p-4 font-medium text-right">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50" data-testid={`customer-row-${c.id}`}>
                  <td className="p-4"><div className="font-semibold text-slate-900">{c.name}</div><div className="text-xs text-slate-500">{c.email} · {c.mobile}</div><div className="text-xs text-slate-400">{c.emirate}</div></td>
                  <td className="p-4 hidden md:table-cell text-slate-600">{c.user_type}</td>
                  <td className="p-4 hidden lg:table-cell">{c.email_verified ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <span className="text-xs text-slate-400">No</span>}</td>
                  <td className="p-4 text-slate-600">{c.property_count} <span className="text-xs text-slate-400">({c.live_count} live · {c.pending_count} pending)</span></td>
                  <td className="p-4"><Badge className={c.status === "disabled" ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}>{c.status}</Badge></td>
                  <td className="p-4 text-right">
                    <Button size="sm" variant="outline" onClick={() => toggle(c)} className={c.status === "disabled" ? "hover:text-emerald-600" : "hover:text-red-600"} data-testid={`toggle-customer-${c.id}`}>
                      {c.status === "disabled" ? <CheckCircle2 className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
