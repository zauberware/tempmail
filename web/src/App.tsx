import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Mail } from "lucide-react";
import { AddressBar } from "@/components/app/AddressBar";
import { MessageList } from "@/components/app/MessageList";
import { MessageDetail } from "@/components/app/MessageDetail";
import { EmptyInbox } from "@/components/app/EmptyInbox";
import { HelpOverlay } from "@/components/app/HelpOverlay";
import { OnboardingModal } from "@/components/app/OnboardingModal";
import { SplitPane } from "@/components/app/SplitPane";
import { api } from "@/lib/api";
import { randomLocal } from "@/lib/random";
import { useInbox } from "@/hooks/useInbox";
import { useInboxHistory } from "@/hooks/useInboxHistory";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useIsMobile } from "@/hooks/useMediaQuery";

const POLL_MS = 5000;

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable;
}

export default function App() {
  const qc = useQueryClient();
  const { inbox, setInbox } = useInbox();
  const { entries: history, remove: removeFromHistory } = useInboxHistory(inbox?.address);
  const [activeId, setActiveId] = useState<string | null>(null);
  const helpTriggerRef = useRef<() => void>(() => undefined);

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

  const clearMut = useMutation({
    mutationFn: () => api.clearInbox(inbox!.address),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["messages", inbox?.address] });
      setActiveId(null);
    },
  });

  const apply = (local: string, domain: string) => {
    createInbox.mutate({ local, domain });
  };

  const onSwitch = (addr: string) => {
    const at = addr.lastIndexOf("@");
    if (at < 0) return;
    apply(addr.slice(0, at), addr.slice(at + 1));
  };

  const onRefresh = () => {
    qc.invalidateQueries({ queryKey: ["messages", inbox?.address] });
  };

  const onClear = () => {
    if (!inbox || (messagesQ.data?.messages.length ?? 0) === 0) return;
    if (confirm(`Alle ${messagesQ.data?.messages.length} Mails in ${inbox.address} löschen?`)) {
      clearMut.mutate();
    }
  };

  const onNew = () => {
    if (!poolQ.data || poolQ.data.domains.length === 0) return;
    const d = poolQ.data.domains[Math.floor(Math.random() * poolQ.data.domains.length)]!;
    apply(randomLocal(), d);
  };

  const onboarding = useOnboarding(!!inbox && !!poolQ.data);
  const isMobile = useIsMobile();

  const messages = messagesQ.data?.messages ?? [];

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (isTyping(e.target)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const key = e.key;

      if (key === "j" || key === "ArrowDown") {
        e.preventDefault();
        if (!messages.length) return;
        const i = activeId ? messages.findIndex((m) => m.id === activeId) : -1;
        const next = messages[Math.min(i + 1, messages.length - 1)];
        if (next) setActiveId(next.id);
      } else if (key === "k" || key === "ArrowUp") {
        e.preventDefault();
        if (!messages.length) return;
        const i = activeId ? messages.findIndex((m) => m.id === activeId) : 0;
        const prev = messages[Math.max(i - 1, 0)];
        if (prev) setActiveId(prev.id);
      } else if (key === "r") {
        e.preventDefault();
        onRefresh();
      } else if (key === "c") {
        e.preventDefault();
        if (inbox) navigator.clipboard.writeText(inbox.address).catch(() => undefined);
      } else if (key === "n") {
        e.preventDefault();
        onNew();
      } else if (key === "E" && e.shiftKey) {
        e.preventDefault();
        onClear();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, activeId, inbox]);

  if (!inbox || !poolQ.data) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        initialisiere…
      </div>
    );
  }

  const list = (
    <MessageList
      address={inbox.address}
      messages={messages}
      activeId={activeId}
      onSelect={setActiveId}
      isLoading={messagesQ.isLoading}
    />
  );

  const rightPane =
    messages.length === 0 ? (
      <EmptyInbox address={inbox.address} />
    ) : activeId ? (
      <MessageDetail
        address={inbox.address}
        messageId={activeId}
        onDeleted={() => setActiveId(null)}
        onBack={isMobile ? () => setActiveId(null) : undefined}
      />
    ) : (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center text-muted-foreground">
        <Mail className="size-12 opacity-30" />
        <p className="text-sm">
          {messages.length} Mails — links auswählen oder{" "}
          <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-xs">
            j
          </kbd>{" "}
          drücken
        </p>
      </div>
    );

  return (
    <div className="flex h-full flex-col">
      <AddressBar
        address={inbox.address}
        pool={poolQ.data.domains}
        messageCount={messages.length}
        isFetching={messagesQ.isFetching}
        history={history}
        isMobile={isMobile}
        onApply={apply}
        onSwitch={onSwitch}
        onHistoryRemove={removeFromHistory}
        onRefresh={onRefresh}
        onClear={onClear}
        onShowOnboarding={onboarding.reopen}
        onShowShortcuts={() => helpTriggerRef.current()}
      />
      <main className="min-h-0 flex-1">
        {isMobile ? (
          activeId || messages.length === 0 ? rightPane : list
        ) : (
          <SplitPane
            storageKey="tempmail.sidebarPx"
            defaultLeftPx={380}
            minLeftPx={260}
            maxLeftPx={640}
            left={list}
            right={rightPane}
          />
        )}
      </main>
      <HelpOverlay onMount={(open) => (helpTriggerRef.current = open)} />
      <OnboardingModal open={onboarding.open} address={inbox.address} onClose={onboarding.close} />
    </div>
  );
}
