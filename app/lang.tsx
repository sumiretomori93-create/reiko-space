"use client";

import { useEffect, useState } from "react";

export type Lang = "zh" | "en";

const KEY = "reiko-lang";
const EVENT = "reiko-lang";

function readLang(): Lang {
  const requested = new URLSearchParams(window.location.search).get("lang");
  if (requested === "en" || requested === "zh") return requested;
  try { return window.localStorage.getItem(KEY) === "en" ? "en" : "zh"; } catch { return "zh"; }
}

export function setLang(next: Lang) {
  try { window.localStorage.setItem(KEY, next); } catch {}
  const url = new URL(window.location.href);
  if (next === "en") url.searchParams.set("lang", "en"); else url.searchParams.delete("lang");
  window.history.replaceState(null, "", url);
  document.documentElement.lang = next === "en" ? "en" : "zh-CN";
  window.dispatchEvent(new CustomEvent<Lang>(EVENT, { detail: next }));
}

// 访客语言：?lang=en 优先，其次是上次的选择，默认中文。所有组件各自订阅，切换时一起变。
export function useLang() {
  const [lang, setLocal] = useState<Lang>("zh");
  useEffect(() => {
    const initial = readLang();
    setLocal(initial);
    document.documentElement.lang = initial === "en" ? "en" : "zh-CN";
    const onChange = (event: Event) => setLocal((event as CustomEvent<Lang>).detail);
    window.addEventListener(EVENT, onChange);
    return () => window.removeEventListener(EVENT, onChange);
  }, []);
  const t = (zh: string, en: string) => (lang === "en" ? en : zh);
  return { lang, t };
}

export function LangToggle({ className }: { className?: string }) {
  const { lang } = useLang();
  return (
    <button type="button" className={className} onClick={() => setLang(lang === "en" ? "zh" : "en")} aria-label={lang === "en" ? "切换到中文" : "Switch to English"}>
      <span aria-hidden={lang !== "zh"} className={lang === "zh" ? "is-on" : ""}>中</span>
      <span aria-hidden="true">/</span>
      <span aria-hidden={lang !== "en"} className={lang === "en" ? "is-on" : ""}>EN</span>
    </button>
  );
}
