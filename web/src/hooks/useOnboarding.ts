import { useCallback, useEffect, useState } from "react";

const LS_KEY = "tempmail.onboarded";

export function useOnboarding(ready: boolean) {
  const [open, setOpen] = useState(false);

  // On first eligible render, decide whether to show the modal.
  useEffect(() => {
    if (!ready) return;
    let seen = false;
    try {
      seen = localStorage.getItem(LS_KEY) === "1";
    } catch {
      seen = false;
    }
    if (!seen) setOpen(true);
  }, [ready]);

  const close = useCallback(() => {
    try {
      localStorage.setItem(LS_KEY, "1");
    } catch {
      /* ignore */
    }
    setOpen(false);
  }, []);

  const reopen = useCallback(() => setOpen(true), []);

  return { open, close, reopen };
}
