/** Minimal, safe Markdown → HTML for article bodies: headings, bold, italic,
 *  inline code, links, images, blockquotes, ordered/unordered lists,
 *  paragraphs. Input is escaped first so it's safe to dangerouslySet. */

function safeUrl(u: string): string {
  const s = u.trim();
  if (/^(https?:\/\/|\/|data:image\/)/i.test(s)) return s.replace(/"/g, "%22");
  return "#";
}

const FRAME = 'style="width:100%;aspect-ratio:16/9;border:0;border-radius:12px;margin:10px 0" allowfullscreen loading="lazy"';
function videoEmbed(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{6,})/);
  if (yt) return `<iframe src="https://www.youtube.com/embed/${yt[1]}" ${FRAME}></iframe>`;
  const ap = url.match(/aparat\.com\/v\/([\w-]+)/);
  if (ap) return `<iframe src="https://www.aparat.com/video/video/embed/videohash/${ap[1]}/vt/frame" ${FRAME}></iframe>`;
  if (/^https?:\/\/[^\s"]+\.(mp4|webm|ogg)(\?|$)/i.test(url))
    return `<video src="${safeUrl(url)}" controls style="width:100%;border-radius:12px;margin:10px 0"></video>`;
  if (/^https?:\/\//i.test(url)) return `<iframe src="${safeUrl(url)}" ${FRAME}></iframe>`;
  return null;
}

export function renderMarkdown(src: string): string {
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const inline = (s: string) => {
    let out = esc(s);
    // images: ![alt](url)
    out = out.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_m, alt, url) =>
      `<img src="${safeUrl(url)}" alt="${alt}" style="max-width:100%;border-radius:12px;margin:8px 0" />`);
    // links: [text](url)
    out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, text, url) =>
      `<a href="${safeUrl(url)}" target="_blank" rel="noreferrer" style="color:var(--accent);text-decoration:underline">${text}</a>`);
    out = out
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/(^|[^*])\*(?!\s)(.+?)\*(?!\*)/g, "$1<em>$2</em>")
      .replace(/`(.+?)`/g, "<code>$1</code>");
    return out;
  };

  const blocks = src.replace(/\r/g, "").split(/\n{2,}/);
  const html: string[] = [];

  for (const block of blocks) {
    const lines = block.split("\n").filter((l) => l.trim() !== "");
    if (lines.length === 0) continue;

    const h = lines[0].match(/^(#{1,4})\s+(.*)$/);
    if (h && lines.length === 1) {
      const level = Math.min(h[1].length + 1, 4);
      html.push(`<h${level}>${inline(h[2])}</h${level}>`);
      continue;
    }
    if (lines.every((l) => /^\s*>\s?/.test(l))) {
      html.push(`<blockquote style="border-inline-start:3px solid var(--accent);padding-inline-start:12px;color:var(--muted);margin:8px 0">${lines.map((l) => inline(l.replace(/^\s*>\s?/, ""))).join("<br>")}</blockquote>`);
      continue;
    }
    if (lines.every((l) => /^\s*[-*]\s+/.test(l))) {
      html.push("<ul>" + lines.map((l) => `<li>${inline(l.replace(/^\s*[-*]\s+/, ""))}</li>`).join("") + "</ul>");
      continue;
    }
    if (lines.every((l) => /^\s*\d+[.)]\s+/.test(l))) {
      html.push("<ol>" + lines.map((l) => `<li>${inline(l.replace(/^\s*\d+[.)]\s+/, ""))}</li>`).join("") + "</ol>");
      continue;
    }
    // a lone image line → render without <p> wrapper
    if (lines.length === 1 && /^!\[[^\]]*\]\([^)]+\)$/.test(lines[0].trim())) {
      html.push(inline(lines[0]));
      continue;
    }
    // video embed: @video(url) — YouTube, Aparat, or direct mp4
    const vm = lines.length === 1 && lines[0].trim().match(/^@video\(([^)]+)\)$/);
    if (vm) {
      const v = videoEmbed(vm[1].trim());
      if (v) { html.push(v); continue; }
    }
    html.push(`<p>${lines.map(inline).join("<br>")}</p>`);
  }
  return html.join("\n");
}
