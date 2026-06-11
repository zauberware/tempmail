export interface Inbox {
  address: string;
  owner_token: string;
}

export interface MessageListItem {
  id: string;
  from: string | null;
  from_name: string | null;
  subject: string | null;
  received_at: number;
  size_bytes: number;
  has_attachments: boolean;
  preview: string | null;
}

export interface Address {
  address?: string;
  name?: string;
}

export interface AttachmentMeta {
  filename: string;
  mimeType: string;
  size: number;
  contentId?: string;
  disposition?: string;
}

export interface MessageDetail {
  id: string;
  from: Address | null;
  to: Address[];
  cc: Address[];
  subject: string | null;
  received_at: number;
  size_bytes: number;
  text: string | null;
  html: string | null;
  headers: { key: string; value: string }[];
  attachments: AttachmentMeta[];
}

export interface CreateInboxResponse {
  address: string;
  owner_token: string;
  reused: boolean;
}
