import { useState } from "react";
import { Copy, Check, MailPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  address: string;
}

export function EmptyInbox({ address }: Props) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 p-4 text-center sm:gap-8 sm:p-8">
      <div className="flex items-center gap-2 text-xs text-muted-foreground sm:text-sm">
        <MailPlus className="size-4 shrink-0" />
        <span>Bereit — keine Mails. Adresse kopieren und irgendwo eintragen:</span>
      </div>

      <button
        onClick={copy}
        className="group w-full max-w-full break-all rounded-2xl border border-dashed border-border bg-card/40 px-4 py-6 transition-all hover:border-primary/60 hover:bg-card sm:px-6 sm:py-8 md:px-12 md:py-12"
        aria-label="Adresse kopieren"
      >
        <div className="select-all font-mono text-base font-semibold tracking-tight sm:text-2xl md:text-4xl">
          {address}
        </div>
        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground transition-colors group-hover:text-foreground">
          {copied ? (
            <>
              <Check className="size-4 text-green-500" />
              <span className="text-green-500">In Zwischenablage kopiert</span>
            </>
          ) : (
            <>
              <Copy className="size-4" />
              <span>Klicken zum Kopieren</span>
            </>
          )}
        </div>
      </button>

      <Button size="lg" onClick={copy} className="gap-2">
        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        {copied ? "Kopiert ✓" : "📋 Adresse kopieren"}
      </Button>

      <div className="max-w-md text-xs text-muted-foreground">
        Sobald eine Mail an diese Adresse geht, taucht sie hier auf. Die Liste
        aktualisiert sich automatisch alle 5 Sekunden.
      </div>
    </div>
  );
}
