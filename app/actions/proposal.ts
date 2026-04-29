"use server";

import {
  generateProposalMarkdown,
  type MatchChunk,
} from "@/lib/ai/services";
import { embed } from "@/lib/ai/embed";
import type { Result } from "@/lib/ai/result";
import type { RfpDetail } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";

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

    const queries = detail.compliance.map((r) => r.requirement);
    const vectors = queries.length > 0 ? await embed(queries) : [];

    const seen = new Set<string>();
    const chunks: MatchChunk[] = [];
    for (let i = 0; i < vectors.length && chunks.length < 30; i++) {
      const { data } = await supabase.rpc("match_chunks", {
        query_embedding: vectors[i],
        k: 5,
      });
      if (!data) continue;
      for (const r of data as Array<{
        id: string;
        document_id: string;
        tag: string;
        page: number;
        content: string;
      }>) {
        if (seen.has(r.id)) continue;
        seen.add(r.id);
        chunks.push({
          documentId: r.document_id,
          tag: r.tag,
          page: r.page,
          content: r.content,
        });
        if (chunks.length >= 30) break;
      }
    }

    const out = await generateProposalMarkdown({ rfp: detail, chunks });

    const upserted = await supabase
      .from("proposals")
      .upsert(
        {
          rfp_id: input.rfpId,
          markdown: out.markdown,
          used_document_ids: out.usedDocumentIds,
          model: "gemini-3.1-pro-preview",
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
