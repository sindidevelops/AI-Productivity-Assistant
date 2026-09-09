import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { RefreshCw, Save, Search, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { AiOutput, AiThinking, EmptyState, ErrorNote } from "@/components/AiPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useStore } from "@/lib/store";
import { useAi } from "@/lib/use-ai";
import { researchPrompt } from "@/lib/prompts";

export const Route = createFileRoute("/research")({
  head: () => ({
    meta: [
      { title: "AI Research Assistant | WorkFlow AI" },
      {
        name: "description",
        content:
          "Turn articles, notes and questions into a structured research brief with insights, considerations and next steps.",
      },
      { property: "og:title", content: "AI Research Assistant | WorkFlow AI" },
      {
        property: "og:description",
        content: "Structured workplace research briefs from your own material.",
      },
    ],
  }),
  component: ResearchPage,
});

const EMPTY = { topic: "", question: "", article: "", notes: "", context: "" };

function ResearchPage() {
  const { logActivity, saveItem } = useStore();
  const { generate, loading, error, setError } = useAi();
  const [form, setForm] = useState(EMPTY);
  const [output, setOutput] = useState("");

  const set = (k: keyof typeof EMPTY) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const run = async () => {
    if (!form.topic.trim() && !form.question.trim() && !form.article.trim()) {
      setError("Please add a research topic, question or some source material first.");
      return;
    }
    const text = await generate([
      { role: "system", content: "You are an expert workplace research analyst." },
      { role: "user", content: researchPrompt(form) },
    ]);
    if (text) {
      setOutput(text);
      logActivity({
        kind: "research",
        label: "Research completed",
        detail: form.topic || form.question || "Research brief",
      });
    }
  };

  return (
    <AppShell title="AI Research Assistant" description="Structured briefs from your own source material">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Search className="h-4 w-4 text-primary" /> Research inputs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Research topic</Label>
              <Input value={form.topic} onChange={(e) => set("topic")(e.target.value)} placeholder="Hybrid work policy" />
            </div>
            <div className="space-y-2">
              <Label>Question</Label>
              <Input
                value={form.question}
                onChange={(e) => set("question")(e.target.value)}
                placeholder="What do comparable companies offer?"
              />
            </div>
            <div className="space-y-2">
              <Label>Article content</Label>
              <Textarea
                value={form.article}
                onChange={(e) => set("article")(e.target.value)}
                placeholder="Paste the article or report extract"
                className="min-h-[140px]"
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => set("notes")(e.target.value)}
                className="min-h-[90px]"
                placeholder="Your own observations"
              />
            </div>
            <div className="space-y-2">
              <Label>Additional context</Label>
              <Textarea
                value={form.context}
                onChange={(e) => set("context")(e.target.value)}
                className="min-h-[70px]"
                placeholder="Audience, decision to be made, constraints"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={run} disabled={loading}>
                <Sparkles className="mr-1.5 h-4 w-4" /> Analyse research
              </Button>
              <Button variant="outline" onClick={run} disabled={loading || !output}>
                <RefreshCw className="mr-1.5 h-4 w-4" /> Regenerate
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {loading && <AiThinking label="AI is analysing your material..." />}
          {error && !loading && <ErrorNote message={error} />}
          {!loading && output && (
            <AiOutput
              title="Research brief"
              content={output}
              onChange={setOutput}
              reminder="This brief is based only on the material you supplied. Verify important facts and sources independently."
              actions={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    saveItem({
                      title: form.topic || form.question || "Research brief",
                      category: "Research",
                      content: output,
                    });
                    toast.success("Saved to Knowledge Hub");
                  }}
                >
                  <Save className="mr-1.5 h-3.5 w-3.5" /> Save to Knowledge Hub
                </Button>
              }
            />
          )}
          {!loading && !output && !error && (
            <EmptyState
              icon={<Search className="h-5 w-5" />}
              title="No research brief yet"
              body="Add a topic, question or source material and AI will organise it into insights, considerations and next steps."
            />
          )}
        </div>
      </div>
    </AppShell>
  );
}
