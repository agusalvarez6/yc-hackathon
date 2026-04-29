"use client";

import { Globe, List } from "lucide-react";
import { cn } from "@/lib/utils";

export type AtlasView = "world" | "list";

const ITEMS: { id: AtlasView; label: string; icon: typeof List }[] = [
  { id: "world", label: "World", icon: Globe },
  { id: "list", label: "List", icon: List },
];

interface ViewSwitcherProps {
  active: AtlasView;
  onChange: (next: AtlasView) => void;
}

export function ViewSwitcher({ active, onChange }: ViewSwitcherProps) {
  return (
    <div
      className="inline-flex items-center gap-0.5 rounded-full border bg-card/80 p-0.5 backdrop-blur-sm"
      role="tablist"
    >
      {ITEMS.map(({ id, label, icon: Icon }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors",
              isActive
                ? "bg-foreground text-background"
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
