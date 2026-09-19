import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Loader2, Send, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ImageUploader from "@/components/ImageUploader";
import { api } from "@/lib/apiClient";
import { EMIRATES, COMMUNITIES } from "@/data/site";

const TYPES = ["Apartment", "Villa", "Townhouse", "Penthouse", "Studio", "Residential Building", "Office", "Retail", "Warehouse", "Land", "Commercial Building", "Other"];
const AMENITIES = ["Balcony", "Parking", "Swimming Pool", "Gym", "Security", "Central AC", "Built-in Wardrobes", "Maids Room", "Garden", "Children's Play Area", "Sea View", "City View", "Marina View", "Covered Parking", "Concierge", "Elevator"];

export default function AddProperty() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [f, setF] = useState({
    title: "", description: "", purpose: "buy", property_type: "Apartment", emirate: "Dubai", community: "",
    city: "", building_name: "", location: "", price: "", price_period: "per year", rental_frequency: "Yearly",
    bedrooms: "", bathrooms: "", area: "", plot_area: "", furnished: "unfurnished", parking_spaces: "",
    status: "ready", availability_date: "", developer: "", completion_date: "", payment_plan: "",
    service_charges: "", rental_yield: "", amenities: [], images: [],
    contact_name: "", contact_mobile: "", contact_whatsapp: "", contact_email: "",
    use_registered_contact: true, show_phone: false, show_whatsapp: true, show_email: false,
  });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    if (id) api.get(`/my/properties/${id}`).then((r) => setF((p) => ({ ...p, ...r.data, price: String(r.data.price || ""), bedrooms: String(r.data.bedrooms ?? ""), bathrooms: String(r.data.bathrooms ?? ""), area: String(r.data.area || "") }))).catch(() => {});
  }, [id]);

  const toggleAmenity = (a) => set("amenities", f.amenities.includes(a) ? f.amenities.filter((x) => x !== a) : [...f.amenities, a]);

  const payload = () => ({
    ...f,
    price: Number(f.price) || 0, bedrooms: Number(f.bedrooms) || 0, bathrooms: Number(f.bathrooms) || 0,
    area: Number(f.area) || 0, plot_area: f.plot_area ? Number(f.plot_area) : null,
    parking_spaces: f.parking_spaces ? Number(f.parking_spaces) : null,
    category: ["Office", "Retail", "Warehouse", "Commercial Building", "Land"].includes(f.property_type) ? "commercial" : "residential",
    price_period: f.purpose === "rent" ? f.price_period : "",
  });

  const save = async (submit) => {
    if (!f.title.trim()) { toast.error("Property title is required"); setStep(1); return; }
    if (submit && (!Number(f.price) || !Number(f.area))) { toast.error("Please enter a price and property size before submitting"); setStep(2); return; }
    setLoading(true);
    try {
      const body = { ...payload(), submit };
      if (id) await api.put(`/my/properties/${id}`, body);
      else await api.post("/my/properties", body);
      toast.success(submit ? "Submitted for approval!" : "Saved as draft");
      navigate("/dashboard/properties");
    } catch (e) { toast.error(e.response?.data?.detail || "Failed to save"); }
    finally { setLoading(false); }
  };

  const communities = COMMUNITIES[f.emirate] || [];
  const isSale = f.purpose === "buy";

  return (
    <div data-testid="add-property-page">
      <h1 className="font-serif text-3xl font-bold text-slate-900 mb-1">List Your Property</h1>
      <p className="text-slate-500 mb-6">Step {step} of 4 — {["Basics", "Details", "Photos & Amenities", "Contact & Review"][step - 1]}</p>

      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
        {step === 1 && (
          <>
            <div className="grid sm:grid-cols-2 gap-4">
              <Fld label="Listing Purpose"><Select value={f.purpose} onValueChange={(v) => set("purpose", v)}><SelectTrigger data-testid="ap-purpose"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="buy">For Sale</SelectItem><SelectItem value="rent">For Rent</SelectItem></SelectContent></Select></Fld>
              <Fld label="Property Type"><Select value={f.property_type} onValueChange={(v) => set("property_type", v)}><SelectTrigger data-testid="ap-type"><SelectValue /></SelectTrigger><SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></Fld>
            </div>
            <Fld label="Property Title *"><Input data-testid="ap-title" value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Spacious 3BR Apartment with Marina View" /></Fld>
            <Fld label="Property Description"><Textarea data-testid="ap-description" value={f.description} onChange={(e) => set("description", e.target.value)} className="min-h-[120px]" /></Fld>
          </>
        )}

        {step === 2 && (
          <>
            <div className="grid sm:grid-cols-3 gap-4">
              <Fld label="Emirate"><Select value={f.emirate} onValueChange={(v) => { set("emirate", v); set("community", ""); }}><SelectTrigger data-testid="ap-emirate"><SelectValue /></SelectTrigger><SelectContent>{EMIRATES.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent></Select></Fld>
              <Fld label="Community / Area"><Select value={f.community || "none"} onValueChange={(v) => set("community", v === "none" ? "" : v)}><SelectTrigger data-testid="ap-community"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="none">—</SelectItem>{communities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></Fld>
              <Fld label="Location (display)"><Input data-testid="ap-location" value={f.location} onChange={(e) => set("location", e.target.value)} placeholder="e.g. Dubai Marina, Dubai" /></Fld>
              <Fld label="Building Name"><Input value={f.building_name} onChange={(e) => set("building_name", e.target.value)} /></Fld>
              <Fld label={isSale ? "Price (AED)" : "Rental Price (AED)"}><Input data-testid="ap-price" value={f.price} onChange={(e) => set("price", e.target.value.replace(/[^0-9]/g, ""))} /></Fld>
              {!isSale && <Fld label="Rental Frequency"><Select value={f.price_period} onValueChange={(v) => set("price_period", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="per year">Per Year</SelectItem><SelectItem value="per month">Per Month</SelectItem></SelectContent></Select></Fld>}
              <Fld label="Bedrooms"><Input data-testid="ap-beds" value={f.bedrooms} onChange={(e) => set("bedrooms", e.target.value.replace(/[^0-9]/g, ""))} /></Fld>
              <Fld label="Bathrooms"><Input value={f.bathrooms} onChange={(e) => set("bathrooms", e.target.value.replace(/[^0-9]/g, ""))} /></Fld>
              <Fld label="Property Size (sq.ft.)"><Input data-testid="ap-area" value={f.area} onChange={(e) => set("area", e.target.value.replace(/[^0-9]/g, ""))} /></Fld>
              <Fld label="Furnished"><Select value={f.furnished} onValueChange={(v) => set("furnished", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="furnished">Furnished</SelectItem><SelectItem value="unfurnished">Unfurnished</SelectItem><SelectItem value="semi">Semi-furnished</SelectItem></SelectContent></Select></Fld>
              <Fld label="Parking Spaces"><Input value={f.parking_spaces} onChange={(e) => set("parking_spaces", e.target.value.replace(/[^0-9]/g, ""))} /></Fld>
              <Fld label="Status"><Select value={f.status} onValueChange={(v) => set("status", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ready">Ready</SelectItem><SelectItem value="offplan">Off-Plan</SelectItem></SelectContent></Select></Fld>
            </div>
            {f.status === "offplan" && (
              <div className="grid sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
                <Fld label="Developer"><Input value={f.developer} onChange={(e) => set("developer", e.target.value)} /></Fld>
                <Fld label="Completion Date"><Input value={f.completion_date} onChange={(e) => set("completion_date", e.target.value)} placeholder="e.g. Q4 2027" /></Fld>
                <Fld label="Payment Plan"><Input value={f.payment_plan} onChange={(e) => set("payment_plan", e.target.value)} /></Fld>
              </div>
            )}
          </>
        )}

        {step === 3 && (
          <>
            <Fld label="Property Photos (first image is the cover)"><ImageUploader images={f.images} onChange={(imgs) => set("images", imgs)} /></Fld>
            <div>
              <Label className="text-slate-700">Features &amp; Amenities</Label>
              <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2" data-testid="ap-amenities">
                {AMENITIES.map((a) => (
                  <label key={a} className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer ${f.amenities.includes(a) ? "border-amber-400 bg-amber-50" : "border-slate-200"}`}>
                    <Checkbox checked={f.amenities.includes(a)} onCheckedChange={() => toggleAmenity(a)} />{a}
                  </label>
                ))}
              </div>
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <label className="flex items-center gap-2 text-sm"><Checkbox checked={f.use_registered_contact} onCheckedChange={(v) => set("use_registered_contact", v)} data-testid="ap-use-registered" /> Use my registered contact details</label>
            {!f.use_registered_contact && (
              <div className="grid sm:grid-cols-2 gap-4">
                <Fld label="Contact Name"><Input value={f.contact_name} onChange={(e) => set("contact_name", e.target.value)} /></Fld>
                <Fld label="Mobile"><Input value={f.contact_mobile} onChange={(e) => set("contact_mobile", e.target.value)} /></Fld>
                <Fld label="WhatsApp"><Input value={f.contact_whatsapp} onChange={(e) => set("contact_whatsapp", e.target.value)} /></Fld>
                <Fld label="Email"><Input value={f.contact_email} onChange={(e) => set("contact_email", e.target.value)} /></Fld>
              </div>
            )}
            <div className="flex flex-wrap gap-4 text-sm">
              <label className="flex items-center gap-2"><Checkbox checked={f.show_phone} onCheckedChange={(v) => set("show_phone", v)} /> Show phone publicly</label>
              <label className="flex items-center gap-2"><Checkbox checked={f.show_whatsapp} onCheckedChange={(v) => set("show_whatsapp", v)} /> Show WhatsApp</label>
              <label className="flex items-center gap-2"><Checkbox checked={f.show_email} onCheckedChange={(v) => set("show_email", v)} /> Show email</label>
            </div>
            <div className="rounded-xl bg-[#FAFAFA] border border-slate-200 p-5" data-testid="ap-review">
              <h3 className="font-serif text-lg font-semibold mb-3">Review Your Property</h3>
              <div className="grid sm:grid-cols-2 gap-2 text-sm text-slate-700">
                <div><span className="text-slate-400">Title:</span> {f.title || "—"}</div>
                <div><span className="text-slate-400">Purpose:</span> {isSale ? "For Sale" : "For Rent"}</div>
                <div><span className="text-slate-400">Type:</span> {f.property_type}</div>
                <div><span className="text-slate-400">Location:</span> {f.location || f.community || "—"}</div>
                <div><span className="text-slate-400">Price:</span> AED {Number(f.price || 0).toLocaleString()}</div>
                <div><span className="text-slate-400">Beds/Baths:</span> {f.bedrooms || 0}/{f.bathrooms || 0}</div>
                <div><span className="text-slate-400">Photos:</span> {f.images.length}</div>
                <div><span className="text-slate-400">Amenities:</span> {f.amenities.length}</div>
              </div>
              <p className="mt-3 text-xs text-amber-700">On submission your property will be <strong>Pending Approval</strong> and will not appear publicly until the Homes Finder team approves it.</p>
            </div>
          </>
        )}

        <div className="flex justify-between pt-4 border-t border-slate-100">
          <Button variant="outline" disabled={step === 1} onClick={() => setStep(step - 1)} data-testid="ap-back">Back</Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => save(false)} disabled={loading} data-testid="ap-save-draft"><Save className="h-4 w-4 mr-1" />Save Draft</Button>
            {step < 4 ? <Button onClick={() => setStep(step + 1)} className="bg-slate-900 text-white hover:bg-slate-800" data-testid="ap-next">Next</Button>
              : <Button onClick={() => save(true)} disabled={loading} className="bg-amber-500 text-slate-950 hover:bg-amber-400 font-semibold" data-testid="ap-submit">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4 mr-1" />Submit for Approval</>}</Button>}
          </div>
        </div>
      </div>
    </div>
  );
}

const Fld = ({ label, children }) => (<div><Label className="text-slate-700 text-sm">{label}</Label><div className="mt-1.5">{children}</div></div>);
