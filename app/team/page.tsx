import { Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Avatar } from "@/components/avatar";
import { getOpportunities, getRfpDetail, getTeam } from "@/lib/data";
import { cn } from "@/lib/utils";

export default function TeamPage() {
  const team = getTeam();
  const opps = getOpportunities();

  // Build a per-member breakdown of open items by RFP
  const byMember: Record<
    string,
    { rfpId: string; buyer: string; count: number }[]
  > = Object.fromEntries(team.members.map((m) => [m.id, []]));

  for (const o of opps) {
    const detail = getRfpDetail(o.id);
    if (!detail) continue;
    for (const group of detail.missingInfo) {
      if (!byMember[group.owner]) continue;
      byMember[group.owner].push({
        rfpId: o.id,
        buyer: o.buyer,
        count: group.items.length,
      });
    }
  }

  return (
    <>
      <PageHeader
        title="Response team"
        subtitle="Who owns what when an RFP needs a human answer"
      />

      <div className="p-6 space-y-6">
        <div className="rounded-xl border bg-gradient-to-br from-violet-500/5 to-sky-500/5 p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-sky-500 text-white">
              <Plus className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h2 className="text-sm font-semibold">
                Routing rules learned from your past responses
              </h2>
              <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
                The agent uses these owners to route requirements automatically.
                Marcus owns anything tagged security, compliance, SOC 2, or
                certifications. Priya owns customer references and case
                studies. Jake owns implementation timelines and technical
                approach. Sarah owns pricing, insurance, and W-9. Maya owns
                strategy, executive narrative, and pricing approval.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {team.members.map((m) => {
            const queue = byMember[m.id] || [];
            return (
              <div
                key={m.id}
                className="rounded-xl border bg-card overflow-hidden"
              >
                <div className="flex items-start gap-4 border-b bg-muted/20 p-5">
                  <Avatar
                    initials={m.initials}
                    color={m.color}
                    size="lg"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-base font-semibold">{m.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {m.role}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {m.owns.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ring-inset",
                      m.openItems > 5
                        ? "bg-rose-50 text-rose-700 ring-rose-600/20"
                        : m.openItems > 2
                          ? "bg-amber-50 text-amber-700 ring-amber-600/20"
                          : "bg-zinc-100 text-zinc-600 ring-zinc-500/20",
                    )}
                  >
                    {m.openItems} open
                  </div>
                </div>
                <div className="p-5 space-y-2">
                  <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    Open across RFPs
                  </div>
                  {queue.length === 0 ? (
                    <div className="text-xs text-muted-foreground italic">
                      No open items right now.
                    </div>
                  ) : (
                    <ul className="space-y-1.5">
                      {queue.map((q) => (
                        <li
                          key={q.rfpId}
                          className="flex items-center justify-between text-sm rounded-md hover:bg-accent/40 px-2 py-1.5 -mx-2"
                        >
                          <span className="truncate">{q.buyer}</span>
                          <span className="text-xs font-medium tabular-nums text-muted-foreground">
                            {q.count} item{q.count === 1 ? "" : "s"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
