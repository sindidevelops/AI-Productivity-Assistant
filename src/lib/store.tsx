import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Priority = "High" | "Medium" | "Low";
export type TaskStatus = "Not started" | "In progress" | "Complete";

export type Task = {
  id: string;
  title: string;
  description: string;
  deadline: string;
  priority: Priority;
  duration: string;
  status: TaskStatus;
  owner?: string;
  source?: string;
  createdAt: number;
};

export type SavedCategory =
  | "Emails"
  | "Meeting Summaries"
  | "Tasks"
  | "Research"
  | "Documents"
  | "Saved Conversations";

export type SavedItem = {
  id: string;
  title: string;
  category: SavedCategory;
  content: string;
  createdAt: number;
};

export type Activity = {
  id: string;
  label: string;
  detail: string;
  kind: "email" | "meeting" | "task" | "research" | "writing" | "chat" | "workflow";
  createdAt: number;
};

export type EmailDraftSeed = {
  recipient?: string;
  recipientRole?: string;
  purpose?: string;
  keyPoints?: string;
  context?: string;
  tone?: string;
};

type Store = {
  ready: boolean;
  userName: string;
  setUserName: (v: string) => void;
  theme: "light" | "dark";
  toggleTheme: () => void;
  tasks: Task[];
  addTask: (t: Omit<Task, "id" | "createdAt">) => Task;
  addTasks: (t: Array<Omit<Task, "id" | "createdAt">>) => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  saved: SavedItem[];
  saveItem: (item: Omit<SavedItem, "id" | "createdAt">) => void;
  updateSaved: (id: string, patch: Partial<SavedItem>) => void;
  deleteSaved: (id: string) => void;
  activity: Activity[];
  logActivity: (a: Omit<Activity, "id" | "createdAt">) => void;
  emailSeed: EmailDraftSeed | null;
  setEmailSeed: (seed: EmailDraftSeed | null) => void;
};

const StoreContext = createContext<Store | null>(null);

const uid = () => Math.random().toString(36).slice(2, 10);
const dayOffset = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

const sampleTasks = (): Task[] => [
  {
    id: uid(),
    title: "Finish the Q3 client presentation",
    description: "Final slides, revenue charts and speaker notes for the Nexa account review.",
    deadline: dayOffset(1),
    priority: "High",
    duration: "3 h",
    status: "In progress",
    owner: "You",
    source: "Manual",
    createdAt: Date.now() - 90000,
  },
  {
    id: uid(),
    title: "Review vendor contract renewal",
    description: "Check pricing changes and the new SLA clause before legal sign-off.",
    deadline: dayOffset(0),
    priority: "High",
    duration: "1 h",
    status: "Not started",
    owner: "You",
    source: "Manual",
    createdAt: Date.now() - 80000,
  },
  {
    id: uid(),
    title: "Send onboarding pack to new hires",
    description: "Two engineers starting Monday.",
    deadline: dayOffset(0),
    priority: "Medium",
    duration: "45 min",
    status: "Not started",
    owner: "You",
    source: "Manual",
    createdAt: Date.now() - 70000,
  },
  {
    id: uid(),
    title: "Draft the monthly marketing report",
    description: "Campaign performance, key trends and recommendations.",
    deadline: dayOffset(4),
    priority: "Medium",
    duration: "2 h",
    status: "Not started",
    owner: "You",
    source: "Manual",
    createdAt: Date.now() - 60000,
  },
  {
    id: uid(),
    title: "Tidy the shared project folder",
    description: "Archive last quarter's files.",
    deadline: dayOffset(6),
    priority: "Low",
    duration: "30 min",
    status: "Not started",
    owner: "You",
    source: "Manual",
    createdAt: Date.now() - 50000,
  },
];

const sampleActivity = (): Activity[] => [
  {
    id: uid(),
    label: "Meeting summarised",
    detail: "Weekly product sync — 4 action items extracted",
    kind: "meeting",
    createdAt: Date.now() - 1000 * 60 * 42,
  },
  {
    id: uid(),
    label: "Email generated",
    detail: "Follow-up to Nexa Group about the Q3 review",
    kind: "email",
    createdAt: Date.now() - 1000 * 60 * 130,
  },
  {
    id: uid(),
    label: "Research completed",
    detail: "Hybrid work policy benchmarks",
    kind: "research",
    createdAt: Date.now() - 1000 * 60 * 300,
  },
];

const KEY = "workflow-ai-state-v1";

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [userName, setUserName] = useState("Masindi");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [saved, setSaved] = useState<SavedItem[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [emailSeed, setEmailSeed] = useState<EmailDraftSeed | null>(null);

  useEffect(() => {
    let parsed: Partial<{
      userName: string;
      theme: "light" | "dark";
      tasks: Task[];
      saved: SavedItem[];
      activity: Activity[];
    }> = {};
    try {
      parsed = JSON.parse(localStorage.getItem(KEY) ?? "{}");
    } catch {
      parsed = {};
    }
    setUserName(parsed.userName ?? "Masindi");
    setTheme(parsed.theme ?? "light");
    setTasks(parsed.tasks ?? sampleTasks());
    setSaved(parsed.saved ?? []);
    setActivity(parsed.activity ?? sampleActivity());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(KEY, JSON.stringify({ userName, theme, tasks, saved, activity }));
  }, [ready, userName, theme, tasks, saved, activity]);

  useEffect(() => {
    if (!ready) return;
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [ready, theme]);

  const logActivity = useCallback((a: Omit<Activity, "id" | "createdAt">) => {
    setActivity((prev) => [{ ...a, id: uid(), createdAt: Date.now() }, ...prev].slice(0, 25));
  }, []);

  const value = useMemo<Store>(
    () => ({
      ready,
      userName,
      setUserName,
      theme,
      toggleTheme: () => setTheme((t) => (t === "light" ? "dark" : "light")),
      tasks,
      addTask: (t) => {
        const task: Task = { ...t, id: uid(), createdAt: Date.now() };
        setTasks((prev) => [task, ...prev]);
        return task;
      },
      addTasks: (list) => {
        const mapped = list.map((t) => ({ ...t, id: uid(), createdAt: Date.now() }));
        setTasks((prev) => [...mapped, ...prev]);
      },
      updateTask: (id, patch) =>
        setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t))),
      deleteTask: (id) => setTasks((prev) => prev.filter((t) => t.id !== id)),
      saved,
      saveItem: (item) =>
        setSaved((prev) => [{ ...item, id: uid(), createdAt: Date.now() }, ...prev]),
      updateSaved: (id, patch) =>
        setSaved((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s))),
      deleteSaved: (id) => setSaved((prev) => prev.filter((s) => s.id !== id)),
      activity,
      logActivity,
      emailSeed,
      setEmailSeed,
    }),
    [ready, userName, theme, tasks, saved, activity, emailSeed, logActivity],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}

export function isToday(dateStr: string) {
  return dateStr === new Date().toISOString().slice(0, 10);
}

export function daysUntil(dateStr: string) {
  if (!dateStr) return Infinity;
  const d = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / 86400000);
}

export function timeAgo(ts: number) {
  const mins = Math.round((Date.now() - ts) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  return `${Math.round(hours / 24)} d ago`;
}
