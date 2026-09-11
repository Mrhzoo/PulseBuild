"use client";

import { motion, useReducedMotion } from "motion/react";
import { CSSProperties, ReactNode, createElement } from "react";
import { fadeUp, stagger } from "../../lib/motion";

export function MotionSection({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <section className={className}>{children}</section>;
  return (
    <motion.section
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.18 }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.08, delayChildren: delay } },
      }}
    >
      {children}
    </motion.section>
  );
}

type Tag = "div" | "article" | "li" | "p" | "h1" | "h2" | "h3" | "header" | "aside";

export function MotionItem({
  children,
  className,
  as = "div",
  style,
}: {
  children: ReactNode;
  className?: string;
  as?: Tag;
  style?: CSSProperties;
}) {
  const reduce = useReducedMotion();
  if (reduce) return createElement(as, { className, style }, children);
  const Comp = motion[as] as typeof motion.div;
  return (
    <Comp className={className} style={style} variants={fadeUp}>
      {children}
    </Comp>
  );
}

export function MotionStagger({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      variants={stagger}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
    >
      {children}
    </motion.div>
  );
}

export function StatusPulse({ className = "" }: { className?: string }) {
  const reduce = useReducedMotion();
  return (
    <span className={`status-dot ${className}`} aria-hidden>
      {!reduce && <span className="status-ring" />}
    </span>
  );
}
