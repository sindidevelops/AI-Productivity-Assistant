import { useCallback, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { runAi, type AiMessage } from "./ai.functions";

export function useAi() {
  const call = useServerFn(runAi);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(
    async (messages: AiMessage[]): Promise<string | null> => {
      setLoading(true);
      setError(null);
      try {
        const result = await call({ data: { messages } });
        if (!result.ok) {
          setError(result.error);
          return null;
        }
        return result.text;
      } catch {
        setError("Something went wrong while generating your response. Please try again.");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [call],
  );

  return { generate, loading, error, setError };
}

export function parseJsonList<T>(raw: string): T[] {
  const cleaned = raw
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");
  if (start === -1 || end === -1) return [];
  try {
    const parsed = JSON.parse(cleaned.slice(start, end + 1));
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

export function sectionFrom(markdown: string, heading: string) {
  const lines = markdown.split("\n");
  const idx = lines.findIndex((l) => l.replace(/#/g, "").trim().toLowerCase() === heading.toLowerCase());
  if (idx === -1) return "";
  const out: string[] = [];
  for (let i = idx + 1; i < lines.length; i++) {
    const line = lines[i] ?? "";
    if (/^#{1,3}\s/.test(line)) break;
    out.push(line);
  }
  return out.join("\n").trim();
}
