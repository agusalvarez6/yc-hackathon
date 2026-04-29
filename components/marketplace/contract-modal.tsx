"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MarketplaceContract } from "@/lib/marketplace/contracts";
import { CATEGORY_BY_ID } from "@/lib/marketplace/countries";

interface ContractModalProps {
  contract: MarketplaceContract | null;
  onClose: () => void;
}

const STATUS_TONE: Record<string, string> = {
  "Open for bids": "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  "Pre-solicitation": "bg-sky-50 text-sky-700 ring-sky-600/20",
  Awarded: "bg-zinc-100 text-zinc-700 ring-zinc-600/20",
  "Under review": "bg-amber-50 text-amber-700 ring-amber-600/20",
};

export function ContractModal({ contract, onClose }: ContractModalProps) {
  useEffect(() => {
    if (!contract) return;
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [contract, onClose]);

  if (!contract) return null;
  const category = CATEGORY_BY_ID[contract.category];
  const tone =
    STATUS_TONE[contract.status] ?? "bg-zinc-100 text-zinc-700 ring-zinc-600/20";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={contract.title}
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg rounded-2xl border bg-card shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b px-6 py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {category && (
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: `hsl(${category.hue} 70% 50%)` }}
                />
              )}
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                {category?.label ?? contract.categoryLabel}
              </p>
            </div>
            <h2 className="mt-1 text-base font-semibold leading-snug">
              {contract.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-3 px-6 py-4 text-sm">
          <Field label="Buyer" value={contract.agency} />
          <Field label="Country" value={contract.countryName} />
          <Field label="Value" value={`$${contract.valueM.toFixed(1)}M`} />
          <Field label="Deadline" value={`${contract.deadlineDays} days`} />
          <Field
            label="Status"
            value={
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset",
                  tone,
                )}
              >
                {contract.status}
              </span>
            }
          />
          <Field label="Reference" value={<code className="font-mono text-[12px]">{contract.ref}</code>} />
        </div>

        <div className="flex items-center justify-end gap-2 border-t bg-muted/30 px-6 py-3">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button
            size="sm"
            onClick={() => {
              // Stub for the demo. Wiring this to the inbox is out of scope.
              alert("Coming soon");
            }}
          >
            Add to inbox
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5 text-sm">{value}</div>
    </div>
  );
}
