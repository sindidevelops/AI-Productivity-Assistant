import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Moon, ShieldCheck, Sun, Trash2, User } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useStore } from "@/lib/store";
import { RESPONSIBLE_AI_DISCLAIMER, RESPONSIBLE_AI_POINTS } from "@/lib/prompts";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings | WorkFlow AI" },
      {
        name: "description",
        content: "Personalise WorkFlow AI: your name, theme and responsible AI preferences.",
      },
      { property: "og:title", content: "Settings | WorkFlow AI" },
      {
        property: "og:description",
        content: "Personalise your WorkFlow AI experience and review responsible AI practices.",
      },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { userName, setUserName, theme, toggleTheme, tasks, saved, activity, logActivity } =
    useStore();
  const [draftName, setDraftName] = useState(userName);

  const saveName = () => {
    const trimmed = draftName.trim();
    if (!trimmed) {
      toast.error("Please enter a name.");
      return;
    }
    setUserName(trimmed);
    toast.success("Name updated");
  };

  const clearData = () => {
    if (typeof window === "undefined") return;
    if (window.confirm("This will clear all tasks, saved items and activity. This cannot be undone.")) {
      localStorage.removeItem("workflow-ai-state-v1");
      window.location.reload();
    }
  };

  return (
    <AppShell title="Settings" description="Personalise your WorkFlow AI experience">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4 text-primary" /> Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Your name</Label>
                <Input
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  placeholder="Masindi"
                />
                <p className="text-xs text-muted-foreground">
                  Used in the dashboard greeting and throughout the app.
                </p>
              </div>
              <Button onClick={saveName}>Save name</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                {theme === "dark" ? (
                  <Moon className="h-4 w-4 text-primary" />
                ) : (
                  <Sun className="h-4 w-4 text-primary" />
                )}
                Appearance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Dark mode</p>
                  <p className="text-xs text-muted-foreground">Switch between light and dark themes.</p>
                </div>
                <Switch checked={theme === "dark"} onCheckedChange={toggleTheme} />
              </div>
              <div
                className={cn(
                  "flex items-center gap-3 rounded-xl border p-4 transition-colors",
                  theme === "dark" ? "bg-background" : "bg-muted/40",
                )}
              >
                <div className="brand-gradient flex h-10 w-10 items-center justify-center rounded-lg">
                  <Sun className="h-5 w-5 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Preview</p>
                  <p className="text-xs text-muted-foreground">
                    {theme === "dark" ? "Dark theme is active" : "Light theme is active"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Trash2 className="h-4 w-4 text-destructive" /> Data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Reset all data</p>
                  <p className="text-xs text-muted-foreground">
                    {tasks.length} tasks, {saved.length} saved items, {activity.length} activities
                  </p>
                </div>
                <Button variant="destructive" size="sm" onClick={clearData}>
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-4 w-4 text-primary" /> Responsible AI
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-sm leading-relaxed text-muted-foreground">{RESPONSIBLE_AI_DISCLAIMER}</p>
            <div className="space-y-3">
              {RESPONSIBLE_AI_POINTS.map((point) => (
                <div key={point} className="flex items-start gap-3 rounded-xl border p-4">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <p className="text-sm">{point}</p>
                </div>
              ))}
            </div>
            <div className="rounded-xl bg-muted/50 p-4">
              <p className="text-sm font-medium">How WorkFlow AI uses your data</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Your inputs are sent to AI models only to generate the outputs you request. Nothing is
                used to train models. All tasks, saved items and activity are stored locally in your
                browser.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
