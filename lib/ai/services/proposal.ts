import "server-only";

import type { RfpDetail } from "@/lib/types";
import type { ProposalOutput } from "@/lib/ai/tools/proposal";
import type { MatchChunk } from "./match";
import { ai } from "@/lib/ai/client";
import { loadPrompt } from "@/lib/ai/prompts";
import { submitProposalTool } from "@/lib/ai/tools";

export interface ProposalInput {
  rfp: RfpDetail;
  chunks: MatchChunk[];
}

export async function generateProposalMarkdown(
  input: ProposalInput,
): Promise<ProposalOutput> {
  const system = await loadPrompt("proposal");
  const user = JSON.stringify({ rfp: input.rfp, chunks: input.chunks });

  const completion = await ai.chat.completions.create({
    model: "gemini-3.1-pro-preview",
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
