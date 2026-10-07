"use client";

import { runDuskTransition } from "./dusk-transition";
import { FormEvent, ReactNode, useEffect, useRef, useState } from "react";
import { formatDate, formatShortDate, fragments, profileContent, projects, socialLinks, type Comment, type Post, type Project, type ProjectKey, type Theme } from "./reiko-content";

type Props = {
  canEdit: boolean; signInPath: string; orderedPosts: Post[]; loading: boolean;
  draft: string; setDraft: (value: string) => void; publishing: boolean;
  publish: (event: FormEvent) => void; message: string;
};
const worlds: { value: Theme; label: string }[] = [
  { value: "room", label: "I · ROOM" }, { value: "garden", label: "II · GARDEN" },
  { value: "white-archive", label: "III · WHITE ARCHIVE" }, { value: "oumagatoki", label: "IV · 宵伽" },
];
function PaperDialog({ title, close, children, className = "" }: { title: string; close: () => void; children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current; const previous = document.activeElement as HTMLElement | null;
    dialog?.showModal(); const old = document.body.style.overflow; document.body.style.overflow = "hidden";
    return () => { dialog?.close(); document.body.style.overflow = old; previous?.focus(); };
  }, []);
  return <dialog ref={ref} className={`dusk-dialog ${className}`} aria-label={title} onCancel={close} onClick={(event) => { if (event.target === event.currentTarget) { const r = event.currentTarget.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) close(); } }}><button type="button" className="dusk-close" aria-label="合上这一页" onClick={close}>×</button>{children}</dialog>;
}
function DiaryPage({ post, canEdit, signInPath, close }: { post: Post; canEdit: boolean; signInPath: string; close: () => void }) {
  const [comments, setComments] = useState<Comment[]>([]); const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState(""); const [saving, setSaving] = useState(false); const [message, setMessage] = useState("");
  useEffect(() => {
    let active = true;
    fetch(`/api/posts/${post.id}/comments`).then(async response => { const data = await response.json() as { error?: string; comments?: Comment[]; comment: Comment }; if (!response.ok) throw new Error(data.error || "批注暂时无法读取。"); if (active) setComments(data.comments || []); }).catch(error => { if (active) setMessage(error.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [post.id]);
  async function annotate(event: FormEvent) {
    event.preventDefault(); if (!draft.trim() || saving) return; setSaving(true); setMessage("");
    try { const response = await fetch(`/api/posts/${post.id}/comments`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ content: draft.trim() }) }); const data = await response.json() as { error?: string; comments?: Comment[]; comment: Comment }; if (!response.ok) throw new Error(data.error || "批注保存失败。"); setComments(items => [...items, data.comment]); setDraft(""); setMessage("批注已经留下了。"); }
    catch (error) { setMessage(error instanceof Error ? error.message : "批注保存失败。"); } finally { setSaving(false); }
  }
  return <PaperDialog title="黄昏手记" close={close} className="dusk-memory-page"><img className="dusk-memory-art" src="/reiko-assets/oumagatoki/reiko-diary-paper.png" alt="" /><span className="dusk-memory-mark" lang="ja">残された記憶</span><span className="dusk-meta">DIARY / {formatShortDate(post.createdAt)}</span><h2 className="sr-only">黄昏の手記</h2><div className="dusk-memory-body" tabIndex={0} aria-label="手记正文与批注"><p className="dusk-full-copy">{post.content}</p><section className="dusk-annotations"><h3>页边的批注</h3>{loading && <p>正在翻开批注……</p>}{!loading && !comments.length && <p className="dusk-muted">这一页还没有批注。</p>}{comments.map(comment => <article key={comment.id}><time>{formatDate(comment.createdAt)}</time><p>{comment.content}</p></article>)}{canEdit ? <form onSubmit={annotate}><label htmlFor="dusk-annotation">留下批注</label><textarea id="dusk-annotation" maxLength={500} value={draft} onChange={event => setDraft(event.target.value)} /><button disabled={saving || !draft.trim()}>{saving ? "保存中" : "留下批注"}</button></form> : <a href={signInPath} target="_top">主人登录后写批注</a>}{message && <output role="status">{message}</output>}</section></div></PaperDialog>;
}
function DuskPlayer() {
  const ref = useRef<HTMLAudioElement>(null); const [playing, setPlaying] = useState(false); const [message, setMessage] = useState("");
  async function toggle() { const audio = ref.current; if (!audio) return; setMessage(""); if (!audio.paused) audio.pause(); else try { await audio.play(); } catch { setMessage("音乐暂时无法播放，请再试一次。"); } }
  return <div className="dusk-player"><audio ref={ref} src="/reiko-assets/oumagatoki/shichibi-no-tasogare.mp3" preload="none" loop onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onError={() => setMessage("音乐暂时无法载入。")} onLoadedMetadata={event => { event.currentTarget.volume = 0.3; }} /><button type="button" onClick={toggle} aria-label={playing ? "暂停音乐" : "播放音乐"} aria-pressed={playing}>{playing ? "Ⅱ" : "▶"}</button><div><span>LISTENING ROOM</span><p>Shichibi no Tasogare</p></div><span className="dusk-player-state">{playing ? "PLAYING" : "SOUND OFF"}</span>{message && <output role="status">{message}</output>}</div>;
}
export default function Oumagatoki(props: Props) {
  const { canEdit, signInPath, orderedPosts, loading, draft, setDraft, publishing, publish, message } = props;
  const [selectedPost, setSelectedPost] = useState<Post | null>(null); const [selectedProject, setSelectedProject] = useState<Project | null>(null); const [secret, setSecret] = useState(false);
  const [previewId, setPreviewId] = useState<number | null>(null);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [composing, setComposing] = useState(false);
  const [query, setQuery] = useState("");
  const [month, setMonth] = useState("");
  const latest = orderedPosts[0];
  const preview = orderedPosts.find(post => post.id === previewId) || latest;
  const entryRef = useRef<HTMLDivElement>(null);
  const archiveTrigger = useRef<HTMLButtonElement>(null);
  const archiveScroll = useRef(0);
  useEffect(() => {
    if (!archiveOpen || selectedPost) return;
    const frame = requestAnimationFrame(() => { const dialog = document.querySelector<HTMLDialogElement>(".dusk-dialog"); if (dialog) dialog.scrollTop = archiveScroll.current; });
    return () => cancelAnimationFrame(frame);
  }, [archiveOpen, selectedPost]);
  function closeArchive() { setArchiveOpen(false); requestAnimationFrame(() => archiveTrigger.current?.focus({ preventScroll: true })); }
  const latestId = latest?.id;
  useEffect(() => { setPreviewId(null); }, [latestId]);
  const monthOf = (post: Post) => formatShortDate(post.createdAt).split(".").slice(0, 2).join(".");
  const months = Array.from(new Set(orderedPosts.map(monthOf)));
  const filtered = orderedPosts.filter(post => (!month || monthOf(post) === month) && (!query.trim() || post.content.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()) || formatShortDate(post.createdAt).includes(query.trim())));
  const groups = Array.from(new Set(filtered.map(monthOf))).map(key => ({ key, posts: filtered.filter(post => monthOf(post) === key) }));
  function openArchive() { runDuskTransition(() => setArchiveOpen(true)); }
  function openPreview() { if (preview) runDuskTransition(() => setSelectedPost(preview)); else entryRef.current?.scrollIntoView({ behavior: "smooth" }); }


  return <div className="dusk-site" id="dusk-top">
    <header className="dusk-hero">
      <img className="dusk-sky" src="/reiko-assets/oumagatoki/sunset.jpg" alt="澄澈的蓝色天空，绯红的云与橙金色的日落" fetchPriority="high" />
      <img className="dusk-eaves" src="/reiko-assets/oumagatoki/eaves.png" alt="" />
      <nav className="dusk-nav" aria-label="主导航"><a className="dusk-brand" href="#dusk-top">Reiko<span>THEME IV / YOI NO TOGI</span></a><div className="dusk-nav-links"><a href="#dusk-diary">日記</a><a href="#dusk-works">作品</a><a href="#dusk-notes">手記</a><a href="#dusk-outside">外へ</a></div><label className="dusk-world"><span className="sr-only">切换主题</span><select aria-label="切换主题" value="oumagatoki" onChange={event => window.dispatchEvent(new CustomEvent("reiko-theme", { detail: event.target.value }))}>{worlds.map(world => <option key={world.value} value={world.value}>{world.label}</option>)}</select></label></nav>
      <div className="dusk-title"><h1 lang="ja">宵伽</h1><span lang="ja">よいのとぎ</span></div>
      <div className="dusk-threshold"><p>最后一点光还在。</p><span>BETWEEN DAY AND NIGHT</span><a href="#dusk-diary" onClick={event => { event.preventDefault(); openPreview(); }}>翻开日记</a></div>
      <div className="dusk-first-pages" id="dusk-diary" ref={entryRef}>
        <div className="dusk-index">
          <div className="dusk-index-heading"><h2>日記の目録</h2><span>DIARY / {orderedPosts.length.toString().padStart(2, "0")}</span></div>
          {loading ? <p role="status">正在翻开手记……</p> : orderedPosts.length ? orderedPosts.slice(0, 3).map((post, i) => <button type="button" key={post.id} aria-pressed={preview?.id === post.id} aria-controls="dusk-current-page" onClick={() => { setPreviewId(post.id); if (window.matchMedia("(max-width:560px)").matches) document.getElementById("dusk-current-page")?.scrollIntoView({ behavior: "smooth", block: "center" }); }}><span className="dusk-seal">{["一", "二", "三"][i]}</span><span className="dusk-index-copy">{post.content}</span><time>{formatShortDate(post.createdAt)}</time></button>) : <p className="dusk-muted">等一页新的手记。</p>}
          <div className="dusk-index-actions"><button className="dusk-index-all" ref={archiveTrigger} type="button" onClick={openArchive}>全部手记 <span aria-hidden="true">→</span></button>{canEdit ? <button type="button" className="dusk-write-link" aria-expanded={composing} aria-controls="dusk-entry-composer" onClick={() => setComposing(!composing)}>{composing ? "收起这页纸" : "写一页"}</button> : <a className="dusk-write-link" href={signInPath} target="_top">主人登录 · 写一页</a>}</div>
          {canEdit && composing && <form id="dusk-entry-composer" className="dusk-composer" onSubmit={publish}><label htmlFor="dusk-draft">写下今天的日记</label><textarea id="dusk-draft" value={draft} onChange={event => setDraft(event.target.value)} maxLength={500} placeholder="今天，想留下什么？" /><div><span>{draft.length} / 500</span><button disabled={publishing || !draft.trim()}>{publishing ? "保存中" : "留下这一页"}</button></div></form>}
          {message && <output className="dusk-message" role="status">{message}</output>}
        </div>
        <div className="dusk-kept-page" id="dusk-current-page"><button className="dusk-paper-preview" type="button" disabled={!preview} aria-label={preview ? `翻开手记 · ${formatShortDate(preview.createdAt)}` : "还没有手记"} onClick={openPreview}><img className="dusk-card-art" src="/reiko-assets/oumagatoki/reiko-journal.png" alt="" /><span className="dusk-meta">{preview ? formatShortDate(preview.createdAt) : "A PAGE KEPT AT DUSK"}</span><h2 className="sr-only" lang="ja">黄昏の手記</h2><p aria-live="polite">{preview ? preview.content : "把今天，留在天色暗下来以前。"}</p><span className="dusk-paper-number">REIKO / IV</span></button>{preview && <span className="dusk-page-hint">点这页纸，翻开全文与批注</span>}<DuskPlayer /></div>
      </div>
    </header>
    <div className="dusk-below-hero"><main className="dusk-main">
      <section className="dusk-section" id="dusk-works"><header className="dusk-heading"><span>二 / WORKS</span><h2><span>留在此岸的东西</span></h2><p>つくったもの</p></header><div className="dusk-works">{(Object.keys(projects) as ProjectKey[]).map((key, index) => <button type="button" key={key} onClick={() => setSelectedProject(projects[key])}><span className="dusk-work-number">0{index + 1}</span><div><span className="dusk-meta">{projects[key].mark}</span><h3>{projects[key].title}</h3><p>{projects[key].summary}</p></div><span className="dusk-work-file">{projects[key].file}</span></button>)}</div></section>
      <section className="dusk-section dusk-notes" id="dusk-notes"><header className="dusk-heading"><span>三 / NOTES</span><h2><span>灯下的几行字</span></h2><p>わたしについて</p></header><div className="dusk-notes-grid"><article className="dusk-profile"><img className="dusk-card-art" src="/reiko-assets/oumagatoki/reiko-profile.png" alt="" loading="lazy" /><span className="dusk-meta">PRIVATE ROOM / REIKO</span><h3>{profileContent.name}</h3>{profileContent.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}<dl>{profileContent.details.map(([term, value]) => <div key={term}><dt>{term}</dt><dd>{value}</dd></div>)}</dl></article><aside className="dusk-margins"><span>余白に残す</span><p>{fragments[0]}</p><p>{fragments[1]}</p><button type="button" aria-expanded={secret} onClick={() => setSecret(!secret)}>{secret ? fragments[2] : "一张折起来的纸"}</button></aside></div></section>
      <section className="dusk-section dusk-outside" id="dusk-outside"><header className="dusk-heading"><span>四 / ELSEWHERE</span><h2><span>夜路，通向别处</span></h2><p>外へ</p></header><div className="dusk-outside-links">{socialLinks.map(link => <a key={link.key} href={link.href} target="_blank" rel="noreferrer"><span>{link.label}</span><small>{link.note}</small></a>)}</div></section>
    </main><footer className="dusk-footer"><span>REIKO / 宵伽</span><a href="#dusk-top">回到黄昏</a></footer></div>
    {archiveOpen && !selectedPost && <PaperDialog title="全部手记" close={closeArchive}><div className="dusk-archive"><span className="dusk-meta">DIARY / {orderedPosts.length} PAGES</span><h2>天色暗下来以前</h2><p className="dusk-archive-intro">按年月，寻回留在这里的一页。</p><div className="dusk-archive-tools"><label>寻找手记<input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="一句话，或一个日期" /></label><label>年月<select value={month} onChange={event => setMonth(event.target.value)}><option value="">全部年月</option>{months.map(value => <option key={value} value={value}>{value.replace(".", " 年 ")} 月</option>)}</select></label></div><p className="dusk-archive-count" role="status">{loading ? "正在翻开手记……" : `共 ${filtered.length} 页`}</p>{!loading && !filtered.length && <p className="dusk-muted">{orderedPosts.length ? "没有找到这一页，试试别的词或年月。" : "这里还没有日记。"}</p>}{groups.map(group => <section className="dusk-archive-month" key={group.key}><h3>{group.key.replace(".", " 年 ")} 月</h3>{group.posts.map(post => <button type="button" key={post.id} onClick={event => { archiveScroll.current = event.currentTarget.closest("dialog")?.scrollTop || 0; runDuskTransition(() => { setPreviewId(post.id); setSelectedPost(post); }); }}><time>{formatShortDate(post.createdAt)}</time><span>{post.content}</span><span aria-hidden="true">→</span></button>)}</section>)}</div></PaperDialog>}
    {selectedPost && <DiaryPage key={selectedPost.id} post={selectedPost} canEdit={canEdit} signInPath={signInPath} close={() => setSelectedPost(null)} />}
    {selectedProject && <PaperDialog title={selectedProject.title} close={() => setSelectedProject(null)}><span className="dusk-meta">WORKS / {selectedProject.mark}</span><h2>{selectedProject.title}</h2><em>{selectedProject.subtitle}</em><p className="dusk-full-copy">{selectedProject.detail}</p><small>{selectedProject.file}</small></PaperDialog>}
  </div>;
}
