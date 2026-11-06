"use client";
import { useEffect, useRef, useState } from "react";
import "./manager.css";

type Post = { id: number; content: string; createdAt: string; deletedAt: string | null };
function date(value: string) {
  const parsed = new Date(value.includes("T") ? value : value.replace(" ", "T") + "Z");
  return parsed.toLocaleString("zh-CN", { timeZone: "Asia/Kuala_Lumpur", hour12: false });
}
export default function DiaryManager() {
  const [posts, setPosts] = useState<Post[]>([]), [loading, setLoading] = useState(true);
  const [trash, setTrash] = useState(false), [query, setQuery] = useState("");
  const [pending, setPending] = useState<Post | null>(null), [busy, setBusy] = useState(false), [message, setMessage] = useState("");
  const lock = useRef(false), dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { let active = true; fetch("/api/posts/manage").then(async r => { const data = await r.json() as { error?: string; posts: Post[] }; if (!r.ok) throw Error(data.error || "读取失败"); if (active) setPosts(data.posts); }).catch(e => { if (active) setMessage(e.message); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, []);
  useEffect(() => { if (pending) dialog.current?.showModal(); else dialog.current?.close(); }, [pending]);
  async function change(post: Post, restore: boolean) {
    if (lock.current) return; lock.current = true; setBusy(true); setMessage("");
    try {
      const response = await fetch(`/api/posts/${post.id}`, { method: restore ? "PATCH" : "DELETE" });
      const data = await response.json() as { error?: string; post: Post }; if (!response.ok) throw Error(data.error || "操作失败");
      setPosts(items => items.map(item => item.id === post.id ? data.post : item));
      setPending(null); setMessage(restore ? "日记已恢复，重新显示在个人站。" : "日记已移入回收站，公开页面不再显示。需要时可以恢复。");
    } catch (e) { setMessage(e instanceof Error ? e.message : "操作失败，请重试。"); }
    finally { lock.current = false; setBusy(false); }
  }
  const visible = posts.filter(post => Boolean(post.deletedAt) === trash && (!query || (post.content + date(post.createdAt)).includes(query)));
  return <main className="diary-manager"><a href="/">← 返回个人站</a><header><p>REIKO / DIARY</p><h1>管理日记</h1><p>删除后会移入回收站，日记和批注均可恢复。</p></header>
    <nav aria-label="日记分类"><button aria-pressed={!trash} onClick={() => { setTrash(false); setMessage(""); }}>已发布 · {posts.filter(p => !p.deletedAt).length}</button><button aria-pressed={trash} onClick={() => { setTrash(true); setMessage(""); }}>回收站 · {posts.filter(p => p.deletedAt).length}</button></nav>
    <label className="diary-search">寻找日记<input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="按文字或日期搜索" /></label>
    <p role="status">{message || (loading ? "正在读取日记……" : `${visible.length} 条日记`)}</p>
    {!loading && visible.length === 0 && <p>这里还没有日记。</p>}
    {visible.map(post => <article key={post.id}><div><time>{date(post.createdAt)}</time><button disabled={busy} onClick={() => post.deletedAt ? change(post, true) : setPending(post)}>{post.deletedAt ? "恢复日记" : "删除日记"}</button></div><p>{post.content}</p></article>)}
    <dialog ref={dialog} onCancel={e => { if (busy) e.preventDefault(); else setPending(null); }}><h2>删除这篇日记？</h2><p>它会移入回收站，公开页面不再显示。批注会一同保留，恢复日记后可重新查看。</p>{pending && <><time>{date(pending.createdAt)}</time><blockquote>{pending.content}</blockquote></>}<div className="diary-confirm"><button disabled={busy} onClick={() => setPending(null)}>保留日记</button><button disabled={busy} onClick={() => pending && change(pending, false)}>{busy ? "正在处理……" : "移入回收站"}</button></div></dialog>
  </main>;
}
