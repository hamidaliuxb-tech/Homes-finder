import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EMIRATES, COMMUNITIES, PROPERTY_TYPES, BEDROOM_OPTIONS } from "@/data/site";

const TABS = [
  { key: "buy", label: "Buy" },
  { key: "rent", label: "Rent" },
  { key: "commercial", label: "Commercial" },
];

export default function PropertySearch({ variant = "hero" }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState("buy");
  const [emirate, setEmirate] = useState("all");
  const [community, setCommunity] = useState("all");
  const [ptype, setPtype] = useState("all");
  const [beds, setBeds] = useState("all");
  const [maxPrice, setMaxPrice] = useState("");
  const [status, setStatus] = useState("all");

  const submit = () => {
    const params = new URLSearchParams();
    if (emirate !== "all") params.set("emirate", emirate);
    if (community !== "all") params.set("community", community);
    if (ptype !== "all") params.set("property_type", ptype);
    if (beds !== "all") params.set("bedrooms", beds);
    if (maxPrice) params.set("max_price", maxPrice);
    if (status !== "all") params.set("status", status);
    let base = "/buy";
    if (tab === "rent") base = "/rent";
    if (tab === "commercial") base = "/commercial";
    navigate(`${base}?${params.toString()}`);
  };

  const communities = emirate !== "all" ? (COMMUNITIES[emirate] || []) : [];

  return (
    <div className={variant === "hero" ? "bg-white/95 backdrop-blur rounded-2xl shadow-2xl p-2 sm:p-3 border border-white/40 text-slate-900" : "bg-white rounded-2xl shadow-md border border-slate-200 p-3 text-slate-900"} data-testid="property-search">
      <div className="flex gap-1 mb-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            data-testid={`hero-search-tab-${t.key}`}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === t.key ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}
          >
            {t.label.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2">
        <Select value={emirate} onValueChange={(v) => { setEmirate(v); setCommunity("all"); }}>
          <SelectTrigger data-testid="search-emirate" className="h-12 bg-slate-50 border-slate-200 text-slate-900 font-medium"><SelectValue placeholder="Emirate" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Emirates</SelectItem>
            {EMIRATES.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={community} onValueChange={setCommunity} disabled={communities.length === 0}>
          <SelectTrigger data-testid="search-community" className="h-12 bg-slate-50 border-slate-200 text-slate-900 font-medium"><SelectValue placeholder="Community" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Communities</SelectItem>
            {communities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={ptype} onValueChange={setPtype}>
          <SelectTrigger data-testid="search-type" className="h-12 bg-slate-50 border-slate-200 text-slate-900 font-medium"><SelectValue placeholder="Property Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {PROPERTY_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={beds} onValueChange={setBeds}>
          <SelectTrigger data-testid="search-beds" className="h-12 bg-slate-50 border-slate-200 text-slate-900 font-medium"><SelectValue placeholder="Bedrooms" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any Beds</SelectItem>
            {BEDROOM_OPTIONS.map((b, i) => <SelectItem key={b} value={b === "Studio" ? "0" : b.replace("+", "")}>{b}</SelectItem>)}
          </SelectContent>
        </Select>

        <Input
          data-testid="search-max-price"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value.replace(/[^0-9]/g, ""))}
          placeholder="Max Price (AED)"
          className="h-12 bg-slate-50 border-slate-200 text-slate-900 font-medium placeholder:text-slate-500"
        />

        <Button onClick={submit} data-testid="search-submit-btn" className="h-12 bg-amber-500 text-slate-950 hover:bg-amber-400 font-semibold">
          <Search className="h-4 w-4 mr-2" /> Search
        </Button>
      </div>

      <div className="mt-2 flex flex-wrap gap-2 px-1">
        <button onClick={() => setStatus(status === "ready" ? "all" : "ready")} className={`text-xs px-3 py-1 rounded-full border ${status === "ready" ? "bg-slate-900 text-white border-slate-900" : "border-slate-300 text-slate-600"}`} data-testid="search-status-ready">Ready</button>
        <button onClick={() => setStatus(status === "offplan" ? "all" : "offplan")} className={`text-xs px-3 py-1 rounded-full border ${status === "offplan" ? "bg-slate-900 text-white border-slate-900" : "border-slate-300 text-slate-600"}`} data-testid="search-status-offplan">Off-Plan</button>
      </div>
    </div>
  );
}
