"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { getAtlasContracts } from "@/lib/atlas/contracts";
import { AtlasList } from "@/components/atlas/atlas-list";
import { AtlasWorld } from "@/components/atlas/atlas-world";
import { ViewSwitcher, type AtlasView } from "@/components/atlas/view-switcher";
import { FilterDock } from "@/components/atlas/filter-dock";
import {
  EMPTY_FILTERS,
  useFilteredContracts,
  type AtlasFilters,
} from "@/components/atlas/use-atlas-filters";

export default function AtlasPage() {
  const contracts = useMemo(() => getAtlasContracts(), []);
  const [view, setView] = useState<AtlasView>("world");
  const [filters, setFilters] = useState<AtlasFilters>(EMPTY_FILTERS);

  const filtered = useFilteredContracts(contracts, filters);

  return (
    <>
      <PageHeader
        title="Atlas"
        subtitle="All public RFPs we’re tracking, on the globe."
      />

      <div className="border-b bg-background/70 px-6 py-3.5 backdrop-blur-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <FilterDock
              contracts={contracts}
              filters={filters}
              onFiltersChange={setFilters}
            />
          </div>
          <div className="flex items-center gap-3 pt-1">
            <span className="hidden whitespace-nowrap text-[11px] tabular-nums text-muted-foreground sm:inline">
              {filtered.length.toLocaleString()} of{" "}
              {contracts.length.toLocaleString()}
            </span>
            <ViewSwitcher active={view} onChange={setView} />
          </div>
        </div>
      </div>

      {view === "world" ? (
        <AtlasWorld
          contracts={filtered}
          selectedCountry={filters.country}
          onSelectedCountryChange={(country) =>
            setFilters({ ...filters, country })
          }
        />
      ) : (
        <div className="p-6">
          <AtlasList contracts={filtered} />
        </div>
      )}
    </>
  );
}
