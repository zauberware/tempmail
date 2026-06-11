import { useState } from "react";
import { Copy, Check, MailPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n-context";

interface Props {
  address: string;
}

export function EmptyInbox({ address }: Props) {
  const { t } = useI18n();
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
        <span>{t("empty_pre_address")}</span>
      </div>

      <button
        onClick={copy}
        className="group w-full max-w-full break-all rounded-2xl border border-dashed border-border bg-card/40 px-4 py-6 transition-all hover:border-primary/60 hover:bg-card sm:px-6 sm:py-8 md:px-12 md:py-12"
        aria-label={t("copy_address")}
      >
        <div className="select-all font-mono text-base font-semibold tracking-tight sm:text-2xl md:text-4xl">
          {address}
        </div>
        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground transition-colors group-hover:text-foreground">
          {copied ? (
            <>
              <Check className="size-4 text-green-500" />
              <span className="text-green-500">{t("copied_to_clipboard")}</span>
            </>
          ) : (
            <>
              <Copy className="size-4" />
              <span>{t("click_to_copy")}</span>
            </>
          )}
        </div>
      </button>

      <Button size="lg" onClick={copy} className="gap-2">
        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        {copied ? t("copied_state") : t("copy_address_button")}
      </Button>

      <div className="max-w-md text-xs text-muted-foreground">{t("empty_subtext")}</div>
    </div>
  );
}
