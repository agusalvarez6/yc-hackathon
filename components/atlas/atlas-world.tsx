"use client";

import { useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  CATEGORY_BY_ID,
  COUNTRY_BY_CODE,
} from "@/lib/atlas/countries";
import type { AtlasContract } from "@/lib/atlas/contracts";
import type { GlobeHandle } from "./globe";
import { ContractModal } from "./contract-modal";

const Globe = dynamic(() => import("./globe"), { ssr: false });

const STATUS_TONE: Record<string, string> = {
  "Open for bids": "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  "Pre-solicitation": "bg-sky-50 text-sky-700 ring-sky-600/20",
  Awarded: "bg-zinc-100 text-zinc-700 ring-zinc-600/20",
  "Under review": "bg-amber-50 text-amber-700 ring-amber-600/20",
};

interface AtlasWorldProps {
  contracts: AtlasContract[];
  selectedCountry: string | null;
  onSelectedCountryChange: (a3: string | null) => void;
}

export function AtlasWorld({
  contracts,
  selectedCountry,
  onSelectedCountryChange,
}: AtlasWorldProps) {
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [selected, setSelected] = useState<AtlasContract | null>(null);
  const globeRef = useRef<GlobeHandle>(null);
  const setSelectedCountry = onSelectedCountryChange;

  const totals = useMemo(() => {
    const total = contracts.length;
    const value = contracts.reduce((s, c) => s + c.valueM, 0);
    return { total, value };
  }, [contracts]);

  const visible = useMemo(() => {
    if (!selectedCountry) return contracts;
    return contracts.filter((c) => c.country === selectedCountry);
  }, [contracts, selectedCountry]);

  const headline = useMemo(() => {
    if (!selectedCountry) {
      return {
        title: "All regions",
        subtitle: `${totals.total} contracts • $${totals.value.toFixed(0)}M total`,
      };
    }
    const country = COUNTRY_BY_CODE[selectedCountry];
    const value = visible.reduce((s, c) => s + c.valueM, 0);
    return {
      title: country?.name ?? selectedCountry,
      subtitle: `${visible.length} contracts • $${value.toFixed(1)}M total`,
    };
  }, [selectedCountry, totals, visible]);

  function handleCountryClick(a3: string) {
    if (selectedCountry === a3) {
      setSelectedCountry(null);
      return;
    }
    setSelectedCountry(a3);
    const country = COUNTRY_BY_CODE[a3];
    if (country) globeRef.current?.focusOn(country.lat, country.lng);
  }

  return (
    <>
      <div className="relative overflow-hidden rounded-xl border bg-card">
        <div className="flex flex-col gap-0 lg:flex-row">
          {/* Globe stage */}
          <div className="relative h-[420px] w-full lg:h-[640px] lg:flex-1">
            <Globe
              ref={globeRef}
              contracts={contracts}
              selectedCountry={selectedCountry}
              hoveredCountry={hoveredCountry}
              onCountryClick={handleCountryClick}
              onCountryHover={setHoveredCountry}
              onMarkerClick={(c) => setSelected(c)}
              autoRotate
              rightInset={0}
            />
            <div className="pointer-events-none absolute left-4 top-4 rounded-lg bg-background/90 px-3 py-2 text-[11px] shadow-sm backdrop-blur">
              <div className="font-medium">Drag to rotate</div>
              <div className="text-muted-foreground">
                Scroll to zoom • Click a country
              </div>
            </div>
          </div>

          {/* Drawer */}
          <div className="flex h-[640px] w-full flex-col border-t lg:h-[640px] lg:w-80 lg:border-l lg:border-t-0">
            <div className="flex items-start justify-between gap-2 border-b px-5 py-4">
              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold">
                  {headline.title}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {headline.subtitle}
                </p>
              </div>
              {selectedCountry && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCountry(null)}
                  className="h-7 px-2 text-xs"
                >
                  <X className="h-3.5 w-3.5" />
                  Clear
                </Button>
              )}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {visible.length === 0 ? (
                <div className="px-5 py-8 text-center text-xs text-muted-foreground">
                  No contracts in this country.
                </div>
              ) : (
                <ul className="divide-y">
                  {visible.map((c) => {
                    const category = CATEGORY_BY_ID[c.category];
                    const tone =
                      STATUS_TONE[c.status] ??
                      "bg-zinc-100 text-zinc-700 ring-zinc-600/20";
                    return (
                      <li key={c.id}>
                        <button
                          type="button"
                          onClick={() => setSelected(c)}
                          className="w-full px-5 py-3 text-left transition-colors hover:bg-accent/40"
                        >
                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            {category && (
                              <span
                                className="h-2 w-2 rounded-full"
                                style={{
                                  background: `hsl(${category.hue} 70% 50%)`,
                                }}
                              />
                            )}
                            <span>{c.categoryLabel}</span>
                            <span aria-hidden>•</span>
                            <span>{c.countryName}</span>
                          </div>
                          <div className="mt-1 line-clamp-2 text-sm font-medium">
                            {c.title}
                          </div>
                          <div className="mt-1 text-[11px] text-muted-foreground">
                            {c.agency}
                          </div>
                          <div className="mt-2 flex items-center justify-between">
                            <span
                              className={cn(
                                "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset",
                                tone,
                              )}
                            >
                              {c.status}
                            </span>
                            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                              <span className="tabular-nums text-foreground">
                                ${c.valueM.toFixed(1)}M
                              </span>
                              <span
                                className={cn(
                                  "tabular-nums",
                                  c.deadlineDays <= 14 &&
                                    "font-medium text-rose-600",
                                )}
                              >
                                {c.deadlineDays}d
                              </span>
                            </div>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      <ContractModal contract={selected} onClose={() => setSelected(null)} />
    </>
  );
}
