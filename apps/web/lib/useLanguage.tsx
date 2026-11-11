"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { LANGUAGES, getMessages } from "./i18n";
import type { LangCode, Messages } from "./i18n";

interface LanguageValue {
  lang: LangCode;
  setLang: (code: LangCode) => void;
  t: Messages;
  locale: string;
}

const LanguageContext = createContext<LanguageValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LangCode>("en");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("loknyaya.lang");
      if (LANGUAGES.some((l) => l.code === saved)) setLangState(saved as LangCode);
    } catch {}
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const value = useMemo<LanguageValue>(
    () => ({
      lang,
      setLang: (code) => {
        setLangState(code);
        try {
          window.localStorage.setItem("loknyaya.lang", code);
        } catch {}
      },
      t: getMessages(lang),
      locale: LANGUAGES.find((l) => l.code === lang)?.locale ?? "en-IN"
    }),
    [lang]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageValue {
  const value = useContext(LanguageContext);
  if (!value) throw new Error("useLanguage must be used inside LanguageProvider");
  return value;
}
