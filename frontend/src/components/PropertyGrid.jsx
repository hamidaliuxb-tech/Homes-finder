import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal } from "lucide-react";
import PropertyCard from "@/components/PropertyCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/apiClient";
import { getCachedProperties, setCachedProperties, fetchWithRetry } from "@/lib/cache";
import { EMIRATES, COMMUNITIES, PROPERTY_TYPES, BEDROOM_OPTIONS } from "@/data/site";

function filterCached(all, fixed, { emirate, community, ptype, beds, maxPrice, status, sort }) {
  let list = (all || []).filter((p) => p.published !== false);
  if (fixed?.purpose) list = list.filter((p) => p.purpose === fixed.purpose);
  if (fixed?.status) list = list.filter((p) => p.status === fixed.status);
  if (fixed?.category) list = list.filter((p) => p.category === fixed.category);
  if (fixed?.featured) list = list.filter((p) => p.featured);

  if (emirate && emirate !== "all") list = list.filter((p) => (p.emirate || "").toLowerCase() === emirate.toLowerCase());
  if (community && community !== "all") list = list.filter((p) => (p.community || "").toLowerCase() === community.toLowerCase());
  if (ptype && ptype !== "all") list = list.filter((p) => (p.property_type || "").toLowerCase() === ptype.toLowerCase());
  if (beds && beds !== "all") {
    const b = Number(beds);
    if (!isNaN(b)) list = list.filter((p) => p.bedrooms === b);
  }
  if (maxPrice) {
    const mp = Number(maxPrice);
    if (!isNaN(mp)) list = list.filter((p) => p.price <= mp);
  }
  if (status && status !== "all") list = list.filter((p) => p.status === status);

  if (sort === "price_asc") list.sort((a, b) => (a.price || 0) - (b.price || 0));
  else if (sort === "price_desc") list.sort((a, b) => (b.price || 0) - (a.price || 0));
  else if (sort === "newest") list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  return list;
}

export default function PropertyGrid({ fixed = {}, title }) {
  const [searchParams, setSearchParams] = useSearchParams();

  const [emirate, setEmirate] = useState(searchParams.get("emirate") || "all");
  const [community, setCommunity] = useState(searchParams.get("community") || "all");
  const [ptype, setPtype] = useState(searchParams.get("property_type") || "all");
  const [beds, setBeds] = useState(searchParams.get("bedrooms") || "all");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("max_price") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "all");
  const [sort, setSort] = useState("featured");

  // Instant 0ms cache initialization
  const [items, setItems] = useState(() => {
    const cached = getCachedProperties();
    return filterCached(cached, fixed, {
      emirate: searchParams.get("emirate") || "all",
      community: searchParams.get("community") || "all",
      ptype: searchParams.get("property_type") || "all",
      beds: searchParams.get("bedrooms") || "all",
      maxPrice: searchParams.get("max_price") || "",
      status: searchParams.get("status") || "all",
      sort: "featured",
    });
  });
  const [loading, setLoading] = useState(() => items.length === 0);
  const [showFilters, setShowFilters] = useState(false);

  const load = useCallback(async () => {
    try {
      const params = { ...fixed, sort };
      if (emirate !== "all") params.emirate = emirate;
      if (community !== "all") params.community = community;
      if (ptype !== "all") params.property_type = ptype;
      if (beds !== "all") params.bedrooms = beds;
      if (maxPrice) params.max_price = maxPrice;
      if (status !== "all") params.status = status;

      const res = await fetchWithRetry(() => api.get("/properties", { params }), 2, 2000);
      if (res && res.data) {
        setItems(res.data);
        // If we fetched an unfiltered listing, also cache properties
        if (Object.keys(fixed).length === 0 && emirate === "all" && community === "all" && ptype === "all") {
          setCachedProperties(res.data);
        }
      }
    } catch {
      // Retain already cached items on cold start failure
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emirate, community, ptype, beds, maxPrice, status, sort, JSON.stringify(fixed)]);

  useEffect(() => { load(); }, [load]);

  const communities = emirate !== "all" ? (COMMUNITIES[emirate] || []) : [];

  const reset = () => {
    setEmirate("all"); setCommunity("all"); setPtype("all"); setBeds("all"); setMaxPrice(""); setStatus("all");
    setSearchParams({});
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="lg:hidden" data-testid="toggle-filters-btn">
            <SlidersHorizontal className="h-4 w-4 mr-2" /> Filters
          </Button>
          <span className="text-sm text-slate-500" data-testid="results-count">{loading ? "Loading..." : `${items.length} propert${items.length === 1 ? "y" : "ies"}`}</span>
        </div>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-[200px] h-11" data-testid="sort-select"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="featured">Featured</SelectItem>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="price_asc">Price: Low to High</SelectItem>
            <SelectItem value="price_desc">Price: High to Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <aside className={`${showFilters ? "block" : "hidden"} lg:block lg:col-span-1`} data-testid="filter-panel">
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 sticky top-24">
            <h3 className="font-serif text-lg font-semibold text-slate-900">Filter Properties</h3>
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Emirate</label>
              <Select value={emirate} onValueChange={(v) => { setEmirate(v); setCommunity("all"); }}>
                <SelectTrigger className="mt-1.5 h-11" data-testid="filter-emirate"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Emirates</SelectItem>
                  {EMIRATES.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Community</label>
              <Select value={community} onValueChange={setCommunity} disabled={communities.length === 0}>
                <SelectTrigger className="mt-1.5 h-11" data-testid="filter-community"><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Communities</SelectItem>
                  {communities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Property Type</label>
              <Select value={ptype} onValueChange={setPtype}>
                <SelectTrigger className="mt-1.5 h-11" data-testid="filter-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {PROPERTY_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Bedrooms (min)</label>
              <Select value={beds} onValueChange={setBeds}>
                <SelectTrigger className="mt-1.5 h-11" data-testid="filter-beds"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any</SelectItem>
                  {BEDROOM_OPTIONS.map((b) => <SelectItem key={b} value={b === "Studio" ? "0" : b.replace("+", "")}>{b}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Max Price (AED)</label>
              <Input value={maxPrice} onChange={(e) => setMaxPrice(e.target.value.replace(/[^0-9]/g, ""))} placeholder="Any" className="mt-1.5 h-11" data-testid="filter-maxprice" />
            </div>
            {!fixed.status && (
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Status</label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="mt-1.5 h-11" data-testid="filter-status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="ready">Ready</SelectItem>
                    <SelectItem value="offplan">Off-Plan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button variant="outline" onClick={reset} className="w-full" data-testid="filter-reset-btn">Reset Filters</Button>
          </div>
        </aside>

        <div className="lg:col-span-3">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-[380px] rounded-xl" />)}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-xl border border-slate-200" data-testid="no-results">
              <p className="text-slate-500">No properties match your criteria.</p>
              <Button variant="outline" onClick={reset} className="mt-4">Clear Filters</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {items.map((p, i) => <PropertyCard key={p.id} property={p} index={i} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
