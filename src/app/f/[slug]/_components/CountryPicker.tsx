"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { Search, ChevronDown, Check } from "lucide-react";
import { COUNTRIES, type Country } from "@/configs/location.config";
import { cn } from "@/server/utils";

interface CountryPickerProps {
  value: string;
  onChange: (dialCode: string) => void;
  className?: string;
}

export const CountryPicker = ({
  value,
  onChange,
  className,
}: CountryPickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter countries based on search
  const filteredCountries = useMemo(() => {
    if (!search) return COUNTRIES;
    const lowerSearch = search.toLowerCase();
    const cleanSearch = lowerSearch.replace(/\D/g, "");

    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(lowerSearch) ||
        c.dialCode.includes(lowerSearch) ||
        c.code.toLowerCase().includes(lowerSearch) ||
        (cleanSearch !== "" &&
          c.dialCode.replace(/\D/g, "").includes(cleanSearch)),
    );
  }, [search, COUNTRIES]);

  // Find the currently selected country to show in the trigger
  const selectedCountry = useMemo(() => {
    if (!value) return undefined;
    const cleanValue = value.replace(/\D/g, "");
    return COUNTRIES.find((c) => c.dialCode.replace(/\D/g, "") === cleanValue);
  }, [value]);

  const handleSelect = (country: Country) => {
    onChange(country.dialCode);
    setIsOpen(false);
    setSearch("");
  };

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full h-full border border-slate-200 rounded-lg px-3 py-2.5 bg-white hover:border-[#6A06E4] transition-colors gap-1"
      >
        <span className="text-sm text-slate-700 font-medium">
          {selectedCountry ? `+${selectedCountry.dialCode}` : "Code"}
        </span>
        <ChevronDown
          size={14}
          className={cn(
            "text-slate-400 transition-transform duration-200",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {/* Searchable dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-slate-200 rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-2 border-b border-slate-50 flex items-center gap-2 bg-slate-50/50">
            <Search size={14} className="text-slate-400 shrink-0" />
            <input
              autoFocus
              type="text"
              placeholder="Search country or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent border-none outline-none text-sm text-slate-700 placeholder:text-slate-400"
            />
          </div>

          <div className="max-h-60 overflow-y-auto no-scrollbar py-1">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((country) => (
                <button
                  key={`${country.code}-${country.dialCode}`}
                  type="button"
                  onClick={() => handleSelect(country)}
                  className="flex items-center justify-between w-full px-3 py-2 text-sm text-slate-600 hover:bg-[#F7F0FF] hover:text-[#6A06E4] transition-colors text-left"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{country.name}</span>
                    <span className="text-xs text-slate-400">
                      +{country.dialCode}
                    </span>
                  </div>
                  {country.dialCode.replace(/\D/g, "") ===
                    (value || "").replace(/\D/g, "") && <Check size={14} />}
                </button>
              ))
            ) : (
              <p className="px-3 py-4 text-sm text-slate-400 text-center">
                No countries found
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
