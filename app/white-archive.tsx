"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { formatShortDate, fragments, profileContent, projects, socialLinks, type Post, type Project, type ProjectKey, type Theme } from "./reiko-content";

const base = "/reiko-assets/white-archive";

type ArchiveLyricCue = {
  start: number;
  end: number;
  text: string;
  language: "zh" | "original";
  position: "upper-left" | "upper-right" | "lower-left" | "lower-right";
};

const archiveLyrics: ArchiveLyricCue[] = [
  { start: 0, end: 3.5, text: "城市已陷入沉睡，像没有生命一样", language: "zh", position: "upper-right" },
  { start: 7, end: 10.4, text: "我将与你十指相扣，低声说", language: "zh", position: "lower-left" },
  { start: 11, end: 14.2, text: "Давай умрём вместе, я не шучу", language: "original", position: "upper-left" },
  { start: 19, end: 22.4, text: "今晚满月迷离，我们并肩同行", language: "zh", position: "lower-right" },
  { start: 27, end: 31.2, text: "Let’s die together, я не шучу", language: "original", position: "upper-right" },
  { start: 37, end: 40.5, text: "Я не шучу", language: "original", position: "lower-left" },
  { start: 42, end: 46.2, text: "一起死去吧，这不是玩笑", language: "zh", position: "upper-left" },
  { start: 52, end: 55.5, text: "我不开玩笑", language: "zh", position: "lower-right" },
  { start: 64, end: 67.5, text: "我正准备与你共享痛苦", language: "zh", position: "upper-right" },
  { start: 71, end: 74.5, text: "料到今后永远无法找回自我", language: "zh", position: "lower-left" },
  { start: 79, end: 82.5, text: "再次置身于一场游戏，又一次忘记存档", language: "zh", position: "upper-left" },
  { start: 87, end: 90.5, text: "我会为了温暖而倒进火焰", language: "zh", position: "lower-right" },
  { start: 94, end: 97.5, text: "Город уснул, он как неживой", language: "original", position: "upper-right" },
  { start: 102, end: 105.4, text: "我将与你十指相扣，低声说", language: "zh", position: "lower-left" },
  { start: 106, end: 110.2, text: "Let’s die together, я не шучу", language: "original", position: "upper-left" },
  { start: 116, end: 119.4, text: "Я не шучу", language: "original", position: "lower-right" },
  { start: 125, end: 128.5, text: "我在黑暗之中奔逃", language: "zh", position: "upper-right" },
  { start: 131, end: 134.4, text: "Обратно к себе", language: "original", position: "lower-left" },
  { start: 135, end: 138.5, text: "我找回了归宿", language: "zh", position: "upper-left" },
  { start: 139, end: 142.5, text: "与我自己相会", language: "zh", position: "lower-right" },
  { start: 150, end: 153.5, text: "我找回了归宿", language: "zh", position: "upper-right" },
  { start: 154, end: 158.5, text: "Навстречу с собой", language: "original", position: "lower-left" },
];

function setWorld(theme: Theme) {
  window.dispatchEvent(new CustomEvent("reiko-theme", { detail: theme }));
}

function ArchivePlayer({ onPlayback }: { onPlayback: (current: number, playing: boolean) => void }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  async function toggle() { const audio = audioRef.current; if (!audio) return; if (audio.paused) { try { await audio.play(); } catch { setPlaying(false); onPlayback(current, false); } } else audio.pause(); }
  return <div className="white-player">
    <audio ref={audioRef} src={`${base}/white-archive.mp3`} loop preload="metadata" onPlay={(event) => { setPlaying(true); onPlayback(event.currentTarget.currentTime, true); }} onPause={(event) => { setPlaying(false); onPlayback(event.currentTarget.currentTime, false); }} onLoadedMetadata={(event) => { event.currentTarget.volume = 0.3; setDuration(event.currentTarget.duration || 0); }} onTimeUpdate={(event) => { setCurrent(event.currentTarget.currentTime); onPlayback(event.currentTarget.currentTime, !event.currentTarget.paused); }} />
    <img src={`${base}/home screen/music player.png`} alt="" />
    <div className="white-player-copy"><span>СЕЙЧАС ИГРАЕТ</span><strong>Let&apos;s die together, Я не шучу</strong></div>
    <button type="button" onClick={toggle} aria-label={playing ? "暂停音乐" : "播放音乐"}>{playing ? "Ⅱ" : "▶"}</button>
    <input aria-label="播放进度" type="range" min="0" max={duration || 1} step="0.1" value={Math.min(current, duration || 0)} disabled={!duration} onChange={(event) => { const next = Number(event.target.value); if (audioRef.current) audioRef.current.currentTime = next; setCurrent(next); }} />
  </div>;
}

function ArchiveLyric({ current, playing }: { current: number; playing: boolean }) {
  const cue = archiveLyrics.find((line) => current >= line.start && current < line.end);
  if (!cue) return null;
  return <div className={`white-memory-lyric is-${cue.position}${playing ? " is-playing" : ""}`} aria-live="off" aria-hidden="true">
    <p key={cue.start} lang={cue.language === "original" ? "ru" : "zh-CN"}>{cue.text}</p>
  </div>;
}

function CagedButterfly() {
  const [frame, setFrame] = useState(1);
  useEffect(() => {
    const sources = Array.from({ length: 39 }, (_, index) => `${base}/caged_butterfly/caged_butterfly_${index + 1}.png`);
    sources.forEach((src) => { const image = new Image(); image.src = src; });
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setFrame((value) => value === 39 ? 1 : value + 1), 95);
    return () => window.clearInterval(timer);
  }, []);
  return <img className="white-butterfly" src={`${base}/caged_butterfly/caged_butterfly_${frame}.png`} alt="笼中的蝴蝶" />;
}

function ArchiveBirdButton({ expanded, hasOlder, transition, disabled }: { expanded: boolean; hasOlder: boolean; transition: () => void; disabled: boolean }) {
  const [frame, setFrame] = useState(1);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setFrame((value) => value >= 3 ? 1 : value + 1), 680);
    return () => window.clearInterval(timer);
  }, []);
  const label = expanded ? "закрыть архив / 让白鸽合上旧页" : hasOlder ? "открыть прошлое / 跟随白鸽翻到更早" : "архив открыт / 白鸽守着全部记录";
  return <button className="white-bird-more" type="button" onClick={transition} disabled={disabled || !hasOlder} aria-busy={disabled}><img src={`${base}/bird/Bird_${frame}.png`} alt="" /><span>{label}</span></button>;
}

function ArchiveBirdTransition({ finish }: { finish: () => void }) {
  const [frame, setFrame] = useState(1);
  useEffect(() => {
    let nextFrame = 1;
    let finishTimer: number | undefined;
    const timer = window.setInterval(() => {
      nextFrame += 1;
      if (nextFrame > 14) {
        window.clearInterval(timer);
        finishTimer = window.setTimeout(finish, 70);
        return;
      }
      setFrame(nextFrame);
    }, 70);
    return () => { window.clearInterval(timer); if (finishTimer) window.clearTimeout(finishTimer); };
  }, [finish]);
  return <div className="white-bird-transition" role="status" aria-label="白鸽正在翻开下一页">
    <img src={`${base}/bird/Bird_${frame}.png`} alt="" />
  </div>;
}

function WhiteProjectModal({ project, close }: { project: Project; close: () => void }) {
  return <div className="white-modal-backdrop" role="presentation" onMouseDown={close}><article className="white-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}><button type="button" onClick={close} aria-label="关闭项目">×</button><span>ARCHIVE / {project.mark}</span><h2>{project.title}</h2><em>{project.subtitle}</em><p>{project.detail}</p><small>{project.file}</small></article></div>;
}

type Props = {
  canEdit: boolean; signInPath: string; posts: Post[]; orderedPosts: Post[]; loading: boolean;
  postsExpanded: boolean; setPostsExpanded: (value: boolean) => void; draft: string; setDraft: (value: string) => void;
  publishing: boolean; publish: (event: FormEvent) => void; message: string;
};

type ArchiveTransitionAction =
  | { kind: "section"; target: string }
  | { kind: "world"; theme: Theme }
  | { kind: "diary" };

export default function WhiteArchive({ canEdit, signInPath, posts, orderedPosts, loading, postsExpanded, setPostsExpanded, draft, setDraft, publishing, publish, message }: Props) {
  const archivePosts = useMemo(() => postsExpanded ? orderedPosts : orderedPosts.slice(0, 6), [orderedPosts, postsExpanded]);
  const previewSlots = useMemo<(Post | null)[]>(() => postsExpanded ? archivePosts : [...archivePosts, ...Array(Math.max(0, 6 - archivePosts.length)).fill(null)], [archivePosts, postsExpanded]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [playback, setPlayback] = useState({ current: 0, playing: false });
  const [transitionAction, setTransitionAction] = useState<ArchiveTransitionAction | null>(null);
  function finishTransition() {
    const action = transitionAction;
    if (!action) return;
    setTransitionAction(null);
    if (action.kind === "section") {
      window.history.pushState(null, "", action.target);
      window.requestAnimationFrame(() => document.querySelector(action.target)?.scrollIntoView({ behavior: "auto" }));
    } else if (action.kind === "world") {
      setWorld(action.theme);
    } else {
      setPostsExpanded(!postsExpanded);
    }
  }
  const selectedPostClass = selectedPost ? selectedPost.content.length > 360 ? "white-diary-copy is-very-long" : selectedPost.content.length > 200 ? "white-diary-copy is-long" : selectedPost.content.length > 110 ? "white-diary-copy is-medium" : "white-diary-copy" : "white-diary-copy";
  useEffect(() => { if (!selectedPost && orderedPosts.length) setSelectedPost(orderedPosts[0]); }, [orderedPosts, selectedPost]);
  return <div className="white-site" id="white-top">
    <header className="white-hero">
      <img className="white-hero-art" src={`${base}/home screen/home_screen_background.png`} alt="白色蕾丝、烛光与银色十字架" />
      <img className="white-mobile-cross" src={`${base}/asset_cross.png`} alt="" />
      <div className="white-hero-frame" />
      <div className="white-hero-title"><span>THEME 03 / WHITE ARCHIVE</span><h1>Reiko&apos;s Sanctuary</h1><p>memory · silence · things kept on purpose</p></div>
      <ArchivePlayer onPlayback={(current, playing) => setPlayback({ current, playing })} />
      <button className="white-enter" type="button" onClick={() => document.getElementById("white-diary")?.scrollIntoView({ behavior: "smooth" })}>open the archive</button>
    </header>

    <nav className="white-nav"><a href="#white-top">WHITE ARCHIVE / III</a><div><a href="#white-diary">I / ДНЕВНИК</a><button type="button" disabled={Boolean(transitionAction)} onClick={() => setTransitionAction({ kind: "section", target: "#white-works" })}>II / WORKS</button><button type="button" disabled={Boolean(transitionAction)} onClick={() => setTransitionAction({ kind: "section", target: "#white-profile" })}>III / DOSSIER</button><a href="#white-outside">IV / ВНЕ</a><button type="button" disabled={Boolean(transitionAction)} onClick={() => setTransitionAction({ kind: "world", theme: "room" })}>ROOM</button><button type="button" disabled={Boolean(transitionAction)} onClick={() => setTransitionAction({ kind: "world", theme: "garden" })}>GARDEN</button></div></nav>

    <main className="white-main">
      <section className="white-section white-diary" id="white-diary">
        <header className="white-heading"><span>01 / ДНЕВНИК</span><h2>Fragments of the day</h2><p>写下以后，就不必再靠记得来保存。</p></header>
        {canEdit ? <form className="white-composer" onSubmit={publish}><textarea value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={500} placeholder="把今天的一小段留在这里……" /><div><span>{draft.length} / 500</span><button type="submit" disabled={!draft.trim() || publishing}>{publishing ? "正在归档" : "归档这段话"}</button></div>{message && <output>{message}</output>}</form> : <a className="white-owner" href={signInPath} target="_top">owner sign-in / write</a>}
        <div className="white-diary-layout">
          <div className="white-diary-index"><div className="white-diary-list-frame"><div className="white-diary-list" aria-live="polite">{loading && Array.from({ length: 6 }, (_, index) => <div className="white-diary-slip is-placeholder" key={index}><img src={`${base}/note_${["A", "B", "C"][index % 3]}.png`} alt="" /><div><time>ЗАГРУЗКА</time><p>正在翻开档案……</p></div></div>)}{!loading && previewSlots.map((post, index) => post ? <button className={selectedPost?.id === post.id ? "white-diary-slip is-active" : "white-diary-slip"} type="button" key={post.id} onClick={() => setSelectedPost(post)}><img src={`${base}/note_${["A", "B", "C"][index % 3]}.png`} alt="" /><div><time>{formatShortDate(post.createdAt)}</time><p>{post.content.slice(0, 34)}{post.content.length > 34 ? "…" : ""}</p></div></button> : <div className="white-diary-slip is-placeholder" key={`empty-${index}`}><img src={`${base}/note_${["A", "B", "C"][index % 3]}.png`} alt="" /><div><time>ПУСТАЯ ЗАПИСЬ</time><p>尚未写下的白色纸页</p></div></div>)}</div></div><ArchiveBirdButton expanded={postsExpanded} hasOlder={orderedPosts.length > 6} disabled={Boolean(transitionAction)} transition={() => setTransitionAction({ kind: "diary" })} /></div>
          <div className="white-diary-card-frame"><article className="white-diary-card"><img src={`${base}/diary_card.png`} alt="" />{selectedPost ? <div className={selectedPostClass}><time>{formatShortDate(selectedPost.createdAt)}</time><h3>易碎存档</h3><p>{selectedPost.content}</p><small>FRAGMENTS OF THE DAY</small></div> : <div className="white-diary-copy"><span>NO. 000</span><h3>未写下的页面</h3><p>这里暂时保持安静。</p></div>}</article></div>
        </div>
      </section>

      <div className="white-lace-rule" aria-hidden="true"><img src={`${base}/asset_5.png`} alt="" /></div>

      <section className="white-section white-works" id="white-works"><img className="white-corner" src={`${base}/asset_4.png`} alt="" /><header className="white-heading"><span>02 / АРХИВ РАБОТ</span><h2>Objects in the cabinet</h2><p>不是陈列品，是仍然留在手边的工程。</p></header><div className="white-work-grid">{(Object.keys(projects) as ProjectKey[]).map((key, index) => { const project = projects[key]; const artwork = key === "home" ? `${base}/home_app.png` : `${base}/asset_${[8, 9, 7][index - 1]}.png`; return <button type="button" key={key} onClick={() => setSelectedProject(project)}><img src={artwork} alt="" /><span>{project.mark}</span><h3>{project.title}</h3><p>{project.summary}</p></button>; })}</div></section>

      <section className="white-section white-profile-section" id="white-profile"><header className="white-heading"><span>03 / ЛИЧНОЕ ДЕЛО</span><h2>A record of Reiko</h2><p>并不完整。完整这件事本身就很可疑。</p></header><div className="white-profile-layout"><article className="white-profile"><img src={`${base}/personal_file_card.png`} alt="个人档案纸页" /><div><span>ЛИЧНОЕ ДЕЛО / 07</span><h3>{profileContent.name}</h3>{profileContent.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}<dl>{profileContent.details.map(([term, description]) => <div key={term}><dt>{term}</dt><dd>{description}</dd></div>)}</dl></div></article><aside className="white-butterfly-stage"><CagedButterfly /><p>caged butterfly / loop no. 39</p><div className="white-fragments">{fragments.map((fragment, index) => <blockquote key={fragment}><span>fragment / 0{index + 1}</span>{fragment}</blockquote>)}</div></aside></div></section>

      <section className="white-section white-outside" id="white-outside"><header className="white-heading"><span>04 / ВНЕ КОМНАТЫ</span><h2>Doors left unlocked</h2><p>从这个房间通往外面的几件东西。</p></header><div className="white-link-grid">{socialLinks.map((link, index) => <a key={link.key} href={link.href} target="_blank" rel="noreferrer"><img className="white-link-flower" src={`${base}/asset_${index + 1}.png`} alt="" /><img className="white-link-object" src={`${base}/${link.key === "github" ? "GitHub" : link.key}.png`} alt={link.label} /><strong>{link.label}</strong><span>{link.note}</span></a>)}</div></section>
      <footer className="white-footer"><span>WHITE ARCHIVE / REIKO&apos;S SPACE</span><p>some things remain.</p></footer>
    </main>
    <ArchiveLyric current={playback.current} playing={playback.playing} />
    {transitionAction && <ArchiveBirdTransition finish={finishTransition} />}
    {selectedProject && <WhiteProjectModal project={selectedProject} close={() => setSelectedProject(null)} />}
  </div>;
}
