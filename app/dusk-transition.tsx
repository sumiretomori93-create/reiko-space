"use client";

import { useEffect, useRef } from "react";

const frames = Array.from({ length: 15 }, (_, index) => `/reiko-assets/oumagatoki/red-butterfly/red_butterfly_${index + 1}.png`);
let transition: ((action: () => void) => void) | null = null;

export function runDuskTransition(action: () => void) {
  if (transition) transition(action);
  else action();
}

export default function DuskTransition() {
  const dialog = useRef<HTMLDialogElement>(null);
  const image = useRef<HTMLImageElement>(null);
  const cancel = useRef<() => void>(() => {});

  useEffect(() => {
    let alive = true;
    let ready = false;
    let busy = false;
    let raf = 0;
    let pending: (() => void) | null = null;
    const loaded = frames.map(src => { const img = new Image(); img.src = src; return img; });
    void Promise.all(loaded.map(img => img.decode())).then(() => { if (alive) ready = true; }).catch(() => { ready = false; });
    function finish(complete: boolean) {
      cancelAnimationFrame(raf);
      dialog.current?.close();
      const action = pending;
      pending = null;
      busy = false;
      if (complete && alive) action?.();
    }
    cancel.current = () => finish(false);
    const start = (action: () => void) => {
      if (busy) return;
      if (!ready || window.matchMedia("(prefers-reduced-motion: reduce)").matches) { action(); return; }
      busy = true;
      pending = action;
      if (image.current) image.current.src = frames[0];
      dialog.current?.showModal();
      const begun = performance.now();
      let last = -1;
      function tick(now: number) {
        const elapsed = now - begun;
        if (elapsed >= 1000) { finish(true); return; }
        const next = Math.min(14, Math.floor(elapsed * 15 / 1000));
        if (next !== last && image.current) { image.current.src = frames[next]; last = next; }
        raf = requestAnimationFrame(tick);
      }
      raf = requestAnimationFrame(tick);
    };
    transition = start;
    return () => { alive = false; finish(false); if (transition === start) transition = null; };
  }, []);

  return <dialog ref={dialog} className="dusk-butterfly-transition" aria-label="红蝶正在翻页" onCancel={event => { event.preventDefault(); cancel.current(); }}>
    <span className="sr-only">红蝶正在翻页，按 Escape 可以取消。</span>
    <img ref={image} src={frames[0]} alt="" className="dusk-transition-butterfly" />
  </dialog>;
}
