import { useEffect, useState, type ReactNode } from "react";
import { AlertTriangle, Check, Copy, Loader2, Pencil, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Markdown } from "@/components/Markdown";

export function AiThinking({ label = "AI is thinking..." }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-dashed bg-muted/40 px-4 py-6">
      <Loader2 className="h-4 w-4 animate-spin text-primary" />
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">Structuring a workplace-ready response.</p>
      </div>
    </div>
  );
}

export function ErrorNote({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3">
      <AlertTriangle className="mt-0.5 h-4 w-4 text-destructive" />
      <p className="text-sm text-destructive">{message}</p>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-12 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-primary">
        {icon}
      </div>
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function AiReminder({ text }: { text: string }) {
  return (
    <p className="flex items-start gap-2 text-xs text-muted-foreground">
      <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
      {text}
    </p>
  );
}

export function AiOutput({
  title,
  content,
  onChange,
  actions,
  reminder,
}: {
  title: string;
  content: string;
  onChange: (value: string) => void;
  actions?: ReactNode;
  reminder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(content);

  useEffect(() => {
    setDraft(content);
  }, [content]);

  const copy = async () => {
    await navigator.clipboard.writeText(content);
    toast.success("Copied to clipboard");
  };

  return (
    <Card className="surface-card border-primary/15">
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-primary" />
          {title}
        </CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={copy}>
            <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy
          </Button>
          {editing ? (
            <Button
              size="sm"
              onClick={() => {
                onChange(draft);
                setEditing(false);
                toast.success("Changes saved");
              }}
            >
              <Check className="mr-1.5 h-3.5 w-3.5" /> Done
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {editing ? (
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="min-h-[320px] font-mono text-xs"
          />
        ) : (
          <Markdown content={content} />
        )}
        {actions && <div className="flex flex-wrap gap-2 border-t pt-4">{actions}</div>}
        {reminder && <AiReminder text={reminder} />}
      </CardContent>
    </Card>
  );
}
