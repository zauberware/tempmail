import PostalMime from "postal-mime";
import { ulid } from "ulid";
import type { Env } from "./lib/env";
import { isPoolDomain } from "./lib/env";
import { randomToken } from "./lib/random";

const MAX_EML_BYTES = 950 * 1024; // D1 Row-Limit ~1MB, Sicherheitsmarge

type AttachmentContent = string | ArrayBuffer | Uint8Array | undefined;

// postal-mime liefert attachment.content je nach Build entweder als
// Uint8Array, ArrayBuffer ODER als base64-kodierten String (für binary
// content in manchen Konfigurationen). Wir muessen alle drei Faelle
// korrekt nach reinem Bytes-ArrayBuffer dekodieren — sonst landen bei
// PDFs/Bildern die ASCII-Bytes des base64-Strings in D1 und der Download
// laesst sich nicht oeffnen.
function attachmentBytes(content: AttachmentContent): ArrayBuffer {
  if (!content) return new ArrayBuffer(0);
  if (typeof content === "string") {
    try {
      const bin = atob(content);
      const u8 = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
      return u8.buffer;
    } catch {
      const u8 = new TextEncoder().encode(content);
      return u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength) as ArrayBuffer;
    }
  }
  if (content instanceof ArrayBuffer) return content;
  return content.buffer.slice(
    content.byteOffset,
    content.byteOffset + content.byteLength,
  ) as ArrayBuffer;
}

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
    const text = parsed.text ?? null;
    const html = parsed.html ?? null;
    const preview = (text ?? "").trim().slice(0, 500);
    const parsedAttachments = (parsed.attachments ?? []).map((a, idx) => {
      const t =
        a.content == null
          ? "null"
          : typeof a.content === "string"
            ? "string"
            : a.content instanceof ArrayBuffer
              ? "ArrayBuffer"
              : "Uint8Array";
      const inLen =
        a.content == null
          ? 0
          : typeof a.content === "string"
            ? a.content.length
            : (a.content as ArrayBuffer | Uint8Array).byteLength;
      const bytes = attachmentBytes(a.content);
      console.log(
        `attachment #${idx} ${a.filename} type=${t} in=${inLen} out=${bytes.byteLength}`,
      );
      return {
        idx,
        filename: a.filename ?? `attachment-${idx}`,
        mimeType: a.mimeType ?? "application/octet-stream",
        contentId: (a.contentId ?? "").replace(/^<|>$/g, "") || null,
        disposition: a.disposition ?? null,
        size: bytes.byteLength,
        bytes,
      };
    });
    const attachmentsMeta = parsedAttachments.map(
      ({ filename, mimeType, contentId, disposition, size }) => ({
        filename,
        mimeType,
        contentId,
        disposition,
        size,
      }),
    );
    const hasAttachments = attachmentsMeta.length > 0 ? 1 : 0;
    const toJson = JSON.stringify(parsed.to ?? []);
    const ccJson = JSON.stringify(parsed.cc ?? []);
    const headersJson = JSON.stringify(parsed.headers ?? []);
    const attachmentsMetaJson = JSON.stringify(attachmentsMeta);

    const stmts = [
      env.DB.prepare(
        `INSERT INTO inboxes (address, created_at, last_seen_at, owner_token)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(address) DO UPDATE SET last_seen_at = excluded.last_seen_at`,
      ).bind(to, now, now, randomToken()),
      env.DB.prepare(
        `INSERT INTO messages
           (id, inbox_address, from_addr, from_name, subject,
            received_at, size_bytes, has_attachments, raw_eml, text_preview,
            text_body, html_body, to_json, cc_json, headers_json, attachments_meta_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).bind(
        id,
        to,
        fromAddr,
        fromName,
        subject,
        now,
        originalSize,
        hasAttachments,
        raw,
        preview,
        text,
        html,
        toJson,
        ccJson,
        headersJson,
        attachmentsMetaJson,
      ),
    ];

    for (const a of parsedAttachments) {
      stmts.push(
        env.DB.prepare(
          `INSERT INTO attachments
             (message_id, idx, filename, mime_type, content_id, disposition, size_bytes, content)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        ).bind(id, a.idx, a.filename, a.mimeType, a.contentId, a.disposition, a.size, a.bytes),
      );
    }

    await env.DB.batch(stmts);
  },
} satisfies ExportedHandler<Env>;
