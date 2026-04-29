import opportunitiesJson from "@/data/opportunities.json";
import documentsJson from "@/data/documents.json";
import teamJson from "@/data/team.json";
import northwind from "@/data/rfps/northwind-bank.json";
import helix from "@/data/rfps/helix-health.json";
import vanguard from "@/data/rfps/vanguard-mfg.json";
import type {
  CompanyDocument,
  DocumentsData,
  OpportunitiesData,
  OpportunitySummary,
  RfpDetail,
  TeamData,
  TeamMember,
} from "./types";

const rfpDetails: Record<string, RfpDetail> = {
  "northwind-bank": northwind as RfpDetail,
  "helix-health": helix as RfpDetail,
  "vanguard-mfg": vanguard as RfpDetail,
};

export function getOpportunities(): OpportunitySummary[] {
  return (opportunitiesJson as OpportunitiesData).opportunities;
}

export function getOpportunity(id: string): OpportunitySummary | undefined {
  return getOpportunities().find((o) => o.id === id);
}

export function getDocuments(): CompanyDocument[] {
  return (documentsJson as DocumentsData).documents;
}

export function getDocument(id: string): CompanyDocument | undefined {
  return getDocuments().find((d) => d.id === id);
}

export function getTeam(): TeamData {
  return teamJson as TeamData;
}

export function getTeamMember(id: string): TeamMember | undefined {
  return getTeam().members.find((m) => m.id === id);
}

export function getRfpDetail(id: string): RfpDetail | undefined {
  return rfpDetails[id];
}

export function getRfpIds(): string[] {
  return Object.keys(rfpDetails);
}
