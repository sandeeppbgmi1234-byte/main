"use client";

import React, { useState, useMemo, useEffect, useRef, useId } from "react";
import { Search, ChevronDown, Check } from "lucide-react";
import { COUNTRIES, INDIAN_STATES } from "@/configs/location.config";
import { cn } from "@/server/utils";

interface HierarchicalLocationPickerProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

/**
 * Hierarchical Location Picker:
 * 1. Country Selector (Searchable)
 * 2. If India: State & City Searchable Dropdowns
 * 3. If Other: State & City Text Inputs
 */
export const HierarchicalLocationPicker = ({
  value,
  onChange,
  required,
}: HierarchicalLocationPickerProps) => {
  // Parse existing value "City, State, Country"
  const initialParts = value ? value.split(", ").map((p) => p.trim()) : [];
  const [selectedCountry, setSelectedCountry] = useState<string>(
    initialParts.length === 3 ? initialParts[2] : "India",
  );
  const [selectedState, setSelectedState] = useState<string>(
    initialParts.length === 3 ? initialParts[1] : "",
  );
  const [selectedCity, setSelectedCity] = useState<string>(
    initialParts.length === 3 ? initialParts[0] : "",
  );

  const countryId = useId();
  const stateId = useId();
  const cityId = useId();
  const isHydratingRef = useRef(false);

  // Seed local state from value prop whenever it changes (e.g. form reset or parent update)
  useEffect(() => {
    isHydratingRef.current = true;
    const parts = value ? value.split(", ").map((p) => p.trim()) : [];
    if (parts.length === 3) {
      setSelectedCountry(parts[2]);
      setSelectedState(parts[1]);
      setSelectedCity(parts[0]);
    } else if (!value) {
      setSelectedCountry("India");
      setSelectedState("");
      setSelectedCity("");
    }
    isHydratingRef.current = false;
    // Only depends on value to avoid re-triggering on local state changes
  }, [value]);

  // Sync back to parent whenever local state changes
  useEffect(() => {
    const composedValue =
      selectedCountry && selectedState && selectedCity
        ? `${selectedCity}, ${selectedState}, ${selectedCountry}`
        : "";

    // Only call onChange if the value is complete or if it has been cleared, and not during hydration
    if (!isHydratingRef.current && composedValue !== value) {
      onChange(composedValue);
    }
    // value is omitted from deps to avoid "barking back" with stale state
    // when parent updates the value prop. The change will be handled in the
    // next render cycle after the first effect updates local state.
  }, [selectedCountry, selectedState, selectedCity, onChange]);

  const isIndia = selectedCountry.toLowerCase() === "india";

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* 1. Country Selection */}
      <div className="space-y-1.5">
        <label
          htmlFor={countryId}
          className="text-[11px] font-bold text-slate-400 uppercase tracking-wider"
        >
          Country
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        <SearchableSelect
          id={countryId}
          options={COUNTRIES.map((c) => c.name)}
          value={selectedCountry}
          onChange={(val) => {
            if (val !== selectedCountry) {
              setSelectedCountry(val);
              setSelectedState("");
              setSelectedCity("");
            }
          }}
          placeholder="Select country"
        />
      </div>

      {/* 2. State & City Selection (Conditional) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* State */}
        <div className="space-y-1.5">
          <label
            htmlFor={stateId}
            className="text-[11px] font-bold text-slate-400 uppercase tracking-wider"
          >
            State / Province
          </label>
          {isIndia ? (
            <SearchableSelect
              id={stateId}
              options={INDIAN_STATES}
              value={selectedState}
              onChange={(val) => {
                if (val !== selectedState) {
                  setSelectedState(val);
                  setSelectedCity("");
                }
              }}
              placeholder="Select state"
              disabled={!selectedCountry}
            />
          ) : (
            <input
              id={stateId}
              type="text"
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              disabled={!selectedCountry}
              placeholder="Enter state"
              required={required}
              className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-[#6A06E4] focus:ring-1 focus:ring-[#6A06E4] transition-colors disabled:bg-slate-50 disabled:text-slate-400"
            />
          )}
        </div>

        {/* City */}
        <div className="space-y-1.5">
          <label
            htmlFor={cityId}
            className="text-[11px] font-bold text-slate-400 uppercase tracking-wider"
          >
            City
          </label>
          <input
            id={cityId}
            type="text"
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            disabled={!selectedState}
            placeholder="Enter city"
            required={required}
            className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-[#6A06E4] focus:ring-1 focus:ring-[#6A06E4] transition-colors disabled:bg-slate-50 disabled:text-slate-400"
          />
        </div>
      </div>
    </div>
  );
};

/**
 * Reusable Searchable Select Component (similar to CountryPicker but generic)
 */
const SearchableSelect = ({
  options,
  value,
  onChange,
  placeholder,
  disabled,
  id,
}: {
  options: string[];
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  disabled?: boolean;
  id?: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset highlight and clear search when menu state changed to closed
  useEffect(() => {
    if (!isOpen) {
      setSearch("");
      setHighlightedIndex(-1);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = useMemo(() => {
    if (!search) return options;
    const s = search.toLowerCase();
    return options.filter((o) => o.toLowerCase().includes(s));
  }, [options, search]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filtered.length - 1 ? prev + 1 : prev,
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && filtered[highlightedIndex]) {
          onChange(filtered[highlightedIndex]);
          setIsOpen(false);
          setSearch("");
        }
        break;
      case "Escape":
        setIsOpen(false);
        break;
    }
  };

  return (
    <div className="relative" ref={containerRef} onKeyDown={handleKeyDown}>
      <button
        id={id}
        type="button"
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full border border-slate-200 rounded-lg px-4 py-2.5 bg-white hover:border-[#6A06E4] transition-colors gap-2 disabled:bg-slate-50 disabled:cursor-not-allowed group"
      >
        <span
          className={cn(
            "text-sm truncate",
            !value ? "text-slate-400" : "text-slate-700 font-medium",
          )}
        >
          {value || placeholder}
        </span>
        <ChevronDown
          size={14}
          className={cn(
            "text-slate-400 transition-transform",
            isOpen && "rotate-180",
            !disabled && "group-hover:text-[#6A06E4]",
          )}
        />
      </button>

      {isOpen && !disabled && (
        <div
          role="listbox"
          aria-labelledby={id}
          className="absolute top-full left-0 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div className="p-2 border-b border-slate-50 flex items-center gap-2 bg-slate-50/50">
            <Search size={14} className="text-slate-400 shrink-0" />
            <input
              autoFocus
              type="text"
              placeholder="Search..."
              aria-label="Search options"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent border-none outline-none text-sm text-slate-700 placeholder:text-slate-400"
            />
          </div>

          <div className="max-h-52 overflow-y-auto no-scrollbar py-1">
            {filtered.length > 0 ? (
              filtered.map((opt, index) => (
                <div
                  key={opt}
                  role="option"
                  aria-selected={opt === value}
                  onClick={() => {
                    onChange(opt);
                    setIsOpen(false);
                    setSearch("");
                  }}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={cn(
                    "flex items-center justify-between w-full px-4 py-2 text-sm transition-colors text-left cursor-pointer",
                    highlightedIndex === index
                      ? "bg-[#F7F0FF] text-[#6A06E4]"
                      : "text-slate-600",
                  )}
                >
                  <span
                    className={cn(opt === value && "font-bold text-[#6A06E4]")}
                  >
                    {opt}
                  </span>
                  {opt === value && (
                    <Check size={14} className="text-[#6A06E4]" />
                  )}
                </div>
              ))
            ) : (
              <p className="px-4 py-4 text-xs text-slate-400 text-center">
                No results found
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
