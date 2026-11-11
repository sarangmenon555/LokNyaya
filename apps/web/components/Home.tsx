"use client";

import Wizard from "./Wizard";
import { useLanguage } from "../lib/useLanguage";

export default function Home() {
  const { t } = useLanguage();
  const trust = [t.trustFree, t.trustNoSignup, t.trustPrivate, t.trustOpen];
  const how = [
    [t.how1Title, t.how1Body],
    [t.how2Title, t.how2Body],
    [t.how3Title, t.how3Body]
  ];
  const tools = [
    [t.toolSections, "/sections"],
    [t.toolCoverage, "/coverage"],
    [t.toolImpact, "/impact"],
    [t.toolFollowup, "/followup"]
  ];

  return (
    <>
      <section className="hero-home">
        <div className="hero-inner">
          <div className="hero-copy">
            <p className="eyebrow light">{t.heroEyebrow}</p>
            <h1>{t.headline}</h1>
            <p className="hero-sub">{t.sub}</p>
            <a className="btn btn-orange btn-lg" href="#start">
              {t.ctaStart}
            </a>
            <ul className="trust">
              {trust.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>
          <svg className="hero-art" viewBox="0 0 200 200" aria-hidden="true">
            <circle cx="100" cy="100" r="92" className="art-ring a" />
            <circle cx="100" cy="100" r="70" className="art-ring b" />
            <circle cx="100" cy="100" r="48" className="art-ring c" />
            <path d="M100 8 A92 92 0 1 1 20 146" className="art-arc" />
            <circle cx="100" cy="100" r="9" className="art-dot" />
          </svg>
        </div>
      </section>

      <main className="wizard-wrap">
        <Wizard />
      </main>

      <section className="band">
        <div className="band-inner">
          <h2>{t.howTitle}</h2>
          <div className="how">
            {how.map(([title, body], i) => (
              <div className="how-card" key={title}>
                <span className="how-num">{i + 1}</span>
                <h3>{title}</h3>
                <p>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="band alt">
        <div className="band-inner">
          <h2>{t.toolsTitle}</h2>
          <div className="toolgrid">
            {tools.map(([label, href]) => (
              <a className="tool" href={href} key={href}>
                {label}
              </a>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
