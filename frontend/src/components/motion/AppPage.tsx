"use client";

import { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";

export default function AppPage({
  children,
  className = "ae-page",
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "article";
}) {
  const reduce = useReducedMotion();
  const Comp = as === "article" ? motion.article : motion.div;
  return (
    <Comp
      className={className}
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </Comp>
  );
}
