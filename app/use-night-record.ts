"use client";
import { useEffect, useState } from "react";

type Status = "loading" | "ready" | "saving" | "error";
export function useNightRecord(canEdit: boolean, localBest: number | null) {
  const [score, setScore] = useState<number | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [retry, setRetry] = useState(0);
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    const onFocus = () => setRefresh(value => value + 1);
    const onVisibility = () => { if (!document.hidden) onFocus(); };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => { window.removeEventListener("focus", onFocus); document.removeEventListener("visibilitychange", onVisibility); };
  }, []);
  useEffect(() => {
    const controller = new AbortController(); let active = true;
    fetch("/api/night-record", { cache: "no-store", signal: controller.signal })
      .then(async response => {
        const data = await response.json() as { score?: unknown };
        if (!response.ok || typeof data.score !== "number" || !Number.isSafeInteger(data.score) || data.score < 0) throw new Error("record unavailable");
        const remoteScore = data.score;
        if (active) { setScore(previous => Math.max(previous ?? 0, remoteScore)); setStatus("ready"); }
      }).catch(() => { if (active) setStatus("error"); });
    return () => { active = false; controller.abort(); };
  }, [refresh, retry]);
  useEffect(() => {
    if (!canEdit || localBest === null || score === null || localBest <= score) return;
    const controller = new AbortController(); let active = true;
    const timer = window.setTimeout(() => {
      setStatus("saving");
      fetch("/api/night-record", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score: localBest }), signal: controller.signal,
      }).then(async response => {
        const data = await response.json() as { score?: unknown };
        if (!response.ok || typeof data.score !== "number" || !Number.isSafeInteger(data.score) || data.score < localBest) throw new Error("record not saved");
        const remoteScore = data.score;
        if (active) { setScore(previous => Math.max(previous ?? 0, remoteScore)); setStatus("ready"); }
      }).catch(() => { if (active) setStatus("error"); });
    }, 600);
    return () => { active = false; clearTimeout(timer); controller.abort(); };
  }, [canEdit, localBest, score, retry, refresh]);
  return { score, status, retry: () => setRetry(value => value + 1) };
}
