"use server";

import { embed } from "@/lib/ai/embed";
import { matchRfp, type MatchChunk } from "@/lib/ai/services";
import type { Result } from "@/lib/ai/result";
import type { RfpDetail } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";

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

    const chunks = chunkEvidence(input.evidenceText);
    const vectors = await embed(chunks);

    const chunkRows = chunks.map((content, i) => ({
      document_id: `evidence:${input.taskId}`,
      tag: "evidence",
      owner_id: null,
      page: 1,
      chunk_index: i,
      content,
      embedding: vectors[i],
    }));

    const inserted = await supabase
      .from("document_chunks")
      .insert(chunkRows)
      .select("id");
    if (inserted.error) return { ok: false, error: inserted.error.message };
    const insertedIds = (inserted.data as Array<{ id: string }>).map(
      (r) => r.id,
    );

    const upd = await supabase
      .from("tasks")
      .update({
        status: "done",
        closed_by: "user",
        evidence_chunk_ids: insertedIds,
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

function chunkEvidence(text: string): string[] {
  if (text.length <= 1000) return [text];
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += 800) {
    chunks.push(text.slice(i, i + 800));
  }
  return chunks;
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

  const queries = detail.compliance.map((r) => r.requirement);
  if (queries.length === 0) return [];
  const vectors = await embed(queries);

  const seen = new Set<string>();
  const hits: MatchChunk[] = [];
  for (let i = 0; i < vectors.length && hits.length < 50; i++) {
    const { data } = await supabase.rpc("match_chunks", {
      query_embedding: vectors[i],
      k: 5,
    });
    if (!data) continue;
    for (const r of data as Array<{
      id: string;
      document_id: string;
      tag: string;
      page: number;
      content: string;
    }>) {
      if (seen.has(r.id)) continue;
      seen.add(r.id);
      hits.push({
        documentId: r.document_id,
        tag: r.tag,
        page: r.page,
        content: r.content,
      });
      if (hits.length >= 50) break;
    }
  }

  const out = await matchRfp({ rfp: detail, chunks: hits });
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
