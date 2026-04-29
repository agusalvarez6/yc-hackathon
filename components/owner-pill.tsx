import { Avatar } from "@/components/avatar";
import { getTeamMember } from "@/lib/data";

interface OwnerPillProps {
  ownerId: string;
  showRole?: boolean;
}

export function OwnerPill({ ownerId, showRole = false }: OwnerPillProps) {
  const member = getTeamMember(ownerId);
  if (!member) return <span className="text-muted-foreground">—</span>;
  return (
    <div className="inline-flex items-center gap-2">
      <Avatar initials={member.initials} color={member.color} size="sm" />
      <div className="flex flex-col leading-tight">
        <span className="text-xs font-medium">{member.name}</span>
        {showRole && (
          <span className="text-[10px] text-muted-foreground">
            {member.role}
          </span>
        )}
      </div>
    </div>
  );
}
