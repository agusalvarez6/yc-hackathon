"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CATEGORIES,
  CATEGORY_BY_ID,
  REGIONS,
  type Region,
} from "@/lib/atlas/countries";
import type { AtlasContract, ContractStatus } from "@/lib/atlas/contracts";
import {
  EMPTY_FILTERS,
  VALUE_DOMAIN,
  countBy,
  type AtlasFilters,
} from "./use-atlas-filters";

const STATUSES: ContractStatus[] = [
  "Open for bids",
  "Pre-solicitation",
  "Awarded",
  "Under review",
];

interface FilterDockProps {
  contracts: AtlasContract[];
  filters: AtlasFilters;
  onFiltersChange: (next: AtlasFilters) => void;
}

export function FilterDock({
  contracts,
  filters,
  onFiltersChange,
}: FilterDockProps) {
  const set = (patch: Partial<AtlasFilters>) =>
    onFiltersChange({ ...filters, ...patch });

  const categoryCounts = useMemo(
    () =>
      countBy(
        contracts,
        (c) => c.category,
        (id) => CATEGORY_BY_ID[id]?.label ?? id,
      ),
    [contracts],
  );
  const regionCounts = useMemo(
    () =>
      countBy(
        contracts,
        (c) => c.region as Region,
        (r) => r,
      ),
    [contracts],
  );
  const statusCounts = useMemo(
    () =>
      countBy(
        contracts,
        (c) => c.status,
        (s) => s,
      ),
    [contracts],
  );

  const valueLabel =
    filters.valueMin === VALUE_DOMAIN.min && filters.valueMax === VALUE_DOMAIN.max
      ? "Any"
      : `$${filters.valueMin}m – $${filters.valueMax}m`;

  return (
    <div className="relative z-40 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <SearchPill
          value={filters.search}
          onChange={(v) => set({ search: v })}
        />

        <FilterPopover
          label="Category"
          activeCount={filters.categories.length}
        >
          <CheckList
            items={categoryCounts}
            selected={filters.categories}
            onToggle={(value) =>
              set({
                categories: filters.categories.includes(value)
                  ? filters.categories.filter((v) => v !== value)
                  : [...filters.categories, value],
              })
            }
            renderSwatch={(value) => {
              const cat = CATEGORY_BY_ID[value];
              return (
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ background: `hsl(${cat?.hue ?? 0} 70% 50%)` }}
                />
              );
            }}
            availableOrder={CATEGORIES.map((c) => c.id)}
            labelOf={(id) => CATEGORY_BY_ID[id]?.label ?? id}
          />
        </FilterPopover>

        <FilterPopover label="Region" activeCount={filters.regions.length}>
          <CheckList
            items={regionCounts}
            selected={filters.regions}
            onToggle={(value) =>
              set({
                regions: filters.regions.includes(value)
                  ? filters.regions.filter((v) => v !== value)
                  : [...filters.regions, value],
              })
            }
            availableOrder={REGIONS}
            labelOf={(r) => r}
          />
        </FilterPopover>

        <FilterPopover label="Status" activeCount={filters.statuses.length}>
          <CheckList
            items={statusCounts}
            selected={filters.statuses}
            onToggle={(value) =>
              set({
                statuses: filters.statuses.includes(value)
                  ? filters.statuses.filter((v) => v !== value)
                  : [...filters.statuses, value],
              })
            }
            availableOrder={STATUSES}
            labelOf={(s) => s}
          />
        </FilterPopover>

        <FilterPopover
          label={`Value: ${valueLabel}`}
          activeCount={
            filters.valueMin !== VALUE_DOMAIN.min ||
            filters.valueMax !== VALUE_DOMAIN.max
              ? 1
              : 0
          }
          width={280}
        >
          <ValueRange
            min={filters.valueMin}
            max={filters.valueMax}
            onChange={(min, max) => set({ valueMin: min, valueMax: max })}
          />
        </FilterPopover>
      </div>

      <ActiveChips filters={filters} onFiltersChange={onFiltersChange} />
    </div>
  );
}

function SearchPill({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return (
    <div className="relative flex h-9 min-w-[260px] items-center gap-2 rounded-full border bg-card/80 px-3.5 shadow-sm backdrop-blur-sm transition-colors focus-within:bg-card">
      <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search title, buyer, country, ref"
        className="h-full w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          className="flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Clear search"
        >
          <X className="h-3 w-3" />
        </button>
      ) : (
        <kbd className="hidden items-center rounded border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground sm:inline-flex">
          ⌘K
        </kbd>
      )}
    </div>
  );
}

function FilterPopover({
  label,
  activeCount,
  children,
  width = 240,
}: {
  label: string;
  activeCount: number;
  children: React.ReactNode;
  width?: number;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const isActive = activeCount > 0;
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-xs font-medium shadow-sm backdrop-blur-sm transition-colors",
          isActive
            ? "border-foreground bg-foreground text-background"
            : "border-border bg-card/80 text-foreground hover:bg-card",
          open && !isActive && "bg-card",
        )}
      >
        <span>{label}</span>
        {activeCount > 0 && (
          <span
            className={cn(
              "inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold tabular-nums",
              isActive
                ? "bg-background/20 text-background"
                : "bg-muted text-foreground",
            )}
          >
            {activeCount}
          </span>
        )}
        <ChevronDown
          className={cn(
            "h-3 w-3 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <div
          className="absolute left-0 top-full z-50 mt-2 rounded-xl border bg-card p-2 shadow-lg"
          style={{ width }}
          role="dialog"
        >
          {children}
        </div>
      )}
    </div>
  );
}

interface CheckItem<T extends string> {
  value: T;
  label: string;
  count: number;
}

function CheckList<T extends string>({
  items,
  selected,
  onToggle,
  renderSwatch,
  availableOrder,
  labelOf,
}: {
  items: CheckItem<T>[];
  selected: string[];
  onToggle: (value: T) => void;
  renderSwatch?: (value: T) => React.ReactNode;
  availableOrder: T[];
  labelOf: (v: T) => string;
}) {
  // Show every option from the canonical order (so empty buckets still appear),
  // overlaying live counts.
  const countMap = new Map(items.map((i) => [i.value, i.count]));
  const merged = availableOrder.map((value) => ({
    value,
    label: labelOf(value),
    count: countMap.get(value) ?? 0,
  }));
  return (
    <ul className="max-h-[280px] overflow-auto py-1">
      {merged.map(({ value, label, count }) => {
        const isOn = selected.includes(value);
        return (
          <li key={value}>
            <button
              type="button"
              onClick={() => onToggle(value)}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors",
                isOn ? "bg-accent" : "hover:bg-accent/60",
              )}
            >
              <span
                className={cn(
                  "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                  isOn ? "border-foreground bg-foreground" : "border-border",
                )}
              >
                {isOn && <Check className="h-3 w-3 text-background" />}
              </span>
              {renderSwatch?.(value)}
              <span className="flex-1 truncate">{label}</span>
              <span className="tabular-nums text-[10px] text-muted-foreground">
                {count}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function ValueRange({
  min,
  max,
  onChange,
}: {
  min: number;
  max: number;
  onChange: (min: number, max: number) => void;
}) {
  const dom = VALUE_DOMAIN;
  return (
    <div className="space-y-3 px-1 py-2">
      <div className="flex items-center justify-between text-xs">
        <span className="tabular-nums text-muted-foreground">${min}M</span>
        <span className="tabular-nums text-muted-foreground">${max}M</span>
      </div>
      <div className="space-y-2">
        <label className="block">
          <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">
            Min
          </span>
          <input
            type="range"
            min={dom.min}
            max={dom.max}
            step={1}
            value={min}
            onChange={(e) => {
              const v = Number(e.target.value);
              onChange(Math.min(v, max), max);
            }}
            className="w-full accent-foreground"
          />
        </label>
        <label className="block">
          <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">
            Max
          </span>
          <input
            type="range"
            min={dom.min}
            max={dom.max}
            step={1}
            value={max}
            onChange={(e) => {
              const v = Number(e.target.value);
              onChange(min, Math.max(v, min));
            }}
            className="w-full accent-foreground"
          />
        </label>
      </div>
      <div className="flex justify-between border-t pt-2">
        <button
          type="button"
          onClick={() => onChange(dom.min, dom.max)}
          className="text-[11px] text-muted-foreground hover:text-foreground"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

function ActiveChips({
  filters,
  onFiltersChange,
}: {
  filters: AtlasFilters;
  onFiltersChange: (next: AtlasFilters) => void;
}) {
  const chips: { key: string; label: string; clear: () => void }[] = [];
  if (filters.search.trim()) {
    chips.push({
      key: "search",
      label: `“${filters.search.trim()}”`,
      clear: () => onFiltersChange({ ...filters, search: "" }),
    });
  }
  for (const id of filters.categories) {
    const cat = CATEGORY_BY_ID[id];
    chips.push({
      key: `c:${id}`,
      label: cat?.label ?? id,
      clear: () =>
        onFiltersChange({
          ...filters,
          categories: filters.categories.filter((v) => v !== id),
        }),
    });
  }
  for (const r of filters.regions) {
    chips.push({
      key: `r:${r}`,
      label: r,
      clear: () =>
        onFiltersChange({
          ...filters,
          regions: filters.regions.filter((v) => v !== r),
        }),
    });
  }
  for (const s of filters.statuses) {
    chips.push({
      key: `s:${s}`,
      label: s,
      clear: () =>
        onFiltersChange({
          ...filters,
          statuses: filters.statuses.filter((v) => v !== s),
        }),
    });
  }
  if (
    filters.valueMin !== VALUE_DOMAIN.min ||
    filters.valueMax !== VALUE_DOMAIN.max
  ) {
    chips.push({
      key: "value",
      label: `$${filters.valueMin}m – $${filters.valueMax}m`,
      clear: () =>
        onFiltersChange({
          ...filters,
          valueMin: VALUE_DOMAIN.min,
          valueMax: VALUE_DOMAIN.max,
        }),
    });
  }
  if (filters.country) {
    chips.push({
      key: "country",
      label: filters.country,
      clear: () => onFiltersChange({ ...filters, country: null }),
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 pt-1">
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={chip.clear}
          className="group inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs text-foreground hover:bg-accent"
        >
          <span>{chip.label}</span>
          <X className="h-3 w-3 text-muted-foreground transition-colors group-hover:text-foreground" />
        </button>
      ))}
      <button
        type="button"
        onClick={() => onFiltersChange(EMPTY_FILTERS)}
        className="ml-auto text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        Clear all
      </button>
    </div>
  );
}
