import "server-only";

import type { Recommendation, RfpEvidence, Status, Risk } from "@/lib/types";

export interface MatchRequirement {
  id: string;
  status: Status;
  risk: Risk;
  reason: string;
  note?: string;
  evidence: RfpEvidence[];
}

export interface MatchOutput {
  recommendation: Recommendation;
  confidence: number;
  strengths: string[];
  weaknesses: string[];
  requirements: MatchRequirement[];
}

const evidenceSchema = {
  type: "object",
  additionalProperties: false,
  required: ["doc", "snippet", "page"],
  properties: {
    doc: { type: "string" },
    snippet: { type: "string" },
    page: { type: "integer" },
  },
} as const;

const matchRequirementSchema = {
  type: "object",
  additionalProperties: false,
  required: ["id", "status", "risk", "reason", "evidence"],
  properties: {
    id: { type: "string" },
    status: { type: "string", enum: ["ready", "partial", "missing"] },
    risk: { type: "string", enum: ["low", "medium", "high"] },
    reason: { type: "string" },
    note: { type: "string" },
    evidence: { type: "array", items: evidenceSchema },
  },
} as const;

export const submitMatchTool = {
  type: "function" as const,
  function: {
    name: "submit_match",
    description:
      "Return the bid/no-bid recommendation and a per-requirement breakdown. Cite only documentIds present in the supplied chunks; never invent ids.",
    parameters: {
      type: "object",
      additionalProperties: false,
      required: [
        "recommendation",
        "confidence",
        "strengths",
        "weaknesses",
        "requirements",
      ],
      properties: {
        recommendation: { type: "string", enum: ["bid", "no-bid", "review"] },
        confidence: { type: "number" },
        strengths: { type: "array", items: { type: "string" } },
        weaknesses: { type: "array", items: { type: "string" } },
        requirements: { type: "array", items: matchRequirementSchema },
      },
    },
  },
};
