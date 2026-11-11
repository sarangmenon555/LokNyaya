"use client";

import type { ReactNode } from "react";
import { DRAFT_LANGUAGES, LANGUAGES } from "../lib/i18n";
import type { LangCode } from "../lib/i18n";
import { useLanguage } from "../lib/useLanguage";

export default function Shell({ children }: { children: ReactNode }) {
  const { lang, setLang, t } = useLanguage();
  return (
    <div className="shell">
      <header className="topbar">
        <div className="topbar-inner">
          <a className="brand" href="/">
            LokNyaya
            <span className="brand-bar" />
          </a>
          <label className="langpick">
            <span className="sr">Language</span>
            <select value={lang} onChange={(e) => setLang(e.target.value as LangCode)}>
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code} lang={l.code}>
                  {l.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>
      <div className="content">{children}</div>
      <footer className="footer">
        <div className="footer-inner">
          <strong className="brand-foot">LokNyaya</strong>
          <p>{t.disclaimer}</p>
          <p>{t.footerOpen}</p>
          {DRAFT_LANGUAGES.includes(lang) && <p className="draft-note">{t.draftTranslation}</p>}
          <nav className="footer-links" aria-label="More">
            <a href="/sections">{t.toolSections}</a>
            <a href="/coverage">{t.toolCoverage}</a>
            <a href="/impact">{t.toolImpact}</a>
            <a href="/followup">{t.toolFollowup}</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
