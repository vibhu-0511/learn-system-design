import { useState } from "react";
import { Bot, Key, Trash2 } from "lucide-react";
import {
  PROVIDERS,
  DEFAULT_MODELS,
  getStoredConfig,
  storeConfig,
  reviewDesign,
} from "../lib/aiReviewer.js";
import { renderMarkdownUntrusted } from "../../library/markdown.js";

export function AiReviewPanel({ drill }) {
  const [config, setConfig] = useState(getStoredConfig);
  const [editProvider, setEditProvider] = useState(config?.provider || "anthropic");
  const [editKey, setEditKey] = useState("");
  const [editModel, setEditModel] = useState(config?.model || "");
  const [editBaseUrl, setEditBaseUrl] = useState(config?.baseUrl || "");
  const [loading, setLoading] = useState(false);
  const [review, setReview] = useState("");
  const [error, setError] = useState("");

  const hasKey = !!config?.key;

  const saveKey = () => {
    if (!editKey.trim()) return;
    const next = {
      provider: editProvider,
      key: editKey.trim(),
      model: editModel.trim() || DEFAULT_MODELS[editProvider] || "",
      baseUrl: editProvider === "custom" ? editBaseUrl.trim() : "",
    };
    storeConfig(next);
    setConfig(next);
    setEditKey("");
    setError("");
  };

  const forgetKey = () => {
    storeConfig(null);
    setConfig(null);
    setReview("");
    setError("");
  };

  const runReview = async () => {
    setLoading(true);
    setError("");
    setReview("");
    try {
      const text = await reviewDesign(drill);
      setReview(text);
    } catch (err) {
      const msg = err.message || "Unknown error";
      if (msg.includes("401") || msg.toLowerCase().includes("auth")) {
        setError("Key rejected — check it below.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const providerInfo = PROVIDERS.find((p) => p.id === (config?.provider || editProvider));

  return (
    <div>
      {!hasKey ? (
        <div className="ai-setup">
          <p className="muted">
            <Key size={13} /> Your key is stored only in this browser's localStorage
            and sent only to the provider's API. Don't enter it on a shared computer.
          </p>

          <div style={{ display: "grid", gap: "var(--space-2)", marginTop: "var(--space-3)" }}>
            <label className="eyebrow">Provider</label>
            <select
              value={editProvider}
              onChange={(e) => {
                setEditProvider(e.target.value);
                setEditModel(DEFAULT_MODELS[e.target.value] || "");
              }}
            >
              {PROVIDERS.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>

            <label className="eyebrow">API key</label>
            <input
              type="password"
              value={editKey}
              onChange={(e) => setEditKey(e.target.value)}
              placeholder={editProvider === "anthropic" ? "sk-ant-..." : editProvider === "grok" ? "xai-..." : "sk-..."}
            />

            <label className="eyebrow">Model (optional)</label>
            <input
              type="text"
              value={editModel}
              onChange={(e) => setEditModel(e.target.value)}
              placeholder={DEFAULT_MODELS[editProvider] || "model-id"}
            />

            {editProvider === "custom" && (
              <>
                <label className="eyebrow">Base URL</label>
                <input
                  type="text"
                  value={editBaseUrl}
                  onChange={(e) => setEditBaseUrl(e.target.value)}
                  placeholder="https://your-api.example.com"
                />
              </>
            )}

            <button className="primary-cta" onClick={saveKey} disabled={!editKey.trim()}>
              Save key
            </button>
          </div>
        </div>
      ) : (
        <div>
          <p className="muted">
            <Bot size={13} /> Using {providerInfo?.label || config.provider} · {config.model || "default model"}
            {" · "}
            <button className="link-button" onClick={forgetKey} style={{ display: "inline" }}>
              <Trash2 size={12} /> Forget key
            </button>
          </p>

          <button
            className="primary-cta"
            onClick={runReview}
            disabled={loading}
            style={{ marginTop: "var(--space-2)" }}
          >
            {loading ? "Reviewing…" : "Run AI review"}
          </button>
        </div>
      )}

      {error && <p className="reader-error" style={{ marginTop: "var(--space-2)" }}>{error}</p>}

      {review && (
        <div
          className="markdown-body"
          style={{ marginTop: "var(--space-3)" }}
          dangerouslySetInnerHTML={{ __html: renderMarkdownUntrusted(review) }}
        />
      )}
    </div>
  );
}
