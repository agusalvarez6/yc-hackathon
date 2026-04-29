import "server-only";

import type { RfpDetail } from "@/lib/types";
import type { MatchOutput } from "@/lib/ai/tools/match";
import { ai } from "@/lib/ai/client";
import { loadPrompt } from "@/lib/ai/prompts";
import { submitMatchTool } from "@/lib/ai/tools";

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
  const system = await loadPrompt("match");
  const user = JSON.stringify({
    rfp: { summary: input.rfp.summary, compliance: input.rfp.compliance },
    companyChunks: input.chunks,
  });

  const completion = await ai.chat.completions.create({
    model: "gemini-3.1-pro-preview",
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    tools: [submitMatchTool],
    tool_choice: {
      type: "function",
      function: { name: "submit_match" },
    },
  });

  const call = completion.choices[0]?.message?.tool_calls?.[0];
  if (!call || call.type !== "function") {
    throw new Error("matchRfp: model did not return a tool call");
  }
  const out = JSON.parse(call.function.arguments) as MatchOutput;

  const allowedDocIds = new Set(input.chunks.map((c) => c.documentId));
  out.requirements = out.requirements.map((r) => ({
    ...r,
    evidence: r.evidence.filter((e) => allowedDocIds.has(e.doc)),
  }));
  return out;
}
