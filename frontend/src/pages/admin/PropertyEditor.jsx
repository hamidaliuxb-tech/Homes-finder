import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ImageUploader from "@/components/ImageUploader";
import { api } from "@/lib/apiClient";
import { useSettings } from "@/context/SettingsContext";
import { EMIRATES, COMMUNITIES, PROPERTY_TYPES } from "@/data/site";

const TOP_DEVELOPERS = [
  "Emaar Properties", "DAMAC Properties", "Nakheel", "Sobha Realty", "Aldar Properties",
  "Meraas", "Danube Properties", "Binghatti Developers", "Omniyat", "Select Group",
  "Ellington Properties", "MAG Property Development", "Deyaar", "Azizi Developments",
  "Tiger Properties", "Al Habtoor Group", "Bloom Properties", "Arada",
];

const EMPTY = {
  title: "", purpose: "buy", category: "residential", property_type: "Apartment", status: "ready",
  availability: "available", emirate: "Dubai", community: "", location: "", price: 0, price_period: "",
  bedrooms: 0, bathrooms: 0, area: 0, plot_area: null, furnished: "unfurnished", developer: "",
  completion_date: "", service_charges: "", handover: "", payment_plan: "", rental_yield: "", roi: "",
  description: "", features: [], amenities: [], location_advantages: [], nearby_schools: [],
  nearby_hospitals: [], nearby_transport: [], investment_highlights: [], images: [], video_url: "",
  virtual_tour_url: "", permit_number: "", lat: null, lng: null, map_url: "", featured: false,
  is_demo: false, published: true,
};

const toList = (s) => (s || "").split("\n").map((x) => x.trim()).filter(Boolean);
const fromList = (a) => (a || []).join("\n");

export default function PropertyEditor({ open, onClose, property, onSaved }) {
  const { settings } = useSettings();
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (property) setForm({ ...EMPTY, ...property });
    else setForm(EMPTY);
  }, [property, open]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const num = (k) => (e) => set(k, e.target.value === "" ? (k === "price" || k === "area" || k === "bedrooms" || k === "bathrooms" ? 0 : null) : Number(e.target.value));

  const save = async () => {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    setSaving(true);
    const payload = { ...form };
    try {
      if (property?.id) await api.put(`/properties/${property.id}`, payload);
      else await api.post("/properties", payload);
      toast.success(property?.id ? "Property updated" : "Property created");
      onSaved();
      onClose();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed to save property");
    } finally {
      setSaving(false);
    }
  };

  const communities = settings?.options?.communities?.[form.emirate] || COMMUNITIES[form.emirate] || [];
  const developers = settings?.options?.developers?.length ? settings.options.developers : TOP_DEVELOPERS;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="property-editor">
        <DialogHeader><DialogTitle className="font-serif text-2xl">{property?.id ? "Edit Property" : "Add Property"}</DialogTitle></DialogHeader>
        <div className="space-y-5 py-2">
          <div>
            <Label>Title *</Label>
            <Input value={form.title} onChange={(e) => set("title", e.target.value)} className="mt-1.5" data-testid="pf-title" placeholder="e.g. Luxury 3 Bedroom Apartment" />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div><Label>Purpose</Label>
              <Select value={form.purpose} onValueChange={(v) => set("purpose", v)}><SelectTrigger className="mt-1.5" data-testid="pf-purpose"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="buy">Buy / Sale</SelectItem><SelectItem value="rent">Rent</SelectItem></SelectContent></Select></div>
            <div><Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => set("category", v)}><SelectTrigger className="mt-1.5" data-testid="pf-category"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="residential">Residential</SelectItem><SelectItem value="commercial">Commercial</SelectItem></SelectContent></Select></div>
            <div><Label>Property Type</Label>
              <Select value={form.property_type} onValueChange={(v) => set("property_type", v)}><SelectTrigger className="mt-1.5" data-testid="pf-type"><SelectValue /></SelectTrigger>
                <SelectContent>{PROPERTY_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v)}><SelectTrigger className="mt-1.5" data-testid="pf-status"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="ready">Ready</SelectItem><SelectItem value="offplan">Off-Plan</SelectItem></SelectContent></Select></div>
            <div><Label>Availability</Label>
              <Select value={form.availability} onValueChange={(v) => set("availability", v)}><SelectTrigger className="mt-1.5" data-testid="pf-availability"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="available">Available</SelectItem><SelectItem value="sold">Sold</SelectItem><SelectItem value="rented">Rented</SelectItem></SelectContent></Select></div>
            <div><Label>Furnished</Label>
              <Select value={form.furnished} onValueChange={(v) => set("furnished", v)}><SelectTrigger className="mt-1.5" data-testid="pf-furnished"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="furnished">Furnished</SelectItem><SelectItem value="unfurnished">Unfurnished</SelectItem><SelectItem value="semi">Semi-furnished</SelectItem></SelectContent></Select></div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div><Label>Emirate</Label>
              <Select value={form.emirate} onValueChange={(v) => { set("emirate", v); set("community", ""); }}><SelectTrigger className="mt-1.5" data-testid="pf-emirate"><SelectValue /></SelectTrigger>
                <SelectContent>{EMIRATES.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent></Select></div>
            <div>
              <Label>Community / Area</Label>
              <Input
                list="admin-community-list"
                value={form.community}
                onChange={(e) => set("community", e.target.value)}
                className="mt-1.5"
                data-testid="pf-community"
                placeholder="Select or enter community"
              />
              <datalist id="admin-community-list">
                {communities.map((c) => <option key={c} value={c} />)}
              </datalist>
            </div>
            <div><Label>Location (display)</Label><Input value={form.location} onChange={(e) => set("location", e.target.value)} className="mt-1.5" data-testid="pf-location" placeholder="Dubai Marina, Dubai" /></div>
          </div>

          <div className="grid sm:grid-cols-4 gap-4">
            <div><Label>Price (AED)</Label><Input type="number" value={form.price} onChange={num("price")} className="mt-1.5" data-testid="pf-price" /></div>
            <div><Label>Rent Period</Label>
              <Select value={form.price_period || "none"} onValueChange={(v) => set("price_period", v === "none" ? "" : v)}><SelectTrigger className="mt-1.5" data-testid="pf-period"><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent><SelectItem value="none">—</SelectItem><SelectItem value="per year">per year</SelectItem><SelectItem value="per month">per month</SelectItem></SelectContent></Select></div>
            <div><Label>Bedrooms</Label><Input type="number" value={form.bedrooms} onChange={num("bedrooms")} className="mt-1.5" data-testid="pf-beds" /></div>
            <div><Label>Bathrooms</Label><Input type="number" value={form.bathrooms} onChange={num("bathrooms")} className="mt-1.5" data-testid="pf-baths" /></div>
            <div><Label>Built-up Area (sq.ft.)</Label><Input type="number" value={form.area} onChange={num("area")} className="mt-1.5" data-testid="pf-area" /></div>
            <div><Label>Plot Area (sq.ft.)</Label><Input type="number" value={form.plot_area ?? ""} onChange={num("plot_area")} className="mt-1.5" data-testid="pf-plot" /></div>
            <div><Label>Latitude</Label><Input type="number" value={form.lat ?? ""} onChange={num("lat")} className="mt-1.5" data-testid="pf-lat" /></div>
            <div><Label>Longitude</Label><Input type="number" value={form.lng ?? ""} onChange={num("lng")} className="mt-1.5" data-testid="pf-lng" /></div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Developer</Label>
              <Input
                list="admin-dev-list"
                value={form.developer}
                onChange={(e) => set("developer", e.target.value)}
                className="mt-1.5"
                data-testid="pf-developer"
                placeholder="Select or enter developer"
              />
              <datalist id="admin-dev-list">
                {developers.map((dev) => <option key={dev} value={dev} />)}
              </datalist>
            </div>
            <div><Label>Completion / Handover</Label><Input value={form.completion_date} onChange={(e) => set("completion_date", e.target.value)} className="mt-1.5" data-testid="pf-completion" placeholder="e.g. Q4 2027" /></div>
            <div><Label>Service Charges</Label><Input value={form.service_charges} onChange={(e) => set("service_charges", e.target.value)} className="mt-1.5" data-testid="pf-service" /></div>
            <div><Label>Payment Plan</Label><Input value={form.payment_plan} onChange={(e) => set("payment_plan", e.target.value)} className="mt-1.5" data-testid="pf-payment" /></div>
            <div><Label>Rental Yield</Label><Input value={form.rental_yield} onChange={(e) => set("rental_yield", e.target.value)} className="mt-1.5" data-testid="pf-yield" placeholder="e.g. 6.2%" /></div>
            <div><Label>Permit Number</Label><Input value={form.permit_number} onChange={(e) => set("permit_number", e.target.value)} className="mt-1.5" data-testid="pf-permit" /></div>
          </div>

          <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => set("description", e.target.value)} className="mt-1.5 min-h-[100px]" data-testid="pf-description" /></div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div><Label>Features (one per line)</Label><Textarea value={fromList(form.features)} onChange={(e) => set("features", toList(e.target.value))} className="mt-1.5" data-testid="pf-features" /></div>
            <div><Label>Amenities (one per line)</Label><Textarea value={fromList(form.amenities)} onChange={(e) => set("amenities", toList(e.target.value))} className="mt-1.5" data-testid="pf-amenities" /></div>
            <div><Label>Investment Highlights (one per line)</Label><Textarea value={fromList(form.investment_highlights)} onChange={(e) => set("investment_highlights", toList(e.target.value))} className="mt-1.5" data-testid="pf-highlights" /></div>
            <div><Label>Location Advantages (one per line)</Label><Textarea value={fromList(form.location_advantages)} onChange={(e) => set("location_advantages", toList(e.target.value))} className="mt-1.5" data-testid="pf-advantages" /></div>
          </div>

          <div>
            <Label>Property Images</Label>
            <div className="mt-1.5"><ImageUploader images={form.images} onChange={(imgs) => set("images", imgs)} /></div>
          </div>

          <div className="flex flex-wrap gap-6 pt-2 border-t border-slate-100">
            <label className="flex items-center gap-2"><Switch checked={form.featured} onCheckedChange={(v) => set("featured", v)} data-testid="pf-featured" /> <span className="text-sm">Featured</span></label>
            <label className="flex items-center gap-2"><Switch checked={form.published} onCheckedChange={(v) => set("published", v)} data-testid="pf-published" /> <span className="text-sm">Published</span></label>
            <label className="flex items-center gap-2"><Switch checked={form.is_demo} onCheckedChange={(v) => set("is_demo", v)} data-testid="pf-demo" /> <span className="text-sm">Demo Property</span></label>
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <Button variant="outline" onClick={onClose} data-testid="pf-cancel">Cancel</Button>
          <Button onClick={save} disabled={saving} className="bg-amber-500 text-slate-950 hover:bg-amber-400 font-semibold" data-testid="pf-save">{saving ? "Saving…" : "Save Property"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
