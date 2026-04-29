"use server";

import { embed } from "@/lib/ai/embed";
import { matchRfp, type MatchChunk } from "@/lib/ai/services";
import type { Result } from "@/lib/ai/result";
import type { RfpDetail } from "@/lib/types";

export interface CompleteTaskInput {
  taskId: string;
  evidenceText: string;
  sourceLabel?: string;
}

export async function completeTaskWithEvidenceAction(
  input: CompleteTaskInput,
): Promise<Result<{ closedTaskIds: string[] }>> {
  try {
    await embed([input.evidenceText]);
    // TODO: persist evidence chunks + mark task done.
    const rfp = {} as RfpDetail;
    const chunks: MatchChunk[] = [];
    await matchRfp({ rfp, chunks });
    return { ok: true, data: { closedTaskIds: [] } };
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
  // TODO: persist new assignee to `tasks` row once DB layer is wired.
  return { ok: true, data: input };
}
