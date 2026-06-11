import { useCallback, useEffect, useState } from "react";

const LS_KEY = "tempmail.inbox.history";
const MAX = 10;

export interface InboxHistoryEntry {
  address: string;
  lastUsed: number;
}

function read(): InboxHistoryEntry[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as InboxHistoryEntry[]) : [];
  } catch {
    return [];
  }
}

export function useInboxHistory(currentAddress: string | undefined) {
  const [entries, setEntries] = useState<InboxHistoryEntry[]>(() => read());

  // Whenever current inbox changes, push to top of history.
  useEffect(() => {
    if (!currentAddress) return;
    setEntries((prev) => {
      const filtered = prev.filter((e) => e.address !== currentAddress);
      const next = [{ address: currentAddress, lastUsed: Date.now() }, ...filtered].slice(0, MAX);
      localStorage.setItem(LS_KEY, JSON.stringify(next));
      return next;
    });
  }, [currentAddress]);

  const remove = useCallback((address: string) => {
    setEntries((prev) => {
      const next = prev.filter((e) => e.address !== address);
      localStorage.setItem(LS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { entries, remove };
}
