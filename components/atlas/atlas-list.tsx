"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { CATEGORY_BY_ID } from "@/lib/atlas/countries";
import type { AtlasContract } from "@/lib/atlas/contracts";
import { ContractModal } from "./contract-modal";

interface AtlasListProps {
  contracts: AtlasContract[];
}

const STATUS_TONE: Record<string, string> = {
  "Open for bids": "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  "Pre-solicitation": "bg-sky-50 text-sky-700 ring-sky-600/20",
  Awarded: "bg-zinc-100 text-zinc-700 ring-zinc-600/20",
  "Under review": "bg-amber-50 text-amber-700 ring-amber-600/20",
};

type SortKey =
  | "agency"
  | "title"
  | "country"
  | "category"
  | "valueM"
  | "status"
  | "deadlineDays";
type SortDir = "asc" | "desc";

export function AtlasList({ contracts }: AtlasListProps) {
  const [selected, setSelected] = useState<AtlasContract | null>(null);
  const [sortKey, setSortKey] = useState<SortKey | null>("valueM");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const sorted = useMemo(() => {
    if (!sortKey) return contracts;
    const arr = [...contracts];
    arr.sort((a, b) => {
      const av = a[sortKey === "country" ? "countryName" : sortKey];
      const bv = b[sortKey === "country" ? "countryName" : sortKey];
      let cmp: number;
      if (typeof av === "number" && typeof bv === "number") cmp = av - bv;
      else cmp = String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [contracts, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir("desc");
      return;
    }
    if (sortDir === "desc") {
      setSortDir("asc");
      return;
    }
    setSortKey(null);
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="flex items-center justify-between gap-3 border-b px-5 py-3">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold">Public RFPs</h2>
            <p className="text-xs text-muted-foreground tabular-nums">
              {contracts.length.toLocaleString()} matching
            </p>
          </div>
        </div>

        <div className="max-h-[calc(100vh-13rem)] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-card/95 text-[11px] uppercase tracking-wider text-muted-foreground backdrop-blur">
              <tr className="border-b text-left">
                <SortHead
                  label="Buyer"
                  active={sortKey === "agency"}
                  dir={sortDir}
                  onClick={() => toggleSort("agency")}
                  className="px-5 py-2.5"
                />
                <SortHead
                  label="Title"
                  active={sortKey === "title"}
                  dir={sortDir}
                  onClick={() => toggleSort("title")}
                  className="px-3 py-2.5"
                />
                <SortHead
                  label="Country"
                  active={sortKey === "country"}
                  dir={sortDir}
                  onClick={() => toggleSort("country")}
                  className="px-3 py-2.5"
                />
                <SortHead
                  label="Category"
                  active={sortKey === "category"}
                  dir={sortDir}
                  onClick={() => toggleSort("category")}
                  className="px-3 py-2.5"
                />
                <SortHead
                  label="Value"
                  active={sortKey === "valueM"}
                  dir={sortDir}
                  onClick={() => toggleSort("valueM")}
                  align="right"
                  className="px-3 py-2.5"
                />
                <SortHead
                  label="Status"
                  active={sortKey === "status"}
                  dir={sortDir}
                  onClick={() => toggleSort("status")}
                  className="px-3 py-2.5"
                />
                <SortHead
                  label="Deadline"
                  active={sortKey === "deadlineDays"}
                  dir={sortDir}
                  onClick={() => toggleSort("deadlineDays")}
                  align="right"
                  className="px-5 py-2.5"
                />
              </tr>
            </thead>
            <tbody className="divide-y">
              {sorted.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-12 text-center text-xs text-muted-foreground"
                  >
                    No contracts match.
                  </td>
                </tr>
              ) : (
                sorted.map((c) => {
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
                      <td className="max-w-[360px] px-3 py-3 align-top">
                        <div className="line-clamp-2 text-sm leading-snug">
                          {c.title}
                        </div>
                        <div className="font-mono text-[11px] text-muted-foreground">
                          {c.ref}
                        </div>
                      </td>
                      <td className="px-3 py-3 align-top">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                            {c.country}
                          </span>
                          {c.countryName}
                        </div>
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

function SortHead({
  label,
  active,
  dir,
  onClick,
  align = "left",
  className,
}: {
  label: string;
  active: boolean;
  dir: SortDir;
  onClick: () => void;
  align?: "left" | "right";
  className?: string;
}) {
  const Arrow = !active ? ArrowUpDown : dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <th className={cn("font-medium", className)}>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "inline-flex items-center gap-1.5 transition-colors hover:text-foreground",
          align === "right" && "ml-auto flex-row-reverse",
          active && "text-foreground",
        )}
      >
        <span>{label}</span>
        <Arrow className="h-3 w-3" />
      </button>
    </th>
  );
}
