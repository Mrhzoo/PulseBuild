"use client";

import { ReactNode } from "react";
import StudioFooter from "./StudioFooter";
import SkyMotion from "./SkyMotion";

export default function MarketingFrame({
  locale,
  kicker,
  title,
  lede,
  children,
}: {
  locale: string;
  kicker: string;
  title: string;
  lede: string;
  children: ReactNode;
}) {
  return (
    <div className="ae-mkt">
      <header className="ae-mkt-hero ae-reveal">
        <SkyMotion />
        <p className="mono-label">{kicker}</p>
        <h1>{title}</h1>
        <p className="lede">{lede}</p>
      </header>
      <div className="ae-section">{children}</div>
      <StudioFooter locale={locale} />
    </div>
  );
}
