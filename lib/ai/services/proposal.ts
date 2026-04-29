import "server-only";

import type { RfpDetail } from "@/lib/types";
import type { ProposalOutput } from "@/lib/ai/tools/proposal";
import type { MatchChunk } from "./match";

export interface ProposalInput {
  rfp: RfpDetail;
  chunks: MatchChunk[];
}

export async function generateProposalMarkdown(
  input: ProposalInput,
): Promise<ProposalOutput> {
  void input;
  throw new Error("AI call not yet wired");
  // Intended:
  // 1. const system = await loadPrompt("proposal");
  // 2. const user = JSON.stringify({ rfp: input.rfp, chunks: input.chunks });
  // 3. ai.chat.completions.create with submitProposalTool forced.
  // 4. Parse tool args and return ProposalOutput.
}
