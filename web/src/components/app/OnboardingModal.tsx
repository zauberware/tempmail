import { useEffect } from "react";
import { Mail, Copy, RefreshCw, ShieldCheck, Keyboard, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  open: boolean;
  address: string;
  onClose: () => void;
}

export function OnboardingModal({ open, address, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const copy = async () => {
    await navigator.clipboard.writeText(address);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal
        aria-labelledby="onboarding-title"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Mail className="size-5" />
            </div>
            <div>
              <h2 id="onboarding-title" className="text-lg font-semibold">
                Willkommen bei tempmail
              </h2>
              <p className="text-sm text-muted-foreground">
                Wegwerf-Mail für Tests, Signups und KI-Agents.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label="schließen"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="my-5 rounded-lg border border-dashed border-border bg-muted/40 p-4">
          <div className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
            Deine Adresse
          </div>
          <div className="flex items-center justify-between gap-3">
            <code className="select-all break-all font-mono text-sm font-semibold sm:text-base">
              {address}
            </code>
            <Button size="sm" variant="outline" onClick={copy}>
              <Copy className="size-3.5" /> Kopieren
            </Button>
          </div>
        </div>

        <ul className="space-y-3 text-sm">
          <li className="flex gap-3">
            <RefreshCw className="mt-0.5 size-4 shrink-0 text-primary" />
            <div>
              <b>Eingehende Mails</b> tauchen automatisch auf — alle 5 Sekunden
              neuer Refresh. Adresse wechseln über das Feld oben.
            </div>
          </li>
          <li className="flex gap-3">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
            <div>
              <b>Auto-Cleanup:</b> Mails ≥7 Tage und Inboxen ≥30 Tage inaktiv
              werden gelöscht. Nutze die History (🕘) um zu früheren Adressen
              zurückzuspringen.
            </div>
          </li>
          <li className="flex gap-3">
            <Keyboard className="mt-0.5 size-4 shrink-0 text-primary" />
            <div>
              <b>Tastenkürzel:</b>{" "}
              <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-xs">
                j
              </kbd>{" "}
              /{" "}
              <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-xs">
                k
              </kbd>{" "}
              navigieren,{" "}
              <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-xs">
                c
              </kbd>{" "}
              kopiert,{" "}
              <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-xs">
                ?
              </kbd>{" "}
              zeigt alle.
            </div>
          </li>
        </ul>

        <div className="mt-6 flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">
            Jederzeit wieder via ⓘ in der Topbar.
          </span>
          <Button onClick={onClose}>Los geht's</Button>
        </div>
      </div>
    </div>
  );
}
