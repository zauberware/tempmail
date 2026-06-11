import { Paperclip, Inbox } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n-context";
import type { MessageListItem } from "@/lib/types";
import { Avatar } from "./Avatar";

interface Props {
  address: string;
  messages: MessageListItem[];
  activeId: string | null;
  onSelect: (id: string) => void;
  isLoading: boolean;
}

function fmtTime(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const sameDay = d.toDateString() === now.toDateString();
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  if (sameDay) return time;
  const sameYear = d.getFullYear() === now.getFullYear();
  const date = sameYear
    ? `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.`
    : `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear() % 100}`;
  return date;
}

function ListSkeleton() {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-3 px-4 py-3">
          <Skeleton className="size-9 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-10" />
            </div>
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function MessageList({ address, messages, activeId, onSelect, isLoading }: Props) {
  const { t } = useI18n();
  if (isLoading && !messages.length) {
    return <ListSkeleton />;
  }

  if (!messages.length) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center text-muted-foreground">
        <Inbox className="size-10 opacity-50" />
        <div className="text-sm">{t("no_messages_yet")}</div>
        <div className="text-xs">
          {t("address_label")}{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-foreground">
            {address}
          </code>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <ul className="divide-y divide-border">
        {messages.map((m) => {
          const active = m.id === activeId;
          return (
            <li key={m.id}>
              <button
                onClick={() => onSelect(m.id)}
                className={cn(
                  "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors",
                  "hover:bg-accent/60",
                  active && "border-l-2 border-primary bg-accent pl-[14px] text-accent-foreground",
                )}
              >
                <Avatar name={m.from_name} email={m.from} />
                <div className="flex min-w-0 flex-1 flex-col gap-1 overflow-hidden">
                  <div className="flex min-w-0 items-baseline justify-between gap-2">
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                      {m.from_name || m.from || "(unknown)"}
                    </span>
                    <span className="shrink-0 whitespace-nowrap text-xs tabular-nums text-muted-foreground">
                      {fmtTime(m.received_at)}
                    </span>
                  </div>
                  <div className="flex min-w-0 items-center gap-1">
                    {m.has_attachments && (
                      <Paperclip className="size-3 shrink-0 text-muted-foreground" />
                    )}
                    <span className="min-w-0 flex-1 truncate text-sm">
                      {m.subject || (
                        <span className="italic text-muted-foreground">{t("no_subject")}</span>
                      )}
                    </span>
                  </div>
                  {m.preview && (
                    <p className="line-clamp-1 min-w-0 text-xs text-muted-foreground">
                      {m.preview}
                    </p>
                  )}
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </ScrollArea>
  );
}
