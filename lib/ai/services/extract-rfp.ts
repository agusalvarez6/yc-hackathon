import "server-only";

import type { RfpDetail } from "@/lib/types";
import { ai } from "@/lib/ai/client";
import { loadPrompt } from "@/lib/ai/prompts";
import { submitRfpDetailTool } from "@/lib/ai/tools";

export interface ExtractRfpInput {
  rfpText: string;
}

export async function extractRfpDetail(
  input: ExtractRfpInput,
): Promise<RfpDetail> {
  const system = await loadPrompt("rfp-detail");
  const completion = await ai.chat.completions.create({
    model: "gemini-3.1-pro-preview",
    messages: [
      { role: "system", content: system },
      { role: "user", content: input.rfpText },
    ],
    tools: [submitRfpDetailTool],
    tool_choice: {
      type: "function",
      function: { name: "submit_rfp_detail" },
    },
  });

  const call = completion.choices[0]?.message?.tool_calls?.[0];
  if (!call || call.type !== "function") {
    throw new Error("extractRfpDetail: model did not return a tool call");
  }
  return JSON.parse(call.function.arguments) as RfpDetail;
}
