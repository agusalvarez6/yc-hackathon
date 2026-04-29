export { ai } from "./client";
export { embed } from "./embed";
export type { Result } from "./result";

export {
  submitRfpDetailTool,
  submitMatchTool,
  submitProposalTool,
} from "./tools";
export type { MatchOutput, MatchRequirement, ProposalOutput } from "./tools";

export {
  extractRfpDetail,
  matchRfp,
  generateProposalMarkdown,
  classifyOwner,
} from "./services";
export type {
  ExtractRfpInput,
  MatchInput,
  MatchChunk,
  ProposalInput,
  ClassifyOwnerInput,
} from "./services";

export { loadPrompt } from "./prompts";
