import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { OwnerPill } from "@/components/owner-pill";
import { RiskPill, StatusPill } from "@/components/status-pill";
import { getRfpDetail, getRfpIds, getTeamMember } from "@/lib/data";
import type { RfpRequirement } from "@/lib/types";

interface Task {
  rfpId: string;
  buyerShort: string;
  section: string;
  requirement: RfpRequirement;
}

function buildTasks(): Task[] {
  const out: Task[] = [];
  for (const id of getRfpIds()) {
    const detail = getRfpDetail(id);
    if (!detail) continue;
    const buyerShort = detail.summary.buyer.split(" ")[0];
    for (const req of detail.compliance) {
      if (req.status === "ready") continue;
      out.push({ rfpId: id, buyerShort, section: req.section, requirement: req });
    }
  }
  return out;
}

function groupByOwner(tasks: Task[]): Map<string, Task[]> {
  const map = new Map<string, Task[]>();
  for (const t of tasks) {
    const key = t.requirement.owner || "unassigned";
    const list = map.get(key) ?? [];
    list.push(t);
    map.set(key, list);
  }
  // Sort owners by open count desc, then by name asc.
  return new Map(
    Array.from(map.entries()).sort((a, b) => {
      const da = b[1].length - a[1].length;
      if (da !== 0) return da;
      return a[0].localeCompare(b[0]);
    }),
  );
}

export default function TasksPage() {
  const tasks = buildTasks();
  const groups = groupByOwner(tasks);

  return (
    <>
      <PageHeader
        title="Tasks"
        subtitle="Open requirements across all opportunities."
      />
      <div className="mx-auto max-w-5xl space-y-8 p-6">
        {tasks.length === 0 ? (
          <div className="rounded-xl border bg-card p-12 text-center text-xs text-muted-foreground">
            Every requirement is ready.
          </div>
        ) : (
          Array.from(groups.entries()).map(([ownerId, items]) => {
            const member = getTeamMember(ownerId);
            return (
              <section key={ownerId} className="space-y-3">
                <div className="flex items-center justify-between">
                  {member ? (
                    <OwnerPill ownerId={ownerId} showRole />
                  ) : (
                    <div className="text-sm font-semibold text-muted-foreground">
                      Unassigned
                    </div>
                  )}
                  <span className="text-[11px] tabular-nums text-muted-foreground">
                    {items.length} open
                  </span>
                </div>
                <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  {items.map((t) => (
                    <li key={`${t.rfpId}:${t.requirement.id}`}>
                      <Link
                        href={`/rfp/${t.rfpId}`}
                        className="group flex h-full flex-col rounded-xl border bg-card p-4 transition-colors hover:bg-accent/40"
                      >
                        <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
                          <span className="font-medium text-foreground">
                            {t.buyerShort}
                          </span>
                          <span aria-hidden>•</span>
                          <span>{t.section}</span>
                          {t.requirement.mandatory && (
                            <span className="ml-auto rounded-full bg-rose-50 px-1.5 py-0.5 text-[10px] font-semibold text-rose-700 ring-1 ring-inset ring-rose-600/20">
                              Mandatory
                            </span>
                          )}
                        </div>
                        <p className="mt-2 line-clamp-2 text-sm leading-snug">
                          {t.requirement.requirement}
                        </p>
                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <StatusPill status={t.requirement.status} />
                            <RiskPill risk={t.requirement.risk} />
                          </div>
                          <span className="inline-flex items-center gap-0.5 text-[11px] text-foreground/70 transition-colors group-hover:text-foreground">
                            Open
                            <ArrowRight className="h-3 w-3" />
                          </span>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })
        )}
      </div>
    </>
  );
}
