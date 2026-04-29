"use client";

import { useMemo } from "react";
import type { AtlasContract } from "@/lib/atlas/contracts";

export interface AtlasFilters {
  search: string;
  categories: string[];
  regions: string[];
  statuses: string[];
  valueMin: number;
  valueMax: number;
  country: string | null;
}

export const VALUE_DOMAIN = { min: 0, max: 80 } as const;

export const EMPTY_FILTERS: AtlasFilters = {
  search: "",
  categories: [],
  regions: [],
  statuses: [],
  valueMin: VALUE_DOMAIN.min,
  valueMax: VALUE_DOMAIN.max,
  country: null,
};

export function isFilterActive(f: AtlasFilters): boolean {
  return (
    f.search.trim().length > 0 ||
    f.categories.length > 0 ||
    f.regions.length > 0 ||
    f.statuses.length > 0 ||
    f.valueMin !== VALUE_DOMAIN.min ||
    f.valueMax !== VALUE_DOMAIN.max ||
    f.country !== null
  );
}

export function useFilteredContracts(
  contracts: AtlasContract[],
  filters: AtlasFilters,
): AtlasContract[] {
  return useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    const cats = new Set(filters.categories);
    const regions = new Set(filters.regions);
    const statuses = new Set(filters.statuses);

    return contracts.filter((c) => {
      if (q) {
        const hay = `${c.title} ${c.agency} ${c.countryName} ${c.ref}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (cats.size > 0 && !cats.has(c.category)) return false;
      if (regions.size > 0 && !regions.has(c.region)) return false;
      if (statuses.size > 0 && !statuses.has(c.status)) return false;
      if (c.valueM < filters.valueMin || c.valueM > filters.valueMax) return false;
      if (filters.country && c.country !== filters.country) return false;
      return true;
    });
  }, [contracts, filters]);
}

interface CountByValue<T extends string> {
  value: T;
  label: string;
  count: number;
}

export function countBy<T extends string>(
  contracts: AtlasContract[],
  pick: (c: AtlasContract) => T,
  labelOf: (v: T) => string,
): CountByValue<T>[] {
  const map = new Map<T, number>();
  for (const c of contracts) {
    const k = pick(c);
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([value, count]) => ({ value, label: labelOf(value), count }))
    .sort((a, b) => b.count - a.count);
}
