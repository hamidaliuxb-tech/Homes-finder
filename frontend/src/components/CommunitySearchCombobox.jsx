import React, { useState, useEffect, useRef } from "react";
import { Search, X, ChevronDown, MapPin, Check } from "lucide-react";
import { COMMUNITIES } from "@/data/site";
import { useSettings } from "@/context/SettingsContext";

export default function CommunitySearchCombobox({
  value = "all",
  onChange,
  emirate = "all",
  placeholder = "Search Community...",
  className = "",
  disabled = false,
  triggerClassName = "",
}) {
  const { settings } = useSettings();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Dynamic communities from settings.options or fallback to static COMMUNITIES
  const allCommunitiesMap = settings?.options?.communities || COMMUNITIES;

  const communityList = React.useMemo(() => {
    if (emirate && emirate !== "all") {
      return allCommunitiesMap[emirate] || [];
    }
    // Aggregate unique communities across all emirates
    const set = new Set();
    Object.values(allCommunitiesMap).forEach((list) => {
      if (Array.isArray(list)) {
        list.forEach((c) => set.add(c));
      }
    });
    return Array.from(set).sort();
  }, [emirate, allCommunitiesMap]);

  // Synchronize query when value changes externally
  useEffect(() => {
    if (value && value !== "all") {
      setQuery(value);
    } else {
      setQuery("");
    }
  }, [value]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        // If query was typed but not selected, restore selected value
        if (value && value !== "all") {
          setQuery(value);
        } else {
          setQuery("");
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [value]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return communityList;
    return communityList.filter((c) => c.toLowerCase().includes(q));
  }, [communityList, query]);

  const handleSelect = (comm) => {
    onChange?.(comm);
    setQuery(comm === "all" ? "" : comm);
    setOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange?.("all");
    setQuery("");
    setOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className={`relative ${className}`} data-testid="community-combobox">
      <div
        onClick={() => {
          if (!disabled) {
            setOpen(true);
            inputRef.current?.focus();
          }
        }}
        className={`flex items-center gap-2 h-12 px-3 rounded-md border border-slate-200 bg-slate-50 text-slate-900 cursor-text transition-all ${
          open ? "ring-2 ring-amber-500 border-amber-500 bg-white" : "hover:border-slate-300"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${triggerClassName}`}
      >
        <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
        <input
          ref={inputRef}
          type="text"
          disabled={disabled}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={value && value !== "all" ? value : placeholder}
          className="w-full bg-transparent text-sm font-medium text-slate-900 placeholder:text-slate-500 outline-none truncate"
        />
        {value && value !== "all" ? (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors"
            title="Clear community filter"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : (
          <ChevronDown className="h-4 w-4 text-slate-400 shrink-0 pointer-events-none" />
        )}
      </div>

      {open && !disabled && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white border border-slate-200 rounded-xl shadow-xl max-h-64 overflow-y-auto divide-y divide-slate-100 animate-in fade-in-50 duration-150">
          <div className="p-1.5">
            <button
              type="button"
              onClick={() => handleSelect("all")}
              className={`flex items-center justify-between w-full px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
                !value || value === "all" ? "bg-amber-50 text-amber-900" : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <span>All Communities {emirate !== "all" ? `in ${emirate}` : "(UAE-Wide)"}</span>
              {(!value || value === "all") && <Check className="h-3.5 w-3.5 text-amber-600" />}
            </button>
          </div>

          <div className="p-1.5 space-y-0.5">
            {filtered.length === 0 ? (
              <div className="p-3 text-center text-xs text-slate-400">
                No communities matching &ldquo;{query}&rdquo;
              </div>
            ) : (
              filtered.map((c) => {
                const isSelected = value === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => handleSelect(c)}
                    className={`flex items-center justify-between w-full px-3 py-2 text-xs font-medium rounded-lg text-left transition-colors ${
                      isSelected ? "bg-amber-100 text-amber-950 font-bold" : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <span className="truncate">{c}</span>
                    {isSelected && <Check className="h-3.5 w-3.5 text-amber-600 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
