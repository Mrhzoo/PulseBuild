"use client";

import { type Transition, type Variants } from "motion/react";

export const easeOut: Transition = {
  duration: 0.7,
  ease: [0.22, 1, 0.36, 1],
};

export const springSoft: Transition = {
  type: "spring",
  stiffness: 260,
  damping: 28,
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: easeOut },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.5 } },
};

export const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.06 } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  show: { opacity: 1, scale: 1, transition: easeOut },
};

export const slideX: Variants = {
  hidden: { opacity: 0, x: 18 },
  show: { opacity: 1, x: 0, transition: easeOut },
};
