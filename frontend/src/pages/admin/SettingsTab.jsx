import React, { useEffect, useState } from "react";
import { Plus, Trash2, Save } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/apiClient";
import { useSettings } from "@/context/SettingsContext";

export default function SettingsTab() {
  const { settings, reload } = useSettings();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (settings) setForm(JSON.parse(JSON.stringify(settings))); }, [settings]);

  if (!form) return <p className="text-slate-500">Loading…</p>;

  const setPath = (path, value) => {
    setForm((f) => {
      const copy = { ...f };
      let node = copy;
      for (let i = 0; i < path.length - 1; i++) { node[path[i]] = { ...node[path[i]] }; node = node[path[i]]; }
      node[path[path.length - 1]] = value;
      return copy;
    });
  };

  const setStat = (i, key, value) => setForm((f) => { const stats = [...f.stats]; stats[i] = { ...stats[i], [key]: value }; return { ...f, stats }; });
  const addStat = () => setForm((f) => ({ ...f, stats: [...(f.stats || []), { label: "New Stat", value: "0" }] }));
  const removeStat = (i) => setForm((f) => ({ ...f, stats: f.stats.filter((_, idx) => idx !== i) }));

  const setFaq = (i, key, value) => setForm((f) => { const faqs = [...f.faqs]; faqs[i] = { ...faqs[i], [key]: value }; return { ...f, faqs }; });
  const addFaq = () => setForm((f) => ({ ...f, faqs: [...(f.faqs || []), { q: "", a: "" }] }));
  const removeFaq = (i) => setForm((f) => ({ ...f, faqs: f.faqs.filter((_, idx) => idx !== i) }));

  const save = async () => {
    setSaving(true);
    try { await api.put("/settings", form); toast.success("Settings saved"); reload(); }
    catch { toast.error("Failed to save settings"); }
    finally { setSaving(false); }
  };

  const Card = ({ title, children }) => (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h3 className="font-serif text-lg font-semibold text-slate-900 mb-4">{title}</h3>
      <div className="space-y-4">{children}</div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-3xl" data-testid="settings-tab">
      <div className="flex justify-end sticky top-20 z-10">
        <Button onClick={save} disabled={saving} className="bg-amber-500 text-slate-950 hover:bg-amber-400 font-semibold shadow-lg" data-testid="save-settings-btn"><Save className="h-4 w-4 mr-2" />{saving ? "Saving…" : "Save All Changes"}</Button>
      </div>

      <Card title="Hero Section">
        <div><Label>Headline</Label><Input value={form.hero?.headline || ""} onChange={(e) => setPath(["hero", "headline"], e.target.value)} className="mt-1.5" data-testid="set-hero-headline" /></div>
        <div><Label>Subheadline</Label><Textarea value={form.hero?.subheadline || ""} onChange={(e) => setPath(["hero", "subheadline"], e.target.value)} className="mt-1.5" data-testid="set-hero-sub" /></div>
      </Card>

      <Card title="Statistics">
        <div><Label>Section Heading</Label><Input value={form.stats_heading || ""} onChange={(e) => setPath(["stats_heading"], e.target.value)} className="mt-1.5" data-testid="set-stats-heading" /></div>
        {(form.stats || []).map((s, i) => (
          <div key={i} className="flex gap-2 items-end" data-testid={`set-stat-${i}`}>
            <div className="flex-1"><Label className="text-xs">Value</Label><Input value={s.value} onChange={(e) => setStat(i, "value", e.target.value)} className="mt-1" /></div>
            <div className="flex-1"><Label className="text-xs">Label</Label><Input value={s.label} onChange={(e) => setStat(i, "label", e.target.value)} className="mt-1" /></div>
            <Button size="icon" variant="outline" onClick={() => removeStat(i)} className="hover:text-red-600"><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
        <Button variant="outline" onClick={addStat} data-testid="add-stat-btn"><Plus className="h-4 w-4 mr-2" />Add Statistic</Button>
      </Card>

      <Card title="Contact Details">
        <div className="grid sm:grid-cols-2 gap-4">
          <div><Label>Phone</Label><Input value={form.contact?.phone || ""} onChange={(e) => setPath(["contact", "phone"], e.target.value)} className="mt-1.5" data-testid="set-phone" /></div>
          <div><Label>WhatsApp (digits only)</Label><Input value={form.contact?.whatsapp || ""} onChange={(e) => setPath(["contact", "whatsapp"], e.target.value)} className="mt-1.5" data-testid="set-whatsapp" /></div>
          <div><Label>Email</Label><Input value={form.contact?.email || ""} onChange={(e) => setPath(["contact", "email"], e.target.value)} className="mt-1.5" data-testid="set-email" /></div>
          <div><Label>Business Hours</Label><Input value={form.contact?.hours || ""} onChange={(e) => setPath(["contact", "hours"], e.target.value)} className="mt-1.5" data-testid="set-hours" /></div>
        </div>
        <div><Label>Office Address</Label><Input value={form.contact?.address || ""} onChange={(e) => setPath(["contact", "address"], e.target.value)} className="mt-1.5" placeholder="Add your office address" data-testid="set-address" /></div>
      </Card>

      <Card title="Google Maps Location">
        <div className="grid sm:grid-cols-2 gap-4">
          <div><Label>Latitude</Label><Input type="number" value={form.map?.lat ?? ""} onChange={(e) => setPath(["map", "lat"], e.target.value === "" ? null : Number(e.target.value))} className="mt-1.5" data-testid="set-map-lat" /></div>
          <div><Label>Longitude</Label><Input type="number" value={form.map?.lng ?? ""} onChange={(e) => setPath(["map", "lng"], e.target.value === "" ? null : Number(e.target.value))} className="mt-1.5" data-testid="set-map-lng" /></div>
        </div>
        <div><Label>Google Maps URL (optional)</Label><Input value={form.map?.url || ""} onChange={(e) => setPath(["map", "url"], e.target.value)} className="mt-1.5" data-testid="set-map-url" /></div>
      </Card>

      <Card title="Social Media Links">
        <div className="grid sm:grid-cols-2 gap-4">
          {["linkedin", "instagram", "facebook", "youtube"].map((s) => (
            <div key={s}><Label className="capitalize">{s}</Label><Input value={form.social?.[s] || ""} onChange={(e) => setPath(["social", s], e.target.value)} className="mt-1.5" data-testid={`set-social-${s}`} /></div>
          ))}
        </div>
      </Card>

      <Card title="About Us">
        <div><Label>Headline</Label><Input value={form.about?.headline || ""} onChange={(e) => setPath(["about", "headline"], e.target.value)} className="mt-1.5" data-testid="set-about-headline" /></div>
        <div><Label>Body</Label><Textarea value={form.about?.body || ""} onChange={(e) => setPath(["about", "body"], e.target.value)} className="mt-1.5 min-h-[80px]" data-testid="set-about-body" /></div>
        <div><Label>Mission</Label><Textarea value={form.about?.mission || ""} onChange={(e) => setPath(["about", "mission"], e.target.value)} className="mt-1.5" data-testid="set-about-mission" /></div>
        <div><Label>Vision</Label><Textarea value={form.about?.vision || ""} onChange={(e) => setPath(["about", "vision"], e.target.value)} className="mt-1.5" data-testid="set-about-vision" /></div>
      </Card>

      <Card title="FAQs">
        {(form.faqs || []).map((f, i) => (
          <div key={i} className="border border-slate-200 rounded-lg p-4 space-y-2" data-testid={`set-faq-${i}`}>
            <div className="flex justify-between items-center"><Label className="text-xs">Question {i + 1}</Label><Button size="icon" variant="ghost" onClick={() => removeFaq(i)} className="h-7 w-7 hover:text-red-600"><Trash2 className="h-4 w-4" /></Button></div>
            <Input value={f.q} onChange={(e) => setFaq(i, "q", e.target.value)} placeholder="Question" />
            <Textarea value={f.a} onChange={(e) => setFaq(i, "a", e.target.value)} placeholder="Answer" />
          </div>
        ))}
        <Button variant="outline" onClick={addFaq} data-testid="add-faq-btn"><Plus className="h-4 w-4 mr-2" />Add FAQ</Button>
      </Card>

      <Card title="Footer">
        <div><Label>Footer Note</Label><Textarea value={form.footer_note || ""} onChange={(e) => setPath(["footer_note"], e.target.value)} className="mt-1.5" data-testid="set-footer-note" /></div>
      </Card>

      <div className="flex justify-end pb-10">
        <Button onClick={save} disabled={saving} className="bg-amber-500 text-slate-950 hover:bg-amber-400 font-semibold"><Save className="h-4 w-4 mr-2" />{saving ? "Saving…" : "Save All Changes"}</Button>
      </div>
    </div>
  );
}
