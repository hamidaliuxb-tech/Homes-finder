import React, { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/apiClient";

export default function LeadForm({ requirement = "General Enquiry", propertyId = "", propertyTitle = "", extended = false, submitLabel = "Submit Enquiry", compact = false }) {
  const [form, setForm] = useState({
    name: "", mobile: "", email: "", location: "", property_type: "",
    bedrooms: "", property_size: "", expected_price: "", message: "",
  });
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.mobile.trim()) {
      toast.error("Please provide your name and mobile number.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/leads", {
        ...form, requirement, property_id: propertyId, property_title: propertyTitle,
      });
      toast.success("Thank you! Our team will contact you shortly.");
      setForm({ name: "", mobile: "", email: "", location: "", property_type: "", bedrooms: "", property_size: "", expected_price: "", message: "" });
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4" data-testid="lead-form">
      <div className={`grid gap-4 ${compact ? "grid-cols-1" : "sm:grid-cols-2"}`}>
        <div>
          <Label className="text-slate-700">Name *</Label>
          <Input data-testid="lead-name" value={form.name} onChange={set("name")} placeholder="Your full name" className="mt-1.5 h-11" />
        </div>
        <div>
          <Label className="text-slate-700">Mobile *</Label>
          <Input data-testid="lead-mobile" value={form.mobile} onChange={set("mobile")} placeholder="+971 5X XXX XXXX" className="mt-1.5 h-11" />
        </div>
      </div>
      <div className={`grid gap-4 ${compact ? "grid-cols-1" : "sm:grid-cols-2"}`}>
        <div>
          <Label className="text-slate-700">Email</Label>
          <Input data-testid="lead-email" type="email" value={form.email} onChange={set("email")} placeholder="you@email.com" className="mt-1.5 h-11" />
        </div>
        <div>
          <Label className="text-slate-700">Property Location</Label>
          <Input data-testid="lead-location" value={form.location} onChange={set("location")} placeholder="e.g. Dubai Marina" className="mt-1.5 h-11" />
        </div>
      </div>

      {extended && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-slate-700">Property Type</Label>
              <Input data-testid="lead-ptype" value={form.property_type} onChange={set("property_type")} placeholder="Apartment / Villa" className="mt-1.5 h-11" />
            </div>
            <div>
              <Label className="text-slate-700">Bedrooms</Label>
              <Input data-testid="lead-bedrooms" value={form.bedrooms} onChange={set("bedrooms")} placeholder="e.g. 3" className="mt-1.5 h-11" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-slate-700">Property Size</Label>
              <Input data-testid="lead-size" value={form.property_size} onChange={set("property_size")} placeholder="e.g. 1,850 sq.ft." className="mt-1.5 h-11" />
            </div>
            <div>
              <Label className="text-slate-700">Expected Price</Label>
              <Input data-testid="lead-price" value={form.expected_price} onChange={set("expected_price")} placeholder="AED" className="mt-1.5 h-11" />
            </div>
          </div>
        </>
      )}

      <div>
        <Label className="text-slate-700">Message</Label>
        <Textarea data-testid="lead-message" value={form.message} onChange={set("message")} placeholder="Tell us what you're looking for..." className="mt-1.5 min-h-[100px]" />
      </div>

      <Button type="submit" disabled={loading} data-testid="lead-submit-btn" className="w-full h-12 bg-amber-500 text-slate-950 hover:bg-amber-400 font-semibold text-base">
        {loading ? "Submitting..." : submitLabel}
      </Button>
    </form>
  );
}
