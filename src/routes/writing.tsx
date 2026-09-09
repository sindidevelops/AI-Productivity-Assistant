import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Copy, PenLine, RefreshCw, Save, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { AiOutput, AiThinking, EmptyState, ErrorNote } from "@/components/AiPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useStore } from "@/lib/store";
import { useAi } from "@/lib/use-ai";
import { writingPrompt } from "@/lib/prompts";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/writing")({
  head: () => ({
    meta: [
      { title: "AI Writing Assistant | WorkFlow AI" },
      {
        name: "description",
        content:
          "Improve workplace writing: make text more professional, concise, persuasive or clearer while keeping its meaning.",
      },
      { property: "og:title", content: "AI Writing Assistant | WorkFlow AI" },
      {
        property: "og:description",
        content: "Polish workplace messages while preserving the original meaning.",
      },
    ],
  }),
  component: WritingPage,
});

const OPTIONS = [
  "Make More Professional",
  "Make More Friendly",
  "Make More Concise",
  "Fix Grammar",
  "Make More Persuasive",
  "Simplify Language",
  "Improve Clarity",
];

function WritingPage() {
  const { logActivity, saveItem } = useStore();
  const { generate, loading, error, setError } = useAi();
  const [text, setText] = useState("");
  const [option, setOption] = useState(OPTIONS[0] as string);
  const [output, setOutput] = useState("");

  const run = async () => {
    if (!text.trim()) {
      setError("No text has been provided. Please paste the writing you want to improve.");
      return;
    }
    const improved = await generate([
      { role: "system", content: "You are an expert workplace writing coach." },
      { role: "user", content: writingPrompt(text, option) },
    ]);
    if (improved) {
      setOutput(improved);
      logActivity({ kind: "writing", label: "Writing improved", detail: option });
    }
  };

  return (
    <AppShell title="AI Writing Assistant" description="Sharpen workplace writing without losing your meaning">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <PenLine className="h-4 w-4 text-primary" /> Your text
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste the message, paragraph or document section you want to improve..."
              className="min-h-[200px]"
            />
            <div className="space-y-2">
              <Label>Improvement</Label>
              <div className="flex flex-wrap gap-2">
                {OPTIONS.map((o) => (
                  <button
                    key={o}
                    onClick={() => setOption(o)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                      option === o
                        ? "border-primary bg-primary text-primary-foreground"
                        : "hover:bg-muted",
                    )}
                  >
                    {o}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={run} disabled={loading}>
                <Sparkles className="mr-1.5 h-4 w-4" /> Improve writing
              </Button>
              <Button variant="outline" onClick={run} disabled={loading || !output}>
                <RefreshCw className="mr-1.5 h-4 w-4" /> Regenerate
              </Button>
            </div>
          </CardContent>
        </Card>

        {loading && <AiThinking label="AI is refining your writing..." />}
        {error && !loading && <ErrorNote message={error} />}

        {!loading && output && (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base">Original text</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    await navigator.clipboard.writeText(text);
                    toast.success("Copied");
                  }}
                >
                  <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy
                </Button>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">{text}</p>
              </CardContent>
            </Card>
            <AiOutput
              title="AI improved version"
              content={output}
              onChange={setOutput}
              reminder="Check the improved version still says exactly what you mean."
              actions={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    saveItem({ title: option, category: "Documents", content: output });
                    toast.success("Saved to Knowledge Hub");
                  }}
                >
                  <Save className="mr-1.5 h-3.5 w-3.5" /> Save to Knowledge Hub
                </Button>
              }
            />
          </div>
        )}

        {!loading && !output && !error && (
          <EmptyState
            icon={<PenLine className="h-5 w-5" />}
            title="Nothing to compare yet"
            body="Paste some text, pick an improvement and the original and improved versions will appear side by side."
          />
        )}
      </div>
    </AppShell>
  );
}
