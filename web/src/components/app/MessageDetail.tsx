import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Download, Trash2, Paperclip, Image as ImageIcon, ImageOff, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { rewriteCids, stripRemote } from "@/lib/html";
import type { Address } from "@/lib/types";
import { Avatar } from "./Avatar";

function addrStr(a: Address | null | undefined): string {
  if (!a) return "(unknown)";
  return a.name ? `${a.name} <${a.address ?? ""}>` : (a.address ?? "(unknown)");
}

function bytesFmt(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
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
      <div className="border-b border-border p-5">
        <Skeleton className="mb-3 h-6 w-2/3" />
        <Skeleton className="mb-2 h-3 w-1/3" />
        <Skeleton className="mb-2 h-3 w-1/2" />
        <Skeleton className="h-3 w-1/4" />
      </div>
      <div className="space-y-3 p-5">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
        <Skeleton className="h-3 w-4/6" />
        <Skeleton className="h-3 w-3/6" />
      </div>
    </div>
  );
}

export function MessageDetail({ address, messageId, onDeleted, onBack }: Props) {
  const qc = useQueryClient();
  const [loadRemote, setLoadRemote] = useState(false);

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

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-3 border-b border-border p-4 sm:p-5">
        <div className="flex min-w-0 flex-1 gap-3">
          {onBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              aria-label="Zurück zur Liste"
              className="shrink-0"
            >
              <ArrowLeft />
            </Button>
          )}
          <Avatar name={msg.from?.name} email={msg.from?.address} size="md" />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-semibold">
              {msg.subject || <span className="italic text-muted-foreground">(no subject)</span>}
            </h1>
            <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
              <dt className="text-muted-foreground">Von</dt>
              <dd className="truncate">{addrStr(msg.from)}</dd>
              <dt className="text-muted-foreground">An</dt>
              <dd className="truncate">{(msg.to ?? []).map((a) => a.address).join(", ")}</dd>
              <dt className="text-muted-foreground">Empfangen</dt>
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
              if (confirm("Mail wirklich löschen?")) del.mutate();
            }}
            disabled={del.isPending}
          >
            <Trash2 /> Löschen
          </Button>
        </div>
      </div>

      {(msg.attachments ?? []).length > 0 && (
        <div className="flex flex-wrap gap-2 border-b border-border px-5 py-3">
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

      <div className="flex flex-1 flex-col overflow-hidden p-5">
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
              >
                {loadRemote ? <ImageOff className="size-3" /> : <ImageIcon className="size-3" />}
                {loadRemote ? "Externe Inhalte blockieren" : "Externe Bilder/Stylesheets laden"}
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
                {msg.text || "(kein Textteil)"}
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
