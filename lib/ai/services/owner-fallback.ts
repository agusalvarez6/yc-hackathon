import "server-only";

export interface ClassifyOwnerInput {
  requirementText: string;
  section: string;
  candidateIds: string[];
}

export async function classifyOwner(input: ClassifyOwnerInput): Promise<string> {
  void input;
  throw new Error("AI call not yet wired");
  // Intended:
  // 1. Call gemini-3.1-flash-preview with a 2-line classification prompt
  //    listing candidateIds and the requirement text/section.
  // 2. Return the chosen TeamMember.id (must be one of candidateIds).
}
