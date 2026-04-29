import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  CircleAlert,
  ListChecks,
  TrendingUp,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Avatar } from "@/components/avatar";
import { OwnerPill } from "@/components/owner-pill";
import { getDocuments, getRfpDetail, getRfpIds, getTeam } from "@/lib/data";
import { cn } from "@/lib/utils";
import type {
  CompanyDocument,
  RfpDetail,
  RfpRequirement,
  Status,
  TeamData,
} from "@/lib/types";
import { TaskRow } from "./task-row";
import { ProposalSection } from "./proposal-section";

export function generateStaticParams() {
  return getRfpIds().map((id) => ({ id }));
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function RfpDetailPage({ params }: PageProps) {
  const { id } = await params;
  const rfp = getRfpDetail(id);
  if (!rfp) notFound();

  const team = getTeam();
  const docs = getDocuments();
  const documentMap: Record<string, CompanyDocument> = Object.fromEntries(
    docs.map((d) => [d.id, d]),
  );

  return (
    <>
      <PageHeader
        title={rfp.summary.buyer}
        subtitle={rfp.summary.title}
        actions={
          <Link
            href="/opportunities"
            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to opportunities
          </Link>
        }
      />

      <div className="mx-auto max-w-6xl space-y-8 p-6">
        <SummaryHeader rfp={rfp} />
        <ComplianceMatrix rfp={rfp} documentMap={documentMap} />
        <TasksSection rfp={rfp} team={team} documentMap={documentMap} />
        <Suspense fallback={<p className="text-sm text-muted-foreground">Loading proposal…</p>}>
          <ProposalSection rfpId={rfp.id} />
        </Suspense>
      </div>
    </>
  );
}

/* ---------------- Summary header ---------------- */

function SummaryHeader({ rfp }: { rfp: RfpDetail }) {
  const ready = rfp.compliance.filter((r) => r.status === "ready").length;
  const partial = rfp.compliance.filter((r) => r.status === "partial").length;
  const missing = rfp.compliance.filter((r) => r.status === "missing").length;
  const total = rfp.compliance.length;

  const recColor =
    rfp.bidNoBid.recommendation === "bid"
      ? "from-emerald-500 to-emerald-600"
      : rfp.bidNoBid.recommendation === "review"
        ? "from-amber-500 to-amber-600"
        : "from-rose-500 to-rose-600";
  const recLabel =
    rfp.bidNoBid.recommendation === "bid"
      ? "Bid"
      : rfp.bidNoBid.recommendation === "review"
        ? "Review"
        : "Skip";

  return (
    <section className="space-y-4">
      <div className="rounded-xl border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 space-y-2">
            <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {rfp.summary.industry}
            </div>
            <h2 className="text-xl font-semibold leading-tight">
              {rfp.summary.title}
            </h2>
            <p className="max-w-3xl text-sm text-muted-foreground leading-relaxed">
              {rfp.summary.overview}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div
              className={cn(
                "rounded-lg bg-gradient-to-br px-3 py-1.5 text-sm font-semibold text-white",
                recColor,
              )}
            >
              {recLabel}
            </div>
            <div className="text-xs text-muted-foreground">
              Confidence{" "}
              <span className="font-semibold text-foreground tabular-nums">
                {rfp.bidNoBid.confidence}%
              </span>
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Fact
            label="Deadline"
            value={new Date(rfp.summary.deadline).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
            icon={Calendar}
          />
          <Fact label="Estimated value" value={rfp.summary.estimatedValue} />
          <Fact label="Contract" value={rfp.summary.contractType} />
          <Fact label="Submission" value={rfp.summary.submissionFormat} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat tone="emerald" label="Ready" value={`${ready}/${total}`} />
        <Stat tone="amber" label="Partial" value={`${partial}/${total}`} />
        <Stat tone="rose" label="Missing" value={`${missing}/${total}`} />
        <Stat
          tone="violet"
          label="Confidence"
          value={`${rfp.bidNoBid.confidence}%`}
          icon={TrendingUp}
        />
      </div>
    </section>
  );
}

function Fact({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: typeof Calendar;
}) {
  return (
    <div>
      <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5 flex items-center gap-1.5 text-sm">
        {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
        <span className="truncate">{value}</span>
      </div>
    </div>
  );
}

function Stat({
  tone,
  label,
  value,
  icon: Icon,
}: {
  tone: "emerald" | "amber" | "rose" | "violet";
  label: string;
  value: string;
  icon?: typeof TrendingUp;
}) {
  const dot = {
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    rose: "bg-rose-500",
    violet: "bg-violet-500",
  }[tone];
  return (
    <div className="rounded-lg border bg-card px-4 py-3 flex items-center gap-3">
      <span className={cn("h-2 w-2 rounded-full", dot)} />
      <div className="min-w-0">
        <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-base font-semibold tabular-nums">{value}</span>
          {Icon && <Icon className="h-3.5 w-3.5 text-violet-500" />}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Compliance matrix grouped by status ---------------- */

const STATUS_ORDER: Status[] = ["missing", "partial", "ready"];

function statusLabel(status: Status) {
  return status === "missing"
    ? "Missing evidence"
    : status === "partial"
      ? "Partial evidence"
      : "Ready";
}

function ComplianceMatrix({
  rfp,
  documentMap,
}: {
  rfp: RfpDetail;
  documentMap: Record<string, CompanyDocument>;
}) {
  const groups = STATUS_ORDER.map((status) => ({
    status,
    items: rfp.compliance.filter((r) => r.status === status),
  })).filter((g) => g.items.length > 0);

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <ListChecks className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold">Compliance matrix</h2>
        <span className="text-xs text-muted-foreground">
          {rfp.compliance.length} requirements extracted
        </span>
      </div>

      <div className="space-y-4">
        {groups.map((group) => (
          <div key={group.status} className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  group.status === "ready"
                    ? "bg-emerald-500"
                    : group.status === "partial"
                      ? "bg-amber-500"
                      : "bg-rose-500",
                )}
              />
              {statusLabel(group.status)}
              <span className="text-muted-foreground/60">
                {group.items.length}
              </span>
            </div>
            <ul className="space-y-2">
              {group.items.map((req) => (
                <li key={req.id}>
                  <ComplianceItem req={req} documentMap={documentMap} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

function ComplianceItem({
  req,
  documentMap,
}: {
  req: RfpRequirement;
  documentMap: Record<string, CompanyDocument>;
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-center gap-2 text-[11px]">
            <span className="font-mono font-medium">{req.id}</span>
            <span className="text-muted-foreground">§{req.section}</span>
            {req.mandatory && (
              <span className="font-bold text-rose-500" title="Mandatory">
                ●
              </span>
            )}
          </div>
          <p className="text-sm leading-snug">{req.requirement}</p>
          {req.evidence.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {req.evidence.map((e, i) => {
                const doc = documentMap[e.doc];
                return (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 rounded-md border bg-background px-1.5 py-0.5 text-[11px]"
                  >
                    <span className="font-medium truncate max-w-[180px]">
                      {doc?.name.replace(/\.[^.]+$/, "") || e.doc}
                    </span>
                    <span className="text-muted-foreground">p.{e.page}</span>
                  </span>
                );
              })}
            </div>
          )}
        </div>
        <div className="shrink-0">
          <OwnerPill ownerId={req.owner} />
        </div>
      </div>
    </div>
  );
}

/* ---------------- Tasks grouped by assignee ---------------- */

function TasksSection({
  rfp,
  team,
  documentMap,
}: {
  rfp: RfpDetail;
  team: TeamData;
  documentMap: Record<string, CompanyDocument>;
}) {
  const open = rfp.compliance.filter((r) => r.status !== "ready");
  const grouped = new Map<string, RfpRequirement[]>();
  for (const r of open) {
    const list = grouped.get(r.owner) ?? [];
    list.push(r);
    grouped.set(r.owner, list);
  }
  const ordered = Array.from(grouped.entries()).sort(
    (a, b) => b[1].length - a[1].length,
  );

  if (ordered.length === 0) {
    return (
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <h2 className="text-sm font-semibold">Tasks</h2>
        </div>
        <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
          No open tasks — every requirement is supported by evidence.
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <CircleAlert className="h-4 w-4 text-amber-500" />
        <h2 className="text-sm font-semibold">Tasks</h2>
        <span className="text-xs text-muted-foreground">
          {open.length} open across {ordered.length} owner
          {ordered.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="space-y-4">
        {ordered.map(([ownerId, items]) => {
          const member = team.members.find((m) => m.id === ownerId);
          return (
            <div
              key={ownerId}
              className="rounded-xl border bg-card overflow-hidden"
            >
              <div className="flex items-center gap-3 border-b bg-muted/30 px-5 py-3">
                {member ? (
                  <Avatar
                    initials={member.initials}
                    color={member.color}
                    size="md"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground">
                    ?
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold">
                    {member?.name ?? ownerId}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {member?.role ?? "Unassigned"} • {items.length} open
                  </div>
                </div>
              </div>
              <ul className="space-y-2 p-4">
                {items.map((req) => (
                  <li key={req.id}>
                    <TaskRow req={req} documentMap={documentMap} />
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
