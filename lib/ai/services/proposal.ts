import "server-only";

import type { RfpDetail } from "@/lib/types";
import type { ProposalOutput } from "@/lib/ai/tools/proposal";
import type { CorpusDocument } from "./match";
import { ai } from "@/lib/ai/client";
import { loadPrompt } from "@/lib/ai/prompts";
import { submitProposalTool } from "@/lib/ai/tools";

export interface ProposalInput {
  rfp: RfpDetail;
  corpus: CorpusDocument[];
}

export async function generateProposalMarkdown(
  input: ProposalInput,
): Promise<ProposalOutput> {
  const system = await loadPrompt("proposal");
  const user = JSON.stringify({ rfp: input.rfp, corpus: input.corpus });

  const completion = await ai.chat.completions.create({
    model: "google/gemini-3.1-pro-preview",
    max_tokens: 64000,
    reasoning_effort: "low",
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    tools: [submitProposalTool],
    tool_choice: {
      type: "function",
      function: { name: "submit_proposal" },
    },
  });

  const call = completion.choices[0]?.message?.tool_calls?.[0];
  if (!call || call.type !== "function") {
    throw new Error("generateProposalMarkdown: model did not return a tool call");
  }
  return JSON.parse(call.function.arguments) as ProposalOutput;
}
