"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";

type ThemePalette = {
  ground: string;
  ground2: string;
  pigment: string;
  peak: string;
  valley: string;
  canyon: string;
  matrix: string;
  glyph: string;
  isLight: boolean;
};

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "").trim();
  if (h.length === 3) {
    return [
      parseInt(h[0] + h[0], 16),
      parseInt(h[1] + h[1], 16),
      parseInt(h[2] + h[2], 16),
    ];
  }
  return [
    parseInt(h.slice(0, 2), 16) || 0,
    parseInt(h.slice(2, 4), 16) || 0,
    parseInt(h.slice(4, 6), 16) || 0,
  ];
}

function readPalette(): ThemePalette {
  const theme = document.documentElement.getAttribute("data-theme") || "light";
  const isLight = theme !== "dark";
  const cs = getComputedStyle(document.documentElement);
  const ground = (cs.getPropertyValue("--pb-ground").trim() || (isLight ? "#E7E3DA" : "#161513"));
  const ground2 = (cs.getPropertyValue("--pb-ground-2").trim() || (isLight ? "#DCD7CB" : "#1E1C19"));
  const pigment = (cs.getPropertyValue("--pb-pigment").trim() || (isLight ? "#9B3418" : "#C45A38"));

  if (isLight) {
    return {
      ground,
      ground2,
      pigment: "#9B3418",
      peak: "#B85A38",
      valley: ground,
      canyon: "#D5CFC2",
      matrix: "120,70,40",
      glyph: "155,52,24",
      isLight: true,
    };
  }
  return {
    ground,
    ground2,
    pigment,
    peak: "#E08A68",
    valley: ground,
    canyon: "#0E0D0C",
    matrix: "180,110,70",
    glyph: "232,160,110",
    isLight: false,
  };
}

/**
 * Homepage hero: 3D undulating topographic canyon.
 * Theme-aware: light/studio = bone valleys + pigment crests;
 * dark = deep ground + pigment crests. Re-reads on data-theme change.
 */
export default function HeroWaves({ className = "" }: { className?: string }) {
  const reduce = useReducedMotion();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false, desynchronized: true });
    if (!ctx) return;

    const DPR_CAP = 1.75;
    const MATRIX = "0123456789ABCDEF$#*·RISKACTWATCH%<>/";

    let cssW = 0;
    let cssH = 0;
    let dpr = 1;
    let raf = 0;
    let running = true;
    let t0 = performance.now();
    let mx = 0.5;
    let my = 0.55;
    let tx = 0.5;
    let ty = 0.55;
    let palette = readPalette();

    const parent = root.parentElement || root;
    const host = parent.parentElement || parent;

    function smoothstep(a: number, b: number, x: number) {
      let t = (x - a) / (b - a);
      t = t < 0 ? 0 : t > 1 ? 1 : t;
      return t * t * (3 - 2 * t);
    }

    /** Multi-octave ridge displacement — faster ambient drift. */
    const displace = (u: number, t: number, seed: number, parallax: number) => {
      const p = parallax * 0.45;
      return (
        Math.sin(u * 2.4 + t * 0.42 + seed + p) * 0.55 +
        Math.sin(u * 5.1 - t * 0.28 + seed * 1.7) * 0.28 +
        Math.sin(u * 9.3 + t * 0.18 + seed * 0.5 + p * 0.5) * 0.12 +
        Math.sin(u * 17.0 - t * 0.12 + seed * 2.1) * 0.05 +
        Math.sin(u * 3.2 + t * 0.35 + seed * 0.9) * 0.1
      );
    };

    const resize = () => {
      const rect = parent.getBoundingClientRect();
      cssW = Math.max(1, Math.floor(rect.width));
      cssH = Math.max(1, Math.floor(rect.height));
      dpr = Math.min(DPR_CAP, window.devicePixelRatio || 1);
      canvas.width = Math.floor(cssW * dpr);
      canvas.height = Math.floor(cssH * dpr);
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = true;
    };

    const onMove = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) return;
      tx = (e.clientX - r.left) / r.width;
      ty = (e.clientY - r.top) / r.height;
    };

    const hash = (n: number) => {
      const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
      return x - Math.floor(x);
    };

    const grainBand = (
      yBase: (u: number) => number,
      thickness: number,
      density: number,
      color: string,
      alpha: number,
      seed: number
    ) => {
      const n = Math.floor(cssW * density);
      ctx.fillStyle = color;
      for (let i = 0; i < n; i++) {
        const u = hash(seed + i * 19.17);
        const x = u * cssW;
        const y = yBase(u) + (hash(seed + i * 7.3) - 0.5) * thickness;
        const a = alpha * (0.35 + hash(seed + i * 3.1) * 0.65);
        ctx.globalAlpha = a;
        const s = 0.6 + hash(seed + i * 11.9) * 1.4;
        ctx.fillRect(x, y, s, s);
      }
      ctx.globalAlpha = 1;
    };

    const paint = (timeMs: number, animate: boolean) => {
      const pal = palette;
      const [gR, gG, gB] = hexToRgb(pal.ground);
      const [g2R, g2G, g2B] = hexToRgb(pal.ground2);
      const [cR, cG, cB] = hexToRgb(pal.canyon);
      const [pR, pG, pB] = hexToRgb(pal.pigment);
      const [peakR, peakG, peakB] = hexToRgb(pal.peak);

      const t = animate ? (timeMs - t0) * 0.001 : 2.4;
      mx += (tx - mx) * 0.06;
      my += (ty - my) * 0.06;
      const px = (mx - 0.5) * 0.08;
      const py = (my - 0.5) * 0.04;

      // Site ground — continuous with page, not a black slab
      ctx.fillStyle = pal.ground;
      ctx.fillRect(0, 0, cssW, cssH);

      // Soft vertical wash so edges match ground-2 slightly
      {
        const wash = ctx.createLinearGradient(0, 0, 0, cssH);
        wash.addColorStop(0, `rgba(${g2R},${g2G},${g2B},0.35)`);
        wash.addColorStop(0.45, `rgba(${gR},${gG},${gB},0)`);
        wash.addColorStop(1, `rgba(${g2R},${g2G},${g2B},0.4)`);
        ctx.fillStyle = wash;
        ctx.fillRect(0, 0, cssW, cssH);
      }

      // Faint matrix / number grid
      const cell = Math.max(14, Math.floor(cssW / 48));
      ctx.font = `${Math.max(9, Math.floor(cell * 0.55))}px ui-monospace, SFMono-Regular, Menlo, monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const cols = Math.ceil(cssW / cell) + 1;
      const rows = Math.ceil(cssH / cell) + 1;
      const matrixBase = pal.isLight ? 0.03 : 0.04;
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          const x = i * cell + cell * 0.5;
          const y = j * cell + cell * 0.5;
          const v = y / cssH;
          const canyonDist = Math.abs(v - 0.5);
          const a =
            canyonDist < 0.14
              ? (pal.isLight ? 0.02 : 0.015)
              : matrixBase + smoothstep(0.14, 0.45, canyonDist) * (pal.isLight ? 0.08 : 0.1);
          const ch = MATRIX[(i * 13 + j * 7 + Math.floor(t * 0.55)) % MATRIX.length];
          ctx.fillStyle = `rgba(${pal.matrix},${a})`;
          ctx.fillText(ch, x, y);
        }
      }

      // Canyon centered vertically for centered copy
      const canyonCenter = 0.5 + py * 0.12;
      const canyonHalf = 0.18;

      const steps = Math.min(300, Math.max(120, Math.floor(cssW / 3.5)));

      type Band = {
        side: "above" | "below";
        depth: number;
        seed: number;
      };
      const bands: Band[] = [];
      const nAbove = 20;
      const nBelow = 18;
      for (let i = 0; i < nAbove; i++) {
        bands.push({ side: "above", depth: i / (nAbove - 1), seed: i * 1.37 });
      }
      for (let i = 0; i < nBelow; i++) {
        bands.push({ side: "below", depth: i / (nBelow - 1), seed: 40 + i * 1.41 });
      }

      const ridgeY = (band: Band, u: number) => {
        const d = displace(u + px, t, band.seed, px);
        const amp = cssH * (0.016 + (1 - band.depth) * 0.024);
        if (band.side === "above") {
          const rim = cssH * (canyonCenter - canyonHalf);
          const y = rim - band.depth * (rim - cssH * 0.02) + d * amp;
          return y + (1 - band.depth) * d * amp * 0.8;
        }
        const rim = cssH * (canyonCenter + canyonHalf);
        const floor = cssH * 0.98;
        return rim + band.depth * (floor - rim) + d * amp;
      };

      // Canyon strip — soft recess, not pure black
      {
        const topRim: number[] = [];
        const botRim: number[] = [];
        for (let s = 0; s <= steps; s++) {
          const u = s / steps;
          const dTop = displace(u + px, t, 0.2, px);
          const dBot = displace(u + px, t, 40.2, px);
          topRim.push(cssH * (canyonCenter - canyonHalf) + dTop * cssH * 0.03);
          botRim.push(cssH * (canyonCenter + canyonHalf) + dBot * cssH * 0.03);
        }
        ctx.beginPath();
        ctx.moveTo(0, topRim[0]);
        for (let s = 1; s <= steps; s++) ctx.lineTo((s / steps) * cssW, topRim[s]);
        for (let s = steps; s >= 0; s--) ctx.lineTo((s / steps) * cssW, botRim[s]);
        ctx.closePath();
        const voidGrad = ctx.createLinearGradient(
          0,
          cssH * (canyonCenter - canyonHalf),
          0,
          cssH * (canyonCenter + canyonHalf)
        );
        if (pal.isLight) {
          voidGrad.addColorStop(0, `rgba(${g2R},${g2G},${g2B},0.55)`);
          voidGrad.addColorStop(0.35, pal.canyon);
          voidGrad.addColorStop(0.65, pal.canyon);
          voidGrad.addColorStop(1, `rgba(${g2R},${g2G},${g2B},0.55)`);
        } else {
          voidGrad.addColorStop(0, `rgba(${cR},${cG},${cB},0.85)`);
          voidGrad.addColorStop(0.35, pal.canyon);
          voidGrad.addColorStop(0.65, pal.canyon);
          voidGrad.addColorStop(1, `rgba(${cR},${cG},${cB},0.85)`);
        }
        ctx.fillStyle = voidGrad;
        ctx.fill();
      }

      const ordered = [...bands].sort((a, b) => b.depth - a.depth);

      for (const band of ordered) {
        const depth = band.depth;
        const crestBri = 0.25 + (1 - depth) * 0.7;
        const mouseDelta =
          (band.side === "above" ? my : 1 - my) - (1 - depth) * 0.5;
        const mouseNear = Math.exp(-(mouseDelta * mouseDelta) * 6) * 0.15;
        const lit = Math.min(1, crestBri + mouseNear);

        const r = Math.floor(pR * (1 - lit * 0.35) + peakR * lit * 0.55 + (pal.isLight ? 8 : 20));
        const g = Math.floor(pG * (1 - lit * 0.2) + peakG * lit * 0.5 + (pal.isLight ? 4 : 8));
        const b = Math.floor(pB * (1 - lit * 0.15) + peakB * lit * 0.35);

        ctx.beginPath();
        for (let s = 0; s <= steps; s++) {
          const u = s / steps;
          const x = u * cssW;
          const y = ridgeY(band, u);
          if (s === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        if (band.side === "above") {
          ctx.lineTo(cssW, 0);
          ctx.lineTo(0, 0);
        } else {
          ctx.lineTo(cssW, cssH);
          ctx.lineTo(0, cssH);
        }
        ctx.closePath();

        const y0 = ridgeY(band, 0.5);
        const fill = ctx.createLinearGradient(
          0,
          band.side === "above" ? y0 - cssH * 0.2 : y0,
          0,
          band.side === "above" ? y0 : y0 + cssH * 0.2
        );
        if (pal.isLight) {
          fill.addColorStop(0, `rgba(${gR},${gG},${gB},${0.75 + depth * 0.2})`);
          fill.addColorStop(0.5, `rgba(${g2R},${g2G},${g2B},${0.55 + depth * 0.25})`);
          fill.addColorStop(
            1,
            `rgba(${Math.floor(r * 0.55)},${Math.floor(g * 0.4)},${Math.floor(b * 0.3)},${0.2 + (1 - depth) * 0.35})`
          );
        } else {
          const darkA = 0.45 + depth * 0.4;
          fill.addColorStop(0, `rgba(${gR},${gG},${gB},${darkA})`);
          fill.addColorStop(0.55, `rgba(${g2R},${g2G},${g2B},${0.35 + depth * 0.35})`);
          fill.addColorStop(
            1,
            `rgba(${Math.floor(r * 0.25)},${Math.floor(g * 0.2)},${Math.floor(b * 0.15)},${0.3 + (1 - depth) * 0.3})`
          );
        }
        ctx.fillStyle = fill;
        ctx.fill();

        ctx.beginPath();
        for (let s = 0; s <= steps; s++) {
          const u = s / steps;
          const x = u * cssW;
          const y = ridgeY(band, u);
          if (s === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        const a = (pal.isLight ? 0.28 : 0.2) + lit * 0.65 * (0.45 + (1 - depth) * 0.55);
        ctx.strokeStyle = `rgba(${r},${g},${b},${Math.min(1, a)})`;
        ctx.lineWidth = 1.0 + (1 - depth) * 2.0;
        ctx.lineJoin = "round";
        ctx.stroke();

        if (depth < 0.55) {
          ctx.beginPath();
          for (let s = 0; s <= steps; s++) {
            const u = s / steps;
            const x = u * cssW;
            const y = ridgeY(band, u);
            if (s === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.strokeStyle = `rgba(${peakR},${peakG},${peakB},${(pal.isLight ? 0.1 : 0.08) + lit * 0.2 * (1 - depth)})`;
          ctx.lineWidth = 3.5 + (1 - depth) * 7;
          ctx.stroke();
        }
      }

      if (cssW > 400) {
        const nearAbove = bands.filter((b) => b.side === "above" && b.depth < 0.45);
        const nearBelow = bands.filter((b) => b.side === "below" && b.depth < 0.45);
        for (const band of [...nearAbove, ...nearBelow]) {
          grainBand(
            (u) => ridgeY(band, u),
            10 + (1 - band.depth) * 18,
            0.35 + (1 - band.depth) * 0.5,
            `rgb(${peakR},${peakG},${peakB})`,
            (pal.isLight ? 0.08 : 0.06) + (1 - band.depth) * 0.1,
            band.seed * 100
          );
        }
      }

      if (cssW > 520) {
        ctx.font = `11px ui-monospace, SFMono-Regular, Menlo, monospace`;
        ctx.textAlign = "center";
        const crestBands = bands.filter((b) => b.depth < 0.4);
        for (const band of crestBands) {
          const count = 5 + Math.floor((1 - band.depth) * 8);
          for (let g = 0; g < count; g++) {
            const u = (g + 0.4) / count + Math.sin(t * 0.32 + band.seed + g) * 0.015;
            if (u < 0.05 || u > 0.95) continue;
            const x = u * cssW;
            const y = ridgeY(band, u) - (band.side === "above" ? 8 : -10);
            const ch = MATRIX[(g * 11 + Math.floor(band.seed * 3)) % MATRIX.length];
            ctx.fillStyle = `rgba(${pal.glyph},${(pal.isLight ? 0.1 : 0.07) + (1 - band.depth) * 0.12})`;
            ctx.fillText(ch, x, y);
          }
        }
      }

      // Soft vignette toward ground — keeps continuity with page edges
      const vig = ctx.createRadialGradient(
        cssW * 0.5,
        cssH * canyonCenter,
        cssH * 0.1,
        cssW * 0.5,
        cssH * canyonCenter,
        cssH * 0.9
      );
      if (pal.isLight) {
        vig.addColorStop(0, `rgba(${gR},${gG},${gB},0)`);
        vig.addColorStop(0.55, `rgba(${gR},${gG},${gB},0)`);
        vig.addColorStop(1, `rgba(${g2R},${g2G},${g2B},0.45)`);
      } else {
        vig.addColorStop(0, `rgba(${gR},${gG},${gB},0)`);
        vig.addColorStop(0.55, `rgba(${gR},${gG},${gB},0)`);
        vig.addColorStop(1, `rgba(${Math.max(0, gR - 8)},${Math.max(0, gG - 8)},${Math.max(0, gB - 6)},0.5)`);
      }
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, cssW, cssH);
    };

    resize();
    palette = readPalette();

    if (reduce) {
      paint(performance.now(), false);
    } else {
      host.addEventListener("pointermove", onMove, { passive: true });
      let last = 0;
      const targetDt = 1000 / 30;
      const tick = (now: number) => {
        if (!running) return;
        if (!document.hidden && now - last >= targetDt) {
          last = now;
          paint(now, true);
        }
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }

    const ro = new ResizeObserver(() => {
      resize();
      paint(performance.now(), !reduce);
    });
    ro.observe(parent);

    const mo = new MutationObserver(() => {
      palette = readPalette();
      paint(performance.now(), !reduce);
    });
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "dir", "class"],
    });

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      host.removeEventListener("pointermove", onMove);
      ro.disconnect();
      mo.disconnect();
    };
  }, [reduce]);

  return (
    <div className={`hero-waves sky-motion hero-stage ${className}`} ref={rootRef} aria-hidden>
      <canvas ref={canvasRef} className="hero-waves-canvas" />
    </div>
  );
}
