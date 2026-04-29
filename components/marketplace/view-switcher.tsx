"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Globe, List } from "lucide-react";
import { cn } from "@/lib/utils";

export type MarketplaceView = "list" | "world";

const ITEMS: { id: MarketplaceView; label: string; icon: typeof List }[] = [
  { id: "list", label: "List", icon: List },
  { id: "world", label: "World", icon: Globe },
];

export function ViewSwitcher({ active }: { active: MarketplaceView }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setView(next: MarketplaceView) {
    if (next === active) return;
    const params = new URLSearchParams(searchParams.toString());
    if (next === "list") params.delete("view");
    else params.set("view", next);
    const qs = params.toString();
    router.replace(qs ? `/?${qs}` : "/", { scroll: false });
  }

  return (
    <div
      className="inline-flex items-center gap-1 rounded-full border bg-background p-1"
      role="tablist"
    >
      {ITEMS.map(({ id, label, icon: Icon }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            role="tab"
            aria-selected={isActive}
            onClick={() => setView(id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
