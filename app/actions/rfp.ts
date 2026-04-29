"use server";

import { extractRfpDetail, matchRfp } from "@/lib/ai/services";
import type { Result } from "@/lib/ai/result";
import { createClient } from "@/lib/supabase/server";
import { getTeam } from "@/lib/data";
import { pdfToText } from "@/lib/pdf";
import { loadCompanyCorpus } from "@/lib/company-corpus";
import { autoAssignTasks } from "./_helpers/assign";

export type IngestRfpInput =
  | { mode: "text"; text: string; slug?: string }
  | { mode: "pdf"; file: File; slug?: string };

export async function ingestRfp(
  input: IngestRfpInput,
): Promise<Result<{ rfpId: string; slug: string }>> {
  try {
    let text: string;
    let sourceKind: "text" | "pdf";
    if (input.mode === "text") {
      text = input.text;
      sourceKind = "text";
    } else {
      const buffer = Buffer.from(await input.file.arrayBuffer());
      text = await pdfToText(buffer);
      if (text.trim() === "") {
        return { ok: false, error: "no extractable text" };
      }
      sourceKind = "pdf";
    }

    const supabase = await createClient();

    const detail = await extractRfpDetail({ rfpText: text });
    const slug = input.slug ?? detail.id;

    const inserted = await supabase
      .from("rfps")
      .insert({
        slug,
        source_kind: sourceKind,
        source_text: text,
        detail,
      })
      .select("id")
      .single();

    if (inserted.error) {
      return { ok: false, error: inserted.error.message };
    }
    const rfpId = inserted.data.id as string;

    const corpus = loadCompanyCorpus();
    const out = await matchRfp({ rfp: detail, corpus });

    detail.bidNoBid = {
      recommendation: out.recommendation,
      confidence: out.confidence,
      strengths: out.strengths,
      weaknesses: out.weaknesses,
    };
    for (const req of detail.compliance) {
      const m = out.requirements.find((r) => r.id === req.id);
      if (m) {
        req.status = m.status;
        req.risk = m.risk;
        req.evidence = m.evidence;
        if (m.note !== undefined) req.note = m.note;
      }
    }

    const upd = await supabase
      .from("rfps")
      .update({ detail, last_matched_at: new Date().toISOString() })
      .eq("id", rfpId);
    if (upd.error) return { ok: false, error: upd.error.message };

    const team = getTeam().members;
    const openReqs = detail.compliance.filter((r) => r.status !== "ready");
    const assignments = autoAssignTasks(openReqs, team);

    if (assignments.length > 0) {
      const rows = assignments.map((a) => {
        const req = openReqs.find((r) => r.id === a.requirementId)!;
        return {
          rfp_id: rfpId,
          requirement_id: req.id,
          requirement_section: req.section,
          requirement_text: req.requirement,
          assignee_id: a.assigneeId,
          assignment_reason: a.assignmentReason,
          status: "open" as const,
        };
      });
      const ti = await supabase.from("tasks").insert(rows);
      if (ti.error) return { ok: false, error: ti.error.message };
    }

    return { ok: true, data: { rfpId, slug } };
  } catch (e) {
    const error = e instanceof Error ? e.message : "unknown error";
    return { ok: false, error };
  }
}
