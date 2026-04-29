import Link from "next/link";
import { ArrowRight, Calendar, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import {
  getOpportunities,
  getRfpDetail,
  getRfpIds,
} from "@/lib/data";
import { cn } from "@/lib/utils";
import type { OpportunitySummary, Recommendation } from "@/lib/types";

interface InboxItem {
  rfpId: string;
  buyer: string;
  industry: string;
  title: string;
  deadline: string;
  estimatedValue: string;
  recommendation: Recommendation;
  confidence: number;
  topBlocker: string;
  fitScore: number;
}

function buildInbox(): InboxItem[] {
  const opportunities = getOpportunities();
  const oppById = new Map<string, OpportunitySummary>(
    opportunities.map((o) => [o.id, o]),
  );

  const items: InboxItem[] = [];
  for (const id of getRfpIds()) {
    const detail = getRfpDetail(id);
    if (!detail) continue;
    const opp = oppById.get(id);
    items.push({
      rfpId: id,
      buyer: detail.summary.buyer,
      industry: detail.summary.industry,
      title: detail.summary.title,
      deadline: detail.summary.deadline,
      estimatedValue: detail.summary.estimatedValue,
      recommendation: detail.bidNoBid.recommendation,
      confidence: detail.bidNoBid.confidence,
      topBlocker: opp?.topBlocker ?? "—",
      fitScore: opp?.fitScore ?? detail.bidNoBid.confidence,
    });
  }
  items.sort((a, b) => b.confidence - a.confidence);
  return items;
}

function recommendationStyles(rec: Recommendation) {
  switch (rec) {
    case "bid":
      return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";
    case "no-bid":
      return "bg-rose-50 text-rose-700 ring-rose-600/20";
    case "review":
      return "bg-amber-50 text-amber-700 ring-amber-600/20";
  }
}

function recommendationLabel(rec: Recommendation) {
  return rec === "bid" ? "Bid" : rec === "no-bid" ? "No-bid" : "Review";
}

function daysUntil(deadline: string) {
  const today = new Date("2026-04-29");
  const due = new Date(deadline);
  return Math.ceil((due.getTime() - today.getTime()) / 86_400_000);
}

export default function OpportunitiesPage() {
  const inbox = buildInbox();

  return (
    <>
      <PageHeader
        title="Opportunities"
        subtitle="RFPs you’re actively tracking."
        actions={
          <Button asChild size="sm">
            <Link href="/rfp/new">
              <Plus className="h-4 w-4" />
              New RFP
            </Link>
          </Button>
        }
      />

      <div className="mx-auto max-w-6xl space-y-4 p-6">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-sm font-semibold">Active opportunities</h2>
            <p className="text-xs text-muted-foreground">
              Click a row to open its workspace.
            </p>
          </div>
          <span className="text-[11px] tabular-nums text-muted-foreground">
            {inbox.length} active
          </span>
        </div>

        {inbox.length === 0 ? (
          <div className="rounded-xl border bg-card p-12 text-center text-xs text-muted-foreground">
            No RFPs yet.{" "}
            <Link
              href="/rfp/new"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Add one
            </Link>
            .
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {inbox.map((o) => {
              const days = daysUntil(o.deadline);
              return (
                <li key={o.rfpId}>
                  <Link
                    href={`/rfp/${o.rfpId}`}
                    className="group flex h-full flex-col rounded-xl border bg-card p-4 transition-colors hover:bg-accent/40"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">
                          {o.buyer}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {o.industry} • {o.estimatedValue}
                        </div>
                      </div>
                      <span
                        className={cn(
                          "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset",
                          recommendationStyles(o.recommendation),
                        )}
                      >
                        {recommendationLabel(o.recommendation)}
                      </span>
                    </div>
                    <div className="mt-2 line-clamp-2 text-sm leading-snug">
                      {o.title}
                    </div>

                    <div className="mt-3 space-y-1.5">
                      <ConfidenceMeter value={o.confidence} />
                      {o.topBlocker !== "—" && (
                        <div className="line-clamp-1 text-[11px] text-muted-foreground">
                          <span className="font-medium text-foreground/80">
                            Top blocker:
                          </span>{" "}
                          {o.topBlocker}
                        </div>
                      )}
                    </div>

                    <div className="mt-auto flex items-center justify-between pt-3 text-[11px]">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span
                          className={cn(
                            days <= 14 ? "font-medium text-rose-600" : "",
                          )}
                        >
                          {days}d left
                        </span>
                      </div>
                      <span className="inline-flex items-center gap-0.5 text-foreground/80 transition-colors group-hover:text-foreground">
                        Open
                        <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}

function ConfidenceMeter({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
        <span>Confidence</span>
        <span className="tabular-nums text-foreground">{pct}%</span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            pct >= 70
              ? "bg-emerald-500"
              : pct >= 40
                ? "bg-amber-500"
                : "bg-rose-500",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
