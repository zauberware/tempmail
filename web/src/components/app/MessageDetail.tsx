import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Download, Trash2, Paperclip, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import type { Address } from "@/lib/types";

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
  messageId: string | null;
  onDeleted: () => void;
}

export function MessageDetail({ address, messageId, onDeleted }: Props) {
  const qc = useQueryClient();

  const { data: msg, isLoading } = useQuery({
    queryKey: ["message", address, messageId],
    queryFn: () => api.getMessage(address, messageId!),
    enabled: !!messageId,
  });

  const del = useMutation({
    mutationFn: () => api.deleteMessage(address, messageId!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["messages", address] });
      onDeleted();
    },
  });

  if (!messageId) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center text-muted-foreground">
        <Mail className="size-12 opacity-30" />
        <p className="text-sm">Wähle links eine Mail aus oder warte auf die nächste.</p>
      </div>
    );
  }

  if (isLoading || !msg) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        lade…
      </div>
    );
  }

  const rawUrl = api.rawUrl(address, msg.id);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-3 border-b border-border p-5">
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-semibold">
            {msg.subject || <span className="italic text-muted-foreground">(no subject)</span>}
          </h1>
          <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
            <dt className="text-muted-foreground">Von</dt>
            <dd className="truncate">{addrStr(msg.from)}</dd>
            <dt className="text-muted-foreground">An</dt>
            <dd className="truncate">
              {(msg.to ?? []).map((a) => a.address).join(", ") || (
                <span className="italic text-muted-foreground">(keine Empfänger)</span>
              )}
            </dd>
            <dt className="text-muted-foreground">Empfangen</dt>
            <dd>
              {new Date(msg.received_at).toLocaleString()}{" "}
              <span className="text-muted-foreground">· {bytesFmt(msg.size_bytes)}</span>
            </dd>
          </dl>
        </div>
        <div className="flex gap-2">
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

      <div className="flex-1 overflow-hidden p-5">
        <Tabs defaultValue={msg.html ? "html" : "text"} className="flex h-full flex-col">
          <TabsList>
            {msg.html && <TabsTrigger value="html">HTML</TabsTrigger>}
            <TabsTrigger value="text">Text</TabsTrigger>
            <TabsTrigger value="headers">Headers</TabsTrigger>
          </TabsList>
          {msg.html && (
            <TabsContent
              value="html"
              className="mt-3 flex-1 overflow-hidden rounded-md border border-border bg-white"
            >
              <iframe title="email html" sandbox="" srcDoc={msg.html} className="size-full" />
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
