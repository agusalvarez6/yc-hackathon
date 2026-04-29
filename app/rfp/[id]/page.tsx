import { notFound } from "next/navigation";
import { Workspace } from "@/components/rfp/workspace";
import { getDocuments, getRfpDetail, getRfpIds, getTeam } from "@/lib/data";
import type { CompanyDocument } from "@/lib/types";

export function generateStaticParams() {
  return getRfpIds().map((id) => ({ id }));
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function RfpWorkspacePage({ params }: PageProps) {
  const { id } = await params;
  const rfp = getRfpDetail(id);
  if (!rfp) notFound();

  const team = getTeam();
  const docs = getDocuments();
  const documentMap: Record<string, CompanyDocument> = Object.fromEntries(
    docs.map((d) => [d.id, d]),
  );

  return <Workspace rfp={rfp} team={team} documentMap={documentMap} />;
}
