import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  CircleAlert,
  FileText,
  Plus,
  Sparkles,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { OwnerPill } from "@/components/owner-pill";
import { getDocuments, getOpportunities, getTeam } from "@/lib/data";
import { cn } from "@/lib/utils";
import type { OpportunitySummary } from "@/lib/types";

function recommendationStyles(rec: OpportunitySummary["recommendation"]) {
  switch (rec) {
    case "bid":
      return "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30";
    case "no-bid":
      return "bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-300";
    case "review":
      return "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300";
  }
}

function recommendationLabel(rec: OpportunitySummary["recommendation"]) {
  return rec === "bid" ? "Bid" : rec === "no-bid" ? "No-bid" : "Review";
}

function FitMeter({ score }: { score: number }) {
  const tone =
    score >= 80
      ? "bg-emerald-500"
      : score >= 60
        ? "bg-amber-500"
        : "bg-rose-500";
  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full", tone)}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-xs font-medium tabular-nums w-8 text-right">
        {score}
      </span>
    </div>
  );
}

function daysUntil(deadline: string) {
  const today = new Date("2026-04-29");
  const due = new Date(deadline);
  const diff = Math.ceil((due.getTime() - today.getTime()) / 86_400_000);
  return diff;
}

export default function OpportunitiesPage() {
  const opportunities = getOpportunities();
  const documents = getDocuments();
  const team = getTeam();

  const totalRequirements = opportunities.reduce(
    (s, o) => s + o.requirementsCount,
    0,
  );
  const totalReady = opportunities.reduce((s, o) => s + o.ready, 0);
  const openItems = team.members.reduce((s, m) => s + m.openItems, 0);

  return (
    <>
      <PageHeader
        title="Opportunities"
        subtitle="Active RFPs auto-scored against your company memory"
        actions={
          <>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4" />
              New RFP
            </Button>
            <Button size="sm">
              <Upload className="h-4 w-4" />
              Upload RFP
            </Button>
          </>
        }
      />

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <StatCard
            label="Active opportunities"
            value={opportunities.length.toString()}
            hint="2 closing this month"
          />
          <StatCard
            label="Requirements tracked"
            value={totalRequirements.toString()}
            hint={`${totalReady} ready • ${totalRequirements - totalReady} open`}
          />
          <StatCard
            label="Open items across team"
            value={openItems.toString()}
            hint="across 5 owners"
          />
          <StatCard
            label="Documents in memory"
            value={documents.length.toString()}
            hint="last refreshed today"
          />
        </div>

        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="flex items-center justify-between border-b px-5 py-3">
            <div>
              <h2 className="text-sm font-semibold">RFP inbox</h2>
              <p className="text-xs text-muted-foreground">
                Click an opportunity to open the response workspace.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-violet-500" />
              Agent scored {opportunities.length} new RFPs in the last 7 days
            </div>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-2.5 font-medium">Buyer</th>
                <th className="px-3 py-2.5 font-medium">Title</th>
                <th className="px-3 py-2.5 font-medium">Deadline</th>
                <th className="px-3 py-2.5 font-medium">Fit</th>
                <th className="px-3 py-2.5 font-medium">Recommendation</th>
                <th className="px-3 py-2.5 font-medium">Top blocker</th>
                <th className="px-5 py-2.5 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {opportunities.map((o) => {
                const days = daysUntil(o.deadline);
                return (
                  <tr
                    key={o.id}
                    className="hover:bg-accent/40 transition-colors"
                  >
                    <td className="px-5 py-3 align-top">
                      <Link
                        href={`/rfp/${o.id}`}
                        className="block group"
                      >
                        <div className="font-medium group-hover:text-foreground">
                          {o.buyer}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {o.industry} • {o.estimatedValue}
                        </div>
                      </Link>
                    </td>
                    <td className="px-3 py-3 align-top max-w-[280px]">
                      <Link href={`/rfp/${o.id}`} className="text-sm">
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
                      <FitMeter score={o.fitScore} />
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
                    <td className="px-3 py-3 align-top max-w-[260px]">
                      <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                        <CircleAlert className="h-3.5 w-3.5 mt-0.5 shrink-0 text-amber-500" />
                        <span>{o.topBlocker}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 align-top text-right">
                      <Link
                        href={`/rfp/${o.id}`}
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-xl border bg-card overflow-hidden">
            <div className="flex items-center justify-between border-b px-5 py-3">
              <div>
                <h2 className="text-sm font-semibold">Document library</h2>
                <p className="text-xs text-muted-foreground">
                  Company memory used by every response.
                </p>
              </div>
              <Link
                href="/documents"
                className="text-xs font-medium text-foreground/80 hover:text-foreground inline-flex items-center gap-1"
              >
                View all
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-border">
              {documents.slice(0, 6).map((doc) => (
                <div
                  key={doc.id}
                  className="bg-card p-4 hover:bg-accent/30 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">
                        {doc.name}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {doc.size} • used in {doc.usedIn} RFPs
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                          {doc.tag}
                        </span>
                        <OwnerPill ownerId={doc.owner} />
                      </div>
                      {doc.warning && (
                        <div className="mt-2 flex items-start gap-1.5 text-[11px] text-rose-600">
                          <CircleAlert className="h-3 w-3 mt-0.5 shrink-0" />
                          <span>{doc.warning}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="border-b px-5 py-3">
              <h2 className="text-sm font-semibold">Response team</h2>
              <p className="text-xs text-muted-foreground">
                Who owes what across active RFPs.
              </p>
            </div>
            <ul className="divide-y">
              {team.members.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center gap-3 px-5 py-3"
                >
                  <div
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full text-white text-xs font-semibold",
                      m.color,
                    )}
                  >
                    {m.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{m.name}</div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      {m.role}
                    </div>
                  </div>
                  <div
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset",
                      m.openItems > 5
                        ? "bg-rose-50 text-rose-700 ring-rose-600/20"
                        : m.openItems > 2
                          ? "bg-amber-50 text-amber-700 ring-amber-600/20"
                          : "bg-zinc-100 text-zinc-600 ring-zinc-500/20",
                    )}
                  >
                    {m.openItems} open
                  </div>
                </li>
              ))}
            </ul>
            <div className="border-t px-5 py-3">
              <Link
                href="/team"
                className="text-xs font-medium text-foreground/80 hover:text-foreground inline-flex items-center gap-1"
              >
                Manage team
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
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
