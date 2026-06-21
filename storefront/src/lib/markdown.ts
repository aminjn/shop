/** Minimal, safe Markdown → HTML for article bodies (headings, bold, italic,
 *  lists, paragraphs). Input is escaped first so it's safe to dangerouslySet. */
export function renderMarkdown(src: string): string {
  const esc = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  const inline = (s: string) =>
    esc(s)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/(^|[^*])\*(?!\s)(.+?)\*(?!\*)/g, "$1<em>$2</em>")
      .replace(/`(.+?)`/g, "<code>$1</code>");

  const blocks = src.replace(/\r/g, "").split(/\n{2,}/);
  const html: string[] = [];

  for (const block of blocks) {
    const lines = block.split("\n").filter((l) => l.trim() !== "");
    if (lines.length === 0) continue;

    // headings
    const h = lines[0].match(/^(#{1,4})\s+(.*)$/);
    if (h && lines.length === 1) {
      const level = h[1].length + 1; // ## -> h3-ish visually
      html.push(`<h${Math.min(level, 4)}>${inline(h[2])}</h${Math.min(level, 4)}>`);
      continue;
    }
    // unordered list
    if (lines.every((l) => /^\s*[-*]\s+/.test(l))) {
      html.push("<ul>" + lines.map((l) => `<li>${inline(l.replace(/^\s*[-*]\s+/, ""))}</li>`).join("") + "</ul>");
      continue;
    }
    // ordered list
    if (lines.every((l) => /^\s*\d+[.)]\s+/.test(l))) {
      html.push("<ol>" + lines.map((l) => `<li>${inline(l.replace(/^\s*\d+[.)]\s+/, ""))}</li>`).join("") + "</ol>");
      continue;
    }
    // paragraph (join soft line breaks with <br>)
    html.push(`<p>${lines.map(inline).join("<br>")}</p>`);
  }
  return html.join("\n");
}
