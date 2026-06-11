import type { AttachmentMeta } from "./types";

const REMOTE_SRC_RE = /(<(?:img|link|script|iframe|video|audio|source)[^>]+?)(?:(src|href|srcset)=["']https?:\/\/[^"']*["'])/gi;
const REMOTE_BG_RE = /url\(\s*["']?https?:\/\/[^"')]+["']?\s*\)/gi;

/**
 * Entfernt externe Bild-/Asset-Quellen aus HTML, damit beim ersten Render
 * keine Tracking-Pixel etc. geladen werden. cid:-Quellen bleiben erhalten.
 */
export function stripRemote(html: string): string {
  return html
    .replace(REMOTE_SRC_RE, (_m, prefix) => `${prefix}data-blocked="1"`)
    .replace(REMOTE_BG_RE, "none");
}

/**
 * Ersetzt cid:abc123 in src/href Attributen durch eine API-URL,
 * über die das passende Inline-Attachment geladen wird.
 */
export function rewriteCids(
  html: string,
  attachments: AttachmentMeta[],
  buildUrl: (cid: string) => string,
): string {
  if (!attachments.length) return html;
  const knownCids = new Set(
    attachments
      .map((a) => (a.contentId || "").replace(/^<|>$/g, ""))
      .filter(Boolean),
  );
  return html.replace(/cid:([^"'\s>)]+)/gi, (match, raw: string) => {
    const cid = raw.replace(/^<|>$/g, "");
    return knownCids.has(cid) ? buildUrl(cid) : match;
  });
}
