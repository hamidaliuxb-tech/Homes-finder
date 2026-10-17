import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Pencil, Trash2, Eye, PlusCircle, Send, FileCheck, FileText, ShieldCheck, Upload, Loader2, ExternalLink, X } from "lucide-react";
import { api, fileUrl, formatAED, API } from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const STATUS_STYLES = {
  draft: "bg-slate-200 text-slate-700", pending: "bg-amber-100 text-amber-800",
  changes_required: "bg-orange-100 text-orange-800", approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800", sold: "bg-blue-100 text-blue-800", rented: "bg-blue-100 text-blue-800",
  unpublished: "bg-slate-200 text-slate-600",
};
const STATUS_LABEL = { approved: "Approved / Live", changes_required: "Changes Required", pending: "Pending Approval" };

function PropertyDocumentsModal({ open, onClose, property, onUpdated }) {
  const [docType, setDocType] = useState("Title Deed");
  const [uploading, setUploading] = useState(false);
  const [docs, setDocs] = useState([]);

  useEffect(() => {
    if (property) {
      setDocs(property.documents || []);
    }
  }, [property]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !property) return;
    if (file.size > 15 * 1024 * 1024) {
      toast.error("File is too large. Maximum size is 15MB.");
      return;
    }
    const fd = new FormData();
    fd.append("file", file);
    fd.append("property_id", property.id);
    fd.append("doc_type", docType);

    setUploading(true);
    try {
      const res = await api.post("/upload-document", fd);
      const newDocs = [...docs, res.data];
      setDocs(newDocs);
      toast.success(`${docType} uploaded successfully!`);
      const fileInp = document.getElementById("my-prop-doc-file");
      if (fileInp) fileInp.value = "";
      onUpdated();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to upload document");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId) => {
    try {
      await api.delete(`/documents/${docId}`);
      setDocs((prev) => prev.filter((d) => d.id !== docId));
      toast.success("Document removed");
      onUpdated();
    } catch (err) {
      toast.error("Failed to remove document");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto" data-testid="property-docs-modal">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-amber-500" />
            <DialogTitle className="font-serif text-xl font-bold">Verification Documents</DialogTitle>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {property?.title} <span className="font-semibold text-slate-700">({property?.reference || "Ref Pending"})</span>
          </p>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Upload New Document Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="text-xs font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Upload className="h-3.5 w-3.5 text-amber-600" /> Upload Verification Document
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-slate-600">Document Type</Label>
                <Select value={docType} onValueChange={setDocType}>
                  <SelectTrigger className="mt-1 h-9 bg-white text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Title Deed">Title Deed / Proof of Ownership</SelectItem>
                    <SelectItem value="Owner Passport / Emirates ID">Landlord / Owner Passport or Emirates ID</SelectItem>
                    <SelectItem value="Form A / Broker Agreement">Form A / Broker Contract / NOC</SelectItem>
                    <SelectItem value="DEWA / Ejari Certificate">DEWA Bill / Ejari Certificate</SelectItem>
                    <SelectItem value="Supporting Document">Other Supporting Document</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-slate-600">Select File (PDF, JPG, PNG)</Label>
                <div className="mt-1 flex items-center gap-2">
                  <Input
                    type="file"
                    id="my-prop-doc-file"
                    accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
                    disabled={uploading}
                    onChange={handleUpload}
                    className="h-9 bg-white text-xs file:text-xs file:font-semibold file:bg-amber-100 file:text-amber-900 file:border-0 file:rounded file:mr-2 file:px-2 file:py-0.5 cursor-pointer"
                  />
                  {uploading && <Loader2 className="h-4 w-4 animate-spin text-amber-600 shrink-0" />}
                </div>
              </div>
            </div>
          </div>

          {/* List of Documents */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Attached Documents ({docs.length})
              </Label>
              <span className="text-[11px] text-slate-400">Strictly confidential · Admin eyes only</span>
            </div>

            {docs.length === 0 ? (
              <div className="text-center p-6 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 text-slate-500 text-xs">
                No verification documents uploaded yet. Uploading your Title Deed or Emirates ID speeds up admin approval.
              </div>
            ) : (
              <div className="space-y-2">
                {docs.map((d) => (
                  <div key={d.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg shadow-2xs gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-800 truncate">{d.doc_type || "Verification Document"}</div>
                        <div className="text-[11px] text-slate-500 truncate">{d.original_filename}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs text-amber-700 hover:text-amber-800 hover:bg-amber-50"
                        onClick={() => {
                          const token = localStorage.getItem("hf_token") || "";
                          window.open(`${API}/documents/${d.id}?token=${token}`, "_blank");
                        }}
                      >
                        <ExternalLink className="h-3.5 w-3.5 mr-1" /> View
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDelete(d.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-slate-100">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function MyProperties() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [docProp, setDocProp] = useState(null);
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
      {docProp && (
        <PropertyDocumentsModal
          open={!!docProp}
          onClose={() => setDocProp(null)}
          property={docProp}
          onUpdated={load}
        />
      )}

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
                  {p.documents && p.documents.length > 0 && (
                    <Badge variant="outline" className="text-emerald-700 border-emerald-200 bg-emerald-50 text-[11px]">
                      {p.documents.length} Doc{p.documents.length === 1 ? "" : "s"}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{p.reference} · {p.location}</p>
                <p className="text-sm font-semibold text-amber-700 mt-1">{formatAED(p.price)}{p.price_period ? ` ${p.price_period}` : ""}</p>
                {p.approval_status === "rejected" && p.rejection_reason && <p className="text-xs text-red-600 mt-1">Reason: {p.rejection_reason}</p>}
                {p.approval_status === "changes_required" && p.admin_comments && <p className="text-xs text-orange-600 mt-1">Requested: {p.admin_comments}</p>}
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setDocProp(p)}
                  className="hover:border-amber-400 hover:text-amber-800"
                  data-testid={`docs-btn-${p.id}`}
                  title="Upload / Manage Verification Documents"
                >
                  <FileCheck className="h-4 w-4 mr-1 text-amber-600" />
                  Documents ({p.documents?.length || 0})
                </Button>
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
