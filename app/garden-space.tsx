"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { formatShortDate as formatDate, fragments, projects, socialLinks, type Post, type Project, type ProjectKey } from "./reiko-content";
const gardenPath = "/reiko-assets/green-garden/Green_garden";
function GardenProjectModal({ project, close }: { project: Project; close: () => void }) {
  return <div className="garden-modal-backdrop" role="presentation" onMouseDown={close}><article className="garden-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}><button type="button" className="garden-modal-close" onClick={close} aria-label="关闭项目">×</button><span>GREEN GARDEN / {project.mark}</span><h2>{project.title}</h2><p>{project.summary}</p><div className="garden-modal-rule" /><p>这个项目被保存在 Reiko 的花园里。它和其他记忆共用同一片土壤，但有自己的生长方式。</p></article></div>;
}

function GardenPostModal({ post, close }: { post: Post; close: () => void }) {
  return <div className="garden-modal-backdrop" role="presentation" onMouseDown={close}><article className="garden-modal garden-post-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}><button type="button" className="garden-modal-close" onClick={close} aria-label="关闭日记">×</button><span>DIARY / {formatDate(post.createdAt)}</span><h2>今天留下的一页</h2><p className="garden-post-modal-copy">{post.content}</p><div className="garden-modal-rule" /><small>每一张纸都可以继续被记住。</small></article></div>;
}
function ButterflyRoomButton({ footer = false }: { footer?: boolean }) {
  const [frame, setFrame] = useState(1);
  const [animating, setAnimating] = useState(false);
  function returnToRoom() {
    if (animating) return;
    setAnimating(true);
    let current = 1;
    const timer = window.setInterval(() => {
      current = current === 16 ? 1 : current + 1;
      setFrame(current);
      if (current === 16) {
        window.clearInterval(timer);
        window.dispatchEvent(new CustomEvent("reiko-theme", { detail: "room" }));
        setAnimating(false);
      }
    }, 70);
  }
  return <button className={footer ? "garden-room-return garden-room-return-footer" : "garden-room-return"} type="button" onClick={returnToRoom} disabled={animating}>
    <img src={"/reiko-assets/upgrade/butterfly_idle/butterfly_idle_" + frame + ".png"} alt="" />
    <span>{footer ? "return to ROOM" : "ROOM"}</span>
  </button>;
}

export default function GreenGarden({ canEdit, signInPath, posts, orderedPosts, visiblePosts, loading, postsExpanded, setPostsExpanded, draft, setDraft, publishing, publish, message }: { canEdit: boolean; signInPath: string; posts: Post[]; orderedPosts: Post[]; visiblePosts: Post[]; loading: boolean; postsExpanded: boolean; setPostsExpanded: (value: boolean) => void; draft: string; setDraft: (value: string) => void; publishing: boolean; publish: (event: FormEvent) => void; message: string }) {
  const [frame, setFrame] = useState(1); const [playing, setPlaying] = useState(false); const [secret, setSecret] = useState(false); const [selectedPost, setSelectedPost] = useState<Post | null>(null); const [selectedProject, setSelectedProject] = useState<Project | null>(null); const audioRef = useRef<HTMLAudioElement>(null);
  const frames = useMemo(() => Array.from({ length: 47 }, (_, i) => gardenPath + "/asset_3_fixed/asset_3_" + (i + 1) + ".png"), []);
  useEffect(() => { const images = frames.map((src) => { const image = new Image(); image.src = src; return image; }); let raf = 0; let last = performance.now(); let elapsed = 0; const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches; const tick = (now: number) => { if (!reduced && document.visibilityState === "visible" && images.every((image) => image.complete)) { elapsed += now - last; if (elapsed > 82) { elapsed = 0; setFrame((value) => value === 47 ? 1 : value + 1); } } last = now; raf = requestAnimationFrame(tick); }; raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf); }, [frames]);
  const gardenPosts = postsExpanded ? orderedPosts : orderedPosts.slice(0, 6);
  async function toggleMusic() { const audio = audioRef.current; if (!audio) return; if (audio.paused) { try { await audio.play(); } catch { setPlaying(false); } } else audio.pause(); }
  return <div className="garden-site" id="garden-top">
    <header className="garden-home" id="garden-home"><img className="garden-home-art" src={gardenPath + "/home screen/home_screen_background.png"} alt="Reiko's garden pond" /><div className="garden-home-copy"><span>THEME 02 / GREEN GARDEN</span><h1>Reiko&apos;s Space</h1><p>welcome to my little quiet garden</p><small>notes · flowers · water · memory</small></div><div className="garden-player"><audio ref={audioRef} src={gardenPath + "/Promise-impro.mp3"} loop onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} /><button type="button" onClick={toggleMusic} aria-label="播放或暂停音乐">{playing ? "Ⅱ" : "▶"}</button><div><span>NOW GROWING</span><strong>Promise — impro</strong><small>looped for this garden</small></div></div><button className="garden-enter" type="button" onClick={() => document.getElementById("garden-diary")?.scrollIntoView({ behavior: "smooth" })}>enter the garden</button></header>
    <nav className="garden-nav"><a href="#garden-top">Reiko&apos;s Space</a><div><a href="#garden-diary">Diary</a><a href="#garden-works">Works</a><a href="#garden-fragments">Fragments</a><a href="#garden-elsewhere">Elsewhere</a><ButterflyRoomButton /><button type="button" onClick={() => window.dispatchEvent(new CustomEvent("reiko-theme", { detail: "white-archive" }))}>WHITE ARCHIVE</button></div></nav>
    <main className="garden-main">
      <section className="garden-section" id="garden-diary"><div className="garden-heading"><span>01 / WALL</span><h2>Reiko&apos;s Diary</h2><p>记录今天的风、花与心情。</p></div>{canEdit ? <form className="garden-composer" onSubmit={publish}><div><strong>写下今天的日记</strong><span>{draft.length} / 500</span></div><textarea value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={500} placeholder="写下一点今天想留下的话……" /><button type="submit" disabled={!draft.trim() || publishing}>{publishing ? "保存中" : "保存记忆"}</button>{message && <output>{message}</output>}</form> : <a className="garden-owner" href={signInPath} target="_top">owner sign-in / write to the wall</a>}<div className="garden-post-grid">{loading && <article className="garden-note-card"><p>正在翻开今天的页面……</p></article>}{!loading && gardenPosts.length === 0 && <article className="garden-note-card"><p>第一句话可以很轻，不必像开场白。</p></article>}{gardenPosts.map((post, index) => <button className={"garden-note-card note-" + (index % 4) + (post.content.length > 150 ? " is-long" : post.content.length > 80 ? " is-medium" : "")} type="button" key={post.id} onClick={() => setSelectedPost(post)}><img src={gardenPath + "/assets/card_A.png"} alt="" /><span>{formatDate(post.createdAt)}</span><p>{post.content}</p></button>)}</div>{!loading && posts.length > 6 && <button className="garden-more" type="button" onClick={() => setPostsExpanded(!postsExpanded)}>{postsExpanded ? "收起较早的记忆" : "翻开更早的页面"}</button>}</section>
      <section className="garden-section" id="garden-works"><div className="garden-heading"><span>02 / WORKS</span><h2>Small things I keep growing</h2><p>几个一直占着位置、不准备丢掉的项目。</p></div><div className="garden-work-grid">{(Object.keys(projects) as ProjectKey[]).map((key, index) => <button type="button" key={key} onClick={() => setSelectedProject(projects[key])}><img src={gardenPath + "/assets/" + ["Card_B.png", "Card_C.png", "Card_D.png", "card_A.png"][index]} alt="" /><span>{projects[key].mark}</span><strong>{projects[key].title}</strong><small>{projects[key].summary}</small></button>)}</div></section>
      <section className="garden-section" id="garden-fragments"><div className="garden-heading"><span>03 / FRAGMENTS</span><h2>About, in loose pieces</h2><p>有些信息不需要被整理成一份完整的自我介绍。</p></div><div className="garden-fragment-grid"><img className="garden-fragment-flower" src={frames[frame - 1]} alt="" /><article className="garden-profile"><img src={gardenPath + "/assets/Profile.png"} alt="Reiko profile" /></article><button className="garden-secret" type="button" onClick={() => setSecret(!secret)}><img src={gardenPath + "/assets/Asset_9.png"} alt="" /><span>{secret ? fragments[2] : "折起来的一张纸"}</span></button></div></section>
      <section className="garden-section" id="garden-elsewhere"><div className="garden-heading"><span>04 / OUTSIDE</span><h2>Things left outside</h2><p>从这个花园通往外面的几件东西。</p></div><div className="garden-link-grid">{socialLinks.map((link) => <a key={link.key} href={link.href} target="_blank" rel="noreferrer"><img src={`${gardenPath}/assets/${link.key === "github" ? "Github" : link.key}.png`} alt={link.label} /><span>{link.note}</span></a>)}</div></section>
    </main><footer className="garden-footer"><span>REIKO&apos;S LITTLE GARDEN / THEME 02</span><ButterflyRoomButton footer /></footer>
    {selectedProject && <GardenProjectModal project={selectedProject} close={() => setSelectedProject(null)} />}
    {selectedPost && <GardenPostModal post={selectedPost} close={() => setSelectedPost(null)} />}
  </div>;
}
