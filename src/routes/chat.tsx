import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Bot, Loader2, Save, Send, User } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { ErrorNote } from "@/components/AiPanel";
import { Markdown } from "@/components/Markdown";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useStore } from "@/lib/store";
import { useAi } from "@/lib/use-ai";
import { CHAT_SYSTEM_PROMPT } from "@/lib/prompts";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "AI Chat Assistant | WorkFlow AI" },
      {
        name: "description",
        content:
          "Chat with a workplace productivity assistant about planning, communication, meetings, research and writing.",
      },
      { property: "og:title", content: "AI Chat Assistant | WorkFlow AI" },
      {
        property: "og:description",
        content: "A conversational assistant for everyday workplace questions.",
      },
    ],
  }),
  component: ChatPage,
});

const STARTERS = [
  "Help me prioritize my tasks.",
  "Write a professional follow-up email.",
  "Summarize these meeting notes.",
  "Help me plan my week.",
  "Improve this workplace message.",
];

type Msg = { role: "user" | "assistant"; content: string };

function ChatPage() {
  const { generate, loading, error } = useAi();
  const { logActivity, saveItem } = useStore();
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm your WorkFlow AI assistant. Ask me about planning your week, drafting a message, following up after a meeting, or improving a piece of writing.",
    },
  ]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    const next: Msg[] = [...messages, { role: "user", content: trimmed }];
    setMessages(next);
    setInput("");
    const reply = await generate([
      { role: "system", content: CHAT_SYSTEM_PROMPT },
      ...next.map((m) => ({ role: m.role, content: m.content })),
    ]);
    if (reply) {
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      logActivity({ kind: "chat", label: "Chat with AI assistant", detail: trimmed.slice(0, 60) });
    }
  };

  return (
    <AppShell title="AI Chat Assistant" description="Ask anything about your workday">
      <div className="flex h-[calc(100vh-11rem)] flex-col gap-4">
        <Card className="flex min-h-0 flex-1 flex-col">
          <CardContent className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 sm:p-6">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    m.role === "user" ? "bg-secondary" : "brand-gradient"
                  }`}
                >
                  {m.role === "user" ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4 text-primary-foreground" />
                  )}
                </div>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "border bg-card"
                  }`}
                >
                  {m.role === "user" ? (
                    <p className="whitespace-pre-wrap text-sm">{m.content}</p>
                  ) : (
                    <Markdown content={m.content} />
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-primary" /> AI is thinking...
              </div>
            )}
            {error && <ErrorNote message={error} />}
            <div ref={endRef} />
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-2">
          {STARTERS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="rounded-full border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
            >
              {s}
            </button>
          ))}
        </div>

        <div className="flex items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send(input);
              }
            }}
            placeholder="Ask about tasks, emails, meetings or writing..."
            className="min-h-[52px] flex-1 resize-none"
          />
          <Button onClick={() => send(input)} disabled={loading} size="icon" className="h-[52px] w-[52px]">
            <Send className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-[52px] w-[52px]"
            aria-label="Save conversation"
            onClick={() => {
              saveItem({
                title: `Conversation — ${new Date().toLocaleString()}`,
                category: "Saved Conversations",
                content: messages.map((m) => `**${m.role === "user" ? "You" : "AI"}:** ${m.content}`).join("\n\n"),
              });
              toast.success("Conversation saved to Knowledge Hub");
            }}
          >
            <Save className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
