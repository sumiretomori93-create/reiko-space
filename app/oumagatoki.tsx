"use client";

import { FormEvent, ReactNode, useEffect, useRef, useState } from "react";
import { formatDate, formatShortDate, fragments, profileContent, projects, socialLinks, type Comment, type Post, type Project, type ProjectKey, type Theme } from "./reiko-content";

type Props = {
  canEdit: boolean; signInPath: string; orderedPosts: Post[]; loading: boolean;
  postsExpanded: boolean; setPostsExpanded: (value: boolean) => void;
  draft: string; setDraft: (value: string) => void; publishing: boolean;
  publish: (event: FormEvent) => void; message: string;
};
const worlds: { value: Theme; label: string }[] = [
  { value: "room", label: "I · ROOM" }, { value: "garden", label: "II · GARDEN" },
  { value: "white-archive", label: "III · WHITE ARCHIVE" }, { value: "oumagatoki", label: "IV · 逢魔の時" },
];
function PaperDialog({ title, close, children }: { title: string; close: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current; const previous = document.activeElement as HTMLElement | null;
    dialog?.showModal(); const old = document.body.style.overflow; document.body.style.overflow = "hidden";
    return () => { dialog?.close(); document.body.style.overflow = old; previous?.focus(); };
  }, []);
  return <dialog ref={ref} className="dusk-dialog" aria-label={title} onCancel={close} onClick={(event) => { if (event.target === event.currentTarget) { const r = event.currentTarget.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) close(); } }}><button type="button" className="dusk-close" aria-label="合上这一页" onClick={close}>×</button>{children}</dialog>;
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
  return <PaperDialog title="黄昏手记" close={close}><span className="dusk-meta">DIARY / {formatShortDate(post.createdAt)}</span><h2>黄昏の手記</h2><p className="dusk-full-copy">{post.content}</p><section className="dusk-annotations"><h3>页边的批注</h3>{loading && <p>正在翻开批注……</p>}{!loading && !comments.length && <p className="dusk-muted">这一页还没有批注。</p>}{comments.map(comment => <article key={comment.id}><time>{formatDate(comment.createdAt)}</time><p>{comment.content}</p></article>)}{canEdit ? <form onSubmit={annotate}><label htmlFor="dusk-annotation">留下批注</label><textarea id="dusk-annotation" maxLength={500} value={draft} onChange={event => setDraft(event.target.value)} /><button disabled={saving || !draft.trim()}>{saving ? "保存中" : "留下批注"}</button></form> : <a href={signInPath} target="_top">主人登录后写批注</a>}{message && <output role="status">{message}</output>}</section></PaperDialog>;
}
function DuskPlayer() {
  const ref = useRef<HTMLAudioElement>(null); const [playing, setPlaying] = useState(false); const [message, setMessage] = useState("");
  async function toggle() { const audio = ref.current; if (!audio) return; setMessage(""); if (!audio.paused) audio.pause(); else try { await audio.play(); } catch { setMessage("音乐暂时无法播放，请再试一次。"); } }
  return <div className="dusk-player"><audio ref={ref} src="/reiko-assets/oumagatoki/shichibi-no-tasogare.mp3" preload="none" loop onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onError={() => setMessage("音乐暂时无法载入。")} onLoadedMetadata={event => { event.currentTarget.volume = 0.3; }} /><button type="button" onClick={toggle} aria-label={playing ? "暂停音乐" : "播放音乐"} aria-pressed={playing}>{playing ? "Ⅱ" : "▶"}</button><div><span>LISTENING ROOM</span><p>Shichibi no Tasogare</p></div><span className="dusk-player-state">{playing ? "PLAYING" : "SOUND OFF"}</span>{message && <output role="status">{message}</output>}</div>;
}
export default function Oumagatoki(props: Props) {
  const { canEdit, signInPath, orderedPosts, loading, postsExpanded, setPostsExpanded, draft, setDraft, publishing, publish, message } = props;
  const [selectedPost, setSelectedPost] = useState<Post | null>(null); const [selectedProject, setSelectedProject] = useState<Project | null>(null); const [secret, setSecret] = useState(false);
  const latest = orderedPosts[0]; const visible = postsExpanded ? orderedPosts : orderedPosts.slice(0, 6);
  return <div className="dusk-site" id="dusk-top">
    <header className="dusk-hero">
      <img className="dusk-sky" src="/reiko-assets/oumagatoki/sunset.jpg" alt="澄澈的蓝色天空，绯红的云与橙金色的日落" fetchPriority="high" />
      <img className="dusk-eaves" src="/reiko-assets/oumagatoki/eaves.png" alt="" />
      <nav className="dusk-nav" aria-label="主导航"><a className="dusk-brand" href="#dusk-top">Reiko<span>THEME IV / OUMAGATOKI</span></a><div className="dusk-nav-links"><a href="#dusk-diary">日記</a><a href="#dusk-works">作品</a><a href="#dusk-notes">手記</a><a href="#dusk-outside">外へ</a></div><label className="dusk-world"><span className="sr-only">切换主题</span><select aria-label="切换主题" value="oumagatoki" onChange={event => window.dispatchEvent(new CustomEvent("reiko-theme", { detail: event.target.value }))}>{worlds.map(world => <option key={world.value} value={world.value}>{world.label}</option>)}</select></label></nav>
      <div className="dusk-title"><h1 lang="ja">逢魔の時</h1><span>REIKO&apos;S PRIVATE ROOM</span></div>
      <div className="dusk-threshold"><p>最后一点光还在。</p><span>BETWEEN DAY AND NIGHT</span><a href="#dusk-diary">翻开日记</a></div>
      <div className="dusk-first-pages"><div className="dusk-index"><div className="dusk-index-heading"><h2>日記の目録</h2><span>DIARY / {orderedPosts.length.toString().padStart(2, "0")}</span></div>{loading ? <p>正在翻开手记……</p> : orderedPosts.length ? orderedPosts.slice(0, 3).map((post, i) => <button type="button" key={post.id} onClick={() => setSelectedPost(post)}><span className="dusk-seal">{["一", "二", "三"][i]}</span><span className="dusk-index-copy">{post.content}</span><time>{formatShortDate(post.createdAt)}</time></button>) : <p className="dusk-muted">等一页新的手记。</p>}<a className="dusk-index-all" href="#dusk-diary">全部手记</a></div><div className="dusk-kept-page"><button className="dusk-paper-preview" type="button" onClick={() => latest ? setSelectedPost(latest) : document.getElementById("dusk-diary")?.scrollIntoView()}><img className="dusk-card-art" src="/reiko-assets/oumagatoki/reiko-journal.png" alt="" /><span className="dusk-meta">{latest ? formatShortDate(latest.createdAt) : "A PAGE KEPT AT DUSK"}</span><h2 className="sr-only" lang="ja">黄昏の手記</h2><p>{latest ? latest.content : "把今天，留在天色暗下来以前。"}</p><span className="dusk-paper-number">REIKO / IV</span></button><DuskPlayer /></div></div>
    </header>
    <div className="dusk-below-hero"><main className="dusk-main">
      <section className="dusk-section" id="dusk-diary"><header className="dusk-heading"><span>一 / DIARY</span><h2>天色暗下来以前</h2><p>日記の続き</p></header>{canEdit ? <form className="dusk-composer" onSubmit={publish}><label htmlFor="dusk-draft">写下今天的日记</label><textarea id="dusk-draft" value={draft} onChange={event => setDraft(event.target.value)} maxLength={500} placeholder="今天，想留下什么？" /><div><span>{draft.length} / 500</span><button disabled={publishing || !draft.trim()}>{publishing ? "保存中" : "留下这一页"}</button></div></form> : <a className="dusk-owner" href={signInPath} target="_top">主人登录 · 写一页日记</a>}{message && <output className="dusk-message" role="status">{message}</output>}<div className="dusk-diary-grid">{loading && <p>正在翻开手记……</p>}{!loading && !visible.length && <p>这里还没有日记。</p>}{visible.map((post, index) => <button type="button" className={"dusk-diary-leaf dusk-leaf-" + (index % 3)} key={post.id} onClick={() => setSelectedPost(post)}><img className="dusk-card-art" src={`/reiko-assets/oumagatoki/paper-${["a", "b", "c"][index % 3]}.png`} alt="" loading="lazy" /><span className="dusk-leaf-top"><time>{formatShortDate(post.createdAt)}</time><span>{String(index + 1).padStart(2, "0")}</span></span><p>{post.content}</p><span className="dusk-leaf-bottom">翻开 · 批注</span></button>)}</div>{orderedPosts.length > 6 && <button className="dusk-more" type="button" aria-expanded={postsExpanded} onClick={() => setPostsExpanded(!postsExpanded)}>{postsExpanded ? "合上较早的手记" : `更早的手记 · 共 ${orderedPosts.length} 页`}</button>}</section>
      <section className="dusk-section" id="dusk-works"><header className="dusk-heading"><span>二 / WORKS</span><h2>留在此岸的东西</h2><p>つくったもの</p></header><div className="dusk-works">{(Object.keys(projects) as ProjectKey[]).map((key, index) => <button type="button" key={key} onClick={() => setSelectedProject(projects[key])}><span className="dusk-work-number">0{index + 1}</span><div><span className="dusk-meta">{projects[key].mark}</span><h3>{projects[key].title}</h3><p>{projects[key].summary}</p></div><span className="dusk-work-file">{projects[key].file}</span></button>)}</div></section>
      <section className="dusk-section dusk-notes" id="dusk-notes"><header className="dusk-heading"><span>三 / NOTES</span><h2>灯下的几行字</h2><p>わたしについて</p></header><div className="dusk-notes-grid"><article className="dusk-profile"><img className="dusk-card-art" src="/reiko-assets/oumagatoki/paper-c.png" alt="" loading="lazy" /><span className="dusk-meta">PRIVATE ROOM / REIKO</span><h3>{profileContent.name}</h3>{profileContent.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}<dl>{profileContent.details.map(([term, value]) => <div key={term}><dt>{term}</dt><dd>{value}</dd></div>)}</dl></article><aside className="dusk-margins"><span>余白に残す</span><p>{fragments[0]}</p><p>{fragments[1]}</p><button type="button" aria-expanded={secret} onClick={() => setSecret(!secret)}>{secret ? fragments[2] : "一张折起来的纸"}</button></aside></div></section>
      <section className="dusk-section dusk-outside" id="dusk-outside"><header className="dusk-heading"><span>四 / ELSEWHERE</span><h2>夜路，通向别处</h2><p>外へ</p></header><div className="dusk-outside-links">{socialLinks.map(link => <a key={link.key} href={link.href} target="_blank" rel="noreferrer"><span>{link.label}</span><small>{link.note}</small></a>)}</div></section>
    </main><footer className="dusk-footer"><span>REIKO / 逢魔の時</span><a href="#dusk-top">回到黄昏</a></footer></div>
    {selectedPost && <DiaryPage key={selectedPost.id} post={selectedPost} canEdit={canEdit} signInPath={signInPath} close={() => setSelectedPost(null)} />}
    {selectedProject && <PaperDialog title={selectedProject.title} close={() => setSelectedProject(null)}><span className="dusk-meta">WORKS / {selectedProject.mark}</span><h2>{selectedProject.title}</h2><em>{selectedProject.subtitle}</em><p className="dusk-full-copy">{selectedProject.detail}</p><small>{selectedProject.file}</small></PaperDialog>}
  </div>;
}
