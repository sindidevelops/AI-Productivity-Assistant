import type { ReactNode } from "react";

function inline(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={i} className="rounded bg-muted px-1 py-0.5 text-[0.85em]">
          {part.slice(1, -1)}
        </code>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

const cells = (row: string) =>
  row
    .trim()
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((c) => c.trim());

export function Markdown({ content }: { content: string }) {
  const lines = content.split("\n");
  const blocks: ReactNode[] = [];
  let list: string[] = [];
  let ordered = false;
  let table: string[] = [];

  const flushList = () => {
    if (!list.length) return;
    const items = list.map((item, i) => (
      <li key={i} className="leading-relaxed">
        {inline(item)}
      </li>
    ));
    blocks.push(
      ordered ? (
        <ol key={blocks.length} className="ml-5 list-decimal space-y-1.5 text-sm text-muted-foreground">
          {items}
        </ol>
      ) : (
        <ul key={blocks.length} className="ml-5 list-disc space-y-1.5 text-sm text-muted-foreground">
          {items}
        </ul>
      ),
    );
    list = [];
  };

  const flushTable = () => {
    if (!table.length) return;
    const rows = table.filter((r) => !/^\|?\s*:?-{2,}/.test(r.replace(/\|/g, "|")));
    const header = rows[0] ? cells(rows[0]) : [];
    const body = rows.slice(1).map(cells);
    blocks.push(
      <div key={blocks.length} className="overflow-x-auto rounded-xl border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/60">
            <tr>
              {header.map((h, i) => (
                <th key={i} className="px-3 py-2 font-semibold text-foreground">
                  {inline(h)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {body.map((r, i) => (
              <tr key={i} className="border-t">
                {r.map((c, j) => (
                  <td key={j} className="px-3 py-2 text-muted-foreground">
                    {inline(c)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>,
    );
    table = [];
  };

  for (const raw of lines) {
    const line = raw.replace(/^```.*$/, "").trimEnd();
    if (line.trim().startsWith("|")) {
      flushList();
      table.push(line);
      continue;
    }
    flushTable();

    if (!line.trim()) {
      flushList();
      continue;
    }
    const heading = line.match(/^(#{1,4})\s+(.*)$/);
    if (heading) {
      flushList();
      const level = heading[1]?.length ?? 2;
      blocks.push(
        <h3
          key={blocks.length}
          className={
            level <= 2
              ? "mt-5 text-sm font-semibold uppercase tracking-wide text-primary first:mt-0"
              : "mt-4 text-sm font-semibold text-foreground"
          }
        >
          {inline(heading[2] ?? "")}
        </h3>,
      );
      continue;
    }
    const bullet = line.match(/^\s*[-*]\s+(.*)$/);
    if (bullet) {
      if (ordered) flushList();
      ordered = false;
      list.push(bullet[1] ?? "");
      continue;
    }
    const num = line.match(/^\s*\d+[.)]\s+(.*)$/);
    if (num) {
      if (!ordered) flushList();
      ordered = true;
      list.push(num[1] ?? "");
      continue;
    }
    flushList();
    blocks.push(
      <p key={blocks.length} className="text-sm leading-relaxed text-muted-foreground">
        {inline(line)}
      </p>,
    );
  }
  flushList();
  flushTable();

  return <div className="space-y-2">{blocks}</div>;
}
