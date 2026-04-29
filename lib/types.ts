export type Recommendation = "bid" | "no-bid" | "review";
export type Status = "ready" | "partial" | "missing";
export type Risk = "low" | "medium" | "high";

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  initials: string;
  color: string;
  owns: string[];
  openItems: number;
}

export interface TeamData {
  company: { name: string; tagline: string };
  members: TeamMember[];
}

export interface CompanyDocument {
  id: string;
  name: string;
  tag: string;
  size: string;
  uploaded: string;
  usedIn: number;
  owner: string;
  warning?: string;
}

export interface DocumentsData {
  documents: CompanyDocument[];
}

export interface EvaluationCriterion {
  label: string;
  weight: number;
}

export interface OpportunitySummary {
  id: string;
  buyer: string;
  industry: string;
  title: string;
  deadline: string;
  received: string;
  estimatedValue: string;
  fitScore: number;
  recommendation: Recommendation;
  topBlocker: string;
  requirementsCount: number;
  ready: number;
  partial: number;
  missing: number;
  evaluation: EvaluationCriterion[];
}

export interface OpportunitiesData {
  opportunities: OpportunitySummary[];
}

export interface RfpEvidence {
  doc: string;
  snippet: string;
  page: number;
}

export interface RfpRequirement {
  id: string;
  section: string;
  requirement: string;
  mandatory: boolean;
  status: Status;
  evidence: RfpEvidence[];
  owner: string;
  risk: Risk;
  note?: string;
}

export interface RfpMissingGroup {
  owner: string;
  items: string[];
}

export interface RfpDraftSection {
  section: string;
  owner: string;
  body: string;
  citations: string[];
  placeholders: string[];
}

export interface RfpExportFile {
  name: string;
  size: string;
  ready: boolean;
}

export interface RfpDetail {
  id: string;
  summary: {
    buyer: string;
    industry: string;
    title: string;
    deadline: string;
    received: string;
    estimatedValue: string;
    contractType: string;
    primaryContact: string;
    submissionFormat: string;
    overview: string;
    evaluationCriteria: EvaluationCriterion[];
    requiredAttachments: string[];
  };
  bidNoBid: {
    recommendation: Recommendation;
    confidence: number;
    strengths: string[];
    weaknesses: string[];
  };
  compliance: RfpRequirement[];
  missingInfo: RfpMissingGroup[];
  draft: RfpDraftSection[];
  exports: RfpExportFile[];
}
