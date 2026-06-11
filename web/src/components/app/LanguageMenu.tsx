import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { DropdownItem } from "@/components/ui/dropdown-menu";
import { useI18n } from "@/lib/i18n-context";

export function LanguageMenu() {
  const { pref, setPref, t } = useI18n();
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" aria-label={t("lang_label")} title={t("lang_label")}>
          <Languages />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-44 p-1">
        <DropdownItem onClick={() => setPref("auto")}>
          {t("lang_auto")} {pref === "auto" && "✓"}
        </DropdownItem>
        <DropdownItem onClick={() => setPref("de")}>
          {t("lang_de")} {pref === "de" && "✓"}
        </DropdownItem>
        <DropdownItem onClick={() => setPref("en")}>
          {t("lang_en")} {pref === "en" && "✓"}
        </DropdownItem>
      </PopoverContent>
    </Popover>
  );
}
