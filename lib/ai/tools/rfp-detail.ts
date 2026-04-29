import "server-only";

const evaluationCriterionSchema = {
  type: "object",
  additionalProperties: false,
  required: ["label", "weight"],
  properties: {
    label: { type: "string" },
    weight: { type: "number" },
  },
} as const;

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

const requirementSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "id",
    "section",
    "requirement",
    "mandatory",
    "status",
    "evidence",
    "owner",
    "risk",
  ],
  properties: {
    id: { type: "string" },
    section: { type: "string" },
    requirement: { type: "string" },
    mandatory: { type: "boolean" },
    status: { type: "string", enum: ["ready", "partial", "missing"] },
    evidence: { type: "array", items: evidenceSchema },
    owner: { type: "string" },
    risk: { type: "string", enum: ["low", "medium", "high"] },
    note: { type: "string" },
  },
} as const;

const missingGroupSchema = {
  type: "object",
  additionalProperties: false,
  required: ["owner", "items"],
  properties: {
    owner: { type: "string" },
    items: { type: "array", items: { type: "string" } },
  },
} as const;

const draftSectionSchema = {
  type: "object",
  additionalProperties: false,
  required: ["section", "owner", "body", "citations", "placeholders"],
  properties: {
    section: { type: "string" },
    owner: { type: "string" },
    body: { type: "string" },
    citations: { type: "array", items: { type: "string" } },
    placeholders: { type: "array", items: { type: "string" } },
  },
} as const;

const exportFileSchema = {
  type: "object",
  additionalProperties: false,
  required: ["name", "size", "ready"],
  properties: {
    name: { type: "string" },
    size: { type: "string" },
    ready: { type: "boolean" },
  },
} as const;

const summarySchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "buyer",
    "industry",
    "title",
    "deadline",
    "received",
    "estimatedValue",
    "contractType",
    "primaryContact",
    "submissionFormat",
    "overview",
    "evaluationCriteria",
    "requiredAttachments",
  ],
  properties: {
    buyer: { type: "string" },
    industry: { type: "string" },
    title: { type: "string" },
    deadline: { type: "string" },
    received: { type: "string" },
    estimatedValue: { type: "string" },
    contractType: { type: "string" },
    primaryContact: { type: "string" },
    submissionFormat: { type: "string" },
    overview: { type: "string" },
    evaluationCriteria: { type: "array", items: evaluationCriterionSchema },
    requiredAttachments: { type: "array", items: { type: "string" } },
  },
} as const;

const bidNoBidSchema = {
  type: "object",
  additionalProperties: false,
  required: ["recommendation", "confidence", "strengths", "weaknesses"],
  properties: {
    recommendation: { type: "string", enum: ["bid", "no-bid", "review"] },
    confidence: { type: "number" },
    strengths: { type: "array", items: { type: "string" } },
    weaknesses: { type: "array", items: { type: "string" } },
  },
} as const;

export const submitRfpDetailTool = {
  type: "function" as const,
  function: {
    name: "submit_rfp_detail",
    description:
      "Return the structured RfpDetail extracted from raw RFP text. Initialize compliance entries with status='missing', empty evidence, owner='', risk='medium'. Leave bidNoBid zeroed and draft/exports empty.",
    parameters: {
      type: "object",
      additionalProperties: false,
      required: [
        "id",
        "summary",
        "bidNoBid",
        "compliance",
        "missingInfo",
        "draft",
        "exports",
      ],
      properties: {
        id: { type: "string" },
        summary: summarySchema,
        bidNoBid: bidNoBidSchema,
        compliance: { type: "array", items: requirementSchema },
        missingInfo: { type: "array", items: missingGroupSchema },
        draft: { type: "array", items: draftSectionSchema },
        exports: { type: "array", items: exportFileSchema },
      },
    },
  },
};
