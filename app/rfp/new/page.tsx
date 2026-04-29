import { PageHeader } from "@/components/page-header";
import { IngestForm } from "./ingest-form";

export default function NewRfpPage() {
  return (
    <>
      <PageHeader
        title="New RFP"
        subtitle="Paste raw RFP text. The agent extracts requirements, scores fit, and routes work."
      />
      <div className="mx-auto max-w-3xl p-6">
        <div className="rounded-xl border bg-card p-6">
          <IngestForm />
        </div>
      </div>
    </>
  );
}
