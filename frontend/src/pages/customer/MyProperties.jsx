import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Pencil, Trash2, Eye, PlusCircle, Send } from "lucide-react";
import { api, fileUrl, formatAED } from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const STATUS_STYLES = {
  draft: "bg-slate-200 text-slate-700", pending: "bg-amber-100 text-amber-800",
  changes_required: "bg-orange-100 text-orange-800", approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800", sold: "bg-blue-100 text-blue-800", rented: "bg-blue-100 text-blue-800",
  unpublished: "bg-slate-200 text-slate-600",
};
const STATUS_LABEL = { approved: "Approved / Live", changes_required: "Changes Required", pending: "Pending Approval" };

export default function MyProperties() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = () => {
    setLoading(true);
    api.get("/my/properties").then((r) => setItems(r.data)).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const submit = async (id) => {
    try { await api.post(`/my/properties/${id}/submit`); toast.success("Submitted for approval"); load(); }
    catch (e) { toast.error(e.response?.data?.detail || "Failed"); }
  };
  const del = async (id) => {
    if (!window.confirm("Delete this property?")) return;
    try { await api.delete(`/my/properties/${id}`); toast.success("Deleted"); load(); }
    catch (e) { toast.error(e.response?.data?.detail || "Cannot delete"); }
  };

  return (
    <div data-testid="my-properties">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h1 className="font-serif text-3xl font-bold text-slate-900">My Properties</h1>
        <Link to="/dashboard/add-property"><Button className="bg-amber-500 text-slate-950 hover:bg-amber-400 font-semibold"><PlusCircle className="h-4 w-4 mr-2" />Add Property</Button></Link>
      </div>

      {loading ? <p className="text-slate-500">Loading…</p> : items.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <p className="text-slate-500 mb-4">You haven't listed any properties yet.</p>
          <Link to="/dashboard/add-property"><Button className="bg-amber-500 text-slate-950 hover:bg-amber-400 font-semibold">List Your First Property</Button></Link>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((p) => (
            <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-4 flex gap-4 flex-wrap sm:flex-nowrap items-center" data-testid={`my-prop-${p.id}`}>
              <div className="w-24 h-20 rounded-lg overflow-hidden bg-slate-100 shrink-0">{p.images?.[0] && <img src={fileUrl(p.images[0])} alt="" className="h-full w-full object-cover" />}</div>
              <div className="flex-1 min-w-[180px]">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-slate-900">{p.title}</h3>
                  <Badge className={`${STATUS_STYLES[p.approval_status] || "bg-slate-200"} hover:${STATUS_STYLES[p.approval_status]}`}>{STATUS_LABEL[p.approval_status] || (p.approval_status ? p.approval_status[0].toUpperCase() + p.approval_status.slice(1) : "Draft")}</Badge>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{p.reference} · {p.location}</p>
                <p className="text-sm font-semibold text-amber-700 mt-1">{formatAED(p.price)}{p.price_period ? ` ${p.price_period}` : ""}</p>
                {p.approval_status === "rejected" && p.rejection_reason && <p className="text-xs text-red-600 mt-1">Reason: {p.rejection_reason}</p>}
                {p.approval_status === "changes_required" && p.admin_comments && <p className="text-xs text-orange-600 mt-1">Requested: {p.admin_comments}</p>}
              </div>
              <div className="flex gap-2 flex-wrap">
                {p.approval_status === "approved" && p.slug && <a href={`/property/${p.slug}`} target="_blank" rel="noopener noreferrer"><Button size="sm" variant="outline" data-testid={`view-live-${p.id}`}><Eye className="h-4 w-4 mr-1" />View Live</Button></a>}
                {["draft", "changes_required", "rejected"].includes(p.approval_status) && <Button size="sm" onClick={() => submit(p.id)} className="bg-slate-900 text-white hover:bg-slate-800" data-testid={`submit-${p.id}`}><Send className="h-4 w-4 mr-1" />Submit</Button>}
                <Button size="sm" variant="outline" onClick={() => navigate(`/dashboard/edit-property/${p.id}`)} data-testid={`edit-${p.id}`}><Pencil className="h-4 w-4" /></Button>
                {p.approval_status !== "approved" && <Button size="sm" variant="outline" onClick={() => del(p.id)} className="hover:text-red-600" data-testid={`del-${p.id}`}><Trash2 className="h-4 w-4" /></Button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
