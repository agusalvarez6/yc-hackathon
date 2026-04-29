import "server-only";

export interface ProposalOutput {
  markdown: string;
  usedDocumentIds: string[];
}

export const submitProposalTool = {
  type: "function" as const,
  function: {
    name: "submit_proposal",
    description:
      "Return the full proposal markdown (executive summary followed by one section per RfpRequirement.section) and the list of company documentIds cited.",
    parameters: {
      type: "object",
      additionalProperties: false,
      required: ["markdown", "usedDocumentIds"],
      properties: {
        markdown: { type: "string" },
        usedDocumentIds: { type: "array", items: { type: "string" } },
      },
    },
  },
};
