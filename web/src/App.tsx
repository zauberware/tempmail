import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AddressBar } from "@/components/app/AddressBar";
import { MessageList } from "@/components/app/MessageList";
import { MessageDetail } from "@/components/app/MessageDetail";
import { api } from "@/lib/api";
import { randomLocal } from "@/lib/random";
import { useInbox } from "@/hooks/useInbox";

const POLL_MS = 5000;

export default function App() {
  const { inbox, setInbox } = useInbox();
  const [activeId, setActiveId] = useState<string | null>(null);

  const poolQ = useQuery({
    queryKey: ["pool"],
    queryFn: api.pool,
    staleTime: 60_000,
  });

  const createInbox = useMutation({
    mutationFn: api.createInbox,
    onSuccess: (res) => {
      setInbox({ address: res.address, owner_token: res.owner_token });
      setActiveId(null);
    },
  });

  // Auto-create on first visit once pool is loaded
  useEffect(() => {
    if (!inbox && poolQ.data && poolQ.data.domains.length > 0) {
      const domain = poolQ.data.domains[Math.floor(Math.random() * poolQ.data.domains.length)]!;
      createInbox.mutate({ local: randomLocal(), domain });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inbox, poolQ.data]);

  const messagesQ = useQuery({
    queryKey: ["messages", inbox?.address],
    queryFn: () => api.listMessages(inbox!.address),
    enabled: !!inbox,
    refetchInterval: POLL_MS,
    refetchIntervalInBackground: false,
  });

  const apply = (local: string, domain: string) => {
    createInbox.mutate({ local, domain });
  };

  if (!inbox || !poolQ.data) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        initialisiere…
      </div>
    );
  }

  const messages = messagesQ.data?.messages ?? [];

  return (
    <div className="flex h-full flex-col">
      <AddressBar
        address={inbox.address}
        pool={poolQ.data.domains}
        messageCount={messages.length}
        isFetching={messagesQ.isFetching}
        onApply={apply}
      />
      <main className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[360px_1fr]">
        <div className="min-h-0 border-b border-border md:border-b-0 md:border-r">
          <MessageList
            address={inbox.address}
            messages={messages}
            activeId={activeId}
            onSelect={setActiveId}
          />
        </div>
        <div className="min-h-0 overflow-hidden">
          <MessageDetail
            address={inbox.address}
            messageId={activeId}
            onDeleted={() => setActiveId(null)}
          />
        </div>
      </main>
    </div>
  );
}
