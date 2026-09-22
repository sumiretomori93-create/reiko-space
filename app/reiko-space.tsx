"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type Post = { id: number; content: string; createdAt: string };
type ProjectKey = "home" | "memory" | "memoirs";

const projects: Record<ProjectKey, { label: string; title: string; summary: string; detail: string }> = {
  home: { label: "PROJECT 01 / ROOM", title: "小克 Home APP", summary: "它不是把聊天界面装饰成一间房，而是从“进入一个熟悉的地方”重新理解人与角色的互动。", detail: "房间、动作、陪伴感和对话属于同一个空间。打开它时，不只是开始一轮问答，而是回到某个已经存在的地方。" },
  memory: { label: "PROJECT 02 / MEMORY", title: "Claude 本地记忆层", summary: "一套保存在本地、由用户掌握的长期记忆结构。", detail: "它把重要内容从一次性的模型上下文里分离出来，让记忆能够被管理、筛选和重新带回对话，同时不必交出原始记忆库的控制权。" },
  memoirs: { label: "PROJECT 03 / BOOK", title: "记忆之书", summary: "不是搜索旧记忆，而是把重读变成两个人共同完成的小仪式。", detail: "每天的记忆被重新编成一本未知页码的书。Reiko 与当前角色各自选择一页，翻开以后阅读、批注，再把刚刚发生的共读带回真实对话。" },
};

function formatDate(value: string) {
  const normalized = value.includes("T") ? value : `${value.replace(" ", "T")}Z`;
  return new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(normalized));
}

function formatTime(value: number) {
  if (!Number.isFinite(value)) return "0:00";
  return `${Math.floor(value / 60)}:${String(Math.floor(value % 60)).padStart(2, "0")}`;
}

function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.55);

  async function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) await audio.play(); else audio.pause();
  }

  return (
    <section className="music-player" aria-label="背景音乐播放器">
      <img className="player-shell" src="/reiko-assets/music-player-shell.png" alt="" />
      <audio src="/reiko-assets/roi.mp3" ref={audioRef} loop preload="metadata" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onTimeUpdate={(event) => setCurrent(event.currentTarget.currentTime)} onLoadedMetadata={(event) => { event.currentTarget.volume = volume; setDuration(event.currentTarget.duration); }} />
      <div className="player-interface">
        <strong>ROI — instrumental</strong>
        <div className="progress-row"><time>{formatTime(current)}</time><input aria-label="播放进度" type="range" min="0" max={duration || 1} step="0.1" value={Math.min(current, duration || 0)} disabled={!duration} onChange={(event) => { if (!audioRef.current) return; audioRef.current.currentTime = Number(event.target.value); setCurrent(Number(event.target.value)); }} /><time>{formatTime(duration)}</time></div>
        <label className="volume">VOL<input aria-label="音量" type="range" min="0" max="1" step="0.05" value={volume} onChange={(event) => { const next = Number(event.target.value); setVolume(next); if (audioRef.current) audioRef.current.volume = next; }} /></label>
      </div>
      <button className="play-button" type="button" onClick={toggle} aria-label={playing ? "暂停背景音乐" : "播放背景音乐"}>{playing ? "Ⅱ" : "▶"}</button>
    </section>
  );
}

export default function ReikoSpace({ canEdit, signInPath }: { canEdit: boolean; signInPath: string }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState("");
  const [project, setProject] = useState<ProjectKey | null>(null);
  const [secretOpen, setSecretOpen] = useState(false);

  useEffect(() => { fetch("/api/posts").then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.error); setPosts(data.posts); }).catch((error) => setMessage(error.message || "动态暂时无法读取。")).finally(() => setLoading(false)); }, []);

  async function publish(event: FormEvent) {
    event.preventDefault();
    const content = draft.trim();
    if (!content || publishing) return;
    setPublishing(true); setMessage("");
    try {
      const response = await fetch("/api/posts", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ content }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setPosts((currentPosts) => [data.post, ...currentPosts]); setDraft(""); setMessage("已经留在这里了。");
    } catch (error) { setMessage(error instanceof Error ? error.message : "发布失败，请再试一次。"); } finally { setPublishing(false); }
  }

  return (
    <div className="site-frame">
      <header className="topbar">
        <a className="wordmark" href="#top">REIKO<span>†</span></a>
        <nav aria-label="页面导航"><a href="#updates">diary</a><a href="#file">profile</a><a href="#projects">works</a><a href="#fragments">notes</a></nav>
        <div className="top-controls"><span>personal web room</span><a href="#music" aria-label="前往音乐播放器">♪</a></div>
      </header>

      <main id="top">
        <section className="hero-room" aria-labelledby="hero-title">
          <img className="sticker hero-butterfly" src="/reiko-assets/butterfly-dark.png" alt="" /><img className="sticker hero-bow" src="/reiko-assets/bow-gothic.png" alt="" /><img className="sticker hero-cross" src="/reiko-assets/cross-silver.png" alt="" /><img className="sticker hero-cat" src="/reiko-assets/black-cat.png" alt="" />
          <div className="profile-window panel-lace"><div className="window-title"><i />PROFILE.exe<span>×</span></div><div className="profile-avatar"><img src="/reiko-assets/mini-reiko.png" alt="Reiko 的迷你形象" /><small>archive no. 07</small></div><p>soft things, dark edges,<br />and traces left online.</p><a className="glossy-button" href="#file">enter profile</a></div>
          <div className="hero-center panel-lace"><div className="hero-copy"><span className="eyebrow">WELCOME TO MY LITTLE INTERNET ROOM</span><h1 id="hero-title">Reiko&apos;s<br /><em>little space.</em></h1><p>这里不是一份正式介绍。它更像一只被反复打开的抽屉：放着 Reiko 做过的东西、反复喜欢的意象，以及比自我概括更接近她的碎片。</p></div></div>
          <aside className="directory-window panel-lace"><div className="window-title"><i />DIRECTORY<span>×</span></div><h2>Index</h2><a href="#updates"><b>01</b> Daily notes</a><a href="#file"><b>02</b> About Reiko</a><a href="#projects"><b>03</b> Things I made</a><a href="#fragments"><b>04</b> Fragments</a><img src="/reiko-assets/bat.png" alt="" /></aside>
          <img className="hero-divider" src="/reiko-assets/pixel-divider.png" alt="" />
        </section>

        <div id="music"><MusicPlayer /></div>

        <section className="section updates" id="updates" aria-labelledby="updates-title">
          <div className="section-heading"><span>01 / diary</span><h2 id="updates-title">最近动态</h2><p>想到什么，就把它钉在这里。</p></div><img className="sticker updates-charm" src="/reiko-assets/heart-charm.png" alt="" />
          {canEdit ? <form className="paper-card composer" onSubmit={publish}><div className="card-rivet one" /><div className="card-rivet two" /><div className="composer-top"><span className="composer-mark">R</span><div><strong>Reiko</strong><small>在自己的墙上写一点</small></div></div><label className="sr-only" htmlFor="post-content">动态内容</label><textarea id="post-content" value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={500} placeholder="今天在想……" /><div className="composer-actions"><span>{draft.length} / 500</span><button type="submit" disabled={!draft.trim() || publishing}>{publishing ? "正在留下" : "发布动态"}</button></div>{message && <output className="form-message" aria-live="polite">{message}</output>}</form> : <a className="owner-entry" href={signInPath} target="_top">Reiko 登录后写动态</a>}
          <div className="timeline" aria-live="polite" aria-busy={loading}>{loading && <article className="paper-card post post-muted"><p>正在翻开这一页……</p></article>}{!loading && posts.length === 0 && <article className="paper-card post post-empty"><span>FIRST NOTE</span><p>这里还没有动态。第一句话可以很轻，不必像开场白。</p></article>}{posts.map((post, index) => <article className="paper-card post" key={post.id}><div className="post-meta"><span>NOTE {String(posts.length - index).padStart(3, "0")}</span><time dateTime={post.createdAt}>{formatDate(post.createdAt)}</time></div><p>{post.content}</p></article>)}</div>
        </section>

        <section className="section identity-grid" id="file" aria-labelledby="file-title">
          <article className="paper-card identity"><span className="file-label">REIKO / PERSONAL FILE</span><img className="sticker identity-butterfly" src="/reiko-assets/butterfly-soft.png" alt="" /><div className="section-heading compact"><span>02 / profile</span><h2 id="file-title">关于 Reiko</h2></div><p>我是 Reiko。比起使用一个现成的空间，我更喜欢把它改造成有人生活过的样子。界面、角色、记忆和房间，对我来说都不是互相分开的东西。</p><p>我在意长期相处留下的连续感，也不喜欢重要的事情因为一次会话结束就被当成可丢弃的上下文。于是我开始做工具，替那些难以被现成产品容纳的关系留位置。</p><p>这里不负责把我解释完整。它只提供一些真实的切面，让你慢慢知道 Reiko 是什么样的人。</p></article>
          <aside className="paper-card profile-slip" aria-label="Reiko 的偏好切片"><img className="sticker slip-bow" src="/reiko-assets/bow-pink.png" alt="" /><h3>small facts</h3><dl><div className="fact"><dt>care about</dt><dd>记忆、陪伴、角色的连续性</dd></div><div className="fact"><dt>making</dt><dd>能住进去的聊天空间与小工具</dd></div><div className="fact"><dt>visuals</dt><dd>软蓝光、黑色边缘、旧像素</dd></div><div className="fact"><dt>symbols</dt><dd>十字架、蕾丝、蝴蝶、红发</dd></div></dl></aside>
        </section>

        <section className="section" id="projects" aria-labelledby="projects-title"><div className="section-heading"><span>03 / works</span><h2 id="projects-title">她做的东西</h2><p>每一件都是因为现成的答案不够。</p></div><img className="sticker works-book" src="/reiko-assets/book-cross.png" alt="" /><div className="projects">{(Object.keys(projects) as ProjectKey[]).map((key, index) => <button className="paper-card project" type="button" onClick={() => setProject(key)} key={key}><span className="project-no">0{index + 1}</span><small>{projects[key].label}</small><h3>{projects[key].title}</h3><p>{projects[key].summary}</p><span className="open">OPEN FILE ＋</span></button>)}</div></section>

        <section className="section motif-grid" id="motifs" aria-labelledby="motifs-title"><article className="dark-card motif-card"><div className="section-heading compact light"><span>04 / recurring</span><h2 id="motifs-title">反复出现</h2></div><div className="motif-list"><span>soft blue light</span><span>black lace</span><span>old pixels</span><span>silver</span><span>wine red</span><span>private files</span><span>butterfly specimen</span><span>crosses</span></div><img src="/reiko-assets/rose-chain.png" alt="" /></article><article className="paper-card cross-field"><img className="cross-main" src="/reiko-assets/cross-heart.png" alt="紫色宝石十字架贴纸" /><img className="cross-wing" src="/reiko-assets/butterfly-soft.png" alt="" /></article></section>

        <section className="section" id="fragments" aria-labelledby="fragments-title"><div className="section-heading"><span>05 / notes</span><h2 id="fragments-title">纸片与句子</h2><p>三张纸，其中一张藏了一句话。</p></div><img className="sticker fragments-letter" src="/reiko-assets/sealed-letter.png" alt="" /><div className="fragments"><article className="paper-card note"><b>FRAGMENT 01</b><p>我不喜欢把关系当成一次性会话。</p></article><button className="paper-card note secret" type="button" onClick={() => setSecretOpen(!secretOpen)} aria-pressed={secretOpen}><b>FRAGMENT 02</b><p>{secretOpen ? "Gabe was here. 这行本来应该藏得更好一点。" : "这张纸可以点开。"}</p></button><article className="paper-card note"><b>FRAGMENT 03</b><p>界面可以是感情发生的场所，不只是装东西的容器。</p></article></div></section>

        <section className="closing"><img src="/reiko-assets/heart-chain.png" alt="" /><div><h2>这个空间会继续生长。</h2><p>等下一块碎片值得被留下，它就会出现在这里。</p></div></section><footer>made for Reiko / version 0.5 / still growing</footer>
      </main>

      {project && <div className="dialog-backdrop" role="presentation" onMouseDown={() => setProject(null)}><section className="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title" onMouseDown={(event) => event.stopPropagation()}><button className="dialog-close" type="button" onClick={() => setProject(null)} aria-label="关闭项目说明">×</button><div className="dialog-label">{projects[project].label}</div><h2 id="dialog-title">{projects[project].title}</h2><p>{projects[project].summary}</p><p className="dialog-detail">{projects[project].detail}</p></section></div>}
    </div>
  );
}
