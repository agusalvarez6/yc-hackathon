"use client";

import { useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CATEGORY_BY_ID, COUNTRY_BY_CODE } from "@/lib/atlas/countries";
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
        subtitle: `${totals.total.toLocaleString()} contracts • $${totals.value.toFixed(0)}M total`,
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
      onSelectedCountryChange(null);
      return;
    }
    onSelectedCountryChange(a3);
    const country = COUNTRY_BY_CODE[a3];
    if (country) globeRef.current?.focusOn(country.lat, country.lng);
  }

  return (
    <>
      <div className="relative h-[calc(100vh-8.5rem)] min-h-[560px] w-full overflow-hidden">
        {/* Full-bleed globe */}
        <Globe
          ref={globeRef}
          contracts={contracts}
          selectedCountry={selectedCountry}
          hoveredCountry={hoveredCountry}
          onCountryClick={handleCountryClick}
          onCountryHover={setHoveredCountry}
          onMarkerClick={(c) => setSelected(c)}
          autoRotate
          rightInset={336}
        />

        {/* Helper hint, top-left */}
        <div className="pointer-events-none absolute left-6 top-6 rounded-lg border bg-card/80 px-3 py-2 text-[11px] shadow-sm backdrop-blur">
          <div className="font-medium">Drag to rotate</div>
          <div className="text-muted-foreground">
            Scroll to zoom • Click a country
          </div>
        </div>

        {/* Heatmap legend, bottom-left */}
        <HeatLegend />

        {/* Floating drawer, right */}
        <aside className="absolute right-6 top-6 bottom-6 w-80 rounded-xl border bg-card/85 shadow-xl backdrop-blur">
          <div className="flex h-full flex-col">
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
                  onClick={() => onSelectedCountryChange(null)}
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
                  No contracts match the current filters.
                </div>
              ) : (
                <ul className="divide-y">
                  {visible.slice(0, 80).map((c) => {
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
                          <div className="mt-1 line-clamp-2 text-sm font-medium leading-snug">
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
            {visible.length > 80 && (
              <div className="border-t px-5 py-2 text-center text-[11px] text-muted-foreground">
                Showing 80 of {visible.length.toLocaleString()}
              </div>
            )}
          </div>
        </aside>
      </div>

      <ContractModal contract={selected} onClose={() => setSelected(null)} />
    </>
  );
}

// Same six-stop ramp as the globe heatmap.
const RAMP: [number, number, number][] = [
  [244, 244, 245],
  [228, 228, 231],
  [203, 213, 225],
  [148, 163, 184],
  [71, 85, 105],
  [15, 23, 42],
];

function HeatLegend() {
  return (
    <div className="absolute bottom-6 left-6 rounded-lg border bg-card/80 px-3 py-2 text-[11px] shadow-sm backdrop-blur">
      <div className="mb-1 font-medium">Contract value</div>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">Low</span>
        <div className="flex h-2 w-32 overflow-hidden rounded-full">
          {RAMP.map((c, i) => (
            <div
              key={i}
              className="flex-1"
              style={{ background: `rgb(${c[0]},${c[1]},${c[2]})` }}
            />
          ))}
        </div>
        <span className="text-muted-foreground">High</span>
      </div>
    </div>
  );
}
