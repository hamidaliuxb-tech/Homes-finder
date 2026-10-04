import React, { useEffect, useState } from "react";
import {
  ShieldCheck, FileText, Cookie, Building, AlertTriangle, Scale, Plus, Edit3, Trash2,
  ExternalLink, Save, Loader2, Search, CheckCircle2, Info
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { api } from "@/lib/apiClient";

const CATEGORY_LABELS = {
  legal_policy: { label: "Policy & Terms", color: "bg-blue-100 text-blue-800 border-blue-200" },
  disclaimer: { label: "Regulatory Disclaimer", color: "bg-amber-100 text-amber-800 border-amber-200" },
  legal_service: { label: "Legal & Advisory Service", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
};

const ICONS = {
  ShieldCheck, FileText, Cookie, Building, AlertTriangle, Scale
};

export default function LegalServicesTab() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Modal editor state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingSlug, setEditingSlug] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    slug: "",
    subtitle: "",
    category: "legal_service",
    icon: "ShieldCheck",
    paragraphsText: "",
  });

  const loadDocs = async () => {
    setLoading(true);
    try {
      const res = await api.get("/legal");
      setDocs(res.data || []);
    } catch (e) {
      toast.error("Failed to load legal services and documents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocs();
  }, []);

  const openAddModal = () => {
    setEditingSlug(null);
    setForm({
      title: "",
      slug: "",
      subtitle: "",
      category: "legal_service",
      icon: "ShieldCheck",
      paragraphsText: "",
    });
    setEditModalOpen(true);
  };

  const openEditModal = (doc) => {
    setEditingSlug(doc.slug);
    setForm({
      title: doc.title || "",
      slug: doc.slug || "",
      subtitle: doc.subtitle || "",
      category: doc.category || "legal_service",
      icon: doc.icon || "ShieldCheck",
      paragraphsText: (doc.body || []).join("\n\n"),
    });
    setEditModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Document title is required");
      return;
    }

    const paragraphs = form.paragraphsText
      .split("\n\n")
      .map((p) => p.trim())
      .filter(Boolean);

    setSaving(true);
    try {
      if (editingSlug) {
        // Update
        await api.put(`/legal/${editingSlug}`, {
          title: form.title,
          subtitle: form.subtitle,
          category: form.category,
          icon: form.icon,
          body: paragraphs.length ? paragraphs : [form.paragraphsText.trim()],
        });
        toast.success("Legal document updated successfully!");
      } else {
        // Create
        await api.post("/legal", {
          title: form.title,
          slug: form.slug,
          subtitle: form.subtitle,
          category: form.category,
          icon: form.icon,
          body: paragraphs.length ? paragraphs : [form.paragraphsText.trim()],
        });
        toast.success("New legal document added successfully!");
      }
      setEditModalOpen(false);
      loadDocs();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to save legal document");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (slug, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      await api.delete(`/legal/${slug}`);
      toast.success("Legal document deleted");
      loadDocs();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to delete legal document");
    }
  };

  const filtered = docs.filter((d) => {
    const matchSearch =
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.slug.toLowerCase().includes(search.toLowerCase()) ||
      (d.subtitle || "").toLowerCase().includes(search.toLowerCase());
    const matchCat = selectedCategory === "all" || d.category === selectedCategory;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-6" data-testid="legal-services-tab">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <Scale className="h-6 w-6 text-amber-500" />
            <h2 className="font-serif text-2xl font-bold text-slate-900">Legal Services &amp; Regulatory CMS</h2>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Manage legal documents, terms, regulatory disclaimers, and advisory services across the website.
          </p>
        </div>
        <Button onClick={openAddModal} className="bg-amber-500 text-slate-950 hover:bg-amber-400 font-semibold shadow-sm">
          <Plus className="h-4 w-4 mr-1.5" /> Add Legal Document / Service
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="h-4 w-4 absolute left-3 top-3.5 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search legal documents..."
            className="pl-9 h-11 bg-white"
          />
        </div>
        <div className="flex gap-1.5 w-full sm:w-auto overflow-x-auto pb-1">
          {[
            ["all", "All Documents"],
            ["legal_service", "Legal Services"],
            ["legal_policy", "Policies & Terms"],
            ["disclaimer", "Disclaimers"],
          ].map(([k, lbl]) => (
            <button
              key={k}
              onClick={() => setSelectedCategory(k)}
              className={`text-xs px-3.5 py-2 rounded-lg font-medium transition-colors shrink-0 ${
                selectedCategory === k
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {lbl}
            </button>
          ))}
        </div>
      </div>

      {/* Content List */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-amber-500 mb-2" />
          Loading legal content...
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
          No legal documents found matching your filter.
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((doc) => {
            const catInfo = CATEGORY_LABELS[doc.category] || { label: doc.category, color: "bg-slate-100 text-slate-800" };
            return (
              <div
                key={doc.slug}
                className="bg-white rounded-xl border border-slate-200 p-5 hover:border-slate-300 transition-shadow hover:shadow-sm"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-serif text-lg font-bold text-slate-900">{doc.title}</h3>
                      <Badge variant="outline" className={`text-xs font-semibold ${catInfo.color}`}>
                        {catInfo.label}
                      </Badge>
                      <span className="text-xs font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                        /legal/{doc.slug}
                      </span>
                    </div>
                    {doc.subtitle && <p className="text-sm text-slate-600">{doc.subtitle}</p>}
                    <div className="text-xs text-slate-400 line-clamp-2 mt-2 leading-relaxed">
                      {(doc.body || []).join(" ")}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={`/legal/${doc.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs px-3 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                      title="View live page"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> View Live
                    </a>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditModal(doc)}
                      className="border-slate-300 text-slate-700 hover:bg-slate-100"
                    >
                      <Edit3 className="h-3.5 w-3.5 mr-1" /> Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(doc.slug, doc.title)}
                      className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">
              {editingSlug ? `Edit: ${form.title}` : "Add New Legal Document or Service"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <div>
              <Label className="text-slate-800 font-medium">Document Title *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Conveyancing & Title Deed Advisory"
                className="mt-1.5 h-11"
                required
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-800 font-medium">URL Slug</Label>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                  placeholder="e.g. conveyancing-advisory"
                  className="mt-1.5 h-11 font-mono text-sm"
                  disabled={Boolean(editingSlug)}
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  {editingSlug ? "Slug cannot be changed once created." : "Leave empty to auto-generate from title."}
                </span>
              </div>

              <div>
                <Label className="text-slate-800 font-medium">Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger className="mt-1.5 h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="legal_service">Legal &amp; Advisory Service</SelectItem>
                    <SelectItem value="legal_policy">Policy &amp; Terms</SelectItem>
                    <SelectItem value="disclaimer">Regulatory Disclaimer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-slate-800 font-medium">Subtitle / Summary</Label>
              <Input
                value={form.subtitle}
                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                placeholder="Brief summary shown at the top of the legal page"
                className="mt-1.5 h-11"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <Label className="text-slate-800 font-medium">Document Paragraphs / Content *</Label>
                <span className="text-xs text-slate-400">Separate paragraphs with a blank line</span>
              </div>
              <Textarea
                value={form.paragraphsText}
                onChange={(e) => setForm({ ...form, paragraphsText: e.target.value })}
                placeholder="Enter detailed terms, legal clauses, or service description.&#10;&#10;Leave an empty line to start a new paragraph."
                className="min-h-[220px] font-sans text-sm leading-relaxed"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <Button type="button" variant="outline" onClick={() => setEditModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="bg-amber-500 text-slate-950 hover:bg-amber-400 font-semibold">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Save className="h-4 w-4 mr-1.5" />}
                {editingSlug ? "Save Changes" : "Create Document"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
