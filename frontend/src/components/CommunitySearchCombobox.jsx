import React, { useState, useEffect, useRef, useMemo } from "react";
import { Search, X, ChevronDown, MapPin, Check, Sparkles } from "lucide-react";
import { COMMUNITIES } from "@/data/site";
import { useSettings } from "@/context/SettingsContext";

export default function CommunitySearchCombobox({
  value = "all",
  onChange,
  emirate = "all",
  placeholder = "Type to search community...",
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

  // Build list of communities with their parent emirate for rich autocomplete
  const fullCommunityList = useMemo(() => {
    const list = [];
    if (emirate && emirate !== "all") {
      const comms = allCommunitiesMap[emirate] || [];
      comms.forEach((c) => list.push({ name: c, emirate }));
    } else {
      Object.entries(allCommunitiesMap).forEach(([em, comms]) => {
        if (Array.isArray(comms)) {
          comms.forEach((c) => list.push({ name: c, emirate: em }));
        }
      });
    }
    // Deduplicate and sort
    const seen = new Set();
    const unique = [];
    list.forEach((item) => {
      const key = `${item.name}-${item.emirate}`.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(item);
      }
    });
    return unique.sort((a, b) => a.name.localeCompare(b.name));
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

  // Instant filtering on keystroke ("type karte hi aa jaye")
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return fullCommunityList.slice(0, 50); // Show top 50 if empty query
    return fullCommunityList.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.emirate.toLowerCase().includes(q)
    );
  }, [fullCommunityList, query]);

  const handleSelect = (commName) => {
    onChange?.(commName);
    setQuery(commName === "all" ? "" : commName);
    setOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange?.("all");
    setQuery("");
    setOpen(false);
    inputRef.current?.focus();
  };

  const handleFocus = () => {
    setOpen(true);
    // Select text on focus so typing immediately replaces it
    setTimeout(() => {
      inputRef.current?.select();
    }, 50);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (filtered.length > 0) {
        handleSelect(filtered[0].name);
      } else if (query.trim()) {
        handleSelect(query.trim());
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  // Helper to highlight matching text
  const highlightMatch = (text, q) => {
    if (!q.trim()) return text;
    const regex = new RegExp(`(${q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <span key={i} className="text-amber-600 font-bold bg-amber-50 rounded px-0.5">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  return (
    <div
      ref={containerRef}
      className={`relative ${open ? "z-50" : "z-10"} ${className}`}
      data-testid="community-combobox"
    >
      <div
        onClick={() => {
          if (!disabled) {
            setOpen(true);
            inputRef.current?.focus();
            inputRef.current?.select();
          }
        }}
        className={`flex items-center gap-2 h-12 px-3 rounded-md border border-slate-200 bg-slate-50 text-slate-900 cursor-text transition-all ${
          open ? "ring-2 ring-amber-500 border-amber-500 bg-white shadow-md" : "hover:border-slate-300"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${triggerClassName}`}
      >
        <MapPin className="h-4 w-4 text-amber-500 shrink-0" />
        <input
          ref={inputRef}
          type="text"
          disabled={disabled}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
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

      {/* Auto-suggest dropdown - pops up instantly on typing */}
      {open && !disabled && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-[100] bg-white border border-slate-200 rounded-xl shadow-2xl max-h-72 overflow-y-auto divide-y divide-slate-100 animate-in fade-in-50 duration-100">
          <div className="p-1.5 bg-slate-50/70 border-b border-slate-100">
            <button
              type="button"
              onClick={() => handleSelect("all")}
              className={`flex items-center justify-between w-full px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
                !value || value === "all" ? "bg-amber-100 text-amber-950 font-bold" : "text-slate-700 hover:bg-slate-200/60"
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                All Communities {emirate !== "all" ? `in ${emirate}` : "(UAE-Wide)"}
              </span>
              {(!value || value === "all") && <Check className="h-3.5 w-3.5 text-amber-600" />}
            </button>
          </div>

          <div className="p-1.5 space-y-0.5">
            {filtered.length === 0 ? (
              <div className="p-4 text-center">
                <p className="text-xs text-slate-500 font-medium">No communities matching &ldquo;{query}&rdquo;</p>
                <button
                  type="button"
                  onClick={() => handleSelect(query.trim())}
                  className="mt-2 text-xs text-amber-600 font-semibold hover:underline"
                >
                  Search &ldquo;{query}&rdquo; directly →
                </button>
              </div>
            ) : (
              filtered.map((item, idx) => {
                const isSelected = value === item.name;
                return (
                  <button
                    key={`${item.name}-${item.emirate}-${idx}`}
                    type="button"
                    onClick={() => handleSelect(item.name)}
                    className={`flex items-center justify-between w-full px-3 py-2 text-xs rounded-lg text-left transition-colors ${
                      isSelected
                        ? "bg-amber-100 text-amber-950 font-bold"
                        : "text-slate-700 hover:bg-amber-50/80 hover:text-slate-950"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{highlightMatch(item.name, query)}</span>
                    </div>
                    <span className="ml-2 text-[10px] uppercase font-semibold tracking-wider text-slate-400 shrink-0 px-1.5 py-0.5 bg-slate-100 rounded">
                      {item.emirate}
                    </span>
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
