"use client";

import { useState, useTransition } from "react";
import { CircleAlert, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RiskPill, StatusPill } from "@/components/status-pill";
import { completeTaskWithEvidenceAction } from "@/app/actions/task";
import type { CompanyDocument, RfpRequirement } from "@/lib/types";
import { cn } from "@/lib/utils";

interface TaskRowProps {
  req: RfpRequirement;
  documentMap: Record<string, CompanyDocument>;
}

export function TaskRow({ req, documentMap }: TaskRowProps) {
  const [open, setOpen] = useState(false);
  const [evidence, setEvidence] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(req.status === "ready");

  function submitEvidence() {
    setError(null);
    if (!evidence.trim()) {
      setError("Add a short evidence note before submitting.");
      return;
    }
    startTransition(async () => {
      const res = await completeTaskWithEvidenceAction({
        taskId: req.id,
        evidenceText: evidence,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setDone(true);
      setOpen(false);
      setEvidence("");
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
        <div className="shrink-0">
          {!done && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpen((v) => !v)}
            >
              {open ? "Cancel" : "Mark done"}
            </Button>
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
    </div>
  );
}

