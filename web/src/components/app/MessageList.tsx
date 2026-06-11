import { Paperclip, Inbox } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { MessageListItem } from "@/lib/types";

interface Props {
  address: string;
  messages: MessageListItem[];
  activeId: string | null;
  onSelect: (id: string) => void;
}

function fmtTime(ts: number): string {
  const d = new Date(ts);
  const sameDay = d.toDateString() === new Date().toDateString();
  return sameDay
    ? d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleString(undefined, {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
}

export function MessageList({ address, messages, activeId, onSelect }: Props) {
  if (!messages.length) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center text-muted-foreground">
        <Inbox className="size-10 opacity-50" />
        <div className="text-sm">Noch keine Mails.</div>
        <div className="text-xs">
          Sende eine Mail an
          <br />
          <code className="mt-1 inline-block rounded bg-muted px-2 py-1 font-mono text-foreground">
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
                  "flex w-full flex-col gap-1 px-4 py-3 text-left transition-colors",
                  "hover:bg-accent/60",
                  active && "border-l-2 border-primary bg-accent pl-[14px] text-accent-foreground",
                )}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-sm font-semibold">
                    {m.from_name || m.from || "(unknown)"}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {fmtTime(m.received_at)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {m.has_attachments && (
                    <Paperclip className="size-3 shrink-0 text-muted-foreground" />
                  )}
                  <span className="truncate text-sm">
                    {m.subject || (
                      <span className="italic text-muted-foreground">(no subject)</span>
                    )}
                  </span>
                </div>
                {m.preview && (
                  <p className="line-clamp-1 text-xs text-muted-foreground">{m.preview}</p>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </ScrollArea>
  );
}
