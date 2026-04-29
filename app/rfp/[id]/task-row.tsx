"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, CircleAlert, FileText, Loader2 } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RiskPill, StatusPill } from "@/components/status-pill";
import {
  completeTaskWithEvidenceAction,
  reassignTaskAction,
} from "@/app/actions/task";
import type {
  CompanyDocument,
  RfpRequirement,
  TeamMember,
} from "@/lib/types";
import { cn } from "@/lib/utils";

interface TaskRowProps {
  req: RfpRequirement;
  documentMap: Record<string, CompanyDocument>;
  team: TeamMember[];
  taskId?: string;
}

export function TaskRow({ req, documentMap, team, taskId }: TaskRowProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [evidence, setEvidence] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [reassigning, startReassign] = useTransition();
  const [done, setDone] = useState(req.status === "ready");
  const interactive = Boolean(taskId);

  function submitEvidence() {
    setError(null);
    if (!taskId) {
      setError("This task isn't tracked in the database (seed data only).");
      return;
    }
    if (!evidence.trim()) {
      setError("Add a short evidence note before submitting.");
      return;
    }
    startTransition(async () => {
      const res = await completeTaskWithEvidenceAction({
        taskId,
        evidenceText: evidence,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setDone(true);
      setOpen(false);
      setEvidence("");
      router.refresh();
    });
  }

  function reassign(assigneeId: string) {
    if (!taskId) return;
    if (assigneeId === req.owner) return;
    setError(null);
    startReassign(async () => {
      const res = await reassignTaskAction({ taskId, assigneeId });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div
      className={cn(
        "rounded-lg border bg-background p-4",
        done && "opacity-60",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] font-medium">{req.id}</span>
            <span className="text-[10px] text-muted-foreground">
              §{req.section}
            </span>
            {req.mandatory && (
              <span
                className="text-[10px] font-bold text-rose-500"
                title="Mandatory"
              >
                ●
              </span>
            )}
            {done ? <StatusPill status="ready" /> : <StatusPill status={req.status} />}
            <RiskPill risk={req.risk} />
          </div>
          <p className="text-sm leading-snug">{req.requirement}</p>
          {req.note && (
            <div className="flex items-start gap-1.5 rounded-md bg-muted/40 px-2.5 py-1.5 text-xs text-muted-foreground">
              <CircleAlert className="mt-0.5 h-3 w-3 shrink-0 text-amber-500" />
              <span>{req.note}</span>
            </div>
          )}
          {req.evidence.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {req.evidence.map((e, i) => {
                const doc = documentMap[e.doc];
                return (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 rounded-md border bg-card px-1.5 py-0.5 text-[11px]"
                  >
                    <FileText className="h-3 w-3 text-muted-foreground" />
                    <span className="truncate max-w-[180px]">
                      {doc?.name.replace(/\.[^.]+$/, "") || e.doc}
                    </span>
                    <span className="text-muted-foreground">p.{e.page}</span>
                  </span>
                );
              })}
            </div>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {!done && interactive && (
            <>
              <ReassignMenu
                team={team}
                currentOwner={req.owner}
                onPick={reassign}
                disabled={reassigning}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOpen((v) => !v)}
              >
                {open ? "Cancel" : "Mark done"}
              </Button>
            </>
          )}
          {done && (
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
              Resolved
            </span>
          )}
        </div>
      </div>

      {open && (
        <div className="mt-4 space-y-3 rounded-md border border-dashed bg-muted/30 p-3">
          <div className="space-y-1.5">
            <Label htmlFor={`evidence-${req.id}`} className="text-xs">
              Evidence
            </Label>
            <Textarea
              id={`evidence-${req.id}`}
              placeholder="Paste a quote, link, or note that proves this requirement is met."
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              disabled={pending}
              className="min-h-[88px] text-xs"
            />
          </div>
          <div className="flex items-center gap-3">
            <Button size="sm" onClick={submitEvidence} disabled={pending}>
              {pending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Saving…
                </>
              ) : (
                "Submit evidence"
              )}
            </Button>
            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
          </div>
        </div>
      )}
      {!open && error && (
        <p className="mt-2 text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function ReassignMenu({
  team,
  currentOwner,
  onPick,
  disabled,
}: {
  team: TeamMember[];
  currentOwner: string;
  onPick: (id: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
      >
        {disabled ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <>
            Reassign
            <ChevronDown className="h-3.5 w-3.5" />
          </>
        )}
      </Button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-30 mt-1.5 w-64 rounded-lg border bg-popover p-1 shadow-lg"
        >
          {team.map((m) => {
            const isCurrent = m.id === currentOwner;
            return (
              <button
                key={m.id}
                role="menuitem"
                type="button"
                onClick={() => {
                  setOpen(false);
                  onPick(m.id);
                }}
                disabled={isCurrent}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors",
                  isCurrent
                    ? "cursor-default bg-muted/60"
                    : "hover:bg-accent hover:text-accent-foreground",
                )}
              >
                <Avatar initials={m.initials} color={m.color} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-medium">{m.name}</div>
                  <div className="truncate text-[10px] text-muted-foreground">
                    {m.role}
                  </div>
                </div>
                {isCurrent && (
                  <Check className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
