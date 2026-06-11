import PostalMime from "postal-mime";
import { ulid } from "ulid";
import type { Env } from "./lib/env";
import { isPoolDomain } from "./lib/env";
import { randomToken } from "./lib/random";

const MAX_EML_BYTES = 950 * 1024; // D1 Row-Limit ~1MB, Sicherheitsmarge

async function readableToBuffer(stream: ReadableStream<Uint8Array>): Promise<ArrayBuffer> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    total += value.byteLength;
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.byteLength;
  }
  return out.buffer;
}

export default {
  async email(message: ForwardableEmailMessage, env: Env, _ctx: ExecutionContext): Promise<void> {
    const to = message.to.toLowerCase();
    const at = to.lastIndexOf("@");
    if (at < 0) {
      message.setReject("invalid recipient");
      return;
    }
    const domain = to.slice(at + 1);
    if (!isPoolDomain(env, domain)) {
      message.setReject("domain not in pool");
      return;
    }

    const id = ulid();
    const now = Date.now();

    let raw = await readableToBuffer(message.raw);
    const originalSize = raw.byteLength;
    if (raw.byteLength > MAX_EML_BYTES) {
      raw = raw.slice(0, MAX_EML_BYTES);
    }

    const parsed = await PostalMime.parse(raw);
    const fromAddr = parsed.from?.address ?? message.from;
    const fromName = parsed.from?.name ?? null;
    const subject = parsed.subject ?? null;
    const preview = (parsed.text ?? "").trim().slice(0, 500);
    const hasAttachments = (parsed.attachments?.length ?? 0) > 0 ? 1 : 0;

    await env.DB.batch([
      env.DB.prepare(
        `INSERT INTO inboxes (address, created_at, last_seen_at, owner_token)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(address) DO UPDATE SET last_seen_at = excluded.last_seen_at`,
      ).bind(to, now, now, randomToken()),
      env.DB.prepare(
        `INSERT INTO messages
           (id, inbox_address, from_addr, from_name, subject,
            received_at, size_bytes, has_attachments, raw_eml, text_preview)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).bind(id, to, fromAddr, fromName, subject, now, originalSize, hasAttachments, raw, preview),
    ]);
  },
} satisfies ExportedHandler<Env>;
