import { useCallback, useEffect, useState } from "react";
import { lsGetMigrated } from "@/lib/ls";

const LS_KEY = "tempus.onboarded";
const LS_KEY_LEGACY = "tempmail.onboarded";

export function useOnboarding(ready: boolean) {
  const [open, setOpen] = useState(false);

  // On first eligible render, decide whether to show the modal.
  useEffect(() => {
    if (!ready) return;
    let seen = false;
    try {
      seen = lsGetMigrated(LS_KEY, LS_KEY_LEGACY) === "1";
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
