import { promises as fs } from "node:fs";
import path from "node:path";
import { FileText, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
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
          <article
            className="
              prose prose-sm dark:prose-invert max-w-none p-8
              prose-headings:font-semibold
              prose-h1:text-2xl prose-h1:mt-0 prose-h1:mb-4
              prose-h2:text-lg prose-h2:mt-8 prose-h2:mb-3 prose-h2:pb-2 prose-h2:border-b
              prose-h3:text-base prose-h3:mt-6 prose-h3:mb-2
              prose-p:leading-relaxed
              prose-li:my-1
              prose-strong:font-semibold prose-strong:text-foreground
              prose-a:text-violet-600 prose-a:no-underline hover:prose-a:underline
              prose-table:text-xs
              prose-th:bg-muted/40 prose-th:font-semibold
              prose-td:border-border prose-th:border-border
              prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:bg-muted prose-code:text-foreground prose-code:font-medium prose-code:text-[0.85em] prose-code:before:content-none prose-code:after:content-none
              prose-blockquote:border-l-violet-400 prose-blockquote:text-muted-foreground prose-blockquote:font-normal prose-blockquote:not-italic
              prose-hr:my-8
            "
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
          </article>
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
