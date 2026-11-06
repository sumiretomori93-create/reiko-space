"use client";
import { useEffect, useRef } from "react";

// 海里的尘埃和点击水波。整页一层，不挡点击，不改排版。
// 三层远近：往下滚时近处的颗粒往上走得快，远处的慢，像自己在往下沉。
type Mote = { x: number; y: number; r: number; layer: number; drift: number; phase: number; blur: boolean };
type Ripple = { x: number; y: number; t0: number };

export default function SeaDust({ motion }: { motion: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current, ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    let w = 1, h = 1, dpr = 1, raf = 0, last = 0, lastScroll = window.scrollY, visible = !document.hidden;
    const motes: Mote[] = [];
    const ripples: Ripple[] = [];
    function seed() {
      motes.length = 0;
      const count = Math.round(Math.min(110, Math.max(45, (w * h) / 9000)));
      for (let i = 0; i < count; i++) {
        const layer = i % 3; // 0 远 1 中 2 近
        motes.push({ x: Math.random() * w, y: Math.random() * h, r: [0.6, 1, 1.6][layer] + Math.random() * 0.6, layer, drift: 4 + Math.random() * 8, phase: Math.random() * 6.28, blur: layer === 2 && Math.random() < 0.18 });
      }
    }
    function size() { w = window.innerWidth; h = window.innerHeight; dpr = Math.min(devicePixelRatio || 1, 1.5); canvas!.width = Math.round(w * dpr); canvas!.height = Math.round(h * dpr); seed(); }
    size();

    function paint(now: number) {
      raf = 0; if (!visible) return;
      const dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
      const scroll = window.scrollY, dScroll = scroll - lastScroll; lastScroll = scroll;
      const descent = Number(document.querySelector<HTMLElement>(".abyss-site")?.style.getPropertyValue("--ab-descent") || 0);
      const deep = Math.max(0.35, 1 - descent * 0.65);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0); ctx!.clearRect(0, 0, w, h);
      for (const m of motes) {
        const parallax = [0.25, 0.55, 1][m.layer];
        if (motion) {
          m.y += m.drift * dt * (m.layer + 1) * 0.6 - dScroll * parallax * 0.35;
          m.x += Math.sin(now / 1000 * 0.4 + m.phase) * dt * 3;
        }
        if (m.y > h + 20) { m.y = -10; m.x = Math.random() * w; }
        if (m.y < -20) { m.y = h + 10; m.x = Math.random() * w; }
        const a = ([0.22, 0.32, 0.45][m.layer]) * deep * (0.75 + Math.sin(now / 1000 * 0.8 + m.phase) * 0.25);
        if (m.blur) {
          const g = ctx!.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.r * 6);
          g.addColorStop(0, `rgba(205,226,236,${a * 0.5})`); g.addColorStop(1, "rgba(205,226,236,0)");
          ctx!.fillStyle = g; ctx!.beginPath(); ctx!.arc(m.x, m.y, m.r * 6, 0, Math.PI * 2); ctx!.fill();
        } else {
          ctx!.fillStyle = `rgba(214,230,238,${a})`; ctx!.beginPath(); ctx!.arc(m.x, m.y, m.r, 0, Math.PI * 2); ctx!.fill();
        }
      }
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i], k = (now - r.t0) / 1100;
        if (k >= 1) { ripples.splice(i, 1); continue; }
        for (let j = 0; j < 2; j++) {
          const kk = k - j * 0.18; if (kk <= 0) continue;
          const e = 1 - Math.pow(1 - kk, 2.4), rad = 8 + e * 58;
          ctx!.strokeStyle = `rgba(206,228,240,${(1 - kk) * 0.38})`; ctx!.lineWidth = 1.4 * (1 - kk) + 0.4;
          ctx!.beginPath(); ctx!.ellipse(r.x, r.y, rad, rad * 0.82, 0, 0, Math.PI * 2); ctx!.stroke();
        }
        const glow = ctx!.createRadialGradient(r.x, r.y, 0, r.x, r.y, 26);
        glow.addColorStop(0, `rgba(214,232,242,${(1 - k) * 0.18})`); glow.addColorStop(1, "rgba(214,232,242,0)");
        ctx!.fillStyle = glow; ctx!.beginPath(); ctx!.arc(r.x, r.y, 26, 0, Math.PI * 2); ctx!.fill();
      }
      if (motion || ripples.length) raf = requestAnimationFrame(paint);
    }
    function kick() { if (!raf) raf = requestAnimationFrame(paint); }

    // 轻点才起水波：按住出触手、拖动、滚动都不算
    let down: { x: number; y: number; t: number } | null = null;
    function onDown(e: PointerEvent) { down = { x: e.clientX, y: e.clientY, t: performance.now() }; }
    function onUp(e: PointerEvent) {
      if (!down || !motion) { down = null; return; }
      const quick = performance.now() - down.t < 220, still = Math.hypot(e.clientX - down.x, e.clientY - down.y) < 10;
      if (quick && still && !document.querySelector(".abyss-site[data-hand-held=true]")) { ripples.push({ x: e.clientX, y: e.clientY, t0: performance.now() }); kick(); }
      down = null;
    }
    function onScroll() { kick(); }
    function onVis() { visible = !document.hidden; if (visible) { last = 0; kick(); } }
    window.addEventListener("resize", size); window.addEventListener("pointerdown", onDown, { passive: true }); window.addEventListener("pointerup", onUp, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true }); document.addEventListener("visibilitychange", onVis);
    raf = requestAnimationFrame(paint);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", size); window.removeEventListener("pointerdown", onDown); window.removeEventListener("pointerup", onUp); window.removeEventListener("scroll", onScroll); document.removeEventListener("visibilitychange", onVis); };
  }, [motion]);
  return <canvas ref={ref} className="abyss-dust" aria-hidden="true" />;
}
