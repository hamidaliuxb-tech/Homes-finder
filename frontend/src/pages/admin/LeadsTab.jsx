import React, { useEffect, useState, useCallback } from "react";
import { Trash2, Mail, Phone, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/apiClient";
import { waLink } from "@/components/FloatingWhatsApp";

const STATUSES = ["New", "Contacted", "Viewing", "Negotiation", "Closed", "Lost"];
const COLORS = {
  New: "bg-blue-100 text-blue-800", Contacted: "bg-amber-100 text-amber-800",
  Viewing: "bg-purple-100 text-purple-800", Negotiation: "bg-orange-100 text-orange-800",
  Closed: "bg-emerald-100 text-emerald-800", Lost: "bg-slate-200 text-slate-600",
};

export default function LeadsTab() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/leads", { params: filter !== "all" ? { status: filter } : {} });
      setLeads(res.data);
    } catch { toast.error("Failed to load leads"); }
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id, status) => {
    try { await api.put(`/leads/${id}`, { status }); toast.success("Lead updated"); load(); }
    catch { toast.error("Update failed"); }
  };

  const del = async (id) => {
    try { await api.delete(`/leads/${id}`); toast.success("Lead deleted"); load(); }
    catch { toast.error("Delete failed"); }
  };

  return (
    <div data-testid="leads-tab">
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <h2 className="font-serif text-xl font-semibold text-slate-900">Leads / Enquiries <span className="text-slate-400 text-base">({leads.length})</span></h2>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px] h-11" data-testid="lead-status-filter"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? <p className="text-slate-500">Loading…</p> : leads.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500" data-testid="no-leads">No leads yet.</div>
      ) : (
        <div className="grid gap-4">
          {leads.map((l) => (
            <div key={l.id} className="bg-white rounded-xl border border-slate-200 p-5" data-testid={`lead-row-${l.id}`}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-semibold text-slate-900">{l.name}</h3>
                    <Badge className={`${COLORS[l.status] || ""} hover:${COLORS[l.status]}`}>{l.status}</Badge>
                    <span className="text-xs text-slate-400">{new Date(l.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-amber-700 font-medium mt-1">{l.requirement}</p>
                  {l.property_title && <p className="text-xs text-slate-500 mt-0.5">Property: {l.property_title}</p>}
                  <div className="flex gap-4 mt-3 text-sm text-slate-600 flex-wrap">
                    <a href={`tel:${l.mobile}`} className="flex items-center gap-1.5 hover:text-amber-600"><Phone className="h-3.5 w-3.5" />{l.mobile}</a>
                    {l.email && <a href={`mailto:${l.email}`} className="flex items-center gap-1.5 hover:text-amber-600"><Mail className="h-3.5 w-3.5" />{l.email}</a>}
                    <a href={waLink(l.mobile, `Hello ${l.name}, thank you for contacting Homes Finder.`)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[#25D366]"><MessageCircle className="h-3.5 w-3.5" />WhatsApp</a>
                  </div>
                  {(l.message || l.location || l.expected_price) && (
                    <div className="mt-3 text-sm text-slate-600 bg-slate-50 rounded-lg p-3 space-y-1">
                      {l.location && <div><span className="text-slate-400">Location:</span> {l.location}</div>}
                      {l.property_type && <div><span className="text-slate-400">Type:</span> {l.property_type} {l.bedrooms && `· ${l.bedrooms} BR`}</div>}
                      {l.expected_price && <div><span className="text-slate-400">Expected Price:</span> {l.expected_price}</div>}
                      {l.message && <div><span className="text-slate-400">Message:</span> {l.message}</div>}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Select value={l.status} onValueChange={(v) => updateStatus(l.id, v)}>
                    <SelectTrigger className="w-[150px] h-10" data-testid={`lead-status-${l.id}`}><SelectValue /></SelectTrigger>
                    <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                  <Button size="icon" variant="outline" onClick={() => del(l.id)} data-testid={`delete-lead-${l.id}`} className="hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
