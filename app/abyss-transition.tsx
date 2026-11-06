"use client";

import { useEffect, useRef } from "react";

// 进深海的转场：水面从上往下压，全屏是水时换主题，气泡往上冒，深度从 0 掉到 200 米，最后从中间清开。
let runner: ((action: () => void) => void) | null = null;
let pending: (() => void) | null = null;
export function runAbyssTransition(action: () => void) {
  if (runner) { runner(action); return; }
  // 转场层还没挂好：先排队，等它准备好再潜；万一一直没挂上，就直接换
  pending = action;
  setTimeout(() => { if (pending === action && !runner) { pending = null; action(); } }, 600);
}

const COVER = 620, BUBBLES_END = 1500, CLEAR_START = 1050, END = 1900;

export default function AbyssTransition() {
  const wrap = useRef<HTMLDivElement>(null), cv = useRef<HTMLCanvasElement>(null), depth = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const host = wrap.current, canvas = cv.current, ctx = canvas?.getContext("2d"), label = depth.current;
    if (!host || !canvas || !ctx || !label) return;
    let raf = 0, busy = false;
    const reduce = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    function play(action: () => void) {
      if (busy) { action(); return; }
      busy = true;
      const w = window.innerWidth, h = window.innerHeight, dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas!.width = Math.round(w * dpr); canvas!.height = Math.round(h * dpr);
      host!.hidden = false; host!.style.opacity = "1";
      if (reduce()) {
        host!.style.transition = "opacity .35s"; host!.style.background = "#061420"; host!.style.opacity = "0";
        requestAnimationFrame(() => { host!.style.opacity = "1"; setTimeout(() => { action(); host!.style.opacity = "0"; setTimeout(() => { host!.hidden = true; host!.style.background = ""; host!.style.transition = ""; busy = false; }, 380); }, 360); });
        return;
      }
      const bubbles = Array.from({ length: 46 }, () => ({ x: Math.random() * w, y: h + Math.random() * h * .5, r: 2 + Math.random() * 7, v: 220 + Math.random() * 380, ph: Math.random() * 6.28 }));
      const t0 = performance.now(); let swapped = false;
      const ease = (k: number) => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      function frame(now: number) {
        const t = now - t0;
        ctx!.setTransform(dpr, 0, 0, dpr, 0, 0); ctx!.clearRect(0, 0, w, h);
        // 1. 水面压下来
        const level = -60 + (h + 120) * ease(Math.min(1, t / COVER));
        const g = ctx!.createLinearGradient(0, 0, 0, Math.max(1, level));
        g.addColorStop(0, "#050f19"); g.addColorStop(.55, "#0b2335"); g.addColorStop(.92, "#1d4c62"); g.addColorStop(1, "#3b7f93");
        ctx!.fillStyle = g; ctx!.beginPath(); ctx!.moveTo(0, -10);
        for (let x = 0; x <= w + 12; x += 12) ctx!.lineTo(x, level + Math.sin(x / w * 9 + t / 160) * 10 + Math.sin(x / w * 23 - t / 110) * 4);
        ctx!.lineTo(w + 12, -10); ctx!.closePath(); ctx!.fill();
        // 水面那条亮线
        ctx!.strokeStyle = "rgba(205,236,244,.55)"; ctx!.lineWidth = 1.5; ctx!.beginPath();
        for (let x = 0; x <= w + 12; x += 12) { const y = level + Math.sin(x / w * 9 + t / 160) * 10 + Math.sin(x / w * 23 - t / 110) * 4; x ? ctx!.lineTo(x, y) : ctx!.moveTo(x, y); }
        ctx!.stroke();
        // 2. 全屏是水时换主题
        if (!swapped && t >= COVER) { swapped = true; try { action(); } catch {} }
        // 气泡往上冒
        if (t > COVER * .55 && t < BUBBLES_END + 400) {
          const dt = Math.min(.05, 1 / 60);
          ctx!.strokeStyle = "rgba(210,236,245,.6)"; ctx!.fillStyle = "rgba(210,236,245,.12)"; ctx!.lineWidth = 1;
          for (const b of bubbles) { b.y -= b.v * dt; const x = b.x + Math.sin(t / 220 + b.ph) * 6; if (b.y < level) { ctx!.beginPath(); ctx!.arc(x, b.y, b.r, 0, Math.PI * 2); ctx!.fill(); ctx!.stroke(); } }
        }
        // 深度数字
        const d = Math.round(200 * ease(Math.max(0, Math.min(1, (t - COVER * .5) / (CLEAR_START - COVER * .5)))));
        label!.textContent = `−${d} m`;
        label!.style.opacity = String(t < COVER * .45 ? 0 : t < CLEAR_START + 250 ? 1 : Math.max(0, 1 - (t - CLEAR_START - 250) / 300));
        // 3. 从中间清开
        if (t > CLEAR_START) {
          const k = ease(Math.min(1, (t - CLEAR_START) / (END - CLEAR_START)));
          const R = Math.hypot(w, h) * .62 * k;
          ctx!.globalCompositeOperation = "destination-out";
          const hole = ctx!.createRadialGradient(w / 2, h * .45, R * .55, w / 2, h * .45, R + 2);
          hole.addColorStop(0, "rgba(0,0,0,1)"); hole.addColorStop(1, "rgba(0,0,0,0)");
          ctx!.fillStyle = hole; ctx!.fillRect(0, 0, w, h);
          ctx!.globalCompositeOperation = "source-over";
          host!.style.opacity = String(1 - Math.max(0, (k - .7) / .3));
        }
        if (t < END) raf = requestAnimationFrame(frame);
        else { host!.hidden = true; host!.style.opacity = "1"; ctx!.clearRect(0, 0, w, h); busy = false; }
      }
      raf = requestAnimationFrame(frame);
    }
    runner = play;
    if (pending) { const queued = pending; pending = null; play(queued); }
    return () => { runner = null; cancelAnimationFrame(raf); };
  }, []);
  return <div ref={wrap} className="abyss-transition" hidden aria-hidden="true">
    <canvas ref={cv} />
    <span ref={depth} className="abyss-transition-depth" />
  </div>;
}
