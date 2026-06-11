import { Hono } from "hono";
import PostalMime from "postal-mime";
import type { Env } from "./lib/env";
import { isPoolDomain, poolDomains } from "./lib/env";
import { basicAuth } from "./lib/auth";
import { randomSlug, randomToken } from "./lib/random";
import {
  deleteMessage,
  getInbox,
  getMessageDetail,
  getMessageWithRaw,
  listMessages,
  touchInbox,
  upsertInbox,
} from "./lib/db";

const app = new Hono<{ Bindings: Env }>();

app.get("/health", (c) => c.text("ok"));

app.use("*", basicAuth);

app.get("/api/pool", (c) => c.json({ domains: poolDomains(c.env) }));

app.post("/api/inboxes", async (c) => {
  const body = await c.req
    .json<{ local?: string; domain?: string }>()
    .catch(() => ({}) as { local?: string; domain?: string });
  const pool = poolDomains(c.env);
  if (pool.length === 0) return c.json({ error: "no_pool_domains" }, 500);

  const domain = (body.domain ?? pool[0]!).toLowerCase();
  if (!isPoolDomain(c.env, domain)) {
    return c.json({ error: "domain_not_in_pool", domain }, 400);
  }

  const local = (body.local ?? randomSlug()).toLowerCase();
  if (!/^[a-z0-9](?:[a-z0-9._+-]{0,62}[a-z0-9])?$/.test(local)) {
    return c.json({ error: "invalid_local_part", local }, 400);
  }

  const address = `${local}@${domain}`;
  const existing = await getInbox(c.env, address);
  if (existing) {
    await touchInbox(c.env, address);
    return c.json({ address, owner_token: existing.owner_token, reused: true });
  }

  const token = randomToken();
  await upsertInbox(c.env, address, token);
  return c.json({ address, owner_token: token, reused: false });
});

app.get("/api/inboxes/:address/messages", async (c) => {
  const address = c.req.param("address").toLowerCase();
  const limit = Math.min(parseInt(c.req.query("limit") ?? "50", 10) || 50, 200);
  const offset = parseInt(c.req.query("offset") ?? "0", 10) || 0;
  await touchInbox(c.env, address);
  const rows = await listMessages(c.env, address, limit, offset);
  return c.json({
    address,
    messages: rows.map((r) => ({
      id: r.id,
      from: r.from_addr,
      from_name: r.from_name,
      subject: r.subject,
      received_at: r.received_at,
      size_bytes: r.size_bytes,
      has_attachments: !!r.has_attachments,
      preview: r.text_preview,
    })),
  });
});

function attachmentBytes(content: string | ArrayBuffer | Uint8Array | undefined): ArrayBuffer {
  if (!content) return new ArrayBuffer(0);
  if (typeof content === "string") {
    const u8 = new TextEncoder().encode(content);
    return u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength) as ArrayBuffer;
  }
  if (content instanceof ArrayBuffer) return content;
  return content.buffer.slice(
    content.byteOffset,
    content.byteOffset + content.byteLength,
  ) as ArrayBuffer;
}

function safeJsonParse<T>(input: string | null, fallback: T): T {
  if (!input) return fallback;
  try {
    return JSON.parse(input) as T;
  } catch {
    return fallback;
  }
}

app.get("/api/inboxes/:address/messages/:id", async (c) => {
  const address = c.req.param("address").toLowerCase();
  const id = c.req.param("id");
  const row = await getMessageDetail(c.env, address, id);
  if (!row) return c.json({ error: "not_found" }, 404);

  const fromObj = row.from_addr ? { address: row.from_addr, name: row.from_name } : null;

  return c.json({
    id: row.id,
    from: fromObj,
    to: safeJsonParse<unknown[]>(row.to_json, []),
    cc: safeJsonParse<unknown[]>(row.cc_json, []),
    subject: row.subject,
    received_at: row.received_at,
    size_bytes: row.size_bytes,
    text: row.text_body,
    html: row.html_body,
    headers: safeJsonParse<unknown[]>(row.headers_json, []),
    attachments: safeJsonParse<unknown[]>(row.attachments_meta_json, []),
  });
});

app.get("/api/inboxes/:address/messages/:id/raw", async (c) => {
  const address = c.req.param("address").toLowerCase();
  const id = c.req.param("id");
  const row = await getMessageWithRaw(c.env, address, id);
  if (!row) return c.json({ error: "not_found" }, 404);
  return new Response(row.raw_eml, {
    headers: {
      "Content-Type": "message/rfc822",
      "Content-Disposition": `attachment; filename="${id}.eml"`,
    },
  });
});

app.get("/api/inboxes/:address/messages/:id/attachments/:name", async (c) => {
  const address = c.req.param("address").toLowerCase();
  const id = c.req.param("id");
  const name = c.req.param("name");
  const row = await getMessageWithRaw(c.env, address, id);
  if (!row) return c.json({ error: "not_found" }, 404);
  const parsed = await PostalMime.parse(row.raw_eml);
  const att = (parsed.attachments ?? []).find((a) => a.filename === name);
  if (!att || !att.content) return c.json({ error: "attachment_not_found" }, 404);
  return new Response(attachmentBytes(att.content), {
    headers: {
      "Content-Type": att.mimeType || "application/octet-stream",
      "Content-Disposition": `attachment; filename="${att.filename}"`,
    },
  });
});

app.delete("/api/inboxes/:address/messages/:id", async (c) => {
  const address = c.req.param("address").toLowerCase();
  const id = c.req.param("id");
  const ok = await deleteMessage(c.env, address, id);
  if (!ok) return c.json({ error: "not_found" }, 404);
  return c.json({ ok: true });
});

// Inline-Bild via Content-ID (z.B. cid:abc123 in HTML-Mails)
app.get("/api/inboxes/:address/messages/:id/cid/:cid", async (c) => {
  const address = c.req.param("address").toLowerCase();
  const id = c.req.param("id");
  const wanted = c.req.param("cid").replace(/^<|>$/g, "");
  const row = await getMessageWithRaw(c.env, address, id);
  if (!row) return c.json({ error: "not_found" }, 404);
  const parsed = await PostalMime.parse(row.raw_eml);
  const att = (parsed.attachments ?? []).find((a) => {
    const cid = (a.contentId || "").replace(/^<|>$/g, "");
    return cid === wanted;
  });
  if (!att || !att.content) return c.json({ error: "cid_not_found" }, 404);
  return new Response(attachmentBytes(att.content), {
    headers: {
      "Content-Type": att.mimeType || "application/octet-stream",
      "Cache-Control": "private, max-age=3600",
    },
  });
});

// Alle Mails einer Inbox löschen ("Postfach leeren")
app.delete("/api/inboxes/:address/messages", async (c) => {
  const address = c.req.param("address").toLowerCase();
  const res = await c.env.DB.prepare(`DELETE FROM messages WHERE inbox_address = ?`)
    .bind(address)
    .run();
  return c.json({ ok: true, deleted: res.meta?.changes ?? 0 });
});

// Alles, was nicht API/Health ist: an die statischen Assets (React SPA) durchreichen.
// Basic Auth gilt weiterhin, weil die Middleware vorher läuft.
app.all("*", (c) => c.env.ASSETS.fetch(c.req.raw));

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MESSAGE_TTL_MS = 7 * MS_PER_DAY;
const INBOX_TTL_MS = 30 * MS_PER_DAY;

async function cleanup(env: Env): Promise<{ messages: number; inboxes: number }> {
  const now = Date.now();
  const msgCutoff = now - MESSAGE_TTL_MS;
  const inboxCutoff = now - INBOX_TTL_MS;

  const deletedMessages =
    (await env.DB.prepare(`DELETE FROM messages WHERE received_at < ?`).bind(msgCutoff).run()).meta
      ?.changes ?? 0;

  const deadInboxes = await env.DB.prepare(
    `SELECT address FROM inboxes WHERE last_seen_at < ? LIMIT 1000`,
  )
    .bind(inboxCutoff)
    .all<{ address: string }>();

  let deletedInboxes = 0;
  for (const row of deadInboxes.results ?? []) {
    const remaining = await env.DB.prepare(
      `SELECT COUNT(*) AS c FROM messages WHERE inbox_address = ?`,
    )
      .bind(row.address)
      .first<{ c: number }>();
    if ((remaining?.c ?? 0) > 0) continue;
    await env.DB.prepare(`DELETE FROM inboxes WHERE address = ?`).bind(row.address).run();
    deletedInboxes++;
  }

  return { messages: deletedMessages, inboxes: deletedInboxes };
}

export default {
  fetch: app.fetch,
  async scheduled(_event: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(
      cleanup(env).then((res) =>
        console.log(`cleanup: messages=${res.messages} inboxes=${res.inboxes}`),
      ),
    );
  },
} satisfies ExportedHandler<Env>;
