export { ai } from "./client";
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
} from "./services";
export type {
  ExtractRfpInput,
  MatchInput,
  CorpusDocument,
  EvidenceNote,
  ProposalInput,
} from "./services";

export { loadPrompt } from "./prompts";
