"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  Download,
  FileSpreadsheet,
  FileText,
  Files,
  ListChecks,
  MessageSquareText,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { OwnerPill } from "@/components/owner-pill";
import { Avatar } from "@/components/avatar";
import { RiskPill, StatusPill } from "@/components/status-pill";
import type {
  CompanyDocument,
  RfpDetail,
  RfpRequirement,
  TeamData,
} from "@/lib/types";

type TabKey = "summary" | "compliance" | "missing" | "draft" | "export";

const tabs: { key: TabKey; label: string; icon: typeof Sparkles }[] = [
  { key: "summary", label: "Summary", icon: FileText },
  { key: "compliance", label: "Compliance Matrix", icon: ListChecks },
  { key: "missing", label: "Missing Info", icon: CircleAlert },
  { key: "draft", label: "Draft", icon: MessageSquareText },
  { key: "export", label: "Export", icon: Files },
];

interface WorkspaceProps {
  rfp: RfpDetail;
  team: TeamData;
  documentMap: Record<string, CompanyDocument>;
}

export function Workspace({ rfp, team, documentMap }: WorkspaceProps) {
  const [tab, setTab] = useState<TabKey>("compliance");
  const ready = rfp.compliance.filter((r) => r.status === "ready").length;
  const partial = rfp.compliance.filter((r) => r.status === "partial").length;
  const missing = rfp.compliance.filter((r) => r.status === "missing").length;
  const total = rfp.compliance.length;

  return (
    <>
      <div className="flex h-14 items-center justify-between border-b bg-background/80 backdrop-blur-sm px-6 sticky top-0 z-10">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold truncate">
                {rfp.summary.buyer}
              </h1>
              <span className="text-[11px] text-muted-foreground">
                {rfp.summary.industry}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground truncate">
              {rfp.summary.title} • due{" "}
              {new Date(rfp.summary.deadline).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Sparkles className="h-4 w-4" />
            Re-run agent
          </Button>
          <Button size="sm">
            <Download className="h-4 w-4" />
            Export packet
          </Button>
        </div>
      </div>

      <div className="border-b bg-muted/30 px-6 py-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <PillStat
            tone="emerald"
            label="Ready"
            value={`${ready}/${total}`}
          />
          <PillStat
            tone="amber"
            label="Partial"
            value={`${partial}/${total}`}
          />
          <PillStat
            tone="rose"
            label="Missing"
            value={`${missing}/${total}`}
          />
          <PillStat
            tone="violet"
            label="Agent confidence"
            value={`${rfp.bidNoBid.confidence}%`}
            icon={TrendingUp}
          />
        </div>
      </div>

      <div className="border-b px-6">
        <div className="flex items-center gap-1 -mb-px overflow-x-auto">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  "inline-flex items-center gap-1.5 border-b-2 px-3 py-3 text-sm font-medium transition-colors whitespace-nowrap",
                  active
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {t.label}
                {t.key === "missing" && (
                  <span className="ml-1 rounded-full bg-rose-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-rose-600">
                    {rfp.missingInfo.reduce((s, g) => s + g.items.length, 0)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-6">
        {tab === "summary" && <SummaryTab rfp={rfp} />}
        {tab === "compliance" && (
          <ComplianceTab rfp={rfp} documentMap={documentMap} />
        )}
        {tab === "missing" && <MissingTab rfp={rfp} team={team} />}
        {tab === "draft" && <DraftTab rfp={rfp} documentMap={documentMap} />}
        {tab === "export" && <ExportTab rfp={rfp} />}
      </div>
    </>
  );
}

function PillStat({
  tone,
  label,
  value,
  icon: Icon,
}: {
  tone: "emerald" | "amber" | "rose" | "violet";
  label: string;
  value: string;
  icon?: typeof Sparkles;
}) {
  const toneCls = {
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    rose: "bg-rose-500",
    violet: "bg-violet-500",
  }[tone];
  return (
    <div className="rounded-lg border bg-card px-4 py-2.5 flex items-center gap-3">
      <span className={cn("h-2 w-2 rounded-full", toneCls)} />
      <div>
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

/* ---------------- Summary tab ---------------- */

function SummaryTab({ rfp }: { rfp: RfpDetail }) {
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
        ? "Review carefully"
        : "Skip";
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-4">
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-violet-500" />
            Agent recommendation
          </div>
          <div className="mt-2 flex items-baseline gap-3">
            <div
              className={cn(
                "rounded-lg bg-gradient-to-br px-3 py-1.5 text-white text-sm font-semibold",
                recColor,
              )}
            >
              {recLabel}
            </div>
            <div className="text-sm text-muted-foreground">
              Confidence{" "}
              <span className="font-semibold text-foreground">
                {rfp.bidNoBid.confidence}%
              </span>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wider text-emerald-700 mb-1.5">
                Strengths
              </div>
              <ul className="space-y-1.5 text-sm">
                {rfp.bidNoBid.strengths.map((s) => (
                  <li key={s} className="flex items-start gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0 text-emerald-500" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wider text-rose-700 mb-1.5">
                Weaknesses
              </div>
              <ul className="space-y-1.5 text-sm">
                {rfp.bidNoBid.weaknesses.map((s) => (
                  <li key={s} className="flex items-start gap-2">
                    <CircleAlert className="h-3.5 w-3.5 mt-0.5 shrink-0 text-rose-500" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <h3 className="text-sm font-semibold">Opportunity overview</h3>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            {rfp.summary.overview}
          </p>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <h3 className="text-sm font-semibold">Evaluation criteria</h3>
          <div className="mt-3 space-y-2.5">
            {rfp.summary.evaluationCriteria.map((c) => (
              <div key={c.label} className="flex items-center gap-3">
                <div className="w-40 text-sm">{c.label}</div>
                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-foreground/80 rounded-full"
                    style={{ width: `${c.weight}%` }}
                  />
                </div>
                <div className="w-10 text-right text-xs font-medium tabular-nums">
                  {c.weight}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-xl border bg-card p-5 space-y-3">
          <h3 className="text-sm font-semibold">Key facts</h3>
          <Fact label="Buyer" value={rfp.summary.buyer} />
          <Fact label="Industry" value={rfp.summary.industry} />
          <Fact label="Estimated value" value={rfp.summary.estimatedValue} />
          <Fact label="Contract type" value={rfp.summary.contractType} />
          <Fact label="Primary contact" value={rfp.summary.primaryContact} />
          <Fact label="Submission" value={rfp.summary.submissionFormat} />
          <Fact
            label="Received"
            value={new Date(rfp.summary.received).toLocaleDateString()}
          />
          <Fact
            label="Deadline"
            value={new Date(rfp.summary.deadline).toLocaleDateString()}
          />
        </div>

        <div className="rounded-xl border bg-card p-5">
          <h3 className="text-sm font-semibold">Required attachments</h3>
          <ul className="mt-3 space-y-1.5 text-sm">
            {rfp.summary.requiredAttachments.map((a) => (
              <li key={a} className="flex items-start gap-2">
                <FileText className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="text-sm mt-0.5">{value}</div>
    </div>
  );
}

/* ---------------- Compliance Matrix tab ---------------- */

function ComplianceTab({
  rfp,
  documentMap,
}: {
  rfp: RfpDetail;
  documentMap: Record<string, CompanyDocument>;
}) {
  const [expanded, setExpanded] = useState<string | null>("R4");
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="flex items-center justify-between border-b px-5 py-3">
        <div>
          <h3 className="text-sm font-semibold">Compliance matrix</h3>
          <p className="text-xs text-muted-foreground">
            {rfp.compliance.length} requirements extracted from the RFP, routed
            to owners.
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4" />
          Export .xlsx
        </Button>
      </div>
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
          <tr className="text-left">
            <th className="px-5 py-2.5 font-medium w-16">Req</th>
            <th className="px-3 py-2.5 font-medium">Requirement</th>
            <th className="px-3 py-2.5 font-medium">Status</th>
            <th className="px-3 py-2.5 font-medium">Evidence</th>
            <th className="px-3 py-2.5 font-medium">Owner</th>
            <th className="px-3 py-2.5 font-medium">Risk</th>
            <th className="px-5 py-2.5 font-medium w-10" />
          </tr>
        </thead>
        <tbody className="divide-y">
          {rfp.compliance.map((r) => (
            <ComplianceRow
              key={r.id}
              req={r}
              isExpanded={expanded === r.id}
              onToggle={() => setExpanded(expanded === r.id ? null : r.id)}
              documentMap={documentMap}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ComplianceRow({
  req,
  isExpanded,
  onToggle,
  documentMap,
}: {
  req: RfpRequirement;
  isExpanded: boolean;
  onToggle: () => void;
  documentMap: Record<string, CompanyDocument>;
}) {
  return (
    <>
      <tr
        className={cn(
          "hover:bg-accent/40 transition-colors cursor-pointer",
          isExpanded && "bg-accent/30",
        )}
        onClick={onToggle}
      >
        <td className="px-5 py-3 align-top">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[11px] font-medium">{req.id}</span>
            {req.mandatory && (
              <span
                className="text-rose-500 text-[10px] font-bold"
                title="Mandatory"
              >
                ●
              </span>
            )}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">
            §{req.section}
          </div>
        </td>
        <td className="px-3 py-3 align-top max-w-[420px]">
          <div className="text-sm">{req.requirement}</div>
        </td>
        <td className="px-3 py-3 align-top">
          <StatusPill status={req.status} />
        </td>
        <td className="px-3 py-3 align-top max-w-[220px]">
          {req.evidence.length === 0 ? (
            <span className="text-xs text-muted-foreground italic">
              No source found
            </span>
          ) : (
            <div className="space-y-1">
              {req.evidence.map((e, i) => {
                const doc = documentMap[e.doc];
                return (
                  <div
                    key={i}
                    className="inline-flex items-center gap-1.5 rounded-md border bg-background px-1.5 py-0.5 text-[11px] mr-1"
                  >
                    <FileText className="h-3 w-3 text-muted-foreground" />
                    <span className="font-medium truncate max-w-[140px]">
                      {doc?.name.replace(/\.[^.]+$/, "") || e.doc}
                    </span>
                    <span className="text-muted-foreground">p.{e.page}</span>
                  </div>
                );
              })}
            </div>
          )}
        </td>
        <td className="px-3 py-3 align-top">
          <OwnerPill ownerId={req.owner} />
        </td>
        <td className="px-3 py-3 align-top">
          <RiskPill risk={req.risk} />
        </td>
        <td className="px-5 py-3 align-top text-right">
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              isExpanded && "rotate-180",
            )}
          />
        </td>
      </tr>
      {isExpanded && (
        <tr className="bg-muted/20">
          <td colSpan={7} className="px-5 py-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 space-y-2">
                <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  Source quote
                </div>
                <blockquote className="rounded-md border-l-2 border-foreground/20 bg-background px-3 py-2 text-sm italic text-muted-foreground">
                  &ldquo;{req.requirement}&rdquo;
                </blockquote>
                {req.note && (
                  <>
                    <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground pt-2">
                      Agent note
                    </div>
                    <div className="rounded-md bg-background px-3 py-2 text-sm">
                      {req.note}
                    </div>
                  </>
                )}
              </div>
              <div className="space-y-2">
                <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  Matched evidence
                </div>
                {req.evidence.length === 0 ? (
                  <div className="text-sm text-muted-foreground italic">
                    No supporting documents found.
                  </div>
                ) : (
                  req.evidence.map((e, i) => {
                    const doc = documentMap[e.doc];
                    return (
                      <div
                        key={i}
                        className="rounded-md border bg-background p-3 space-y-1"
                      >
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                          {doc?.name || e.doc}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          &ldquo;{e.snippet}&rdquo; · p.{e.page}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

/* ---------------- Missing Info tab ---------------- */

function MissingTab({ rfp, team }: { rfp: RfpDetail; team: TeamData }) {
  const total = rfp.missingInfo.reduce((s, g) => s + g.items.length, 0);
  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-card p-5 flex items-start gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-500/10 text-rose-500 shrink-0">
          <CircleAlert className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold">
            {total} open items routed to {rfp.missingInfo.length} owners
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            The agent flagged information that is required by the RFP but not
            supported by the documents in your company memory. Resolve these
            before submission.
          </p>
        </div>
        <Button variant="outline" size="sm">
          <MessageSquareText className="h-4 w-4" />
          Send all to Slack
        </Button>
      </div>

      <div className="space-y-3">
        {rfp.missingInfo.map((group) => {
          const member = team.members.find((m) => m.id === group.owner);
          if (!member) return null;
          return (
            <div
              key={group.owner}
              className="rounded-xl border bg-card overflow-hidden"
            >
              <div className="flex items-center gap-3 border-b bg-muted/30 px-5 py-3">
                <Avatar
                  initials={member.initials}
                  color={member.color}
                  size="md"
                />
                <div className="flex-1">
                  <div className="text-sm font-semibold">{member.name}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {member.role} • {group.items.length} open
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  <MessageSquareText className="h-4 w-4" />
                  Notify
                </Button>
              </div>
              <ul className="divide-y">
                {group.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 px-5 py-3">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 rounded border-border text-foreground focus:ring-foreground"
                    />
                    <span className="text-sm flex-1">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- Draft tab ---------------- */

function DraftTab({
  rfp,
  documentMap,
}: {
  rfp: RfpDetail;
  documentMap: Record<string, CompanyDocument>;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
      <div className="lg:col-span-1">
        <div className="rounded-xl border bg-card p-4 sticky top-32">
          <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-2">
            Sections
          </div>
          <ul className="space-y-1">
            {rfp.draft.map((s) => (
              <li
                key={s.section}
                className="flex items-start gap-2 text-sm py-1"
              >
                <div
                  className={cn(
                    "mt-1.5 h-1.5 w-1.5 rounded-full shrink-0",
                    s.placeholders.length > 0 ? "bg-amber-500" : "bg-emerald-500",
                  )}
                />
                <span className="flex-1">{s.section}</span>
                {s.placeholders.length > 0 && (
                  <span className="text-[10px] font-semibold text-amber-600">
                    {s.placeholders.length}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="lg:col-span-3 space-y-4">
        <div className="flex items-center gap-2 rounded-lg border bg-amber-50 px-4 py-2.5 text-sm dark:bg-amber-500/10">
          <Sparkles className="h-4 w-4 text-amber-600 shrink-0" />
          <span className="text-amber-900 dark:text-amber-200">
            Every paragraph cites a source document. Red brackets flag claims
            the agent refused to fabricate — they need a human answer.
          </span>
        </div>

        {rfp.draft.map((section) => (
          <div
            key={section.section}
            className="rounded-xl border bg-card overflow-hidden"
          >
            <div className="flex items-center justify-between border-b bg-muted/20 px-5 py-3">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-semibold">{section.section}</h3>
                {section.placeholders.length > 0 && (
                  <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                    {section.placeholders.length} placeholders
                  </span>
                )}
              </div>
              <OwnerPill ownerId={section.owner} showRole />
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm leading-relaxed">
                {renderBody(section.body, section.placeholders)}
              </p>
              <div className="flex items-center gap-2 flex-wrap pt-2 border-t">
                <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  Cites
                </span>
                {section.citations.map((c) => {
                  const doc = documentMap[c];
                  return (
                    <span
                      key={c}
                      className="inline-flex items-center gap-1 rounded-md border bg-background px-2 py-0.5 text-[11px]"
                    >
                      <FileText className="h-3 w-3 text-muted-foreground" />
                      {doc?.name.replace(/\.[^.]+$/, "") || c}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function renderBody(body: string, placeholders: string[]) {
  if (placeholders.length === 0) return body;
  const parts: React.ReactNode[] = [];
  let remaining = body;
  let i = 0;
  while (remaining.length > 0) {
    const match = remaining.match(/\[([^\]]+)\]/);
    if (!match) {
      parts.push(remaining);
      break;
    }
    const before = remaining.slice(0, match.index);
    if (before) parts.push(before);
    const inner = match[1];
    const isPlaceholder = placeholders.some((p) => p === inner);
    if (isPlaceholder) {
      parts.push(
        <span
          key={i++}
          className="rounded-md bg-rose-500/15 px-1.5 py-0.5 text-[11px] font-semibold text-rose-700 mx-0.5"
        >
          [{inner}]
        </span>,
      );
    } else {
      parts.push(
        <span
          key={i++}
          className="rounded-md bg-violet-500/10 px-1.5 py-0.5 text-[11px] font-medium text-violet-700 mx-0.5"
        >
          [{inner}]
        </span>,
      );
    }
    remaining = remaining.slice((match.index ?? 0) + match[0].length);
  }
  return <>{parts}</>;
}

/* ---------------- Export tab ---------------- */

function ExportTab({ rfp }: { rfp: RfpDetail }) {
  const iconFor = (name: string) => {
    if (name.endsWith(".docx")) return FileText;
    if (name.endsWith(".xlsx")) return FileSpreadsheet;
    if (name.endsWith(".pdf")) return FileText;
    return Files;
  };
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 rounded-xl border bg-card overflow-hidden">
        <div className="border-b px-5 py-3">
          <h3 className="text-sm font-semibold">Submission packet</h3>
          <p className="text-xs text-muted-foreground">
            Files generated from your compliance matrix, draft, and source
            documents.
          </p>
        </div>
        <ul className="divide-y">
          {rfp.exports.map((f) => {
            const Icon = iconFor(f.name);
            return (
              <li
                key={f.name}
                className="flex items-center gap-3 px-5 py-3.5"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{f.name}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {f.ready
                      ? `Ready • ${f.size}`
                      : "Blocked — resolve missing items first"}
                  </div>
                </div>
                <Button variant="outline" size="sm" disabled={!f.ready}>
                  <Download className="h-4 w-4" />
                  {f.ready ? "Download" : "Locked"}
                </Button>
              </li>
            );
          })}
        </ul>
        <div className="flex items-center justify-between border-t bg-muted/30 px-5 py-3">
          <div className="text-xs text-muted-foreground">
            {rfp.exports.filter((e) => e.ready).length} of {rfp.exports.length}{" "}
            files ready
          </div>
          <Button size="sm">
            <Download className="h-4 w-4" />
            Download all
          </Button>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-5 space-y-3">
        <h3 className="text-sm font-semibold">Pre-flight checks</h3>
        <Check ok={true} label="All mandatory sections drafted" />
        <Check ok={true} label="Compliance matrix generated" />
        <Check ok={false} label="No unresolved missing items" />
        <Check ok={false} label="Insurance certificate current" />
        <Check ok={true} label="Draft passes hallucination scan" />
        <Check ok={true} label="Citations resolve to source docs" />
      </div>
    </div>
  );
}

function Check({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {ok ? (
        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
      ) : (
        <CircleAlert className="h-4 w-4 text-rose-500 shrink-0" />
      )}
      <span className={ok ? "" : "text-muted-foreground"}>{label}</span>
    </div>
  );
}
