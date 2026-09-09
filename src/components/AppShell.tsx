import { Link, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  Bot,
  BrainCircuit,
  CalendarCheck,
  LayoutDashboard,
  Library,
  Mail,
  Menu,
  Moon,
  PenLine,
  Search,
  Settings,
  Sparkles,
  Sun,
  Workflow,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/email", label: "AI Email Generator", icon: Mail },
  { to: "/meetings", label: "Meeting Assistant", icon: CalendarCheck },
  { to: "/tasks", label: "Task Planner", icon: BrainCircuit },
  { to: "/research", label: "Research Assistant", icon: Search },
  { to: "/writing", label: "AI Writing Assistant", icon: PenLine },
  { to: "/workflow", label: "Workflow Automation", icon: Workflow },
  { to: "/chat", label: "AI Chat Assistant", icon: Bot },
  { to: "/knowledge", label: "Knowledge Hub", icon: Library },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const { theme, toggleTheme } = useStore();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
      {NAV.map((item) => {
        const active = pathname === item.to;
        const Icon = item.icon;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  const brand = (
    <div className="flex items-center gap-3 border-b border-sidebar-border px-5 py-5">
      <div className="brand-gradient flex h-9 w-9 items-center justify-center rounded-xl">
        <Sparkles className="h-5 w-5 text-primary-foreground" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-sidebar-foreground">WorkFlow AI</p>
        <p className="truncate text-xs text-sidebar-foreground/60">Productivity assistant</p>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-72 shrink-0 flex-col bg-sidebar lg:flex">
        {brand}
        {nav}
        <p className="border-t border-sidebar-border px-5 py-4 text-xs leading-relaxed text-sidebar-foreground/60">
          AI can make mistakes. Review outputs before you use them.
        </p>
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Close menu"
            className="absolute inset-0 bg-foreground/40"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute left-0 top-0 flex h-full w-72 flex-col bg-sidebar">
            <div className="flex items-center justify-between">
              <div className="flex-1">{brand}</div>
              <button
                className="mr-3 rounded-lg p-2 text-sidebar-foreground/80 hover:bg-sidebar-accent"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {nav}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b bg-background/85 px-4 py-3 backdrop-blur sm:px-6">
          <button
            className="rounded-lg p-2 hover:bg-muted lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-semibold sm:text-lg">{title}</h1>
            <p className="hidden truncate text-xs text-muted-foreground sm:block">{description}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle colour mode">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
