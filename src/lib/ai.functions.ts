import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const MessageSchema = z.object({
  role: z.enum(["system", "user", "assistant"]),
  content: z.string(),
});

const AiInput = z.object({
  messages: z.array(MessageSchema).min(1),
});

export type AiMessage = z.infer<typeof MessageSchema>;

export const runAi = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => AiInput.parse(input))
  .handler(async ({ data }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) {
      return { ok: false as const, error: "AI is not configured yet. Please try again later." };
    }

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "google/gemini-3.8-flash",
        messages: data.messages,
      }),
    });

    if (!res.ok) {
      const status = res.status;
      let message = "Something went wrong while generating your response. Please try again.";
      if (status === 429) message = "The assistant is busy right now. Please wait a moment and try again.";
      if (status === 402) message = "AI credits have run out for this workspace. Please add more credits to continue.";
      if (status === 403) message = "AI access is currently blocked for this workspace.";
      return { ok: false as const, error: message };
    }

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = json.choices?.[0]?.message?.content?.trim();
    if (!text) {
      return { ok: false as const, error: "The assistant returned an empty response. Please try again." };
    }
    return { ok: true as const, text };
  });
