import { Hono } from "hono";
import type { Env } from "./lib/env";
import { isPoolDomain, poolDomains } from "./lib/env";
import { basicAuth } from "./lib/auth";
import { randomSlug, randomToken } from "./lib/random";
import {
  deleteMessage,
  getAttachmentByCid,
  getAttachmentByFilename,
  getInbox,
  getMessageDetail,
  getMessageWithRaw,
  listMessages,
  messageBelongsToInbox,
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

function base64ToBytes(b64: string | null): Uint8Array {
  if (!b64) return new Uint8Array(0);
  const bin = atob(b64);
  const u8 = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  return u8;
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
  if (!(await messageBelongsToInbox(c.env, address, id))) {
    return c.json({ error: "not_found" }, 404);
  }
  const att = await getAttachmentByFilename(c.env, id, name);
  if (!att) return c.json({ error: "attachment_not_found" }, 404);
  return new Response(base64ToBytes(att.content_b64), {
    headers: {
      "Content-Type": att.mime_type || "application/octet-stream",
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

// Inline image by Content-ID (e.g. cid:abc123 references inside HTML mails).
app.get("/api/inboxes/:address/messages/:id/cid/:cid", async (c) => {
  const address = c.req.param("address").toLowerCase();
  const id = c.req.param("id");
  const wanted = c.req.param("cid").replace(/^<|>$/g, "");
  if (!(await messageBelongsToInbox(c.env, address, id))) {
    return c.json({ error: "not_found" }, 404);
  }
  const att = await getAttachmentByCid(c.env, id, wanted);
  if (!att) return c.json({ error: "cid_not_found" }, 404);
  return new Response(base64ToBytes(att.content_b64), {
    headers: {
      "Content-Type": att.mime_type || "application/octet-stream",
      "Cache-Control": "private, max-age=3600",
    },
  });
});

// Delete all messages in an inbox ("empty inbox").
app.delete("/api/inboxes/:address/messages", async (c) => {
  const address = c.req.param("address").toLowerCase();
  const res = await c.env.DB.prepare(`DELETE FROM messages WHERE inbox_address = ?`)
    .bind(address)
    .run();
  return c.json({ ok: true, deleted: res.meta?.changes ?? 0 });
});

// Anything that's not API/health falls through to the static assets (the React SPA).
// Basic Auth still applies because the middleware ran before we get here.
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
