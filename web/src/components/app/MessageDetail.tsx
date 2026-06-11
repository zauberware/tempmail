import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Download,
  Trash2,
  Paperclip,
  Image as ImageIcon,
  ImageOff,
  ArrowLeft,
  MoreVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { DropdownItem } from "@/components/ui/dropdown-menu";
import { api } from "@/lib/api";
import { rewriteCids, stripRemote } from "@/lib/html";
import { useI18n } from "@/lib/i18n-context";
import { t as tRaw, type Lang } from "@/lib/i18n";
import type { Address } from "@/lib/types";
import { Avatar } from "./Avatar";

function addrStr(a: Address | null | undefined, lang: Lang): string {
  const unknown = tRaw("unknown_sender", lang);
  if (!a) return unknown;
  return a.name ? `${a.name} <${a.address ?? ""}>` : (a.address ?? unknown);
}

function bytesFmt(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function fmtDate(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}. ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface Props {
  address: string;
  messageId: string;
  onDeleted: () => void;
  onBack?: () => void;
}

function DetailSkeleton() {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border p-3 sm:p-5">
        <Skeleton className="mb-3 h-5 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <div className="space-y-3 p-4 sm:p-5">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
        <Skeleton className="h-3 w-4/6" />
      </div>
    </div>
  );
}

export function MessageDetail({ address, messageId, onDeleted, onBack }: Props) {
  const { t, lang } = useI18n();
  const qc = useQueryClient();
  const [loadRemote, setLoadRemote] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const isCompact = !!onBack; // we only pass onBack on mobile

  const { data: msg, isLoading } = useQuery({
    queryKey: ["message", address, messageId],
    queryFn: () => api.getMessage(address, messageId),
  });

  const del = useMutation({
    mutationFn: () => api.deleteMessage(address, messageId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["messages", address] });
      onDeleted();
    },
  });

  const processedHtml = useMemo(() => {
    if (!msg?.html) return "";
    const withCids = rewriteCids(msg.html, msg.attachments, (cid) =>
      api.cidUrl(address, msg.id, cid),
    );
    return loadRemote ? withCids : stripRemote(withCids);
  }, [msg, address, loadRemote]);

  if (isLoading || !msg) {
    return <DetailSkeleton />;
  }

  const rawUrl = api.rawUrl(address, msg.id);
  const hasRemote = !!msg.html && /https?:\/\//.test(msg.html);
  const fromLine = addrStr(msg.from, lang);

  return (
    <div className="flex h-full flex-col">
      {isCompact ? (
        <div className="border-b border-border">
          {/* Row 1: back + subject + actions menu */}
          <div className="flex items-center gap-2 px-2 py-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              aria-label={t("back_to_list")}
              className="shrink-0"
            >
              <ArrowLeft />
            </Button>
            <h1 className="min-w-0 flex-1 truncate text-sm font-semibold">
              {msg.subject || <span className="italic text-muted-foreground">{t("no_subject")}</span>}
            </h1>
            <Popover open={actionsOpen} onOpenChange={setActionsOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" aria-label={t("actions_label")}>
                  <MoreVertical />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-44 p-1">
                <DropdownItem
                  icon={<Download className="size-4" />}
                  onClick={() => {
                    setActionsOpen(false);
                    window.location.href = rawUrl;
                  }}
                >
                  {t("download_eml")}
                </DropdownItem>
                <DropdownItem
                  icon={<Trash2 className="size-4" />}
                  destructive
                  onClick={() => {
                    setActionsOpen(false);
                    if (confirm(t("confirm_delete"))) del.mutate();
                  }}
                  disabled={del.isPending}
                >
                  {t("delete")}
                </DropdownItem>
              </PopoverContent>
            </Popover>
          </div>
          {/* Row 2: avatar + from + meta */}
          <div className="flex items-center gap-2 px-3 pt-1 pb-3 text-xs">
            <Avatar name={msg.from?.name} email={msg.from?.address} />
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium text-foreground">{fromLine}</div>
              <div className="truncate text-muted-foreground">
                {fmtDate(msg.received_at)} · {bytesFmt(msg.size_bytes)}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-start justify-between gap-3 border-b border-border p-4 sm:p-5">
          <div className="flex min-w-0 flex-1 gap-3">
            <Avatar name={msg.from?.name} email={msg.from?.address} size="md" />
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-lg font-semibold">
                {msg.subject || <span className="italic text-muted-foreground">{t("no_subject")}</span>}
              </h1>
              <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                <dt className="text-muted-foreground">{t("from_label")}</dt>
                <dd className="truncate">{fromLine}</dd>
                <dt className="text-muted-foreground">{t("to_label")}</dt>
                <dd className="truncate">{(msg.to ?? []).map((a) => a.address).join(", ")}</dd>
                <dt className="text-muted-foreground">{t("received_label")}</dt>
                <dd>
                  {new Date(msg.received_at).toLocaleString()}{" "}
                  <span className="text-muted-foreground">· {bytesFmt(msg.size_bytes)}</span>
                </dd>
              </dl>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href={rawUrl} download={`${msg.id}.eml`}>
                <Download /> .eml
              </a>
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (confirm(t("confirm_delete"))) del.mutate();
              }}
              disabled={del.isPending}
            >
              <Trash2 /> {t("delete")}
            </Button>
          </div>
        </div>
      )}

      {(msg.attachments ?? []).length > 0 && (
        <div className="flex flex-wrap gap-2 border-b border-border px-3 py-2 sm:px-5 sm:py-3">
          {(msg.attachments ?? []).map((a) => (
            <Badge key={a.filename} variant="outline" asChild>
              <a
                href={api.attachmentUrl(address, msg.id, a.filename)}
                download={a.filename}
                className="gap-1"
              >
                <Paperclip className="size-3" />
                {a.filename}
                <span className="text-muted-foreground">· {bytesFmt(a.size)}</span>
              </a>
            </Badge>
          ))}
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden p-3 sm:p-5">
        <Tabs defaultValue={msg.html ? "html" : "text"} className="flex h-full flex-col">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <TabsList>
              {msg.html && <TabsTrigger value="html">HTML</TabsTrigger>}
              <TabsTrigger value="text">Text</TabsTrigger>
              <TabsTrigger value="headers">Headers</TabsTrigger>
            </TabsList>
            {msg.html && hasRemote && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLoadRemote((v) => !v)}
                className="gap-2 text-xs"
                aria-label={loadRemote ? t("block_external_full") : t("load_external_full")}
              >
                {loadRemote ? <ImageOff className="size-3" /> : <ImageIcon className="size-3" />}
                <span className="hidden sm:inline">
                  {loadRemote ? t("block_external_short") : t("load_external_short")}
                </span>
              </Button>
            )}
          </div>
          {msg.html && (
            <TabsContent
              value="html"
              className="mt-3 flex-1 overflow-hidden rounded-md border border-border bg-white"
            >
              <iframe
                title="email html"
                sandbox="allow-popups allow-popups-to-escape-sandbox"
                srcDoc={processedHtml}
                className="size-full"
              />
            </TabsContent>
          )}
          <TabsContent value="text" className="mt-3 flex-1 overflow-hidden">
            <ScrollArea className="h-full rounded-md border border-border bg-muted/40">
              <pre className="whitespace-pre-wrap break-words p-4 font-mono text-sm">
                {msg.text || t("no_text_part")}
              </pre>
            </ScrollArea>
          </TabsContent>
          <TabsContent value="headers" className="mt-3 flex-1 overflow-hidden">
            <ScrollArea className="h-full rounded-md border border-border bg-muted/40">
              <pre className="whitespace-pre-wrap break-words p-4 font-mono text-xs">
                {(msg.headers || []).map((h) => `${h.key}: ${h.value}`).join("\n")}
              </pre>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
