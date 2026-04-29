import "server-only";

import type { RfpDetail } from "@/lib/types";
import type { MatchOutput } from "@/lib/ai/tools/match";

export interface MatchChunk {
  documentId: string;
  tag: string;
  page: number;
  content: string;
}

export interface MatchInput {
  rfp: RfpDetail;
  chunks: MatchChunk[];
}

export async function matchRfp(input: MatchInput): Promise<MatchOutput> {
  void input;
  throw new Error("AI call not yet wired");
  // Intended:
  // 1. const system = await loadPrompt("match");
  // 2. const user = JSON.stringify({
  //      rfp: { summary: input.rfp.summary, compliance: input.rfp.compliance },
  //      companyChunks: input.chunks,
  //    });
  // 3. ai.chat.completions.create with submitMatchTool forced.
  // 4. Parse tool args, drop fabricated documentIds, return MatchOutput.
}
