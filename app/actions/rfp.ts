"use server";

import {
  extractRfpDetail,
  matchRfp,
  type MatchChunk,
} from "@/lib/ai/services";
import type { Result } from "@/lib/ai/result";
import type { RfpDetail } from "@/lib/types";

export type IngestRfpInput =
  | { mode: "text"; text: string; slug?: string }
  | { mode: "pdf"; fileName: string; bytes: ArrayBuffer; slug?: string };

export async function ingestRfp(
  input: IngestRfpInput,
): Promise<Result<{ rfpId: string; slug: string }>> {
  try {
    const rfpText =
      input.mode === "text"
        ? input.text
        : `pdf:${input.fileName}:${input.bytes.byteLength}`;

    const detail = await extractRfpDetail({ rfpText });
    // TODO: persist `detail` to the `rfps` table once DB layer is wired.

    const slug = input.slug ?? detail.id;
    return { ok: true, data: { rfpId: detail.id, slug } };
  } catch (e) {
    const error = e instanceof Error ? e.message : "unknown error";
    return { ok: false, error };
  }
}

export async function matchRfpAction(input: {
  rfpId: string;
}): Promise<Result<{ confidence: number }>> {
  try {
    void input.rfpId;
    // TODO: load RfpDetail and chunk hits from DB; placeholders below.
    const rfp = {} as RfpDetail;
    const chunks: MatchChunk[] = [];

    const out = await matchRfp({ rfp, chunks });
    return { ok: true, data: { confidence: out.confidence } };
  } catch (e) {
    const error = e instanceof Error ? e.message : "unknown error";
    return { ok: false, error };
  }
}
