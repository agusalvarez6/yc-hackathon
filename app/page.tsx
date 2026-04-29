import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  CircleAlert,
  Plus,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { OwnerPill } from "@/components/owner-pill";
import {
  getOpportunities,
  getRfpDetail,
  getRfpIds,
  getTeam,
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
  ready: number;
  total: number;
  topOwner: string | null;
  topBlocker: string | null;
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
    const ready = detail.compliance.filter((r) => r.status === "ready").length;
    const total = detail.compliance.length;
    const firstMissing = detail.compliance.find(
      (r) => r.status === "missing",
    );
    items.push({
      rfpId: id,
      buyer: detail.summary.buyer,
      industry: detail.summary.industry,
      title: detail.summary.title,
      deadline: detail.summary.deadline,
      estimatedValue: detail.summary.estimatedValue,
      recommendation: detail.bidNoBid.recommendation,
      confidence: detail.bidNoBid.confidence,
      ready,
      total,
      topOwner: firstMissing?.owner ?? null,
      topBlocker: firstMissing?.requirement ?? opp?.topBlocker ?? null,
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
  const team = getTeam();

  const totalRequirements = inbox.reduce((s, o) => s + o.total, 0);
  const totalReady = inbox.reduce((s, o) => s + o.ready, 0);
  const openItems = team.members.reduce((s, m) => s + m.openItems, 0);

  return (
    <>
      <PageHeader
        title="Opportunities"
        subtitle="Active RFPs auto-scored against your company memory"
        actions={
          <Button asChild size="sm">
            <Link href="/rfp/new">
              <Plus className="h-4 w-4" />
              New RFP
            </Link>
          </Button>
        }
      />

      <div className="mx-auto max-w-6xl space-y-6 p-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard
            label="Active opportunities"
            value={inbox.length.toString()}
            hint={`${inbox.filter((o) => o.recommendation === "bid").length} marked bid`}
          />
          <StatCard
            label="Requirements covered"
            value={`${totalReady}/${totalRequirements}`}
            hint={`${totalRequirements - totalReady} still need evidence`}
          />
          <StatCard
            label="Open items"
            value={openItems.toString()}
            hint={`across ${team.members.length} owners`}
          />
        </div>

        {inbox.length === 0 ? (
          <div className="rounded-xl border bg-card p-10 text-center text-sm text-muted-foreground">
            No RFPs yet.{" "}
            <Link
              href="/rfp/new"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Add the first one
            </Link>
            .
          </div>
        ) : (
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="flex items-center justify-between border-b px-5 py-3">
              <div>
                <h2 className="text-sm font-semibold">RFP inbox</h2>
                <p className="text-xs text-muted-foreground">
                  Sorted by agent confidence. Click an RFP to open the
                  workspace.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-violet-500" />
                {inbox.length} scored
              </div>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr className="text-left">
                  <th className="px-5 py-2.5 font-medium">Buyer</th>
                  <th className="px-3 py-2.5 font-medium">Title</th>
                  <th className="px-3 py-2.5 font-medium">Deadline</th>
                  <th className="px-3 py-2.5 font-medium">Confidence</th>
                  <th className="px-3 py-2.5 font-medium">Recommendation</th>
                  <th className="px-3 py-2.5 font-medium">Top blocker</th>
                  <th className="px-5 py-2.5 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {inbox.map((o) => {
                  const days = daysUntil(o.deadline);
                  return (
                    <tr
                      key={o.rfpId}
                      className="hover:bg-accent/40 transition-colors"
                    >
                      <td className="px-5 py-3 align-top">
                        <Link href={`/rfp/${o.rfpId}`} className="block group">
                          <div className="font-medium group-hover:text-foreground">
                            {o.buyer}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {o.industry} • {o.estimatedValue}
                          </div>
                        </Link>
                      </td>
                      <td className="px-3 py-3 align-top max-w-[280px]">
                        <Link href={`/rfp/${o.rfpId}`} className="text-sm">
                          {o.title}
                        </Link>
                      </td>
                      <td className="px-3 py-3 align-top">
                        <div className="flex items-center gap-1.5 text-xs">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium">
                            {new Date(o.deadline).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                        <div
                          className={cn(
                            "text-[11px] mt-0.5",
                            days <= 14
                              ? "text-rose-600 font-medium"
                              : "text-muted-foreground",
                          )}
                        >
                          {days} days left
                        </div>
                      </td>
                      <td className="px-3 py-3 align-top">
                        <ConfidenceMeter score={o.confidence} />
                      </td>
                      <td className="px-3 py-3 align-top">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset",
                            recommendationStyles(o.recommendation),
                          )}
                        >
                          {recommendationLabel(o.recommendation)}
                        </span>
                      </td>
                      <td className="px-3 py-3 align-top max-w-[280px]">
                        {o.topBlocker ? (
                          <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                            <CircleAlert className="h-3.5 w-3.5 mt-0.5 shrink-0 text-amber-500" />
                            <div className="space-y-0.5 min-w-0">
                              <div className="line-clamp-2">{o.topBlocker}</div>
                              {o.topOwner && <OwnerPill ownerId={o.topOwner} />}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">
                            None — ready to draft
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 align-top text-right">
                        <Link
                          href={`/rfp/${o.rfpId}`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-foreground/80 hover:text-foreground"
                        >
                          Open
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

function ConfidenceMeter({ score }: { score: number }) {
  const tone =
    score >= 80
      ? "bg-emerald-500"
      : score >= 60
        ? "bg-amber-500"
        : "bg-rose-500";
  return (
    <div className="flex items-center gap-2 min-w-[140px]">
      <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full", tone)}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-xs font-medium tabular-nums w-8 text-right">
        {score}
      </span>
      <TrendingUp className="h-3 w-3 text-muted-foreground" />
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
      {hint && (
        <div className="mt-0.5 text-[11px] text-muted-foreground">{hint}</div>
      )}
    </div>
  );
}
