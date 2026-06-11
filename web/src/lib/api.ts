import type { CreateInboxResponse, MessageDetail, MessageListItem } from "./types";

async function jsonFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    let detail = "";
    try {
      detail = JSON.stringify(await res.json());
    } catch {
      detail = await res.text().catch(() => "");
    }
    throw new Error(`HTTP ${res.status}: ${detail || res.statusText}`);
  }
  return (await res.json()) as T;
}

export const api = {
  pool: () => jsonFetch<{ domains: string[] }>("/api/pool"),

  createInbox: (body: { local?: string; domain?: string }) =>
    jsonFetch<CreateInboxResponse>("/api/inboxes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),

  listMessages: (address: string) =>
    jsonFetch<{ address: string; messages: MessageListItem[] }>(
      `/api/inboxes/${encodeURIComponent(address)}/messages`,
    ),

  getMessage: (address: string, id: string) =>
    jsonFetch<MessageDetail>(`/api/inboxes/${encodeURIComponent(address)}/messages/${id}`),

  deleteMessage: (address: string, id: string) =>
    jsonFetch<{ ok: true }>(`/api/inboxes/${encodeURIComponent(address)}/messages/${id}`, {
      method: "DELETE",
    }),

  clearInbox: (address: string) =>
    jsonFetch<{ ok: true; deleted: number }>(
      `/api/inboxes/${encodeURIComponent(address)}/messages`,
      { method: "DELETE" },
    ),

  rawUrl: (address: string, id: string) =>
    `/api/inboxes/${encodeURIComponent(address)}/messages/${id}/raw`,

  attachmentUrl: (address: string, id: string, filename: string) =>
    `/api/inboxes/${encodeURIComponent(address)}/messages/${id}/attachments/${encodeURIComponent(filename)}`,

  cidUrl: (address: string, id: string, cid: string) =>
    `/api/inboxes/${encodeURIComponent(address)}/messages/${id}/cid/${encodeURIComponent(cid)}`,
};
