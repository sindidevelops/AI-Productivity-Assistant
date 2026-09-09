import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  BookOpen,
  CalendarDays,
  FileText,
  Library,
  MessageSquare,
  PenLine,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/AiPanel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useStore, type SavedCategory } from "@/lib/store";
import { Markdown } from "@/components/Markdown";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/knowledge")({
  head: () => ({
    meta: [
      { title: "Knowledge Hub | WorkFlow AI" },
      {
        name: "description",
        content: "Search, browse and manage saved emails, meeting summaries, tasks, research and documents.",
      },
      { property: "og:title", content: "Knowledge Hub | WorkFlow AI" },
      {
        property: "og:description",
        content: "Your saved AI outputs, organised and searchable in one place.",
      },
    ],
  }),
  component: KnowledgePage,
});

const CATEGORIES: SavedCategory[] = [
  "Emails",
  "Meeting Summaries",
  "Tasks",
  "Research",
  "Documents",
  "Saved Conversations",
];

const ICONS: Record<SavedCategory, typeof FileText> = {
  Emails: MessageSquare,
  "Meeting Summaries": CalendarDays,
  Tasks: PenLine,
  Research: Search,
  Documents: FileText,
  "Saved Conversations": MessageSquare,
};

function KnowledgePage() {
  const { saved, deleteSaved, updateSaved } = useStore();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<SavedCategory | "All">("All");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return saved
      .filter((item) => (category === "All" ? true : item.category === category))
      .filter(
        (item) =>
          !q ||
          item.title.toLowerCase().includes(q) ||
          item.content.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q),
      )
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [saved, query, category]);

  const counts = useMemo(() => {
    const map: Record<SavedCategory | "All", number> = { All: saved.length };
    for (const c of CATEGORIES) map[c] = saved.filter((s) => s.category === c).length;
    return map;
  }, [saved]);

  const startEdit = (id: string) => {
    const item = saved.find((s) => s.id === id);
    if (!item) return;
    setEditingId(id);
    setEditTitle(item.title);
    setEditContent(item.content);
  };

  const saveEdit = () => {
    if (!editingId) return;
    updateSaved(editingId, { title: editTitle, content: editContent });
    setEditingId(null);
    toast.success("Saved item updated");
  };

  return (
    <AppShell
      title="Knowledge Hub"
      description="Saved emails, summaries, tasks, research and documents"
    >
      <div className="space-y-6">
        <Card>
          <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search saved items..."
                className="pl-9"
              />
            </div>
            <Select value={category} onValueChange={(v) => setCategory(v as SavedCategory | "All")}>
              <SelectTrigger className="w-full sm:w-[220px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All categories ({counts.All})</SelectItem>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c} ({counts[c]})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {query && (
              <Button variant="ghost" size="sm" onClick={() => setQuery("")}>
                <X className="mr-1.5 h-4 w-4" /> Clear
              </Button>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((c) => {
            const Icon = ICONS[c];
            const active = category === c;
            return (
              <button
                key={c}
                onClick={() => setCategory(active ? "All" : c)}
                className={cn(
                  "flex items-center justify-between rounded-xl border p-4 text-left transition-colors",
                  active ? "border-primary bg-primary/5" : "hover:bg-muted/50",
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium">{c}</span>
                </div>
                <Badge variant="secondary">{counts[c]}</Badge>
              </button>
            );
          })}
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<Library className="h-5 w-5" />}
            title="No saved items yet"
            body="Generate emails, summaries, plans or research and save them here to build your knowledge base."
          />
        ) : (
          <div className="space-y-4">
            {filtered.map((item) => {
              const Icon = ICONS[item.category];
              const editing = editingId === item.id;
              return (
                <Card key={item.id} className="overflow-hidden">
                  <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-primary">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{item.title}</CardTitle>
                        <p className="text-xs text-muted-foreground">
                          {item.category} · {new Date(item.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {editing ? (
                        <Button size="sm" onClick={saveEdit}>
                          Save
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => startEdit(item.id)}>
                          Edit
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          deleteSaved(item.id);
                          toast.success("Item deleted");
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {editing ? (
                      <div className="space-y-3">
                        <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                        <Textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="min-h-[200px] font-mono text-xs"
                        />
                      </div>
                    ) : (
                      <div className="max-h-[400px] overflow-y-auto pr-2">
                        <Markdown content={item.content} />
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
