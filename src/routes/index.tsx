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
    { label: "Tasks due today", value: dueToday.length, icon: ListTodo, tone: "text-primary" },
    { label: "High priority", value: highPriority.length, icon: Flame, tone: "text-destructive" },
    { label: "Upcoming deadlines", value: upcoming.length, icon: AlarmClock, tone: "text-warning" },
    { label: "Meetings this week", value: 4, icon: Users, tone: "text-success" },
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
      <div className="space-y-6">
        <Card className="surface-card overflow-hidden border-primary/20">
          <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold sm:text-2xl">
                {greeting()}, {userName}! Let&apos;s make today productive.
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                You have {highPriority.length} high-priority {highPriority.length === 1 ? "task" : "tasks"} and{" "}
                {dueToday.length} due today. Clear the urgent work first, then move to planning.
              </p>
            </div>
            <Button asChild>
              <Link to="/workflow">
                Run the meeting workflow <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((s) => (
            <Card key={s.label} className="lift-on-hover">
              <CardContent className="flex items-center justify-between p-5">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{s.label}</p>
                  <p className="mt-1 text-3xl font-bold">{s.value}</p>
                </div>
                <s.icon className={`h-8 w-8 ${s.tone}`} />
              </CardContent>
            </Card>
          ))}
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Quick actions
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {quickActions.map((a) => (
              <Link
                key={a.to}
                to={a.to}
                className="lift-on-hover flex items-center gap-3 rounded-xl border bg-card px-4 py-3 text-sm font-medium"
              >
                <a.icon className="h-4 w-4 text-primary" />
                {a.label}
              </Link>
            ))}
          </div>
        </div>

        <Card className="border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-primary" /> Your AI Productivity Briefing
            </CardTitle>
            <Button variant="outline" size="sm" onClick={runBriefing} disabled={loading}>
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Refresh
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

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
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
                  <div key={t.id} className="flex items-start gap-3 rounded-xl border p-3">
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

          <Card>
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
                  <div key={a.id} className="flex items-start gap-3 border-b pb-3 last:border-0 last:pb-0">
                    <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
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
