"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";

/**
 * Homepage hero: 3D undulating topographic canyon over a faint matrix grid.
 * Dark horizontal valley for copy; pigment (#9B3418) glowing crests above/below.
 * Slow ambient loop + subtle mouse parallax. prefers-reduced-motion → static.
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

    const parent = root.parentElement || root;
    const host = parent.parentElement || parent;

    function smoothstep(a: number, b: number, x: number) {
      let t = (x - a) / (b - a);
      t = t < 0 ? 0 : t > 1 ? 1 : t;
      return t * t * (3 - 2 * t);
    }

    /** Multi-octave ridge displacement along X (slow ambient). */
    const displace = (u: number, t: number, seed: number, parallax: number) => {
      const p = parallax * 0.4;
      return (
        Math.sin(u * 2.4 + t * 0.18 + seed + p) * 0.55 +
        Math.sin(u * 5.1 - t * 0.12 + seed * 1.7) * 0.28 +
        Math.sin(u * 9.3 + t * 0.08 + seed * 0.5 + p * 0.5) * 0.12 +
        Math.sin(u * 17.0 - t * 0.05 + seed * 2.1) * 0.05
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

    /** Deterministic hash → stable grain (no per-frame sparkle). */
    const hash = (n: number) => {
      const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
      return x - Math.floor(x);
    };

    /** Stipple / grain along a ridge band for tactile crest texture. */
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
      const t = animate ? (timeMs - t0) * 0.001 : 2.4;
      mx += (tx - mx) * 0.06;
      my += (ty - my) * 0.06;
      const px = (mx - 0.5) * 0.08;
      const py = (my - 0.5) * 0.04;

      // Deep black void
      ctx.fillStyle = "#050403";
      ctx.fillRect(0, 0, cssW, cssH);

      // --- Faint matrix / number grid (behind waves) ---
      const cell = Math.max(14, Math.floor(cssW / 48));
      ctx.font = `${Math.max(9, Math.floor(cell * 0.55))}px ui-monospace, SFMono-Regular, Menlo, monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const cols = Math.ceil(cssW / cell) + 1;
      const rows = Math.ceil(cssH / cell) + 1;
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          const x = i * cell + cell * 0.5;
          const y = j * cell + cell * 0.5;
          const v = y / cssH;
          // Brighter near top lit zone, nearly invisible in canyon
          const canyonDist = Math.abs(v - 0.52);
          const a =
            canyonDist < 0.14
              ? 0.015
              : 0.04 + smoothstep(0.14, 0.45, canyonDist) * 0.1;
          const ch = MATRIX[(i * 13 + j * 7 + Math.floor(t * 0.3)) % MATRIX.length];
          ctx.fillStyle = `rgba(180,110,70,${a})`;
          ctx.fillText(ch, x, y);
        }
      }

      // Canyon center biased slightly low (lower-middle) for bottom-anchored copy
      const canyonCenter = 0.54 + py * 0.15;
      const canyonHalf = 0.16;

      // --- Build ridge polylines: bands ABOVE and BELOW the canyon ---
      const steps = Math.min(280, Math.max(120, Math.floor(cssW / 4)));

      type Band = {
        side: "above" | "below";
        depth: number; // 0 = near canyon edge, 1 = far
        seed: number;
      };
      const bands: Band[] = [];
      const nAbove = 14;
      const nBelow = 12;
      for (let i = 0; i < nAbove; i++) {
        bands.push({ side: "above", depth: i / (nAbove - 1), seed: i * 1.37 });
      }
      for (let i = 0; i < nBelow; i++) {
        bands.push({ side: "below", depth: i / (nBelow - 1), seed: 40 + i * 1.41 });
      }

      const ridgeY = (band: Band, u: number) => {
        const d = displace(u + px, t, band.seed, px);
        const amp = cssH * (0.018 + (1 - band.depth) * 0.022);
        if (band.side === "above") {
          // Far top → near canyon rim
          const base =
            cssH *
            (canyonCenter - canyonHalf - 0.02 - band.depth * (canyonCenter - canyonHalf - 0.02));
          // Push toward canyon as depth→0; undulate
          const rim = cssH * (canyonCenter - canyonHalf);
          const y = rim - band.depth * (rim - cssH * 0.02) + d * amp;
          // Soft fold so near-rim ridges bulge into lit crest
          return y + (1 - band.depth) * d * amp * 0.8;
        }
        const rim = cssH * (canyonCenter + canyonHalf);
        const floor = cssH * 0.98;
        return rim + band.depth * (floor - rim) + d * amp;
      };

      // Fill solid dark canyon strip first (ensures clean void)
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
        const voidGrad = ctx.createLinearGradient(0, cssH * (canyonCenter - canyonHalf), 0, cssH * (canyonCenter + canyonHalf));
        voidGrad.addColorStop(0, "#0a0807");
        voidGrad.addColorStop(0.35, "#050403");
        voidGrad.addColorStop(0.65, "#050403");
        voidGrad.addColorStop(1, "#0a0807");
        ctx.fillStyle = voidGrad;
        ctx.fill();
      }

      // Draw ridge fills from far → near so near crests sit on top
      const ordered = [...bands].sort((a, b) => b.depth - a.depth);

      for (const band of ordered) {
        const depth = band.depth;
        // Pigment family #9B3418 — terracotta peaks, never pink/magenta
        const crestBri = 0.25 + (1 - depth) * 0.7;
        const mouseDelta =
          (band.side === "above" ? my : 1 - my) - (1 - depth) * 0.5;
        const mouseNear = Math.exp(-(mouseDelta * mouseDelta) * 6) * 0.15;
        const lit = Math.min(1, crestBri + mouseNear);

        // Pigment RGB
        const pR = 0x9b;
        const pG = 0x34;
        const pB = 0x18;
        // Warm terracotta peak (not pink)
        const peakR = 0xcc;
        const peakG = 0x78;
        const peakB = 0x48;

        const r = Math.floor(pR * (1 - lit * 0.35) + peakR * lit * 0.55 + 20);
        const g = Math.floor(pG * (1 - lit * 0.2) + peakG * lit * 0.5 + 8);
        const b = Math.floor(pB * (1 - lit * 0.15) + peakB * lit * 0.35);

        // Valley fill between this ridge and screen edge / canyon
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
        const darkA = 0.55 + depth * 0.35;
        fill.addColorStop(0, `rgba(8,6,5,${darkA})`);
        fill.addColorStop(0.55, `rgba(12,9,7,${0.4 + depth * 0.3})`);
        fill.addColorStop(1, `rgba(${Math.floor(r * 0.25)},${Math.floor(g * 0.2)},${Math.floor(b * 0.15)},${0.35 + (1 - depth) * 0.25})`);
        ctx.fillStyle = fill;
        ctx.fill();

        // Crest stroke — illuminated ridge line
        ctx.beginPath();
        for (let s = 0; s <= steps; s++) {
          const u = s / steps;
          const x = u * cssW;
          const y = ridgeY(band, u);
          if (s === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        const a = 0.2 + lit * 0.65 * (0.45 + (1 - depth) * 0.55);
        ctx.strokeStyle = `rgba(${r},${g},${b},${a})`;
        ctx.lineWidth = 1.1 + (1 - depth) * 2.2;
        ctx.lineJoin = "round";
        ctx.stroke();

        // Soft glow halo on near crests
        if (depth < 0.55) {
          ctx.beginPath();
          for (let s = 0; s <= steps; s++) {
            const u = s / steps;
            const x = u * cssW;
            const y = ridgeY(band, u);
            if (s === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.strokeStyle = `rgba(${peakR},${peakG},${peakB},${0.08 + lit * 0.18 * (1 - depth)})`;
          ctx.lineWidth = 4 + (1 - depth) * 8;
          ctx.stroke();
        }
      }

      // Grain / stipple on illuminated near-canyon crests
      if (cssW > 400) {
        const nearAbove = bands.filter((b) => b.side === "above" && b.depth < 0.45);
        const nearBelow = bands.filter((b) => b.side === "below" && b.depth < 0.45);
        for (const band of [...nearAbove, ...nearBelow]) {
          grainBand(
            (u) => ridgeY(band, u),
            10 + (1 - band.depth) * 18,
            0.35 + (1 - band.depth) * 0.5,
            `rgb(204,120,72)`,
            0.06 + (1 - band.depth) * 0.1,
            band.seed * 100
          );
        }
      }

      // Sparse data glyphs riding lit crests
      if (cssW > 520) {
        ctx.font = `11px ui-monospace, SFMono-Regular, Menlo, monospace`;
        ctx.textAlign = "center";
        const crestBands = bands.filter((b) => b.depth < 0.4);
        for (const band of crestBands) {
          const count = 5 + Math.floor((1 - band.depth) * 8);
          for (let g = 0; g < count; g++) {
            const u = (g + 0.4) / count + Math.sin(t * 0.15 + band.seed + g) * 0.015;
            if (u < 0.05 || u > 0.95) continue;
            const x = u * cssW;
            const y = ridgeY(band, u) - (band.side === "above" ? 8 : -10);
            const ch = MATRIX[(g * 11 + Math.floor(band.seed * 3)) % MATRIX.length];
            ctx.fillStyle = `rgba(232,160,110,${0.07 + (1 - band.depth) * 0.12})`;
            ctx.fillText(ch, x, y);
          }
        }
      }

      // Soft vignette — keep canyon readable, edges slightly darker
      const vig = ctx.createRadialGradient(
        cssW * 0.5,
        cssH * canyonCenter,
        cssH * 0.08,
        cssW * 0.5,
        cssH * canyonCenter,
        cssH * 0.85
      );
      vig.addColorStop(0, "rgba(5,4,3,0)");
      vig.addColorStop(0.55, "rgba(5,4,3,0)");
      vig.addColorStop(1, "rgba(5,4,3,0.55)");
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, cssW, cssH);
    };

    resize();

    if (reduce) {
      paint(performance.now(), false);
    } else {
      host.addEventListener("pointermove", onMove, { passive: true });
      let last = 0;
      const targetDt = 1000 / 24; // slow ambient — don't distract from CTA
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

    const mo = new MutationObserver(() => paint(performance.now(), !reduce));
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "dir"],
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
