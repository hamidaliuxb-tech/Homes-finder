import React, { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Trash2, Star, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import PropertyEditor from "@/pages/admin/PropertyEditor";
import { api, fileUrl, formatAED } from "@/lib/apiClient";

export default function PropertiesTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [toDelete, setToDelete] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/properties", { params: { admin: true, limit: 500, sort: "newest" } });
      setItems(res.data);
    } catch { toast.error("Failed to load properties"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const del = async () => {
    try { await api.delete(`/properties/${toDelete.id}`); toast.success("Property deleted"); load(); }
    catch { toast.error("Failed to delete"); }
    finally { setToDelete(null); }
  };

  const filtered = items.filter((p) => p.title.toLowerCase().includes(search.toLowerCase()) || (p.location || "").toLowerCase().includes(search.toLowerCase()));

  return (
    <div data-testid="properties-tab">
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search properties…" className="max-w-xs h-11" data-testid="admin-property-search" />
        <Button onClick={() => { setEditing(null); setEditorOpen(true); }} className="bg-amber-500 text-slate-950 hover:bg-amber-400 font-semibold" data-testid="add-property-btn"><Plus className="h-4 w-4 mr-2" />Add Property</Button>
      </div>

      {loading ? <p className="text-slate-500">Loading…</p> : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-left">
                <tr>
                  <th className="p-4 font-medium">Property</th>
                  <th className="p-4 font-medium hidden md:table-cell">Price</th>
                  <th className="p-4 font-medium hidden lg:table-cell">Status</th>
                  <th className="p-4 font-medium">Flags</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((p) => (
                  <tr key={p.id} data-testid={`admin-property-row-${p.id}`} className="hover:bg-slate-50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-lg overflow-hidden bg-slate-100 shrink-0">{p.images?.[0] && <img src={fileUrl(p.images[0])} alt="" className="h-full w-full object-cover" />}</div>
                        <div><div className="font-semibold text-slate-900 line-clamp-1">{p.title}</div><div className="text-slate-500 text-xs">{p.location}</div></div>
                      </div>
                    </td>
                    <td className="p-4 hidden md:table-cell text-slate-700">{formatAED(p.price)}</td>
                    <td className="p-4 hidden lg:table-cell"><Badge variant="outline" className="capitalize">{p.status === "offplan" ? "Off-Plan" : "Ready"}</Badge> <span className="capitalize text-xs text-slate-500 ml-1">{p.availability}</span></td>
                    <td className="p-4">
                      <div className="flex gap-1.5">
                        {p.featured && <Star className="h-4 w-4 text-amber-500 fill-amber-500" />}
                        {p.published ? <Eye className="h-4 w-4 text-emerald-500" /> : <EyeOff className="h-4 w-4 text-slate-400" />}
                        {p.is_demo && <span className="text-[10px] font-bold bg-slate-900 text-amber-300 px-1.5 py-0.5 rounded">DEMO</span>}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        <Button size="icon" variant="outline" onClick={() => { setEditing(p); setEditorOpen(true); }} data-testid={`edit-property-${p.id}`}><Pencil className="h-4 w-4" /></Button>
                        <Button size="icon" variant="outline" onClick={() => setToDelete(p)} data-testid={`delete-property-${p.id}`} className="hover:bg-red-50 hover:text-red-600 hover:border-red-200"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-slate-500">No properties found.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <PropertyEditor open={editorOpen} onClose={() => setEditorOpen(false)} property={editing} onSaved={load} />

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent data-testid="delete-confirm-dialog">
          <AlertDialogHeader><AlertDialogTitle>Delete this property?</AlertDialogTitle><AlertDialogDescription>"{toDelete?.title}" will be permanently removed. This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={del} className="bg-red-600 hover:bg-red-700" data-testid="confirm-delete-btn">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
