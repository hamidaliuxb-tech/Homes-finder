import React, { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Check, X, MessageSquareWarning, Eye, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { api, fileUrl, formatAED, API } from "@/lib/apiClient";

const LABEL = { pending: "Pending", changes_required: "Changes Required", approved: "Approved / Live", rejected: "Rejected" };

export default function ApprovalsTab() {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [action, setAction] = useState(null); // {type, id}
  const [reason, setReason] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    api.get("/admin/properties", { params: { status, source: "customer" } }).then((r) => setItems(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [status]);
  useEffect(() => { load(); }, [load]);

  const approve = async (id) => {
    if (!window.confirm("Approve and publish this property?")) return;
    try { await api.post(`/admin/properties/${id}/approve`); toast.success("Property approved and published"); load(); setDetail(null); }
    catch (e) { toast.error(e.response?.data?.detail || "Failed"); }
  };
  const doAction = async () => {
    if (!reason.trim()) { toast.error("Please provide a reason"); return; }
    try {
      await api.post(`/admin/properties/${action.id}/${action.type}`, { reason });
      toast.success(action.type === "reject" ? "Property rejected" : "Changes requested");
      setAction(null); setReason(""); load(); setDetail(null);
    } catch (e) { toast.error(e.response?.data?.detail || "Failed"); }
  };
  const openDetail = async (id) => {
    try { const r = await api.get(`/admin/properties/${id}`); setDetail(r.data); } catch { toast.error("Failed to load"); }
  };

  return (
    <div data-testid="approvals-tab">
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <h2 className="font-serif text-xl font-semibold text-slate-900">Property Approvals <span className="text-slate-400 text-base">({items.length})</span></h2>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[200px] h-11" data-testid="approval-status-filter"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending Approval</SelectItem>
            <SelectItem value="changes_required">Changes Required</SelectItem>
            <SelectItem value="approved">Approved / Live</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="all">All Submissions</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? <p className="text-slate-500">Loading…</p> : items.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500" data-testid="no-approvals">No submissions in this category.</div>
      ) : (
        <div className="space-y-4">
          {items.map((p) => (
            <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-4 flex gap-4 items-center flex-wrap sm:flex-nowrap" data-testid={`approval-row-${p.id}`}>
              <div className="w-24 h-20 rounded-lg overflow-hidden bg-slate-100 shrink-0">{p.images?.[0] && <img src={fileUrl(p.images[0])} alt="" className="h-full w-full object-cover" />}</div>
              <div className="flex-1 min-w-[180px]">
                <div className="flex items-center gap-2 flex-wrap"><h3 className="font-semibold text-slate-900">{p.title}</h3><Badge variant="outline">{LABEL[p.approval_status] || p.approval_status}</Badge></div>
                <p className="text-xs text-slate-500 mt-0.5">{p.reference} · {p.location} · {formatAED(p.price)}</p>
                {p.customer && <p className="text-xs text-slate-500 mt-0.5">By {p.customer.name} · {p.customer.email} · {p.customer.phone}</p>}
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" variant="outline" onClick={() => openDetail(p.id)} data-testid={`review-${p.id}`}><Eye className="h-4 w-4 mr-1" />View</Button>
                {p.approval_status !== "approved" && <Button size="sm" onClick={() => approve(p.id)} className="bg-emerald-600 text-white hover:bg-emerald-700" data-testid={`approve-${p.id}`}><Check className="h-4 w-4 mr-1" />Approve</Button>}
                <Button size="sm" variant="outline" onClick={() => setAction({ type: "request-changes", id: p.id })} className="hover:text-orange-600"><MessageSquareWarning className="h-4 w-4" /></Button>
                <Button size="sm" variant="outline" onClick={() => setAction({ type: "reject", id: p.id })} className="hover:text-red-600" data-testid={`reject-${p.id}`}><X className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="review-dialog">
          {detail && (
            <>
              <DialogHeader><DialogTitle className="font-serif text-2xl">{detail.title}</DialogTitle></DialogHeader>
              <div className="grid grid-cols-3 gap-2">{(detail.images || []).slice(0, 6).map((im, i) => <img key={i} src={fileUrl(im)} alt="" className="rounded-lg aspect-square object-cover" />)}</div>
              <div className="grid sm:grid-cols-2 gap-2 text-sm text-slate-700 mt-2">
                <div><span className="text-slate-400">Reference:</span> {detail.reference}</div>
                <div><span className="text-slate-400">Purpose:</span> {detail.purpose === "rent" ? "For Rent" : "For Sale"}</div>
                <div><span className="text-slate-400">Type:</span> {detail.property_type}</div>
                <div><span className="text-slate-400">Location:</span> {detail.location}</div>
                <div><span className="text-slate-400">Price:</span> {formatAED(detail.price)}</div>
                <div><span className="text-slate-400">Beds/Baths:</span> {detail.bedrooms}/{detail.bathrooms}</div>
                <div><span className="text-slate-400">Area:</span> {detail.area} sq.ft.</div>
                <div><span className="text-slate-400">Amenities:</span> {(detail.amenities || []).length}</div>
              </div>
              {detail.description && <p className="text-sm text-slate-600 mt-2">{detail.description}</p>}
              {detail.customer && <div className="rounded-lg bg-slate-50 p-3 text-sm mt-2"><strong>Customer:</strong> {detail.customer.name} · {detail.customer.email} · {detail.customer.mobile}</div>}
              {(detail.documents || []).length > 0 && (
                <div className="mt-2"><h4 className="font-semibold text-sm mb-1">Private Documents (admin only)</h4>
                  {detail.documents.map((d) => <a key={d.id} href={`${API}/documents/${d.id}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-amber-700 hover:underline"><FileText className="h-4 w-4" />{d.original_filename} ({d.doc_type})</a>)}
                </div>
              )}
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setAction({ type: "request-changes", id: detail.id })}>Request Changes</Button>
                <Button variant="outline" onClick={() => setAction({ type: "reject", id: detail.id })} className="text-red-600">Reject</Button>
                {detail.approval_status !== "approved" && <Button onClick={() => approve(detail.id)} className="bg-emerald-600 text-white hover:bg-emerald-700" data-testid="approve-in-dialog">Approve &amp; Publish</Button>}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!action} onOpenChange={(o) => !o && (setAction(null), setReason(""))}>
        <DialogContent data-testid="reason-dialog">
          <DialogHeader><DialogTitle>{action?.type === "reject" ? "Reject Property" : "Request Changes"}</DialogTitle></DialogHeader>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder={action?.type === "reject" ? "Reason for rejection…" : "Describe the changes required…"} className="min-h-[120px]" data-testid="reason-input" />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAction(null); setReason(""); }}>Cancel</Button>
            <Button onClick={doAction} className="bg-slate-900 text-white hover:bg-slate-800" data-testid="reason-submit">Send</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
