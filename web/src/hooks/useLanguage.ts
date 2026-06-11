import { useCallback, useEffect, useState } from "react";
import { resolveLang, type Lang, type LangPref } from "@/lib/i18n";
import { lsGetMigrated } from "@/lib/ls";

const LS_KEY = "tempus.lang";
const LS_KEY_LEGACY = "tempmail.lang";

function read(): LangPref {
  try {
    const v = lsGetMigrated(LS_KEY, LS_KEY_LEGACY);
    if (v === "de" || v === "en" || v === "auto") return v;
  } catch {
    /* ignore */
  }
  return "auto";
}

export function useLanguage(): {
  pref: LangPref;
  lang: Lang;
  setPref: (next: LangPref) => void;
} {
  const [pref, setPrefState] = useState<LangPref>(() => read());
  const [lang, setLang] = useState<Lang>(() => resolveLang(read()));

  useEffect(() => {
    setLang(resolveLang(pref));
  }, [pref]);

  useEffect(() => {
    if (pref !== "auto") return;
    const onLangChange = () => setLang(resolveLang("auto"));
    window.addEventListener("languagechange", onLangChange);
    return () => window.removeEventListener("languagechange", onLangChange);
  }, [pref]);

  const setPref = useCallback((next: LangPref) => {
    try {
      localStorage.setItem(LS_KEY, next);
    } catch {
      /* ignore */
    }
    setPrefState(next);
  }, []);

  return { pref, lang, setPref };
}
