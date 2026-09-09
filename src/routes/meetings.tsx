import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { CalendarCheck, ListPlus, Mail, RefreshCw, Save, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { AiOutput, AiThinking, EmptyState, ErrorNote } from "@/components/AiPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useStore, type Priority } from "@/lib/store";
import { parseJsonList, sectionFrom, useAi } from "@/lib/use-ai";
import { actionItemsJsonPrompt, meetingPrompt } from "@/lib/prompts";

export const Route = createFileRoute("/meetings")({
  head: () => ({
    meta: [
      { title: "AI Meeting Assistant | WorkFlow AI" },
      {
        name: "description",
        content:
          "Turn meeting notes into an executive summary, decisions, owners, deadlines and action items you can send to your task planner.",
      },
      { property: "og:title", content: "AI Meeting Assistant | WorkFlow AI" },
      {
        property: "og:description",
        content: "Summaries, decisions and action items extracted from your meeting notes.",
      },
    ],
  }),
  component: MeetingsPage,
});

const SAMPLE = `Weekly product sync — 12 attendees
- Thabo confirmed the Nexa integration passed QA; go-live agreed for Friday.
- Decision: we postpone the pricing page redesign to next quarter.
- Lerato will prepare the client presentation by Thursday (high priority).
- Sam to send the updated onboarding pack to new hires this week.
- Open question: who owns the support handover? Not decided.`;

export type ExtractedItem = {
  title: string;
  owner: string;
  deadline: string;
  priority: string;
  description: string;
};

function MeetingsPage() {
  const navigate = useNavigate();
  const { addTasks, logActivity, saveItem, setEmailSeed } = useStore();
  const { generate, loading, error, setError } = useAi();
  const [notes, setNotes] = useState("");
  const [summary, setSummary] = useState("");
  const [extracting, setExtracting] = useState(false);

  const run = async () => {
    if (!notes.trim()) {
      setError("No meeting notes have been provided. Please paste your meeting notes before generating a summary.");
      return;
    }
    const text = await generate([
      { role: "system", content: "You are an expert AI workplace meeting assistant." },
      { role: "user", content: meetingPrompt(notes) },
    ]);
    if (text) {
      setSummary(text);
      logActivity({ kind: "meeting", label: "Meeting summarised", detail: notes.slice(0, 60) + "..." });
    }
  };

  const createTasks = async () => {
    setExtracting(true);
    const raw = await generate([
      { role: "system", content: "You extract structured data and reply with JSON only." },
      { role: "user", content: actionItemsJsonPrompt(summary || notes) },
    ]);
    setExtracting(false);
    if (!raw) return;
    const items = parseJsonList<ExtractedItem>(raw);
    if (!items.length) {
      toast.error("No action items could be found in this meeting.");
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
        source: "Meeting Assistant",
      })),
    );
    logActivity({ kind: "task", label: "Tasks created", detail: `${items.length} action items sent to Task Planner` });
    toast.success(`${items.length} action items sent to the Task Planner`);
    void navigate({ to: "/tasks" });
  };

  const followUpEmail = () => {
    setEmailSeed({
      purpose: "Send a follow-up after our meeting",
      keyPoints:
        sectionFrom(summary, "Decisions Made") + "\n" + sectionFrom(summary, "Action Items"),
      context: sectionFrom(summary, "Executive Summary") || summary.slice(0, 800),
      tone: "Professional",
    });
    void navigate({ to: "/email" });
  };

  return (
    <AppShell title="AI Meeting Assistant" description="From raw notes to decisions, owners and next steps">
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarCheck className="h-4 w-4 text-primary" /> Meeting notes or transcript
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
              className="min-h-[240px]"
            />
            <div className="flex flex-wrap gap-2">
              <Button onClick={run} disabled={loading}>
                <Sparkles className="mr-1.5 h-4 w-4" /> Summarize meeting
              </Button>
              <Button variant="outline" onClick={run} disabled={loading || !summary}>
                <RefreshCw className="mr-1.5 h-4 w-4" /> Regenerate summary
              </Button>
            </div>
          </CardContent>
        </Card>

        {(loading || extracting) && (
          <AiThinking label={extracting ? "AI is extracting action items..." : "AI is analysing the meeting..."} />
        )}
        {error && !loading && <ErrorNote message={error} />}

        {!loading && summary && (
          <AiOutput
            title="Meeting analysis"
            content={summary}
            onChange={setSummary}
            reminder="Only information found in your notes is used. Anything missing is marked 'Not specified.'"
            actions={
              <>
                <Button size="sm" onClick={createTasks} disabled={extracting}>
                  <ListPlus className="mr-1.5 h-3.5 w-3.5" /> Create tasks
                </Button>
                <Button size="sm" variant="outline" onClick={followUpEmail}>
                  <Mail className="mr-1.5 h-3.5 w-3.5" /> Generate follow-up email
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    saveItem({
                      title: `Meeting summary — ${new Date().toLocaleDateString()}`,
                      category: "Meeting Summaries",
                      content: summary,
                    });
                    toast.success("Saved to Knowledge Hub");
                  }}
                >
                  <Save className="mr-1.5 h-3.5 w-3.5" /> Save summary
                </Button>
              </>
            }
          />
        )}

        {!loading && !summary && !error && (
          <EmptyState
            icon={<CalendarCheck className="h-5 w-5" />}
            title="No meeting analysed yet"
            body="Paste notes or a transcript and AI will pull out the summary, decisions, owners, deadlines and action items."
          />
        )}
      </div>
    </AppShell>
  );
}
