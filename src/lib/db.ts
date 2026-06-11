import type { Env } from "./env";

export interface InboxRow {
  address: string;
  created_at: number;
  last_seen_at: number;
  owner_token: string;
}

export interface MessageRow {
  id: string;
  inbox_address: string;
  from_addr: string | null;
  from_name: string | null;
  subject: string | null;
  received_at: number;
  size_bytes: number;
  has_attachments: number;
  text_preview: string | null;
}

export interface MessageRowWithRaw extends MessageRow {
  raw_eml: ArrayBuffer;
}

export async function getInbox(env: Env, address: string): Promise<InboxRow | null> {
  return await env.DB.prepare(
    `SELECT address, created_at, last_seen_at, owner_token
     FROM inboxes WHERE address = ?`,
  )
    .bind(address.toLowerCase())
    .first<InboxRow>();
}

export async function upsertInbox(env: Env, address: string, token: string): Promise<void> {
  const now = Date.now();
  await env.DB.prepare(
    `INSERT INTO inboxes (address, created_at, last_seen_at, owner_token)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(address) DO UPDATE SET last_seen_at = excluded.last_seen_at`,
  )
    .bind(address.toLowerCase(), now, now, token)
    .run();
}

export async function touchInbox(env: Env, address: string): Promise<void> {
  await env.DB.prepare(`UPDATE inboxes SET last_seen_at = ? WHERE address = ?`)
    .bind(Date.now(), address.toLowerCase())
    .run();
}

export async function listMessages(
  env: Env,
  address: string,
  limit = 50,
  offset = 0,
): Promise<MessageRow[]> {
  const res = await env.DB.prepare(
    `SELECT id, inbox_address, from_addr, from_name, subject,
            received_at, size_bytes, has_attachments, text_preview
     FROM messages
     WHERE inbox_address = ?
     ORDER BY received_at DESC
     LIMIT ? OFFSET ?`,
  )
    .bind(address.toLowerCase(), limit, offset)
    .all<MessageRow>();
  return res.results ?? [];
}

export async function getMessage(
  env: Env,
  address: string,
  id: string,
): Promise<MessageRow | null> {
  return await env.DB.prepare(
    `SELECT id, inbox_address, from_addr, from_name, subject,
            received_at, size_bytes, has_attachments, text_preview
     FROM messages
     WHERE inbox_address = ? AND id = ?`,
  )
    .bind(address.toLowerCase(), id)
    .first<MessageRow>();
}

export async function getMessageWithRaw(
  env: Env,
  address: string,
  id: string,
): Promise<MessageRowWithRaw | null> {
  return await env.DB.prepare(
    `SELECT id, inbox_address, from_addr, from_name, subject,
            received_at, size_bytes, has_attachments, raw_eml, text_preview
     FROM messages
     WHERE inbox_address = ? AND id = ?`,
  )
    .bind(address.toLowerCase(), id)
    .first<MessageRowWithRaw>();
}

export async function deleteMessage(env: Env, address: string, id: string): Promise<boolean> {
  const res = await env.DB.prepare(`DELETE FROM messages WHERE inbox_address = ? AND id = ?`)
    .bind(address.toLowerCase(), id)
    .run();
  return (res.meta?.changes ?? 0) > 0;
}
