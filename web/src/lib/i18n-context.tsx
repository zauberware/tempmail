import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { t as tRaw, type Lang, type LangPref, type StrKey } from "./i18n";

interface I18nValue {
  lang: Lang;
  pref: LangPref;
  setPref: (p: LangPref) => void;
  t: (key: StrKey) => string;
}

const Ctx = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const { pref, lang, setPref } = useLanguage();
  const value = useMemo<I18nValue>(
    () => ({ lang, pref, setPref, t: (key: StrKey) => tRaw(key, lang) }),
    [lang, pref, setPref],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n(): I18nValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useI18n must be used inside I18nProvider");
  return v;
}
