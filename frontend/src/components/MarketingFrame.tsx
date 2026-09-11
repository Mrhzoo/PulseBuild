"use client";

import { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import StudioFooter from "./StudioFooter";
import { easeOut } from "../lib/motion";

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
  const reduce = useReducedMotion();
  return (
    <div className="ae-mkt">
      <header className="ae-mkt-hero">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={easeOut}
        >
          <p className="mono-label">{kicker}</p>
          <h1>{title}</h1>
          <p className="lede">{lede}</p>
        </motion.div>
      </header>
      <motion.div
        className="ae-section"
        initial={reduce ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...easeOut, delay: 0.08 }}
      >
        {children}
      </motion.div>
      <StudioFooter locale={locale} />
    </div>
  );
}
