import React, { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Check, X, MessageSquareWarning, Eye, FileText, ShieldCheck, ExternalLink, QrCode, AlertCircle } from "lucide-react";
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
    api.get("/admin/properties", { params: { status } }).then((r) => setItems(r.data)).catch(() => {}).finally(() => setLoading(false));
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
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-slate-900">{p.title}</h3>
                  <Badge variant="outline">{LABEL[p.approval_status] || p.approval_status}</Badge>
                  {p.documents && p.documents.length > 0 ? (
                    <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-200 text-xs font-semibold">
                      {p.documents.length} Doc{p.documents.length === 1 ? "" : "s"} Attached
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-amber-700 bg-amber-50 border-amber-200 text-xs">
                      No Docs
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{p.reference} · {p.location} · {formatAED(p.price)}</p>
                {p.customer && <p className="text-xs text-slate-500 mt-0.5">By {p.customer.name} · {p.customer.email} · {p.customer.phone}</p>}
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" variant="outline" onClick={() => openDetail(p.id)} data-testid={`review-${p.id}`}><Eye className="h-4 w-4 mr-1" />Review</Button>
                {p.approval_status !== "approved" && <Button size="sm" onClick={() => approve(p.id)} className="bg-emerald-600 text-white hover:bg-emerald-700" data-testid={`approve-${p.id}`}><Check className="h-4 w-4 mr-1" />Approve</Button>}
                <Button size="sm" variant="outline" onClick={() => setAction({ type: "request-changes", id: p.id })} className="hover:text-orange-600" title="Request Changes"><MessageSquareWarning className="h-4 w-4" /></Button>
                <Button size="sm" variant="outline" onClick={() => setAction({ type: "reject", id: p.id })} className="hover:text-red-600" data-testid={`reject-${p.id}`} title="Reject"><X className="h-4 w-4" /></Button>
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
                <div><span className="text-slate-400">Ownership:</span> {detail.ownership_type || "Freehold"}</div>
                <div><span className="text-slate-400">Type:</span> {detail.property_type}</div>
                <div><span className="text-slate-400">Location:</span> {detail.location}</div>
                <div><span className="text-slate-400">Price:</span> {formatAED(detail.price)}</div>
                <div><span className="text-slate-400">Beds/Baths:</span> {detail.bedrooms}/{detail.bathrooms}</div>
                <div><span className="text-slate-400">Area:</span> {detail.area} sq.ft.</div>
              </div>
              {detail.description && <p className="text-sm text-slate-600 mt-2">{detail.description}</p>}
              {detail.customer && <div className="rounded-lg bg-slate-50 p-3 text-sm mt-2"><strong>Customer:</strong> {detail.customer.name} · {detail.customer.email} · {detail.customer.mobile}</div>}

              {/* Regulatory & Permit QR Code Info */}
              <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-xs font-semibold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-amber-500" /> Regulatory &amp; Permit Details
                </div>
                <div className="grid sm:grid-cols-2 gap-2 text-xs text-slate-700">
                  <div><span className="text-slate-400">Agency:</span> {detail.agency_name || "Homes Finder Real Estate"}</div>
                  <div><span className="text-slate-400">Zone:</span> {detail.zone || "—"}</div>
                  <div><span className="text-slate-400">RERA Permit:</span> {detail.rera_number || "—"}</div>
                  <div><span className="text-slate-400">BRN / ORN:</span> {detail.brn || "—"} / {detail.orn || "32890"}</div>
                  <div><span className="text-slate-400">DLD Permit:</span> {detail.dld_permit_number || "—"}</div>
                </div>
                {detail.permit_qr_code && (
                  <div className="mt-2.5 pt-2 border-t border-slate-200 flex items-center gap-3">
                    <img src={fileUrl(detail.permit_qr_code)} alt="Permit QR" className="h-16 w-16 object-contain border border-slate-300 rounded bg-white p-1" />
                    <div className="text-xs">
                      <div className="font-semibold text-slate-900 flex items-center gap-1"><QrCode className="h-3.5 w-3.5 text-amber-600" /> Official DLD Permit QR Code</div>
                      <p className="text-slate-500 mt-0.5">Permit verification QR uploaded by agent/owner.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Uploaded Verification Documents (Title Deed, Emirates ID, Form A) */}
              <div className="mt-3 p-4 bg-amber-50/50 border border-amber-200 rounded-xl" data-testid="admin-verification-docs">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 font-semibold text-sm text-amber-950">
                    <ShieldCheck className="h-4 w-4 text-amber-600" />
                    Property Verification Documents (Private)
                  </div>
                  <Badge variant="outline" className="text-amber-800 border-amber-300 bg-amber-100 text-xs font-semibold">
                    {detail.documents?.length || 0} Document{(detail.documents?.length === 1) ? "" : "s"}
                  </Badge>
                </div>

                {(detail.documents || []).length > 0 ? (
                  <div className="space-y-2 mt-2">
                    {detail.documents.map((d) => (
                      <div key={d.id} className="flex items-center justify-between p-2.5 bg-white border border-amber-200/80 rounded-lg shadow-2xs gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                            <FileText className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-900 truncate">{d.doc_type || "Verification Document"}</div>
                            <div className="text-[11px] text-slate-500 truncate">{d.original_filename}</div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs font-semibold text-amber-800 border-amber-300 hover:bg-amber-100"
                          onClick={() => {
                            const token = localStorage.getItem("hf_token") || "";
                            window.open(`${API}/documents/${d.id}?token=${token}`, "_blank");
                          }}
                          data-testid={`admin-view-doc-${d.id}`}
                        >
                          <ExternalLink className="h-3.5 w-3.5 mr-1" /> View Document
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-amber-800 bg-amber-100/60 p-2.5 rounded-lg border border-amber-200 mt-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                    <span>No verification documents uploaded yet. You may approve if verified offline or click &quot;Request Changes&quot; to ask the owner for documents.</span>
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2 pt-2">
                <Button variant="outline" onClick={() => setAction({ type: "request-changes", id: detail.id })}>Request Changes</Button>
                <Button variant="outline" onClick={() => setAction({ type: "reject", id: detail.id })} className="text-red-600">Reject</Button>
                {detail.approval_status !== "approved" && <Button onClick={() => approve(detail.id)} className="bg-emerald-600 text-white hover:bg-emerald-700" data-testid="approve-in-dialog"><Check className="h-4 w-4 mr-1" />Approve &amp; Publish</Button>}
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
