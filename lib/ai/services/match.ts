import "server-only";

import type { RfpDetail } from "@/lib/types";
import type { MatchOutput } from "@/lib/ai/tools/match";
import { ai } from "@/lib/ai/client";
import { loadPrompt } from "@/lib/ai/prompts";
import { submitMatchTool } from "@/lib/ai/tools";

export interface CorpusDocument {
  documentId: string;
  content: string;
}

export interface EvidenceNote {
  taskId: string;
  text: string;
}

export interface MatchInput {
  rfp: RfpDetail;
  corpus: CorpusDocument[];
  evidenceNotes?: EvidenceNote[];
}

export async function matchRfp(input: MatchInput): Promise<MatchOutput> {
  const system = await loadPrompt("match");
  const user = JSON.stringify({
    rfp: { summary: input.rfp.summary, compliance: input.rfp.compliance },
    corpus: input.corpus,
    evidenceNotes: input.evidenceNotes ?? [],
  });

  const completion = await ai.chat.completions.create({
    model: "google/gemini-3.1-pro-preview",
    max_tokens: 4000,
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

  const allowedDocIds = new Set(input.corpus.map((c) => c.documentId));
  out.requirements = out.requirements.map((r) => ({
    ...r,
    evidence: r.evidence.filter((e) => allowedDocIds.has(e.doc)),
  }));
  return out;
}
