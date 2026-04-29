import { Suspense } from "react";
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
import { getMarketplaceContracts } from "@/lib/marketplace/contracts";
import { MarketplaceList } from "@/components/marketplace/marketplace-list";
import { MarketplaceWorld } from "@/components/marketplace/marketplace-world";
import {
  ViewSwitcher,
  type MarketplaceView,
} from "@/components/marketplace/view-switcher";

interface InboxItem {
  rfpId: string;
  buyer: string;
  industry: string;
  title: string;
  deadline: string;
  estimatedValue: string;
  recommendation: Recommendation;
  confidence: number;
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
    oppById.get(id);
    items.push({
      rfpId: id,
      buyer: detail.summary.buyer,
      industry: detail.summary.industry,
      title: detail.summary.title,
      deadline: detail.summary.deadline,
      estimatedValue: detail.summary.estimatedValue,
      recommendation: detail.bidNoBid.recommendation,
      confidence: detail.bidNoBid.confidence,
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

interface PageProps {
  searchParams: Promise<{ view?: string }>;
}

export default function HomePage({ searchParams }: PageProps) {
  const inbox = buildInbox();

  return (
    <>
      <PageHeader
        title="Home"
        subtitle="Your inbox plus every public RFP we know about."
        actions={
          <Button asChild size="sm">
            <Link href="/rfp/new">
              <Plus className="h-4 w-4" />
              New RFP
            </Link>
          </Button>
        }
      />

      <div className="mx-auto max-w-6xl space-y-8 p-6">
        {/* Your inbox — internal RFPs */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">Your inbox</h2>
              <p className="text-xs text-muted-foreground">
                RFPs assigned to your team. Click to open the workspace.
              </p>
            </div>
            <span className="text-[11px] text-muted-foreground">
              {inbox.length} active
            </span>
          </div>

          {inbox.length === 0 ? (
            <div className="rounded-xl border bg-card p-8 text-center text-xs text-muted-foreground">
              No RFPs in your inbox yet.{" "}
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
                      className="group block h-full rounded-xl border bg-card p-4 transition-colors hover:bg-accent/40"
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
                      <div className="mt-2 line-clamp-2 text-sm">{o.title}</div>
                      <div className="mt-3 flex items-center justify-between text-[11px]">
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
                        <div className="flex items-center gap-2">
                          <span className="tabular-nums text-muted-foreground">
                            {o.confidence}%
                          </span>
                          <span className="inline-flex items-center gap-0.5 text-foreground/80 transition-colors group-hover:text-foreground">
                            Open
                            <ArrowRight className="h-3 w-3" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Marketplace — view depends on searchParams, so wrap in Suspense
            so the static shell can prerender. */}
        <Suspense fallback={<MarketplaceFallback />}>
          <MarketplaceSection searchParams={searchParams} />
        </Suspense>
      </div>
    </>
  );
}

async function MarketplaceSection({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const sp = await searchParams;
  const view: MarketplaceView = sp.view === "world" ? "world" : "list";
  const contracts = getMarketplaceContracts();

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Marketplace</h2>
          <p className="text-xs text-muted-foreground">
            All public RFPs we&apos;re tracking.
          </p>
        </div>
        <ViewSwitcher active={view} />
      </div>

      {view === "world" ? (
        <MarketplaceWorld contracts={contracts} />
      ) : (
        <MarketplaceList contracts={contracts} />
      )}
    </section>
  );
}

function MarketplaceFallback() {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold">Marketplace</h2>
        <p className="text-xs text-muted-foreground">
          All public RFPs we&apos;re tracking.
        </p>
      </div>
      <div className="h-[640px] animate-pulse rounded-xl border bg-card" />
    </section>
  );
}
