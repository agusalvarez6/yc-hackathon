"use server";

import { generateProposalMarkdown } from "@/lib/ai/services";
import type { Result } from "@/lib/ai/result";
import type { RfpDetail } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";
import { loadCompanyCorpus } from "@/lib/company-corpus";

export interface GenerateProposalInput {
  rfpId: string;
}

export async function generateProposalAction(
  input: GenerateProposalInput,
): Promise<Result<{ proposalId: string }>> {
  try {
    const supabase = await createClient();

    const row = await supabase
      .from("rfps")
      .select("id, detail")
      .eq("id", input.rfpId)
      .single();
    if (row.error || !row.data) {
      return { ok: false, error: row.error?.message ?? "rfp not found" };
    }
    const detail = row.data.detail as RfpDetail;

    const corpus = loadCompanyCorpus();
    const out = await generateProposalMarkdown({ rfp: detail, corpus });

    const upserted = await supabase
      .from("proposals")
      .upsert(
        {
          rfp_id: input.rfpId,
          markdown: out.markdown,
          used_document_ids: out.usedDocumentIds,
          model: "google/gemini-3.1-pro-preview",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "rfp_id" },
      )
      .select("id")
      .single();
    if (upserted.error || !upserted.data) {
      return {
        ok: false,
        error: upserted.error?.message ?? "upsert failed",
      };
    }

    return { ok: true, data: { proposalId: upserted.data.id as string } };
  } catch (e) {
    const error = e instanceof Error ? e.message : "unknown error";
    return { ok: false, error };
  }
}
