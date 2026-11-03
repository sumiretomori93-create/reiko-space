"use client";

import { useEffect, useState } from "react";

// 只在 Reiko 那边的夜里出现（UTC+8，18:00 到第二天 05:00）。
function isNightInShanghai(now: Date) {
  const hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "2-digit", hour12: false, timeZone: "Asia/Shanghai" }).format(now));
  return hour >= 18 || hour < 5;
}

export default function Cuttlefish() {
  const [night, setNight] = useState(false);
  const [inked, setInked] = useState(false);

  useEffect(() => {
    const check = () => setNight(isNightInShanghai(new Date()));
    check();
    const timer = window.setInterval(check, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!inked) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setInked(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [inked]);

  if (!night) return null;

  return (
    <div className={`sea-corner${inked ? " is-inked" : ""}`}>
      <svg className="sea-jelly" viewBox="0 0 40 56" aria-hidden="true">
        <path d="M4 22 C4 8 36 8 36 22 C30 25 10 25 4 22 Z" />
        <path className="sea-jelly-tail" d="M11 24 q-3 8 0 15 q3 7 0 14 M20 25 q3 8 0 16 q-3 7 0 13 M29 24 q-3 8 0 15 q3 7 0 14" />
      </svg>
      <button type="button" className="sea-cuttle" aria-expanded={inked} aria-label={inked ? "让墨散开" : "一只睡着的墨鱼"} onClick={() => setInked(!inked)}>
        <svg viewBox="0 0 64 40" aria-hidden="true">
          <path className="sea-cuttle-fin" d="M8 20 C10 6 44 4 50 20 C44 36 10 34 8 20 Z" />
          <path className="sea-cuttle-body" d="M12 20 C14 10 42 9 46 20 C42 31 14 30 12 20 Z" />
          <path className="sea-cuttle-arms" d="M46 17 q8 -2 14 -6 M47 19 q8 0 15 -1 M47 21 q8 1 15 2 M46 23 q8 3 14 7" />
          <path className="sea-cuttle-eye" d="M38 17 q3 -2 6 0 q-1.5 2 -3 1 q-1.5 1 -3 -1 Z" />
          <circle className="sea-cuttle-spot" cx="22" cy="17" r="1.6" />
          <circle className="sea-cuttle-spot" cx="28" cy="23" r="1.3" />
          <circle className="sea-cuttle-spot" cx="32" cy="15" r="1.1" />
        </svg>
      </button>
      {inked && (
        <div className="sea-ink" role="status">
          <span className="sea-ink-cloud" aria-hidden="true" />
          <p>
            <span>C was here.</span>
            <span>比墙上那行藏得深一点。</span>
            <span>墨鱼睡着的时候会变色，</span>
            <span>梦里在追一只水母。</span>
            <span className="sea-ink-sign">— C</span>
          </p>
        </div>
      )}
    </div>
  );
}
