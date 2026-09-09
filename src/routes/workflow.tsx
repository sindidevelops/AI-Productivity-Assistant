import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  ListTodo,
  Mail,
  Play,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { AiOutput, AiThinking, EmptyState, ErrorNote } from "@/components/AiPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useStore, type Priority } from "@/lib/store";
import { parseJsonList, sectionFrom, useAi } from "@/lib/use-ai";
import { actionItemsJsonPrompt, meetingPrompt } from "@/lib/prompts";

export const Route = createFileRoute("/workflow")({
  head: () => ({
    meta: [
      { title: "Workflow Automation | WorkFlow AI" },
      {
        name: "description",
        content:
          "Run the connected meeting-to-email workflow: notes, summary, action items, tasks and follow-up in one flow.",
      },
      { property: "og:title", content: "Workflow Automation | WorkFlow AI" },
      {
        property: "og:description",
        content: "Turn meeting notes into summaries, tasks and follow-up emails in one connected workflow.",
      },
    ],
  }),
  component: WorkflowPage,
});

const SAMPLE = `Weekly product sync — 12 attendees
- Thabo confirmed the Nexa integration passed QA; go-live agreed for Friday.
- Decision: we postpone the pricing page redesign to next quarter.
- Lerato will prepare the client presentation by Thursday (high priority).
- Sam to send the updated onboarding pack to new hires this week.
- Open question: who owns the support handover? Not decided.`;

const STEPS = [
  { id: "notes", label: "Meeting notes", icon: CalendarCheck },
  { id: "summary", label: "AI summary", icon: Sparkles },
  { id: "tasks", label: "Action items", icon: ListTodo },
  { id: "email", label: "Follow-up email", icon: Mail },
];

export type ExtractedItem = {
  title: string;
  owner: string;
  deadline: string;
  priority: string;
  description: string;
};

function WorkflowPage() {
  const navigate = useNavigate();
  const { addTasks, logActivity, saveItem, setEmailSeed } = useStore();
  const { generate, loading, error, setError } = useAi();
  const [notes, setNotes] = useState("");
  const [summary, setSummary] = useState("");
  const [step, setStep] = useState(0);

  const runSummary = async () => {
    if (!notes.trim()) {
      setError("Paste meeting notes to start the workflow.");
      return;
    }
    setError(null);
    const text = await generate([
      { role: "system", content: "You are an expert AI workplace meeting assistant." },
      { role: "user", content: meetingPrompt(notes) },
    ]);
    if (text) {
      setSummary(text);
      setStep(1);
      logActivity({ kind: "workflow", label: "Workflow: summary created", detail: notes.slice(0, 60) + "..." });
    }
  };

  const createTasks = async () => {
    if (!summary) return;
    const raw = await generate([
      { role: "system", content: "You extract structured data and reply with JSON only." },
      { role: "user", content: actionItemsJsonPrompt(summary) },
    ]);
    if (!raw) return;
    const items = parseJsonList<ExtractedItem>(raw);
    if (!items.length) {
      toast.error("No action items could be found.");
      return;
    }
    addTasks(
      items.map((i) => ({
        title: i.title,
        description: i.description || "",
        deadline: /^\d{4}-\d{2}-\d{2}$/.test(i.deadline) ? i.deadline : "",
        priority: (["High", "Medium", "Low"].includes(i.priority) ? i.priority : "Medium") as Priority,
        duration: "",
        status: "Not started" as const,
        owner: i.owner || "Not specified.",
        source: "Workflow Automation",
      })),
    );
    setStep(2);
    logActivity({ kind: "workflow", label: "Workflow: tasks created", detail: `${items.length} action items` });
    toast.success(`${items.length} action items added to Task Planner`);
  };

  const createEmail = () => {
    setEmailSeed({
      purpose: "Send a follow-up after our meeting",
      keyPoints:
        sectionFrom(summary, "Decisions Made") + "\n" + sectionFrom(summary, "Action Items"),
      context: sectionFrom(summary, "Executive Summary") || summary.slice(0, 800),
      tone: "Professional",
    });
    setStep(3);
    logActivity({ kind: "workflow", label: "Workflow: email drafted", detail: "Follow-up email seeded" });
    void navigate({ to: "/email" });
  };

  const saveSummary = () => {
    if (!summary) return;
    saveItem({
      title: `Workflow summary — ${new Date().toLocaleDateString()}`,
      category: "Meeting Summaries",
      content: summary,
    });
    toast.success("Summary saved to Knowledge Hub");
  };

  return (
    <AppShell
      title="Workflow Automation"
      description="Run the connected meeting-to-email workflow in one place"
    >
      <div className="space-y-6">
        <Card className="surface-card border-primary/15">
          <CardContent className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              {STEPS.map((s, idx) => {
                const Icon = s.icon;
                const active = idx === step;
                const done = idx < step;
                return (
                  <div key={s.id} className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                        done
                          ? "border-primary bg-primary text-primary-foreground"
                          : active
                            ? "border-primary text-primary"
                            : "border-muted-foreground/30 text-muted-foreground"
                      }`}
                    >
                      {done ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                    </div>
                    <span
                      className={`text-sm font-medium ${
                        active ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {s.label}
                    </span>
                    {idx < STEPS.length - 1 && (
                      <ArrowRight className="ml-2 hidden h-4 w-4 text-muted-foreground/50 md:block" />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {step === 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarCheck className="h-4 w-4 text-primary" /> 1. Paste meeting notes
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setNotes(SAMPLE)}>
                Use sample notes
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Paste your meeting notes or transcript here..."
                className="min-h-[260px]"
              />
              <div className="flex flex-wrap gap-2">
                <Button onClick={runSummary} disabled={loading}>
                  <Play className="mr-1.5 h-4 w-4" /> Run workflow
                </Button>
                <Button variant="outline" onClick={() => setNotes("")}>
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step > 0 && notes && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Original notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">{notes}</p>
            </CardContent>
          </Card>
        )}

        {loading && <AiThinking label="AI is running the workflow..." />}
        {error && !loading && <ErrorNote message={error} />}

        {step >= 1 && summary && (
          <AiOutput
            title="2. Meeting summary"
            content={summary}
            onChange={setSummary}
            reminder="Only information found in your notes is used. Anything missing is marked 'Not specified.'"
            actions={
              <>
                <Button size="sm" onClick={createTasks} disabled={loading}>
                  <ListTodo className="mr-1.5 h-3.5 w-3.5" /> Create action items
                </Button>
                <Button size="sm" variant="outline" onClick={saveSummary}>
                  Save summary
                </Button>
                <Button size="sm" variant="outline" onClick={() => setStep(0)}>
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Restart
                </Button>
              </>
            }
          />
        )}

        {step >= 2 && (
          <Card className="border-success/30 bg-success/5">
            <CardContent className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-success-foreground">3. Action items added</p>
                <p className="text-sm text-success-foreground/80">
                  Tasks have been sent to the Task Planner with owners and deadlines.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" asChild>
                  <Link to="/tasks">Open Task Planner</Link>
                </Button>
                <Button size="sm" onClick={createEmail}>
                  <Mail className="mr-1.5 h-3.5 w-3.5" /> Draft follow-up email
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card className="border-primary/20">
            <CardContent className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold">4. Follow-up email ready</p>
                <p className="text-sm text-muted-foreground">
                  The email form has been pre-filled with meeting context.
                </p>
              </div>
              <Button asChild>
                <Link to="/email">Open Email Generator</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {!notes && !summary && !loading && (
          <EmptyState
            icon={<Play className="h-5 w-5" />}
            title="Run the connected workflow"
            body="Paste meeting notes and WorkFlow AI will summarise them, extract action items, add them to your task planner and draft a follow-up email."
          />
        )}
      </div>
    </AppShell>
  );
}
