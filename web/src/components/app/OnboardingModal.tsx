import { useEffect } from "react";
import { Hourglass, Copy, RefreshCw, ShieldCheck, Keyboard, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n-context";

interface Props {
  open: boolean;
  address: string;
  onClose: () => void;
}

export function OnboardingModal({ open, address, onClose }: Props) {
  const { t } = useI18n();

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
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-card p-5 shadow-2xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal
        aria-labelledby="onboarding-title"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Hourglass className="size-5" />
            </div>
            <div>
              <h2 id="onboarding-title" className="text-lg font-semibold">
                {t("ob_welcome")}
              </h2>
              <p className="text-sm text-muted-foreground">{t("ob_tagline")}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label={t("close")}
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="my-5 rounded-lg border border-dashed border-border bg-muted/40 p-4">
          <div className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
            {t("ob_address_label")}
          </div>
          <div className="flex items-center justify-between gap-3">
            <code className="select-all break-all font-mono text-sm font-semibold sm:text-base">
              {address}
            </code>
            <Button size="sm" variant="outline" onClick={copy}>
              <Copy className="size-3.5" /> {t("ob_copy")}
            </Button>
          </div>
        </div>

        <ul className="space-y-3 text-sm">
          <li className="flex gap-3">
            <RefreshCw className="mt-0.5 size-4 shrink-0 text-primary" />
            <div>
              <b>{t("ob_incoming")}</b>
              {t("ob_incoming_text")}
            </div>
          </li>
          <li className="flex gap-3">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
            <div>
              <b>{t("ob_cleanup")}</b>
              {t("ob_cleanup_text")}
            </div>
          </li>
          <li className="flex gap-3">
            <Keyboard className="mt-0.5 size-4 shrink-0 text-primary" />
            <div>
              <b>{t("ob_shortcuts_label")}</b>{" "}
              <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-xs">
                j
              </kbd>{" "}
              /{" "}
              <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-xs">
                k
              </kbd>
              {t("ob_shortcuts_navigate")}
              <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-xs">
                c
              </kbd>
              {t("ob_shortcuts_copy")}
              <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-xs">
                ?
              </kbd>
              {t("ob_shortcuts_showall")}
            </div>
          </li>
        </ul>

        <div className="mt-6 flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">{t("ob_again_via_info")}</span>
          <Button onClick={onClose}>{t("ob_go")}</Button>
        </div>
      </div>
    </div>
  );
}
