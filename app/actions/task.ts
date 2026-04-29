"use server";

import { matchRfp } from "@/lib/ai/services";
import type { Result } from "@/lib/ai/result";
import type { RfpDetail } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";
import { loadCompanyCorpus } from "@/lib/company-corpus";

export interface CompleteTaskInput {
  taskId: string;
  evidenceText: string;
  sourceLabel?: string;
}

export async function completeTaskWithEvidenceAction(
  input: CompleteTaskInput,
): Promise<Result<{ closedTaskIds: string[] }>> {
  try {
    const supabase = await createClient();

    const taskRow = await supabase
      .from("tasks")
      .select("id, rfp_id")
      .eq("id", input.taskId)
      .single();
    if (taskRow.error) return { ok: false, error: taskRow.error.message };
    const rfpId = taskRow.data.rfp_id as string;

    const upd = await supabase
      .from("tasks")
      .update({
        status: "done",
        closed_by: "user",
        evidence_text: input.evidenceText,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.taskId);
    if (upd.error) return { ok: false, error: upd.error.message };

    const closedTaskIds = await rerunMatch(supabase, rfpId);
    return {
      ok: true,
      data: { closedTaskIds: [input.taskId, ...closedTaskIds] },
    };
  } catch (e) {
    const error = e instanceof Error ? e.message : "unknown error";
    return { ok: false, error };
  }
}

export interface ReassignTaskInput {
  taskId: string;
  assigneeId: string;
}

export async function reassignTaskAction(
  input: ReassignTaskInput,
): Promise<Result<{ taskId: string; assigneeId: string }>> {
  try {
    const supabase = await createClient();
    const upd = await supabase
      .from("tasks")
      .update({
        assignee_id: input.assigneeId,
        assignment_reason: "manual",
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.taskId);
    if (upd.error) return { ok: false, error: upd.error.message };
    return { ok: true, data: input };
  } catch (e) {
    const error = e instanceof Error ? e.message : "unknown error";
    return { ok: false, error };
  }
}

async function rerunMatch(
  supabase: Awaited<ReturnType<typeof createClient>>,
  rfpId: string,
): Promise<string[]> {
  const row = await supabase
    .from("rfps")
    .select("detail")
    .eq("id", rfpId)
    .single();
  if (row.error || !row.data) return [];
  const detail = row.data.detail as RfpDetail;

  const evidenceRows = await supabase
    .from("tasks")
    .select("id, evidence_text")
    .eq("rfp_id", rfpId)
    .not("evidence_text", "is", null);
  const evidenceNotes = (
    (evidenceRows.data as Array<{ id: string; evidence_text: string | null }> | null) ?? []
  )
    .filter((r) => r.evidence_text && r.evidence_text.trim() !== "")
    .map((r) => ({ taskId: r.id, text: r.evidence_text as string }));

  const corpus = loadCompanyCorpus();
  const out = await matchRfp({ rfp: detail, corpus, evidenceNotes });

  detail.bidNoBid = {
    recommendation: out.recommendation,
    confidence: out.confidence,
    strengths: out.strengths,
    weaknesses: out.weaknesses,
  };
  const nowReady: string[] = [];
  for (const req of detail.compliance) {
    const m = out.requirements.find((r) => r.id === req.id);
    if (m) {
      req.status = m.status;
      req.risk = m.risk;
      req.evidence = m.evidence;
      if (m.note !== undefined) req.note = m.note;
      if (m.status === "ready") nowReady.push(req.id);
    }
  }
  await supabase
    .from("rfps")
    .update({ detail, last_matched_at: new Date().toISOString() })
    .eq("id", rfpId);

  if (nowReady.length === 0) return [];
  const closed = await supabase
    .from("tasks")
    .update({
      status: "done",
      closed_by: "auto",
      updated_at: new Date().toISOString(),
    })
    .eq("rfp_id", rfpId)
    .in("requirement_id", nowReady)
    .eq("status", "open")
    .select("id");
  if (closed.error || !closed.data) return [];
  return (closed.data as Array<{ id: string }>).map((r) => r.id);
}
