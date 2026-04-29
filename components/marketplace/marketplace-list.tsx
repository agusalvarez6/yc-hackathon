"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { CATEGORY_BY_ID } from "@/lib/marketplace/countries";
import type { MarketplaceContract } from "@/lib/marketplace/contracts";
import { ContractModal } from "./contract-modal";

interface MarketplaceListProps {
  contracts: MarketplaceContract[];
}

const STATUS_TONE: Record<string, string> = {
  "Open for bids": "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  "Pre-solicitation": "bg-sky-50 text-sky-700 ring-sky-600/20",
  Awarded: "bg-zinc-100 text-zinc-700 ring-zinc-600/20",
  "Under review": "bg-amber-50 text-amber-700 ring-amber-600/20",
};

export function MarketplaceList({ contracts }: MarketplaceListProps) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<MarketplaceContract | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return contracts;
    return contracts.filter((c) => {
      return (
        c.title.toLowerCase().includes(q) ||
        c.agency.toLowerCase().includes(q) ||
        c.countryName.toLowerCase().includes(q)
      );
    });
  }, [contracts, query]);

  return (
    <>
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b px-5 py-3">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold">Public RFPs</h2>
            <p className="text-xs text-muted-foreground">
              {filtered.length.toLocaleString()} of{" "}
              {contracts.length.toLocaleString()} shown
            </p>
          </div>
          <div className="relative w-72 max-w-full">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title, buyer, country"
              className="h-8 pl-8 text-xs"
            />
          </div>
        </div>

        <div className="max-h-[640px] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-muted/60 text-[11px] uppercase tracking-wider text-muted-foreground backdrop-blur">
              <tr className="text-left">
                <th className="px-5 py-2.5 font-medium">Buyer</th>
                <th className="px-3 py-2.5 font-medium">Title</th>
                <th className="px-3 py-2.5 font-medium">Country</th>
                <th className="px-3 py-2.5 font-medium">Category</th>
                <th className="px-3 py-2.5 font-medium text-right">Value</th>
                <th className="px-3 py-2.5 font-medium">Status</th>
                <th className="px-5 py-2.5 font-medium text-right">Deadline</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-12 text-center text-xs text-muted-foreground"
                  >
                    No contracts match.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => {
                  const category = CATEGORY_BY_ID[c.category];
                  const tone =
                    STATUS_TONE[c.status] ??
                    "bg-zinc-100 text-zinc-700 ring-zinc-600/20";
                  return (
                    <tr
                      key={c.id}
                      onClick={() => setSelected(c)}
                      className="cursor-pointer transition-colors hover:bg-accent/40"
                    >
                      <td className="px-5 py-3 align-top">
                        <div className="font-medium">{c.agency}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {c.region}
                        </div>
                      </td>
                      <td className="max-w-[320px] px-3 py-3 align-top">
                        <div className="line-clamp-2 text-sm">{c.title}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {c.ref}
                        </div>
                      </td>
                      <td className="px-3 py-3 align-top text-sm">
                        {c.countryName}
                      </td>
                      <td className="px-3 py-3 align-top">
                        <div className="flex items-center gap-1.5 text-xs">
                          {category && (
                            <span
                              className="h-2 w-2 shrink-0 rounded-full"
                              style={{
                                background: `hsl(${category.hue} 70% 50%)`,
                              }}
                            />
                          )}
                          <span>{c.categoryLabel}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 align-top text-right tabular-nums">
                        ${c.valueM.toFixed(1)}M
                      </td>
                      <td className="px-3 py-3 align-top">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset",
                            tone,
                          )}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 align-top text-right">
                        <span
                          className={cn(
                            "text-xs tabular-nums",
                            c.deadlineDays <= 14
                              ? "font-medium text-rose-600"
                              : "text-muted-foreground",
                          )}
                        >
                          {c.deadlineDays}d
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ContractModal contract={selected} onClose={() => setSelected(null)} />
    </>
  );
}
