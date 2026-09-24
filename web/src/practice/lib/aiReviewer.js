const STORAGE_KEY = "hld-ai-reviewer";

const PROVIDERS = [
  { id: "anthropic", label: "Anthropic (Claude)", baseUrl: "https://api.anthropic.com" },
  { id: "openai", label: "OpenAI (GPT)", baseUrl: "https://api.openai.com" },
  { id: "grok", label: "xAI (Grok)", baseUrl: "https://api.x.ai" },
  { id: "custom", label: "Custom (OpenAI-compatible)", baseUrl: "" },
];

const DEFAULT_MODELS = {
  anthropic: "claude-sonnet-4-20250514",
  openai: "gpt-4o",
  grok: "grok-3",
  custom: "gpt-4o",
};

export { PROVIDERS, DEFAULT_MODELS };

export function getStoredConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

export function storeConfig(config) {
  try {
    if (config) localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    else localStorage.removeItem(STORAGE_KEY);
  } catch { /* ignore */ }
}

const SYSTEM = `You are a principal engineer reviewing a system-design exercise.
The user designed against stated constraints. Review like a calibrated architect:
- Judge every component against the constraints, not against fashion.
- Name concrete failure modes the design misses (timeout/retry/breaker/backup).
- Praise precisely what is right; no generic encouragement.
- Speak in trade-offs. Reference real outage patterns where relevant.
Respond in markdown with exactly these sections:
## Verdict (2 sentences)
## What holds up
## What breaks
## The one change with the highest leverage`;

function buildBrief({ constraints, components, entities, api, deepDive }) {
  return [
    `Constraints: ${JSON.stringify(constraints)}`,
    `Components: ${components.map((c) => `${c.name}: ${c.justification}`).join(" | ")}`,
    entities ? `Entities: ${entities}` : null,
    api ? `API: ${api}` : null,
    deepDive?.failure ? `Failure walkthrough: ${deepDive.failure}` : null,
    deepDive?.scale ? `Scale answer: ${deepDive.scale}` : null,
  ].filter(Boolean).join("\n\n");
}

async function callAnthropic(config, brief) {
  const res = await fetch(`${config.baseUrl || "https://api.anthropic.com"}/v1/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": config.key,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: config.model || DEFAULT_MODELS.anthropic,
      max_tokens: 2000,
      system: SYSTEM,
      messages: [{ role: "user", content: brief }],
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Anthropic API error ${res.status}`);
  }
  const data = await res.json();
  return data.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");
}

async function callOpenAICompatible(config, brief, defaultBase) {
  const base = config.baseUrl || defaultBase;
  const res = await fetch(`${base}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${config.key}`,
    },
    body: JSON.stringify({
      model: config.model || DEFAULT_MODELS[config.provider] || "gpt-4o",
      max_tokens: 2000,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: brief },
      ],
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `API error ${res.status}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

export async function reviewDesign(drill) {
  const config = getStoredConfig();
  if (!config?.key) throw new Error("No API key configured.");

  const brief = buildBrief(drill);

  switch (config.provider) {
    case "anthropic":
      return callAnthropic(config, brief);
    case "openai":
      return callOpenAICompatible(config, brief, "https://api.openai.com");
    case "grok":
      return callOpenAICompatible(config, brief, "https://api.x.ai");
    case "custom":
      if (!config.baseUrl) throw new Error("Custom provider needs a base URL.");
      // The key travels in a header, so refuse plain http except for a model on this machine.
      if (!/^(https:\/\/|http:\/\/(localhost|127\.0\.0\.1)(:|\/|$))/i.test(config.baseUrl)) {
        throw new Error("Custom base URL must start with https:// (http:// is allowed only for localhost).");
      }
      return callOpenAICompatible(config, brief, config.baseUrl);
    default:
      throw new Error(`Unknown provider: ${config.provider}`);
  }
}
