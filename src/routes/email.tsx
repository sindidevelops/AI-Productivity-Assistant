import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eraser, Mail, RefreshCw, Save, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { AiOutput, AiThinking, EmptyState, ErrorNote } from "@/components/AiPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useStore } from "@/lib/store";
import { useAi } from "@/lib/use-ai";
import { emailPrompt } from "@/lib/prompts";

export const Route = createFileRoute("/email")({
  head: () => ({
    meta: [
      { title: "AI Email Generator | WorkFlow AI" },
      {
        name: "description",
        content:
          "Draft professional workplace emails with a chosen tone, subject line, body and closing in seconds.",
      },
      { property: "og:title", content: "AI Email Generator | WorkFlow AI" },
      {
        property: "og:description",
        content: "Generate, edit and reuse professional workplace emails with AI.",
      },
    ],
  }),
  component: EmailPage,
});

const TONES = ["Formal", "Professional", "Friendly", "Persuasive", "Apologetic", "Confident"];

const EMPTY = {
  recipient: "",
  recipientRole: "",
  purpose: "",
  keyPoints: "",
  context: "",
  tone: "Professional",
};

function EmailPage() {
  const { emailSeed, setEmailSeed, logActivity, saveItem } = useStore();
  const { generate, loading, error, setError } = useAi();
  const [form, setForm] = useState(EMPTY);
  const [output, setOutput] = useState("");

  useEffect(() => {
    if (emailSeed) {
      setForm((f) => ({ ...f, ...emailSeed }));
      setEmailSeed(null);
      toast.info("Meeting details loaded into the email form");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emailSeed]);

  const set = (k: keyof typeof EMPTY) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const run = async () => {
    if (!form.purpose.trim() && !form.keyPoints.trim()) {
      setError("Please add the email purpose or key points before generating.");
      return;
    }
    const text = await generate([
      { role: "system", content: "You are an expert workplace communication assistant." },
      { role: "user", content: emailPrompt(form) },
    ]);
    if (text) {
      setOutput(text);
      logActivity({
        kind: "email",
        label: "Email generated",
        detail: `${form.tone} email to ${form.recipient || "a colleague"}`,
      });
    }
  };

  return (
    <AppShell title="AI Email Generator" description="Professional workplace emails, drafted in seconds">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Mail className="h-4 w-4 text-primary" /> Email details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Recipient name</Label>
              <Input
                value={form.recipient}
                onChange={(e) => set("recipient")(e.target.value)}
                placeholder="Thandi Mokoena"
              />
            </div>
            <div className="space-y-2">
              <Label>Recipient role or company</Label>
              <Input
                value={form.recipientRole}
                onChange={(e) => set("recipientRole")(e.target.value)}
                placeholder="Operations Director, Nexa Group"
              />
            </div>
            <div className="space-y-2">
              <Label>Email purpose</Label>
              <Input
                value={form.purpose}
                onChange={(e) => set("purpose")(e.target.value)}
                placeholder="Request a deadline extension"
              />
            </div>
            <div className="space-y-2">
              <Label>Key points</Label>
              <Textarea
                value={form.keyPoints}
                onChange={(e) => set("keyPoints")(e.target.value)}
                placeholder="One point per line"
                className="min-h-[110px]"
              />
            </div>
            <div className="space-y-2">
              <Label>Additional context</Label>
              <Textarea
                value={form.context}
                onChange={(e) => set("context")(e.target.value)}
                placeholder="Background the reader needs"
                className="min-h-[80px]"
              />
            </div>
            <div className="space-y-2">
              <Label>Tone</Label>
              <Select value={form.tone} onValueChange={set("tone")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TONES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button onClick={run} disabled={loading}>
                <Sparkles className="mr-1.5 h-4 w-4" /> Generate email
              </Button>
              <Button variant="outline" onClick={run} disabled={loading || !output}>
                <RefreshCw className="mr-1.5 h-4 w-4" /> Regenerate
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setForm(EMPTY);
                  setOutput("");
                  setError(null);
                }}
              >
                <Eraser className="mr-1.5 h-4 w-4" /> Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {loading && <AiThinking label="AI is writing your email..." />}
          {error && !loading && <ErrorNote message={error} />}
          {!loading && output && (
            <AiOutput
              title="Generated email"
              content={output}
              onChange={setOutput}
              reminder="Review AI-generated emails before sending them."
              actions={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    saveItem({
                      title: `Email to ${form.recipient || "colleague"}`,
                      category: "Emails",
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
              icon={<Mail className="h-5 w-5" />}
              title="No email yet"
              body="Fill in the details on the left and generate a polished workplace email with a subject line, body and closing."
            />
          )}
        </div>
      </div>
    </AppShell>
  );
}
