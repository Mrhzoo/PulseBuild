"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";

const VIDEO_SRC = "/landing/hero-ai.mp4";

/**
 * Homepage hero BACKGROUND: LED/pixel mosaic driven by AI-chip video
 * luminance, undulating brightness waves + mouse influence (Canvas 2D).
 * Respects prefers-reduced-motion (static graded frame through LED).
 */
export default function HeroLedGrid({ className = "" }: { className?: string }) {
  const reduce = useReducedMotion();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false, desynchronized: true });
    if (!ctx) return;

    // Low-res LED buffer → nearest-neighbor upscale (fast + crisp mosaic)
    const CELL_CSS = 12;
    const DPR_CAP = 1.5;

    let cols = 0;
    let rows = 0;
    let cssW = 0;
    let cssH = 0;
    let dpr = 1;
    let img: ImageData | null = null;
    let lum: Float32Array | null = null;
    let raf = 0;
    let running = true;
    let t0 = performance.now();
    let mx = 0.72;
    let my = 0.45;
    let tx = 0.72;
    let ty = 0.45;
    let rtl = false;
    let darkTheme = false;
    let videoReady = false;
    let staticCaptured = false;

    const parent = root.parentElement || root;

    const readEnv = () => {
      rtl = document.documentElement.dir === "rtl";
      darkTheme = document.documentElement.getAttribute("data-theme") === "dark";
    };

    function smoothstep(a: number, b: number, x: number) {
      let t = (x - a) / (b - a);
      t = t < 0 ? 0 : t > 1 ? 1 : t;
      return t * t * (3 - 2 * t);
    }

    // Offscreen: video frame sampled at LED resolution
    const sample = document.createElement("canvas");
    const sampleCtx = sample.getContext("2d", {
      alpha: false,
      willReadFrequently: true,
    })!;
    const scratch = document.createElement("canvas");
    const scratchCtx = scratch.getContext("2d", { alpha: false })!;

    const video = document.createElement("video");
    video.src = VIDEO_SRC;
    video.muted = true;
    video.defaultMuted = true;
    video.loop = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");
    video.preload = "auto";
    video.crossOrigin = "anonymous";

    const tryPlay = () => {
      if (reduce || document.hidden) return;
      const p = video.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    };

    const onVideoReady = () => {
      videoReady = true;
      if (reduce) {
        try {
          video.currentTime = Math.min(0.8, (video.duration || 2) * 0.15);
        } catch {
          /* seek may fail before enough data */
        }
        video.pause();
      } else {
        tryPlay();
      }
    };

    video.addEventListener("loadeddata", onVideoReady);
    video.addEventListener("canplay", onVideoReady);
    video.load();

    /** Cover-fit video into LED buffer; flip X for RTL so chip stays on the “end” side. */
    const sampleVideoLuma = () => {
      if (!lum || cols < 1 || rows < 1) return false;
      if (!videoReady || video.readyState < 2) return false;

      const vw = video.videoWidth || 1;
      const vh = video.videoHeight || 1;
      const scale = Math.max(cols / vw, rows / vh);
      const dw = vw * scale;
      const dh = vh * scale;
      // Bias cover toward the right of the source (AI chip); flip X for RTL so
      // the subject sits on the inline-end side away from copy.
      const ox = (cols - dw) * 0.65;
      const oy = (rows - dh) * 0.45;

      sampleCtx.fillStyle = "#0c0b0a";
      sampleCtx.fillRect(0, 0, cols, rows);
      sampleCtx.save();
      if (rtl) {
        sampleCtx.translate(cols, 0);
        sampleCtx.scale(-1, 1);
      }
      sampleCtx.drawImage(video, ox, oy, dw, dh);
      sampleCtx.restore();

      const frame = sampleCtx.getImageData(0, 0, cols, rows);
      const d = frame.data;
      for (let i = 0, n = cols * rows; i < n; i++) {
        const o = i << 2;
        // Rec.601 luma; source is grayscale but keep formula for robustness
        lum[i] = (d[o] * 0.299 + d[o + 1] * 0.587 + d[o + 2] * 0.114) / 255;
      }
      return true;
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
      ctx.imageSmoothingEnabled = false;

      cols = Math.max(24, Math.ceil(cssW / CELL_CSS));
      rows = Math.max(16, Math.ceil(cssH / CELL_CSS));
      const maxCells = 14000;
      if (cols * rows > maxCells) {
        const scale = Math.sqrt(maxCells / (cols * rows));
        cols = Math.max(24, Math.floor(cols * scale));
        rows = Math.max(16, Math.floor(rows * scale));
      }

      readEnv();
      img = ctx.createImageData(cols, rows);
      lum = new Float32Array(cols * rows);
      sample.width = cols;
      sample.height = rows;
      scratch.width = cols;
      scratch.height = rows;
      staticCaptured = false;
    };

    const onMove = (e: PointerEvent) => {
      const r = parent.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) return;
      tx = (e.clientX - r.left) / r.width;
      ty = (e.clientY - r.top) / r.height;
    };

    const paintFast = (timeMs: number, animate: boolean) => {
      if (!img || !lum) return;

      const gotFrame = sampleVideoLuma();
      if (gotFrame && reduce) staticCaptured = true;

      const t = animate ? (timeMs - t0) * 0.001 : 0.85;
      mx += (tx - mx) * 0.14;
      my += (ty - my) * 0.14;

      const data = img.data;
      const luma = lum;
      const gR = darkTheme ? 14 : 18;
      const gG = darkTheme ? 13 : 16;
      const gB = darkTheme ? 12 : 14;
      const copyLeft = !rtl;

      for (let j = 0; j < rows; j++) {
        const v = (j + 0.5) / rows;
        const yV = 1 - Math.abs(v - 0.5) * 0.32;
        for (let i = 0; i < cols; i++) {
          const u = (i + 0.5) / cols;
          const idx = j * cols + i;
          const o = idx << 2;

          // Waves stay subtle — video luma carries the image
          const wave =
            Math.sin(u * 4.2 + t * 1.1 + v * 1.4) * 0.16 +
            Math.sin(v * 5.1 - t * 0.85 + u * 2.0) * 0.1 +
            Math.sin((u + v) * 6.5 + t * 0.55) * 0.06 +
            Math.sin(u * 9.0 - v * 3.0 - t * 1.4) * 0.03;
          const waveN = wave * 0.5 + 0.5;

          // Video subject is primary; quiet ambient waves + quieter mouse glow
          const vid = luma[idx];
          const sdx = u - mx;
          const sdy = v - my;
          const spot = Math.exp(-(sdx * sdx * 8 + sdy * sdy * 11)) * 0.09;
          const side = copyLeft ? u : 1 - u;
          // Stronger darkening on copy side (left in LTR) for title legibility
          const leftDark = 0.05 + 0.95 * smoothstep(0.0, 0.44, side);

          // Near-linear midtones (was pow 0.9 + harsh led gamma → hot orange wash)
          const vidLift = Math.pow(Math.max(0, vid), 1.06);
          const GLOBAL_GAIN = 0.7;
          let bri =
            (vidLift * 0.9 + waveN * 0.05 + spot + vidLift * (waveN - 0.5) * 0.05) *
            leftDark *
            yV *
            GLOBAL_GAIN;
          if (!gotFrame) {
            // Fallback soft field until first frame (no hand motif)
            bri = (waveN * 0.2 + spot) * leftDark * yV * GLOBAL_GAIN;
          }
          // Cap peaks so the wash never blinds / blows chip detail
          if (bri > 0.82) bri = 0.82;
          const led =
            bri < 0.025 && vidLift < 0.04
              ? 0
              : Math.pow(Math.max(0, bri - 0.02), 0.94);

          let r: number;
          let g: number;
          let b: number;
          if (led < 0.015) {
            r = gR;
            g = gG;
            b = gB;
          } else {
            // Soft pigment tint over warm grayscale backbone — preserves
            // video midtone / circuit structure instead of flattening to hot orange.
            const gy = led;
            const grayR = gR + (0xc8 - gR) * gy;
            const grayG = gG + (0xb6 - gG) * gy;
            const grayB = gB + (0x9e - gB) * gy;

            // Pigment family #9B3418, scaled with luma (multiply feel)
            const pScale = 0.32 + 0.68 * gy;
            const pR = 0x9b * pScale;
            const pG = 0x34 * pScale;
            const pB = 0x18 * pScale;

            // Moderate tint — enough brand pigment, enough gray structure
            const tint = 0.38 + 0.28 * smoothstep(0.08, 0.75, led);
            r = grayR * (1 - tint) + pR * tint;
            g = grayG * (1 - tint) + pG * tint;
            b = grayB * (1 - tint) + pB * tint;

            // Soft terracotta peak (not yellow-white) for brightest LEDs
            const peak = smoothstep(0.58, 0.95, led);
            if (peak > 0) {
              const pk = peak * 0.4;
              r = r * (1 - pk) + 0xcc * pk;
              g = g * (1 - pk) + 0x78 * pk;
              b = b * (1 - pk) + 0x4a * pk;
            }
          }
          data[o] = r;
          data[o + 1] = g;
          data[o + 2] = b;
          data[o + 3] = 255;
        }
      }

      scratchCtx.putImageData(img, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(scratch, 0, 0, cols, rows, 0, 0, cssW, cssH);

      const cellW = cssW / cols;
      const cellH = cssH / rows;
      if (cellW >= 8 && cellH >= 8) {
        ctx.fillStyle = darkTheme ? "rgba(8,7,6,0.55)" : "rgba(10,9,8,0.5)";
        for (let i = 1; i < cols; i++) {
          ctx.fillRect(i * cellW - 0.5, 0, 1, cssH);
        }
        for (let j = 1; j < rows; j++) {
          ctx.fillRect(0, j * cellH - 0.5, cssW, 1);
        }
      }
    };

    const onTheme = () => {
      readEnv();
      if (reduce) paintFast(performance.now(), false);
    };

    const onVis = () => {
      if (document.hidden) {
        video.pause();
      } else if (!reduce) {
        tryPlay();
      }
    };

    resize();

    if (reduce) {
      // Paint once when a frame is available; retry briefly until seek lands
      let tries = 0;
      const waitStatic = () => {
        if (!running) return;
        paintFast(performance.now(), false);
        if (!staticCaptured && tries++ < 40) {
          raf = requestAnimationFrame(waitStatic);
        }
      };
      raf = requestAnimationFrame(waitStatic);
    } else {
      parent.addEventListener("pointermove", onMove, { passive: true });
      document.addEventListener("visibilitychange", onVis);
      let last = 0;
      const targetDt = 1000 / 30;
      const tick = (now: number) => {
        if (!running) return;
        if (!document.hidden && now - last >= targetDt) {
          last = now;
          paintFast(now, true);
        }
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }

    const ro = new ResizeObserver(() => {
      resize();
      paintFast(performance.now(), !reduce);
    });
    ro.observe(parent);

    const mo = new MutationObserver(onTheme);
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "dir"],
    });

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      parent.removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", onVis);
      video.removeEventListener("loadeddata", onVideoReady);
      video.removeEventListener("canplay", onVideoReady);
      video.pause();
      video.removeAttribute("src");
      video.load();
      ro.disconnect();
      mo.disconnect();
    };
  }, [reduce]);

  return (
    <div className={`hero-led-grid sky-motion hero-stage ${className}`} ref={rootRef} aria-hidden>
      <canvas ref={canvasRef} className="hero-led-canvas" />
    </div>
  );
}
