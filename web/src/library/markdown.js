// Markdown rendering for chapter READMEs and vault notes (ported from the old app).
//
// - marked is loaded eagerly (small, sync parser)
// - mermaid is lazy-loaded only when a mermaid fence is encountered
// - highlight.js is lazy-loaded only when a code fence with a language is found
// - wikilinks ([[Target]] / [[Target|Label]]) become clickable spans;
//   the Library resolves them via the title index.
//
// renderMarkdown is for our own repo files (READMEs, vault notes) and does NOT
// sanitize: marked passes raw HTML, javascript: links and remote images through.
// Text from anywhere else, such as an AI model's reply, must go through
// renderMarkdownUntrusted instead.
//
// Use:
//   container.innerHTML = renderMarkdown(rawMd);
//   await postProcess(container, theme);   // theme: "light" | "dusk"

import { marked, Marked } from "marked";

let mermaidPromise = null;
let hljsPromise = null;
let hljsCssLoaded = false;

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (ch) => {
    switch (ch) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return ch;
    }
  });
}

const wikilinkExtension = {
  name: "wikilink",
  level: "inline",
  start(src) {
    const i = src.indexOf("[[");
    return i === -1 ? undefined : i;
  },
  tokenizer(src) {
    const match = src.match(/^\[\[([^\]|#\n]+)(?:[#|]([^\]\n]*))?\]\]/);
    if (!match) return undefined;
    const target = match[1].trim();
    const label = (match[2] || target).trim();
    return { type: "wikilink", raw: match[0], target, label };
  },
  renderer(token) {
    return `<a href="#" class="wikilink" data-target="${escapeHtml(token.target)}">${escapeHtml(token.label)}</a>`;
  },
};

let configured = false;
function configure() {
  if (configured) return;
  configured = true;
  marked.use({ gfm: true, breaks: false, extensions: [wikilinkExtension] });
}

export function renderMarkdown(md) {
  configure();
  if (!md) return "";
  return marked.parse(md);
}

// Markdown from a source we do not control. Raw HTML is shown as text, images are dropped
// (a remote image URL can leak data), and links keep only http(s), mailto and in-page targets.
const SAFE_HREF = /^(https?:|mailto:|#)/i;
let untrustedParser = null;

export function renderMarkdownUntrusted(md) {
  if (!md) return "";
  untrustedParser ??= new Marked({
    gfm: true,
    breaks: false,
    renderer: {
      html: ({ text }) => escapeHtml(text),
      image: ({ text }) => escapeHtml(text),
      link({ href, title, tokens }) {
        const label = this.parser.parseInline(tokens);
        if (!SAFE_HREF.test(href)) return label;
        const t = title ? ` title="${escapeHtml(title)}"` : "";
        return `<a href="${escapeHtml(href)}"${t} target="_blank" rel="noopener noreferrer">${label}</a>`;
      },
    },
  });
  return untrustedParser.parse(md);
}

export async function postProcess(container, theme = "light") {
  if (!container) return;
  await Promise.all([processMermaid(container, theme), processHighlight(container)]);
}

async function processMermaid(container, theme) {
  const blocks = container.querySelectorAll("pre code.language-mermaid");
  if (!blocks.length) return;

  if (!mermaidPromise) mermaidPromise = import("mermaid").then((m) => m.default);
  const mermaid = await mermaidPromise;

  // Re-initialized on every call: the same page can be re-rendered after a theme switch.
  mermaid.initialize({
    startOnLoad: false,
    theme: theme === "dusk" || theme === "dark" ? "dark" : "default",
    securityLevel: "strict",
    fontFamily: "Geist, system-ui, sans-serif",
  });

  const nodes = [];
  blocks.forEach((codeEl, i) => {
    const pre = codeEl.parentElement;
    if (!pre) return;
    const div = document.createElement("div");
    div.className = "mermaid";
    div.id = `mmd-${Date.now().toString(36)}-${i}`;
    div.textContent = codeEl.textContent || "";
    pre.replaceWith(div);
    nodes.push(div);
  });

  try {
    await mermaid.run({ nodes, suppressErrors: true });
  } catch (err) {
    console.warn("mermaid render error", err);
  }
}

async function processHighlight(container) {
  const blocks = container.querySelectorAll('pre code[class*="language-"]:not(.language-mermaid)');
  if (!blocks.length) return;

  if (!hljsPromise) hljsPromise = import("highlight.js/lib/common").then((m) => m.default);
  const hljs = await hljsPromise;

  if (!hljsCssLoaded) {
    hljsCssLoaded = true;
    await import("highlight.js/styles/github-dark.css");
  }

  blocks.forEach((block) => {
    if (block.dataset.highlighted === "yes") return;
    try {
      hljs.highlightElement(block);
    } catch (err) {
      console.warn("hljs error", err);
    }
  });
}
