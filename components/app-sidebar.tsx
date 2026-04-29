"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CheckSquare,
  ChevronUp,
  FolderOpen,
  Globe,
  Inbox,
  LogIn,
  LogOut,
  Sparkles,
  Users,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { signOut } from "@/app/actions/auth";

interface NavItem {
  href: string;
  label: string;
  icon: typeof Inbox;
  /**
   * Predicate over the current pathname. Allows "Atlas" at "/" to stay active
   * for nothing else, while "Opportunities" at "/opportunities" claims any
   * descendant including "/rfp/[id]".
   */
  match: (pathname: string) => boolean;
}

const DISCOVER: NavItem[] = [
  {
    href: "/",
    label: "Atlas",
    icon: Globe,
    match: (p) => p === "/",
  },
  {
    href: "/opportunities",
    label: "Opportunities",
    icon: Inbox,
    match: (p) =>
      p === "/opportunities" ||
      p.startsWith("/opportunities/") ||
      (p.startsWith("/rfp") && p !== "/rfp/new"),
  },
];

const COMPANY: NavItem[] = [
  {
    href: "/documents",
    label: "Documents",
    icon: FolderOpen,
    match: (p) => p.startsWith("/documents"),
  },
  {
    href: "/team",
    label: "Team",
    icon: Users,
    match: (p) => p.startsWith("/team"),
  },
  {
    href: "/tasks",
    label: "Tasks",
    icon: CheckSquare,
    match: (p) => p.startsWith("/tasks"),
  },
];

export interface AppSidebarUser {
  email: string;
  initials: string;
}

interface AppSidebarProps {
  companyName: string;
  user: AppSidebarUser | null;
}

export function AppSidebar({ companyName, user }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r bg-background/60 backdrop-blur-sm md:flex">
      <Link
        href="/"
        className="flex h-14 items-center gap-2 border-b px-4 transition-colors hover:bg-accent/40"
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-violet-500 to-sky-500 text-white">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold">{companyName}</div>
          <div className="text-[10px] text-muted-foreground">RFP Agent</div>
        </div>
      </Link>

      <nav className="flex-1 space-y-5 p-3">
        <NavGroup label="Discover" items={DISCOVER} pathname={pathname} />
        <NavGroup label="Company" items={COMPANY} pathname={pathname} />
      </nav>

      <div className="border-t p-2">
        {user ? <UserPill user={user} /> : <SignedOutCta />}
      </div>
    </aside>
  );
}

function NavGroup({
  label,
  items,
  pathname,
}: {
  label: string;
  items: NavItem[];
  pathname: string;
}) {
  return (
    <div>
      <div className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <ul className="space-y-0.5">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = item.match(pathname);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function UserPill({ user }: { user: AppSidebarUser }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors",
          open ? "bg-accent" : "hover:bg-accent/60",
        )}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold text-foreground">
          {user.initials}
        </span>
        <span className="min-w-0 flex-1 truncate text-xs text-foreground">
          {user.email}
        </span>
        <ChevronUp
          className={cn(
            "h-3.5 w-3.5 text-muted-foreground transition-transform",
            !open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute bottom-full left-0 right-0 z-30 mb-1 overflow-hidden rounded-md border bg-card shadow-lg"
        >
          <form action={signOut}>
            <button
              type="submit"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-foreground transition-colors hover:bg-accent"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function SignedOutCta() {
  return (
    <Button asChild size="sm" variant="outline" className="w-full justify-start gap-2">
      <Link href="/auth/login">
        <LogIn className="h-3.5 w-3.5" />
        Sign in
      </Link>
    </Button>
  );
}
