// Shared Anthropic client for JSON-shaped completions. Used by the AI Store
// Launcher; the older call sites (gumroad description rewrite, newsletter
// ai-draft) can migrate here over time.
//
// claudeJson() guarantees: parsed JSON or a thrown AnthropicError. Retries
// transient failures (429/5xx/network) with backoff, and retries ONCE on
// unparseable output with an explicit "return only JSON" reminder appended.

export class AnthropicError extends Error {
  constructor(message: string, public readonly retryable: boolean) {
    super(message);
    this.name = "AnthropicError";
  }
}

const API_URL = "https://api.anthropic.com/v1/messages";
const MAX_TRANSIENT_RETRIES = 2;

export function stripJsonFences(raw: string): string {
  let s = raw.trim();
  s = s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "");
  // Models occasionally preface with a sentence — recover by slicing to the
  // first { or [ when the head isn't JSON.
  const firstBrace = s.search(/[{[]/);
  if (firstBrace > 0) s = s.slice(firstBrace);
  return s.trim();
}

async function callOnce(params: { prompt: string; model: string; maxTokens: number; apiKey: string }): Promise<string> {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "x-api-key": params.apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: params.model,
      max_tokens: params.maxTokens,
      messages: [{ role: "user", content: params.prompt }],
    }),
  });

  if (!res.ok) {
    const body = await res.text().then((t) => t.slice(0, 300)).catch(() => "");
    const retryable = res.status === 429 || res.status >= 500;
    throw new AnthropicError(`Anthropic ${res.status}: ${body}`, retryable);
  }
  const json = (await res.json()) as any;
  const text = json?.content?.[0]?.text;
  if (typeof text !== "string" || !text) {
    throw new AnthropicError("Anthropic returned an empty completion", true);
  }
  return text;
}

export async function claudeJson<T = unknown>(params: {
  prompt: string;
  maxTokens?: number;
  model?: string;
}): Promise<T> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new AnthropicError("ANTHROPIC_API_KEY is not configured", false);

  const model = params.model || process.env.AI_LAUNCHER_MODEL || "claude-sonnet-4-6";
  const maxTokens = params.maxTokens ?? 2048;

  let prompt = params.prompt;
  let parseRetried = false;

  for (let attempt = 0; ; attempt++) {
    let text: string;
    try {
      text = await callOnce({ prompt, model, maxTokens, apiKey });
    } catch (err: any) {
      const retryable = err instanceof AnthropicError ? err.retryable : true;
      if (retryable && attempt < MAX_TRANSIENT_RETRIES) {
        await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
        continue;
      }
      throw err;
    }

    try {
      return JSON.parse(stripJsonFences(text)) as T;
    } catch {
      if (!parseRetried) {
        // One repair attempt: same prompt with an explicit format reminder.
        parseRetried = true;
        prompt = `${params.prompt}\n\nIMPORTANT: Your previous response was not valid JSON. Respond with ONLY the JSON object — no prose, no markdown fences.`;
        continue;
      }
      throw new AnthropicError(`Model returned unparseable JSON: ${text.slice(0, 200)}`, false);
    }
  }
}
