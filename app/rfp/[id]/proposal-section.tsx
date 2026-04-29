import { promises as fs } from "node:fs";
import path from "node:path";
import { FileText, Sparkles } from "lucide-react";
import { RegenerateButton } from "./regenerate-button";
import { createClient } from "@/lib/supabase/server";

async function loadProposalFromFile(slug: string): Promise<string | null> {
  const file = path.join(process.cwd(), "data", "proposals", `${slug}.md`);
  try {
    return await fs.readFile(file, "utf8");
  } catch {
    return null;
  }
}

async function loadProposalFromDb(rfpDbId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("proposals")
    .select("markdown")
    .eq("rfp_id", rfpDbId)
    .maybeSingle();
  if (error || !data) return null;
  return data.markdown as string;
}

export async function ProposalSection({
  rfpSlug,
  rfpDbId,
}: {
  rfpSlug: string;
  rfpDbId?: string;
}) {
  const markdown = rfpDbId
    ? await loadProposalFromDb(rfpDbId)
    : await loadProposalFromFile(rfpSlug);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-violet-500" />
            Proposal draft
          </h2>
          <p className="text-xs text-muted-foreground">
            Markdown response generated from your compliance matrix and document
            memory.
          </p>
        </div>
        <RegenerateButton
          rfpId={rfpDbId ?? rfpSlug}
          hasProposal={markdown !== null}
          disabled={!rfpDbId}
        />
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        {markdown ? (
          <pre className="whitespace-pre-wrap break-words p-6 text-sm leading-relaxed font-sans text-foreground">
            {markdown}
          </pre>
        ) : (
          <div className="flex items-center gap-3 px-6 py-10 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            No proposal yet. Click <span className="font-medium text-foreground">Generate proposal</span> to draft one.
          </div>
        )}
      </div>
    </section>
  );
}
