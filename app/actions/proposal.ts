"use server";

import {
  generateProposalMarkdown,
  type MatchChunk,
} from "@/lib/ai/services";
import type { Result } from "@/lib/ai/result";
import type { RfpDetail } from "@/lib/types";

export interface GenerateProposalInput {
  rfpId: string;
}

export async function generateProposalAction(
  input: GenerateProposalInput,
): Promise<Result<{ proposalId: string }>> {
  try {
    void input.rfpId;
    // TODO: load RfpDetail and top-K chunks from DB; placeholders below.
    const rfp = {} as RfpDetail;
    const chunks: MatchChunk[] = [];

    await generateProposalMarkdown({ rfp, chunks });
    return { ok: true, data: { proposalId: input.rfpId } };
  } catch (e) {
    const error = e instanceof Error ? e.message : "unknown error";
    return { ok: false, error };
  }
}
