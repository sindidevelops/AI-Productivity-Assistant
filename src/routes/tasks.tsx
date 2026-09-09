import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  CalendarClock,
  ListTodo,
  Plus,
  RefreshCw,
  Save,
  Scissors,
  Sparkles,
  Trash2,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { AiOutput, AiThinking, EmptyState, ErrorNote } from "@/components/AiPanel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStore, type Priority, type TaskStatus } from "@/lib/store";
import { parseJsonList, useAi } from "@/lib/use-ai";
import { breakdownPrompt, plannerPrompt, subtasksJsonPrompt } from "@/lib/prompts";

export const Route = createFileRoute("/tasks")({
  head: () => ({
    meta: [
      { title: "AI Task Planner | WorkFlow AI" },
      {
        name: "description",
        content:
          "Add tasks, let AI prioritise them and generate a realistic daily schedule, weekly plan and task breakdowns.",
      },
      { property: "og:title", content: "AI Task Planner | WorkFlow AI" },
      {
        property: "og:description",
        content: "AI prioritisation, daily schedules and task breakdowns for busy professionals.",
      },
    ],
  }),
  component: TasksPage,
});

const EMPTY = {
  title: "",
  description: "",
  deadline: "",
  priority: "Medium" as Priority,
  duration: "",
  status: "Not started" as TaskStatus,
};

const priorityVariant = (p: Priority) =>
  p === "High" ? "destructive" : p === "Medium" ? "default" : "secondary";

function TasksPage() {
  const { tasks, addTask, addTasks, updateTask, deleteTask, logActivity, saveItem } = useStore();
  const { generate, loading, error, setError } = useAi();
  const [form, setForm] = useState(EMPTY);
  const [plan, setPlan] = useState("");
  const [goal, setGoal] = useState("");
  const [breakdown, setBreakdown] = useState("");
  const [busy, setBusy] = useState<"plan" | "breakdown" | "subtasks" | null>(null);

  const submit = () => {
    if (!form.title.trim()) {
      toast.error("Please give the task a name.");
      return;
    }
    addTask({ ...form, owner: "You", source: "Manual" });
    setForm(EMPTY);
    logActivity({ kind: "task", label: "Task created", detail: form.title });
    toast.success("Task added");
  };

  const makePlan = async () => {
    if (!tasks.length) {
      setError("There are no tasks to plan yet. Add a task first.");
      return;
    }
    setBusy("plan");
    const text = await generate([
      { role: "system", content: "You are an expert productivity planner." },
      { role: "user", content: plannerPrompt(tasks.map((t) => ({ ...t }))) },
    ]);
    setBusy(null);
    if (text) setPlan(text);
  };

  const makeBreakdown = async () => {
    if (!goal.trim()) {
      setError("Describe the large task you want to break down.");
      return;
    }
    setBusy("breakdown");
    const text = await generate([
      { role: "system", content: "You are an expert project planning assistant." },
      { role: "user", content: breakdownPrompt(goal) },
    ]);
    setBusy(null);
    if (text) setBreakdown(text);
  };

  const sendSubtasks = async () => {
    setBusy("subtasks");
    const raw = await generate([
      { role: "system", content: "You reply with JSON only." },
      { role: "user", content: subtasksJsonPrompt(goal) },
    ]);
    setBusy(null);
    if (!raw) return;
    const items = parseJsonList<{
      title: string;
      description: string;
      duration: string;
      priority: string;
    }>(raw);
    if (!items.length) {
      toast.error("Couldn't turn that into subtasks. Try rephrasing the goal.");
      return;
    }
    addTasks(
      items.map((i) => ({
        title: i.title,
        description: i.description || "",
        deadline: "",
        priority: (["High", "Medium", "Low"].includes(i.priority) ? i.priority : "Medium") as Priority,
        duration: i.duration || "",
        status: "Not started" as TaskStatus,
        owner: "You",
        source: "Task Breakdown",
      })),
    );
    toast.success(`${items.length} subtasks added to your task list`);
  };

  const groups: Array<{ label: string; items: typeof tasks }> = [
    { label: "High priority", items: tasks.filter((t) => t.priority === "High") },
    { label: "Medium priority", items: tasks.filter((t) => t.priority === "Medium") },
    { label: "Low priority", items: tasks.filter((t) => t.priority === "Low") },
  ];

  return (
    <AppShell title="AI Task Planner" description="Prioritise, schedule and break down your work">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Plus className="h-4 w-4 text-primary" /> Add a task
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label>Task name</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="min-h-[70px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Deadline</Label>
                  <Input
                    type="date"
                    value={form.deadline}
                    onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Estimated time</Label>
                  <Input
                    value={form.duration}
                    placeholder="2 h"
                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select
                    value={form.priority}
                    onValueChange={(v) => setForm({ ...form, priority: v as Priority })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["High", "Medium", "Low"].map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={form.status}
                    onValueChange={(v) => setForm({ ...form, status: v as TaskStatus })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["Not started", "In progress", "Complete"].map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button className="w-full" onClick={submit}>
                <Plus className="mr-1.5 h-4 w-4" /> Add task
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Scissors className="h-4 w-4 text-primary" /> Task breakdown assistant
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="e.g. Prepare the monthly marketing report"
                className="min-h-[80px]"
              />
              <div className="flex flex-wrap gap-2">
                <Button onClick={makeBreakdown} disabled={busy !== null}>
                  <Wand2 className="mr-1.5 h-4 w-4" /> Break it down
                </Button>
                <Button variant="outline" onClick={sendSubtasks} disabled={busy !== null || !breakdown}>
                  <ListTodo className="mr-1.5 h-4 w-4" /> Send subtasks to planner
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
              <CardTitle className="text-base">Your tasks ({tasks.length})</CardTitle>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={makePlan} disabled={busy !== null}>
                  <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Generate AI plan
                </Button>
                <Button size="sm" variant="outline" onClick={makePlan} disabled={busy !== null || !plan}>
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Optimise schedule
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {tasks.length === 0 ? (
                <EmptyState
                  icon={<ListTodo className="h-5 w-5" />}
                  title="No tasks yet"
                  body="Add your first task or let AI help you plan your work."
                />
              ) : (
                groups
                  .filter((g) => g.items.length > 0)
                  .map((g) => (
                    <div key={g.label} className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {g.label}
                      </p>
                      {g.items.map((t) => (
                        <div key={t.id} className="rounded-xl border p-3">
                          <div className="flex items-start gap-3">
                            <Checkbox
                              className="mt-1"
                              checked={t.status === "Complete"}
                              onCheckedChange={(c) =>
                                updateTask(t.id, { status: c ? "Complete" : "Not started" })
                              }
                            />
                            <div className="min-w-0 flex-1">
                              <p
                                className={`text-sm font-medium ${
                                  t.status === "Complete" ? "text-muted-foreground line-through" : ""
                                }`}
                              >
                                {t.title}
                              </p>
                              {t.description && (
                                <p className="mt-0.5 text-xs text-muted-foreground">{t.description}</p>
                              )}
                              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                <span className="inline-flex items-center gap-1">
                                  <CalendarClock className="h-3 w-3" />
                                  {t.deadline || "Not specified."}
                                </span>
                                {t.duration && <span>· {t.duration}</span>}
                                {t.owner && <span>· {t.owner}</span>}
                                {t.source && t.source !== "Manual" && <span>· via {t.source}</span>}
                              </div>
                            </div>
                            <div className="flex shrink-0 items-center gap-1">
                              <Badge variant={priorityVariant(t.priority)}>{t.priority}</Badge>
                              <Select
                                value={t.status}
                                onValueChange={(v) => updateTask(t.id, { status: v as TaskStatus })}
                              >
                                <SelectTrigger className="h-8 w-[130px] text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {["Not started", "In progress", "Complete"].map((s) => (
                                    <SelectItem key={s} value={s}>
                                      {s}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label="Delete task"
                                onClick={() => deleteTask(t.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))
              )}
            </CardContent>
          </Card>

          {(loading || busy) && <AiThinking label="AI is planning your work..." />}
          {error && !loading && <ErrorNote message={error} />}

          {!loading && plan && (
            <AiOutput
              title="AI plan and schedule"
              content={plan}
              onChange={setPlan}
              reminder="Adjust the schedule to fit meetings and commitments AI cannot see."
              actions={
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    saveItem({ title: "AI task plan", category: "Tasks", content: plan });
                    toast.success("Saved to Knowledge Hub");
                  }}
                >
                  <Save className="mr-1.5 h-3.5 w-3.5" /> Save plan
                </Button>
              }
            />
          )}

          {!loading && breakdown && (
            <AiOutput title="Task breakdown" content={breakdown} onChange={setBreakdown} />
          )}
        </div>
      </div>
    </AppShell>
  );
}
