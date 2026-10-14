import { createHash } from "node:crypto";
import { ne, or, lt, sql } from "drizzle-orm";
import { getDb } from "../db";
import { requestLimits } from "../db/schema";
import { getChatGPTUser } from "./chatgpt-auth";

export class RequestError extends Error {
  constructor(public status: number, message: string, public retryAfter?: number) { super(message); }
}
export function requestError(error: unknown) {
  if (!(error instanceof RequestError)) return null;
  return Response.json({ error: error.message }, { status: error.status,
    headers: { "Cache-Control": "no-store", ...(error.retryAfter ? { "Retry-After": String(error.retryAfter) } : {}) } });
}
export async function owner(request: Request) {
  const user = await getChatGPTUser();
  if (user?.email.toLowerCase() !== "sumire.tomori93@gmail.com") throw new RequestError(403, "只有 Reiko 可以进行这个操作。");
  if (request.headers.get("sec-fetch-site") === "cross-site") throw new RequestError(403, "请从本站页面进行操作。");
  if (request.method !== "GET") {
    const origin = request.headers.get("origin");
    if (origin !== new URL(request.url).origin || request.headers.get("sec-fetch-site") === "cross-site") {
      throw new RequestError(403, "请从本站页面进行操作。");
    }
  }
  return user;
}
export async function readJson(request: Request): Promise<Record<string, unknown>> {
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get("content-type") || "")) throw new RequestError(415, "请求需要使用 JSON 格式。");
  const maxBytes = 4096;
  const length = request.headers.get("content-length");
  if (length && (!/^\d+$/.test(length) || Number(length) > maxBytes)) throw new RequestError(413, "提交内容太大。");
  const reader = request.body?.getReader();
  if (!reader) throw new RequestError(400, "请求内容无效。");
  const parts: Uint8Array[] = []; let total = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read(); if (done) break;
      total += value.byteLength;
      if (total > maxBytes) { await reader.cancel(); throw new RequestError(413, "提交内容太大。"); }
      parts.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(total); let offset = 0;
  for (const part of parts) { bytes.set(part, offset); offset += part.length; }
  let value: unknown;
  try { value = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)); }
  catch { throw new RequestError(400, "请求内容不是有效的 JSON。"); }
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new RequestError(400, "请求内容无效。");
  return value as Record<string, unknown>;
}
// Atomic D1 counters work across Worker instances. Counts include canceled requests.
export async function limitRequest(request: Request, scope: string, limit: number, seconds = 60, userId?: string) {
  const now = Math.floor(Date.now() / 1000), start = Math.floor(now / seconds) * seconds;
  const identity = userId ? `user:${userId}` : `ip:${request.headers.get("cf-connecting-ip") || "unknown"}`;
  const key = `${scope}:${createHash("sha256").update(identity).digest("hex")}`;
  let allowed;
  try {
    [allowed] = await getDb().insert(requestLimits).values({ key, windowStart: start, count: 1 })
      .onConflictDoUpdate({ target: requestLimits.key, set: { windowStart: start,
        count: sql`case when ${requestLimits.windowStart} != ${start} then 1 else ${requestLimits.count} + 1 end` },
        setWhere: or(ne(requestLimits.windowStart, start), lt(requestLimits.count, limit)),
      }).returning({ count: requestLimits.count });
  } catch { throw new RequestError(503, "服务暂时繁忙，请稍后再试。"); }
  if (!allowed) throw new RequestError(429, "操作有些频繁，请稍后再试。", seconds - (now - start));
  // Occasional bounded cleanup; no schema changes in request handlers.
  if (now % 60 === 0) {
    await getDb().run(sql`delete from ${requestLimits} where key in (select key from ${requestLimits} where window_start < ${now - 86400} limit 100)`).catch(() => {});
  }
}
