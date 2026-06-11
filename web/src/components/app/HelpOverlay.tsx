import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useI18n } from "@/lib/i18n-context";
import { t as tRaw, type StrKey } from "@/lib/i18n";

const SHORTCUTS: { keys: string; desc: StrKey }[] = [
  { keys: "j / ↓", desc: "sc_next" },
  { keys: "k / ↑", desc: "sc_prev" },
  { keys: "Enter", desc: "sc_open" },
  { keys: "d / Del", desc: "sc_delete" },
  { keys: "r", desc: "sc_refresh" },
  { keys: "c", desc: "sc_copy" },
  { keys: "n", desc: "sc_new" },
  { keys: "E", desc: "sc_clear" },
  { keys: "?", desc: "sc_help" },
];

interface Props {
  onMount?: (open: () => void) => void;
}

export function HelpOverlay({ onMount }: Props = {}) {
  const { lang } = useI18n();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    onMount?.(() => setOpen(true));
  }, [onMount]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement) {
        const tag = e.target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || e.target.isContentEditable) return;
      }
      if (e.key === "?") {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{tRaw("shortcuts_title", lang)}</h2>
          <button
            onClick={() => setOpen(false)}
            className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label={tRaw("close", lang)}
          >
            <X className="size-4" />
          </button>
        </div>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
          {SHORTCUTS.map(({ keys, desc }) => (
            <div key={keys} className="contents">
              <dt>
                <kbd className="rounded border border-border bg-muted px-2 py-0.5 font-mono text-xs">
                  {keys}
                </kbd>
              </dt>
              <dd className="text-sm">{tRaw(desc, lang)}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
