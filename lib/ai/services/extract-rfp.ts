import "server-only";

import type { RfpDetail } from "@/lib/types";

export interface ExtractRfpInput {
  rfpText: string;
}

export async function extractRfpDetail(
  input: ExtractRfpInput,
): Promise<RfpDetail> {
  void input;
  throw new Error("AI call not yet wired");
  // Intended:
  // 1. const system = await loadPrompt("rfp-detail");
  // 2. const completion = await ai.chat.completions.create({
  //      model: "gemini-3.1-pro-preview",
  //      messages: [
  //        { role: "system", content: system },
  //        { role: "user", content: input.rfpText },
  //      ],
  //      tools: [submitRfpDetailTool],
  //      tool_choice: { type: "function", function: { name: "submit_rfp_detail" } },
  //    });
  // 3. const call = completion.choices[0].message.tool_calls?.[0];
  // 4. return JSON.parse(call.function.arguments) as RfpDetail;
}
