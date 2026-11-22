"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, Loader2, X } from "lucide-react";
import type { CityLocation } from "@/types/smogshield";

interface CitySearchBarProps {
  onSelectCity: (city: CityLocation) => void;
}

/**
 * Debounced search input with autocomplete dropdown for global cities.
 */
export function CitySearchBar({ onSelectCity }: CitySearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CityLocation[]>([]);
  const [searching, setSearching] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced search (350ms)
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) return;

    const timeoutId = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/aqi?q=${encodeURIComponent(trimmed)}`);
        if (res.ok) {
          const data = (await res.json()) as { cities?: CityLocation[] };
          setResults(data.cities ?? []);
          setDropdownOpen(true);
        }
      } catch (err) {
        console.error("Failed to query cities:", err);
      } finally {
        setSearching(false);
      }
    }, 350);

    return () => clearTimeout(timeoutId);
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlePick = (city: CityLocation) => {
    onSelectCity(city);
    setQuery("");
    setResults([]);
    setDropdownOpen(false);
  };

  return (
    <div ref={containerRef} className="relative flex-1 max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" aria-hidden="true" />
        <label htmlFor="city-search" className="sr-only">
          Search station or city
        </label>
        <input
          id="city-search"
          type="text"
          role="combobox"
          aria-expanded={dropdownOpen}
          aria-autocomplete="list"
          aria-controls="city-search-results"
          aria-label="Search station or city"
          value={query}
          onChange={(e) => {
            const val = e.target.value;
            setQuery(val);
            if (val.trim().length < 2) {
              setResults([]);
              setSearching(false);
              setDropdownOpen(false);
            }
          }}
          onFocus={() => {
            if (results.length > 0) setDropdownOpen(true);
          }}
          placeholder="Search station or city (e.g. New Delhi, Beijing)..."
          className="w-full rounded-lg border border-stone-300 bg-stone-50/50 py-2 pl-9 pr-9 text-sm text-stone-900 placeholder:text-stone-500 focus:bg-white focus:border-stone-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900 transition shadow-2xs"
        />
        {searching ? (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-stone-500" aria-hidden="true" />
        ) : query.length > 0 ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setResults([]);
              setDropdownOpen(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-800 transition rounded p-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900"
            aria-label="Clear city search query"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      {dropdownOpen && results.length > 0 && (
        <div
          id="city-search-results"
          role="listbox"
          aria-label="City search suggestions"
          className="absolute z-30 mt-1 w-full overflow-hidden rounded-lg border border-stone-200 bg-white py-1 shadow-lg"
        >
          {results.map((city, idx) => (
            <button
              key={`${city.name}-${city.latitude}-${idx}`}
              type="button"
              role="option"
              aria-selected={false}
              onClick={() => handlePick(city)}
              className="flex w-full items-center justify-between px-3.5 py-2 text-left text-xs text-stone-800 transition hover:bg-stone-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900"
            >
              <span className="font-medium text-stone-900">
                {city.name}
                {city.admin1 ? `, ${city.admin1}` : ""}
              </span>
              <span className="font-mono text-[11px] text-stone-600">
                {city.country}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
