import { CircleAlert, FileText, Upload } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { OwnerPill } from "@/components/owner-pill";
import { getDocuments } from "@/lib/data";

const tagColor: Record<string, string> = {
  company: "bg-violet-100 text-violet-700",
  security: "bg-emerald-100 text-emerald-700",
  compliance: "bg-amber-100 text-amber-700",
  "case-study": "bg-sky-100 text-sky-700",
  pricing: "bg-rose-100 text-rose-700",
  delivery: "bg-zinc-100 text-zinc-700",
  references: "bg-fuchsia-100 text-fuchsia-700",
};

export default function DocumentsPage() {
  const documents = getDocuments();
  return (
    <>
      <PageHeader
        title="Document library"
        subtitle="Every response cites and learns from these documents"
        actions={
          <Button size="sm">
            <Upload className="h-4 w-4" />
            Upload document
          </Button>
        }
      />

      <div className="p-6">
        <div className="rounded-xl border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr className="text-left">
                <th className="px-5 py-2.5 font-medium">Document</th>
                <th className="px-3 py-2.5 font-medium">Tag</th>
                <th className="px-3 py-2.5 font-medium">Owner</th>
                <th className="px-3 py-2.5 font-medium">Used in</th>
                <th className="px-3 py-2.5 font-medium">Uploaded</th>
                <th className="px-5 py-2.5 font-medium">Size</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {documents.map((doc) => (
                <tr
                  key={doc.id}
                  className="hover:bg-accent/40 transition-colors"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium truncate">{doc.name}</div>
                        {doc.warning && (
                          <div className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-rose-600">
                            <CircleAlert className="h-3 w-3" />
                            {doc.warning}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        tagColor[doc.tag] ?? "bg-muted text-muted-foreground"
                      }`}
                    >
                      {doc.tag}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <OwnerPill ownerId={doc.owner} />
                  </td>
                  <td className="px-3 py-3 text-sm tabular-nums">
                    {doc.usedIn} RFPs
                  </td>
                  <td className="px-3 py-3 text-xs text-muted-foreground">
                    {new Date(doc.uploaded).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3 text-xs text-muted-foreground tabular-nums">
                    {doc.size}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
