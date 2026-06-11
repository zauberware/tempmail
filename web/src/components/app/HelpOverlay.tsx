import { useEffect, useState } from "react";
import { X } from "lucide-react";

const SHORTCUTS: [string, string][] = [
  ["j / ↓", "Nächste Mail"],
  ["k / ↑", "Vorherige Mail"],
  ["Enter", "Mail öffnen"],
  ["d / Del", "Mail löschen"],
  ["r", "Refresh"],
  ["c", "Adresse kopieren"],
  ["n", "Neue Random-Inbox"],
  ["E", "Postfach leeren"],
  ["?", "Diese Hilfe ein-/ausblenden"],
];

export function HelpOverlay() {
  const [open, setOpen] = useState(false);

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
          <h2 className="text-lg font-semibold">Tastenkürzel</h2>
          <button
            onClick={() => setOpen(false)}
            className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label="schließen"
          >
            <X className="size-4" />
          </button>
        </div>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
          {SHORTCUTS.map(([key, desc]) => (
            <div key={key} className="contents">
              <dt>
                <kbd className="rounded border border-border bg-muted px-2 py-0.5 font-mono text-xs">
                  {key}
                </kbd>
              </dt>
              <dd className="text-sm">{desc}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
