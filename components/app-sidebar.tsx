"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Inbox,
  FolderOpen,
  Users,
  Sparkles,
  Settings,
  HelpCircle,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Opportunities", icon: Inbox },
  { href: "/rfp/new", label: "New RFP", icon: Plus },
  { href: "/documents", label: "Documents", icon: FolderOpen },
  { href: "/team", label: "Response Team", icon: Users },
];

export function AppSidebar({ companyName }: { companyName: string }) {
  const pathname = usePathname();
  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r bg-background/60 backdrop-blur-sm">
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-violet-500 to-sky-500 text-white">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold">{companyName}</div>
          <div className="text-[10px] text-muted-foreground">RFP Agent</div>
        </div>
      </div>
      <nav className="flex-1 space-y-0.5 p-2">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive =
            link.href === "/"
              ? pathname === "/" ||
                (pathname.startsWith("/rfp") && pathname !== "/rfp/new")
              : link.href === "/rfp/new"
                ? pathname === "/rfp/new"
                : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-2 space-y-0.5">
        <button className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent/60 hover:text-foreground">
          <Settings className="h-4 w-4" />
          Settings
        </button>
        <button className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent/60 hover:text-foreground">
          <HelpCircle className="h-4 w-4" />
          Help
        </button>
      </div>
    </aside>
  );
}
