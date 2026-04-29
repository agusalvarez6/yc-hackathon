import "server-only";

import type { RfpRequirement, TeamMember } from "@/lib/types";

export interface TaskAssignment {
  requirementId: string;
  assigneeId: string;
  assignmentReason: string;
}

export function autoAssignTasks(
  requirements: RfpRequirement[],
  team: TeamMember[],
): TaskAssignment[] {
  return requirements.map((req) => {
    const haystack = `${req.requirement} ${req.section}`.toLowerCase();
    for (const member of team) {
      for (const token of member.owns) {
        if (haystack.includes(token.toLowerCase())) {
          return {
            requirementId: req.id,
            assigneeId: member.id,
            assignmentReason: `owns:${token}`,
          };
        }
      }
    }
    return {
      requirementId: req.id,
      assigneeId: "maya",
      assignmentReason: "default",
    };
  });
}
