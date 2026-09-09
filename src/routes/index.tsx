import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  AlarmClock,
  ArrowRight,
  Bot,
  CalendarDays,
  CheckCircle2,
  Flame,
  ListTodo,
  Mail,
  RefreshCw,
  Search,
  Sparkles,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { AiThinking, EmptyState, ErrorNote } from "@/components/AiPanel";
import { Markdown } from "@/components/Markdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { daysUntil, timeAgo, useStore } from "@/lib/store";
import { useAi } from "@/lib/use-ai";
import { briefingPrompt } from "@/lib/prompts";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard | WorkFlow AI Productivity Assistant" },
      {
        name: "description",
        content:
          "See today's priorities, deadlines and your AI productivity briefing in one workplace dashboard.",
      },
      { property: "og:title", content: "Dashboard | WorkFlow AI" },
      {
        property: "og:description",
        content: "Today's priorities, deadlines and an AI productivity briefing at a glance.",
      },
    ],
  }),
  component: Dashboard,
});

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function Dashboard() {
  const { userName, tasks, activity, updateTask, ready } = useStore();
  const { generate, loading, error } = useAi();
  const [briefing, setBriefing] = useState("");

  const openTasks = tasks.filter((t) => t.status !== "Complete");
  const dueToday = openTasks.filter((t) => daysUntil(t.deadline) <= 0);
  const highPriority = openTasks.filter((t) => t.priority === "High");
  const upcoming = openTasks.filter((t) => {
    const d = daysUntil(t.deadline);
    return d > 0 && d <= 7;
  });
  const priorities = [...openTasks]
    .sort((a, b) => {
      const rank = { High: 0, Medium: 1, Low: 2 } as const;
      return rank[a.priority] - rank[b.priority] || daysUntil(a.deadline) - daysUntil(b.deadline);
    })
    .slice(0, 5);

  const runBriefing = async () => {
    const summary = openTasks
      .map((t) => `- ${t.title} (${t.priority}, due ${t.deadline || "Not specified."}, ${t.duration || "no estimate"})`)
      .join("\n");
    const text = await generate([
      { role: "system", content: "You are a concise executive productivity assistant." },
      { role: "user", content: briefingPrompt(summary) },
    ]);
    if (text) setBriefing(text);
  };

  useEffect(() => {
    if (ready && !briefing) void runBriefing();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const stats = [
    { label: "Tasks due today", value: dueToday.length, icon: ListTodo, tone: "text-primary", iconBg: "bg-primary/10" },
    { label: "High priority", value: highPriority.length, icon: Flame, tone: "text-destructive", iconBg: "bg-destructive/10" },
    { label: "Upcoming deadlines", value: upcoming.length, icon: AlarmClock, tone: "text-warning", iconBg: "bg-warning/15" },
    { label: "Meetings this week", value: 4, icon: Users, tone: "text-success", iconBg: "bg-success/10" },
  ];

  const quickActions = [
    { to: "/email", label: "Generate Email", icon: Mail },
    { to: "/meetings", label: "Summarize Meeting", icon: CalendarDays },
    { to: "/tasks", label: "Plan My Tasks", icon: ListTodo },
    { to: "/research", label: "Start Research", icon: Search },
    { to: "/chat", label: "Ask AI Assistant", icon: Bot },
  ] as const;

  return (
    <AppShell title="Dashboard" description="Your workplace at a glance">
      <div className="space-y-7">
        <Card className="dashboard-enter dashboard-glass overflow-hidden border-primary/15">
          <CardContent className="relative flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between lg:p-7">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
                <Sparkles className="h-3.5 w-3.5" /> Daily focus
              </div>
              <h2 className="max-w-3xl text-xl font-bold sm:text-2xl">
                {greeting()}, {userName}! Let&apos;s make today productive.
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                You have {highPriority.length} high-priority {highPriority.length === 1 ? "task" : "tasks"} and{" "}
                {dueToday.length} due today. Clear the urgent work first, then move to planning.
              </p>
            </div>
            <Button asChild className="group shrink-0 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
              <Link to="/workflow">
                Run the meeting workflow <ArrowRight className="ml-1.5 h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <div className="dashboard-enter dashboard-delay-1 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((s) => (
            <Card key={s.label} className="metric-card group rounded-lg border-border/70 shadow-sm">
              <CardContent className="flex items-center justify-between p-5">
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">{s.label}</p>
                  <p className="mt-2 text-3xl font-bold tabular-nums">{s.value}</p>
                </div>
                <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${s.iconBg} transition-transform duration-200 group-hover:scale-105`}>
                  <s.icon className={`h-5 w-5 ${s.tone}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <section className="dashboard-enter dashboard-delay-2">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Quick actions</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">Jump into your most-used tools</p>
            </div>
          </div>
          <div className="grid overflow-hidden rounded-lg border bg-card/75 shadow-sm backdrop-blur-sm sm:grid-cols-2 lg:grid-cols-5">
            {quickActions.map((a) => (
              <Link
                key={a.to}
                to={a.to}
                className="group flex min-h-14 items-center gap-3 border-b px-4 py-3 text-sm font-medium transition-colors duration-200 hover:bg-accent/60 sm:border-r lg:border-b-0 last:border-b-0 lg:last:border-r-0"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/8 text-primary transition-colors duration-200 group-hover:bg-primary group-hover:text-primary-foreground">
                  <a.icon className="h-4 w-4" />
                </span>
                {a.label}
              </Link>
            ))}
          </div>
        </section>

        <Card className="dashboard-enter dashboard-delay-3 dashboard-glass overflow-hidden rounded-lg border-primary/15">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Sparkles className="h-4 w-4" />
              </span>
              Your AI Productivity Briefing
            </CardTitle>
            <Button variant="outline" size="sm" onClick={runBriefing} disabled={loading} className="transition-colors duration-200">
              <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading && <AiThinking label="AI is preparing your briefing..." />}
            {error && !loading && <ErrorNote message={error} />}
            {!loading && !error && briefing && <Markdown content={briefing} />}
            {!loading && !error && !briefing && (
              <p className="text-sm text-muted-foreground">Refresh to generate today&apos;s briefing.</p>
            )}
          </CardContent>
        </Card>

        <div className="dashboard-enter dashboard-delay-4 grid gap-6 lg:grid-cols-2">
          <Card className="rounded-lg border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Today&apos;s priorities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {priorities.length === 0 ? (
                <EmptyState
                  icon={<ListTodo className="h-5 w-5" />}
                  title="No tasks yet"
                  body="Add your first task or let AI help you plan your work."
                  action={
                    <Button asChild size="sm">
                      <Link to="/tasks">Open Task Planner</Link>
                    </Button>
                  }
                />
              ) : (
                priorities.map((t) => (
                  <div key={t.id} className="group flex items-start gap-3 rounded-lg border border-transparent bg-muted/35 p-3 transition-colors duration-200 hover:border-border hover:bg-muted/60">
                    <Checkbox
                      checked={t.status === "Complete"}
                      onCheckedChange={(c) =>
                        updateTask(t.id, { status: c ? "Complete" : "Not started" })
                      }
                      className="mt-1"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{t.title}</p>
                      <p className="text-xs text-muted-foreground">
                        Due {t.deadline || "Not specified."} · {t.status}
                      </p>
                    </div>
                    <Badge
                      variant={t.priority === "High" ? "destructive" : t.priority === "Medium" ? "default" : "secondary"}
                    >
                      {t.priority}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="rounded-lg border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Recent activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {activity.length === 0 ? (
                <EmptyState
                  icon={<CheckCircle2 className="h-5 w-5" />}
                  title="Nothing here yet"
                  body="Your generated emails, summaries and tasks will appear here."
                />
              ) : (
                activity.slice(0, 6).map((a) => (
                  <div key={a.id} className="group flex items-start gap-3 border-b pb-3 transition-colors last:border-0 last:pb-0">
                    <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary ring-4 ring-primary/10 transition-transform duration-200 group-hover:scale-110" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{a.label}</p>
                      <p className="truncate text-xs text-muted-foreground">{a.detail}</p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(a.createdAt)}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
