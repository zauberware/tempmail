import { useCallback, useEffect, useState } from "react";
import type { Inbox } from "@/lib/types";

const LS_KEY = "tempmail.inbox";

function read(): Inbox | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as Inbox) : null;
  } catch {
    return null;
  }
}

export function useInbox() {
  const [inbox, setInboxState] = useState<Inbox | null>(() => read());

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === LS_KEY) setInboxState(read());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setInbox = useCallback((next: Inbox | null) => {
    if (next) localStorage.setItem(LS_KEY, JSON.stringify(next));
    else localStorage.removeItem(LS_KEY);
    setInboxState(next);
  }, []);

  return { inbox, setInbox };
}
