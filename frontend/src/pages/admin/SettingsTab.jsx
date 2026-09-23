import React, { useEffect, useState } from "react";
import {
  Plus, Trash2, Save, Search, Building2, Sparkles,
  HelpCircle, Info, PhoneCall, LayoutGrid, Megaphone, Loader2
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/apiClient";
import { useSettings } from "@/context/SettingsContext";
import { EMIRATES } from "@/data/site";

const SECTIONS = [
  { key: "dropdowns", label: "Dropdowns & Taxonomies", icon: LayoutGrid },
  { key: "announcement_hero", label: "Hero & Banner", icon: Megaphone },
  { key: "why_us", label: "Why Choose Us", icon: Sparkles },
  { key: "stats", label: "Statistics", icon: Building2 },
  { key: "about_faq", label: "About Us & FAQs", icon: HelpCircle },
  { key: "contact_map", label: "Contact & Maps", icon: PhoneCall },
];

export default function SettingsTab() {
  const { settings, reload } = useSettings();
  const [activeSection, setActiveSection] = useState("dropdowns");
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  // Dropdown Manager state
  const [taxCategory, setTaxCategory] = useState("developers");
  const [selectedEmirate, setSelectedEmirate] = useState("Dubai");
  const [newOptionVal, setNewOptionVal] = useState("");
  const [optionSearch, setOptionSearch] = useState("");
  const [addingOpt, setAddingOpt] = useState(false);

  useEffect(() => {
    if (settings) {
      const copy = JSON.parse(JSON.stringify(settings));
      if (!copy.options) copy.options = {};
      if (!copy.options.developers) copy.options.developers = [];
      if (!copy.options.property_types) copy.options.property_types = [];
      if (!copy.options.communities) copy.options.communities = {};
      if (!copy.options.amenities) copy.options.amenities = [];
      if (!copy.announcement) copy.announcement = { enabled: false, text: "", link: "", link_text: "Learn More →" };
      if (!copy.why_us) copy.why_us = [];
      setForm(copy);
    }
  }, [settings]);

  if (!form) return <div className="p-8 text-center text-slate-500">Loading settings…</div>;

  const setPath = (path, value) => {
    setForm((f) => {
      const copy = { ...f };
      let node = copy;
      for (let i = 0; i < path.length - 1; i++) {
        node[path[i]] = { ...node[path[i]] };
        node = node[path[i]];
      }
      node[path[path.length - 1]] = value;
      return copy;
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.put("/settings", form);
      toast.success("Settings saved successfully!");
      reload();
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  // Add Option directly via API
  const handleAddOption = async (e) => {
    e?.preventDefault();
    const val = newOptionVal.trim();
    if (!val) return;
    setAddingOpt(true);
    try {
      const res = await api.post("/options/add", {
        category: taxCategory,
        value: val,
        emirate: selectedEmirate,
      });
      setForm((prev) => ({
        ...prev,
        options: res.data.options,
      }));
      setNewOptionVal("");
      toast.success(`Added "${val}" to ${taxCategory}!`);
      reload();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to add option");
    } finally {
      setAddingOpt(false);
    }
  };

  // Delete Option directly via API
  const handleDeleteOption = async (val) => {
    if (!window.confirm(`Delete "${val}" from ${taxCategory}?`)) return;
    try {
      const res = await api.delete("/options/delete", {
        data: {
          category: taxCategory,
          value: val,
          emirate: selectedEmirate,
        },
      });
      setForm((prev) => ({
        ...prev,
        options: res.data.options,
      }));
      toast.success(`Deleted "${val}"`);
      reload();
    } catch {
      toast.error("Failed to delete option");
    }
  };

  const currentOptionsList = () => {
    if (!form.options) return [];
    if (taxCategory === "communities") {
      return form.options.communities?.[selectedEmirate] || [];
    }
    return form.options[taxCategory] || [];
  };

  const filteredOptions = currentOptionsList().filter((item) =>
    item.toLowerCase().includes(optionSearch.toLowerCase())
  );

  return (
    <div className="space-y-6" data-testid="settings-tab">
      {/* Top Header & Save Button */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-white rounded-xl border border-slate-200 p-4 sticky top-20 z-20 shadow-sm">
        <div>
          <h2 className="font-serif text-xl font-bold text-slate-900">Website Content &amp; Taxonomies CMS</h2>
          <p className="text-xs text-slate-500">Manage all website text, dropdown choices, banners and configurations.</p>
        </div>
        <Button
          onClick={save}
          disabled={saving}
          className="bg-amber-500 text-slate-950 hover:bg-amber-400 font-semibold shadow-md"
          data-testid="save-settings-btn"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          {saving ? "Saving…" : "Save All Changes"}
        </Button>
      </div>

      {/* Sub-Section Navigation Tabs */}
      <div className="flex gap-2 border-b border-slate-200 overflow-x-auto pb-1">
        {SECTIONS.map((sec) => (
          <button
            key={sec.key}
            onClick={() => setActiveSection(sec.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeSection === sec.key
                ? "bg-slate-900 text-white shadow"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <sec.icon className="h-4 w-4 text-amber-400" />
            {sec.label}
          </button>
        ))}
      </div>

      {/* 1. DROPDOWNS & TAXONOMIES */}
      {activeSection === "dropdowns" && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-serif text-lg font-bold text-slate-900">Dropdown Options Manager</h3>
                <p className="text-xs text-slate-500">Edit or add options for developers, communities, property types and amenities used in property listings.</p>
              </div>
              {/* Category selector */}
              <div className="flex gap-1.5 flex-wrap">
                {[
                  ["developers", "Developers"],
                  ["communities", "Communities"],
                  ["property_types", "Property Types"],
                  ["amenities", "Amenities"],
                ].map(([cat, label]) => (
                  <button
                    key={cat}
                    onClick={() => { setTaxCategory(cat); setOptionSearch(""); setNewOptionVal(""); }}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors ${
                      taxCategory === cat
                        ? "bg-amber-500 border-amber-500 text-slate-950 font-bold"
                        : "border-slate-300 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Emirate filter for Communities */}
            {taxCategory === "communities" && (
              <div className="flex items-center gap-3 pt-4">
                <Label className="text-xs font-semibold text-slate-700">Filter by Emirate:</Label>
                <div className="w-48">
                  <Select value={selectedEmirate} onValueChange={setSelectedEmirate}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {EMIRATES.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Add New Option Form */}
            <form onSubmit={handleAddOption} className="mt-4 flex gap-2 items-center flex-wrap sm:flex-nowrap">
              <Input
                value={newOptionVal}
                onChange={(e) => setNewOptionVal(e.target.value)}
                placeholder={`Type new ${taxCategory.replace("_", " ")} name to add…`}
                className="h-10 flex-1"
              />
              <Button type="submit" disabled={addingOpt || !newOptionVal.trim()} className="bg-slate-900 text-white hover:bg-slate-800">
                {addingOpt ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
                Add Option
              </Button>
            </form>

            {/* Search Filter & Items Count */}
            <div className="mt-5 flex items-center justify-between gap-3 flex-wrap">
              <div className="relative max-w-xs flex-1">
                <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  value={optionSearch}
                  onChange={(e) => setOptionSearch(e.target.value)}
                  placeholder="Filter existing items…"
                  className="h-8 pl-8 text-xs"
                />
              </div>
              <span className="text-xs text-slate-500">{filteredOptions.length} of {currentOptionsList().length} item(s)</span>
            </div>

            {/* Items Grid */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[420px] overflow-y-auto p-1 border border-slate-100 rounded-lg">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt) => (
                  <div
                    key={opt}
                    className="flex items-center justify-between px-3 py-2 bg-slate-50 hover:bg-slate-100 rounded-md border border-slate-200 text-sm transition-colors group"
                  >
                    <span className="font-medium text-slate-800 truncate pr-2">{opt}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteOption(opt)}
                      className="text-slate-400 hover:text-red-600 transition-colors p-1"
                      title="Delete option"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-8 text-center text-sm text-slate-400">
                  No items found matching "{optionSearch}"
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. HERO & ANNOUNCEMENT BANNER */}
      {activeSection === "announcement_hero" && (
        <div className="space-y-6 max-w-3xl">
          {/* Announcement Bar */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-lg font-bold text-slate-900">Top Announcement Banner</h3>
                <p className="text-xs text-slate-500">Shows an eye-catching promotional bar at the very top of every website page.</p>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="banner-toggle" className="text-xs font-semibold">Enable Banner</Label>
                <Switch
                  id="banner-toggle"
                  checked={form.announcement?.enabled || false}
                  onCheckedChange={(v) => setPath(["announcement", "enabled"], v)}
                />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <Label>Banner Message</Label>
                <Input
                  value={form.announcement?.text || ""}
                  onChange={(e) => setPath(["announcement", "text"], e.target.value)}
                  placeholder="e.g. Special Offer: 0% Commission on Selected Off-Plan Projects"
                  className="mt-1.5"
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label>Link Destination</Label>
                  <Input
                    value={form.announcement?.link || ""}
                    onChange={(e) => setPath(["announcement", "link"], e.target.value)}
                    placeholder="e.g. /off-plan or /contact"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>Link Button Text</Label>
                  <Input
                    value={form.announcement?.link_text || ""}
                    onChange={(e) => setPath(["announcement", "link_text"], e.target.value)}
                    placeholder="e.g. Inquire Now →"
                    className="mt-1.5"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Hero Section */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <h3 className="font-serif text-lg font-bold text-slate-900">Hero Section</h3>
            <div>
              <Label>Headline</Label>
              <Input
                value={form.hero?.headline || ""}
                onChange={(e) => setPath(["hero", "headline"], e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Subheadline</Label>
              <Textarea
                value={form.hero?.subheadline || ""}
                onChange={(e) => setPath(["hero", "subheadline"], e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Hero Background Image URL</Label>
              <Input
                value={form.hero?.image_url || ""}
                onChange={(e) => setPath(["hero", "image_url"], e.target.value)}
                placeholder="https://..."
                className="mt-1.5"
              />
              {form.hero?.image_url && (
                <div className="mt-2 h-28 w-full rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                  <img src={form.hero.image_url} alt="Hero preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>

          {/* Footer Note */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-3">
            <h3 className="font-serif text-lg font-bold text-slate-900">Footer Text</h3>
            <div>
              <Label>Footer Description</Label>
              <Textarea
                value={form.footer_note || ""}
                onChange={(e) => setPath(["footer_note"], e.target.value)}
                className="mt-1.5"
              />
            </div>
          </div>
        </div>
      )}

      {/* 3. WHY CHOOSE US */}
      {activeSection === "why_us" && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6 max-w-4xl">
          <div>
            <h3 className="font-serif text-lg font-bold text-slate-900">"Why Choose Us" Value Cards</h3>
            <p className="text-xs text-slate-500">Edit the 6 value proposition cards displayed on the homepage.</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {(form.why_us || []).map((card, i) => (
              <div key={i} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
                <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Card {i + 1}</span>
                <div>
                  <Label className="text-xs">Title</Label>
                  <Input
                    value={card.title || ""}
                    onChange={(e) => {
                      const copy = [...form.why_us];
                      copy[i] = { ...copy[i], title: e.target.value };
                      setForm({ ...form, why_us: copy });
                    }}
                    className="mt-1 h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs">Description</Label>
                  <Textarea
                    value={card.desc || ""}
                    onChange={(e) => {
                      const copy = [...form.why_us];
                      copy[i] = { ...copy[i], desc: e.target.value };
                      setForm({ ...form, why_us: copy });
                    }}
                    className="mt-1 min-h-[70px] text-xs"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. STATISTICS */}
      {activeSection === "stats" && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 max-w-3xl">
          <h3 className="font-serif text-lg font-bold text-slate-900">Statistics Counters</h3>
          <div>
            <Label>Section Heading</Label>
            <Input
              value={form.stats_heading || ""}
              onChange={(e) => setPath(["stats_heading"], e.target.value)}
              className="mt-1.5"
            />
          </div>
          {(form.stats || []).map((s, i) => (
            <div key={i} className="flex gap-2 items-end">
              <div className="flex-1">
                <Label className="text-xs">Value (e.g. 100+)</Label>
                <Input
                  value={s.value}
                  onChange={(e) => {
                    const stats = [...form.stats];
                    stats[i] = { ...stats[i], value: e.target.value };
                    setForm({ ...form, stats });
                  }}
                  className="mt-1"
                />
              </div>
              <div className="flex-1">
                <Label className="text-xs">Label</Label>
                <Input
                  value={s.label}
                  onChange={(e) => {
                    const stats = [...form.stats];
                    stats[i] = { ...stats[i], label: e.target.value };
                    setForm({ ...form, stats });
                  }}
                  className="mt-1"
                />
              </div>
              <Button
                size="icon"
                variant="outline"
                onClick={() => setForm({ ...form, stats: form.stats.filter((_, idx) => idx !== i) })}
                className="hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            onClick={() => setForm({ ...form, stats: [...(form.stats || []), { label: "New Stat", value: "0" }] })}
          >
            <Plus className="h-4 w-4 mr-2" />Add Statistic
          </Button>
        </div>
      )}

      {/* 5. ABOUT US & FAQS */}
      {activeSection === "about_faq" && (
        <div className="space-y-6 max-w-3xl">
          {/* About Us */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <h3 className="font-serif text-lg font-bold text-slate-900">About Us Page Content</h3>
            <div>
              <Label>Headline</Label>
              <Input
                value={form.about?.headline || ""}
                onChange={(e) => setPath(["about", "headline"], e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Main Story / Body</Label>
              <Textarea
                value={form.about?.body || ""}
                onChange={(e) => setPath(["about", "body"], e.target.value)}
                className="mt-1.5 min-h-[90px]"
              />
            </div>
            <div>
              <Label>Mission Statement</Label>
              <Textarea
                value={form.about?.mission || ""}
                onChange={(e) => setPath(["about", "mission"], e.target.value)}
                className="mt-1.5 min-h-[70px]"
              />
            </div>
            <div>
              <Label>Vision Statement</Label>
              <Textarea
                value={form.about?.vision || ""}
                onChange={(e) => setPath(["about", "vision"], e.target.value)}
                className="mt-1.5 min-h-[70px]"
              />
            </div>
          </div>

          {/* FAQs */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <h3 className="font-serif text-lg font-bold text-slate-900">Frequently Asked Questions (FAQs)</h3>
            {(form.faqs || []).map((f, i) => (
              <div key={i} className="border border-slate-200 rounded-lg p-4 space-y-2 bg-slate-50/50">
                <div className="flex justify-between items-center">
                  <Label className="text-xs font-semibold">Question {i + 1}</Label>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setForm({ ...form, faqs: form.faqs.filter((_, idx) => idx !== i) })}
                    className="h-7 w-7 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <Input
                  value={f.q}
                  onChange={(e) => {
                    const faqs = [...form.faqs];
                    faqs[i] = { ...faqs[i], q: e.target.value };
                    setForm({ ...form, faqs });
                  }}
                  placeholder="Question"
                />
                <Textarea
                  value={f.a}
                  onChange={(e) => {
                    const faqs = [...form.faqs];
                    faqs[i] = { ...faqs[i], a: e.target.value };
                    setForm({ ...form, faqs });
                  }}
                  placeholder="Answer"
                  className="min-h-[70px]"
                />
              </div>
            ))}
            <Button
              variant="outline"
              onClick={() => setForm({ ...form, faqs: [...(form.faqs || []), { q: "", a: "" }] })}
            >
              <Plus className="h-4 w-4 mr-2" />Add FAQ
            </Button>
          </div>
        </div>
      )}

      {/* 6. CONTACT & MAPS */}
      {activeSection === "contact_map" && (
        <div className="space-y-6 max-w-3xl">
          {/* Contact Details */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <h3 className="font-serif text-lg font-bold text-slate-900">Contact Details</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Phone</Label>
                <Input
                  value={form.contact?.phone || ""}
                  onChange={(e) => setPath(["contact", "phone"], e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>WhatsApp (digits only with country code)</Label>
                <Input
                  value={form.contact?.whatsapp || ""}
                  onChange={(e) => setPath(["contact", "whatsapp"], e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  value={form.contact?.email || ""}
                  onChange={(e) => setPath(["contact", "email"], e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Business Hours</Label>
                <Input
                  value={form.contact?.hours || ""}
                  onChange={(e) => setPath(["contact", "hours"], e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>
            <div>
              <Label>Office Address</Label>
              <Input
                value={form.contact?.address || ""}
                onChange={(e) => setPath(["contact", "address"], e.target.value)}
                className="mt-1.5"
              />
            </div>
          </div>

          {/* Google Maps Location */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <h3 className="font-serif text-lg font-bold text-slate-900">Google Maps Location</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Latitude</Label>
                <Input
                  type="number"
                  value={form.map?.lat ?? ""}
                  onChange={(e) => setPath(["map", "lat"], e.target.value === "" ? null : Number(e.target.value))}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Longitude</Label>
                <Input
                  type="number"
                  value={form.map?.lng ?? ""}
                  onChange={(e) => setPath(["map", "lng"], e.target.value === "" ? null : Number(e.target.value))}
                  className="mt-1.5"
                />
              </div>
            </div>
            <div>
              <Label>Google Maps URL (optional)</Label>
              <Input
                value={form.map?.url || ""}
                onChange={(e) => setPath(["map", "url"], e.target.value)}
                className="mt-1.5"
              />
            </div>
          </div>

          {/* Social Links */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <h3 className="font-serif text-lg font-bold text-slate-900">Social Media Links</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {["linkedin", "instagram", "facebook", "youtube"].map((s) => (
                <div key={s}>
                  <Label className="capitalize">{s} Profile URL</Label>
                  <Input
                    value={form.social?.[s] || ""}
                    onChange={(e) => setPath(["social", s], e.target.value)}
                    className="mt-1.5"
                    placeholder={`https://${s}.com/...`}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sticky Bottom Save Button */}
      <div className="flex justify-end pt-4 pb-12">
        <Button
          onClick={save}
          disabled={saving}
          className="bg-amber-500 text-slate-950 hover:bg-amber-400 font-semibold shadow-lg px-8 py-3"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          {saving ? "Saving…" : "Save All Changes"}
        </Button>
      </div>
    </div>
  );
}
