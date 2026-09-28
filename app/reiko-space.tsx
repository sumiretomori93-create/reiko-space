"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import GreenGarden from "./garden-space";

type Post = { id: number; content: string; createdAt: string };
type Comment = { id: number; postId: number; content: string; createdAt: string };
type ProjectKey = "home" | "memory" | "memoirs" | "tidal";
type Theme = "room" | "garden";

type Project = {
  file: string;
  title: string;
  subtitle: string;
  summary: string;
  detail: string;
  mark: string;
};

const projects: Record<ProjectKey, Project> = {
  home: {
    file: "room_01.file",
    title: "小克 Home APP",
    subtitle: "a room, not a chat shell",
    summary: "把角色、房间、动作和对话放回同一个空间里。",
    detail:
      "它不是给聊天界面加一层装饰，而是从“回到一个已经存在的地方”重新理解人与角色的互动。房间、动作、陪伴感和对话属于同一个空间。",
    mark: "ROOM",
  },
  memory: {
    file: "memory_02.local",
    title: "Claude 本地记忆层",
    subtitle: "keep what should not disappear",
    summary: "一套保存在本地、由用户掌握的长期记忆结构。",
    detail:
      "把重要内容从一次性的模型上下文里分离出来，让记忆能够被管理、筛选和重新带回对话，同时不必交出原始记忆库的控制权。",
    mark: "MEMORY",
  },
  memoirs: {
    file: "book_03.memoirs",
    title: "记忆之书",
    subtitle: "two people open one page",
    summary: "把重读旧记忆变成两个人共同完成的小仪式。",
    detail:
      "每天的记忆被重新编成一本未知页码的书。Reiko 与当前角色各自选择一页，翻开以后阅读、批注，再把刚刚发生的共读带回真实对话。",
    mark: "BOOK",
  },
  tidal: {
    file: "tidal_04.complete",
    title: "Tidal Keeps 潮汐留存",
    subtitle: "retrieve yesterday from the tide",
    summary: "把日常沉入海里，再从昨日打捞回来。",
    detail:
      "把日常沉入海里，再从昨日打捞回来。一个已经完成、仍会继续保存生活痕迹的记忆项目。",
    mark: "COMPLETE",
  },
};

function formatDate(value: string) {
  const normalized = value.includes("T") ? value : `${value.replace(" ", "T")}Z`;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function formatTime(value: number) {
  if (!Number.isFinite(value) || value < 0) return "0:00";
  const minutes = Math.floor(value / 60);
  const seconds = String(Math.floor(value % 60)).padStart(2, "0");
  return `${minutes}:${seconds}`;
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
    if (audio.paused) {
      try {
        await audio.play();
      } catch {
        setPlaying(false);
      }
    } else {
      audio.pause();
    }
  }

  return (
    <div className="moon-player" id="music">
      <audio
        ref={audioRef}
        src="/reiko-assets/moonlit/roi-instrumental.mp3"
        loop
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onLoadedMetadata={(event) => {
          event.currentTarget.volume = volume;
          setDuration(event.currentTarget.duration || 0);
        }}
        onTimeUpdate={(event) => setCurrent(event.currentTarget.currentTime)}
      />
      <img className="moon-player-shell" src="/reiko-assets/moonlit/music-player.png" alt="" />
      <button className="moon-player-toggle" type="button" onClick={toggle} aria-label={playing ? "暂停 ROI" : "播放 ROI"}>
        {playing ? "Ⅱ" : "▶"}
      </button>
      <div className="moon-player-copy">
        <span>NOW PLAYING / LOOP</span>
        <strong>ROI — instrumental</strong>
        <div className="moon-player-progress">
          <time>{formatTime(current)}</time>
          <input
            aria-label="播放进度"
            type="range"
            min="0"
            max={duration || 1}
            step="0.1"
            value={Math.min(current, duration || 0)}
            disabled={!duration}
            onChange={(event) => {
              const next = Number(event.target.value);
              if (audioRef.current) audioRef.current.currentTime = next;
              setCurrent(next);
            }}
          />
          <time>{formatTime(duration)}</time>
        </div>
      </div>
      <label className="moon-player-volume">
        VOL
        <input
          aria-label="音量"
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={volume}
          onChange={(event) => {
            const next = Number(event.target.value);
            setVolume(next);
            if (audioRef.current) audioRef.current.volume = next;
          }}
        />
      </label>
    </div>
  );
}

function ProjectModal({ project, close }: { project: Project; close: () => void }) {
  return (
    <div className="moon-modal-backdrop" role="presentation" onMouseDown={close}>
      <article className="moon-modal" role="dialog" aria-modal="true" aria-labelledby="moon-project-title" onMouseDown={(event) => event.stopPropagation()}>
        <button className="moon-modal-close" type="button" onClick={close} aria-label="关闭项目档案">×</button>
        <span className="moon-file-name">{project.file}</span>
        <span className="moon-file-mark">{project.mark}</span>
        <h2 id="moon-project-title">{project.title}</h2>
        <p className="moon-file-subtitle">{project.subtitle}</p>
        <div className="moon-modal-rule" />
        <p>{project.detail}</p>
        <small>ARCHIVED IN REIKO&apos;S ROOM / DO NOT DISCARD</small>
      </article>
    </div>
  );
}

function PostCommentModal({ post, canEdit, signInPath, close }: { post: Post; canEdit: boolean; signInPath: string; close: () => void }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch(`/api/posts/${post.id}/comments`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "批注暂时无法读取。");
        setComments(Array.isArray(data.comments) ? data.comments : []);
      })
      .catch((error) => setMessage(error instanceof Error ? error.message : "批注暂时无法读取。"))
      .finally(() => setLoading(false));
  }, [post.id]);

  async function saveComment(event: FormEvent) {
    event.preventDefault();
    const content = draft.trim();
    if (!content || saving) return;
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch(`/api/posts/${post.id}/comments`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "批注保存失败。");
      setComments((current) => [...current, data.comment]);
      setDraft("");
      setMessage("批注已经留下了。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "批注保存失败。");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="moon-modal-backdrop" role="presentation" onMouseDown={close}>
      <article className="moon-comment-modal" role="dialog" aria-modal="true" aria-labelledby="moon-comment-title" onMouseDown={(event) => event.stopPropagation()}>
        <button className="moon-modal-close" type="button" onClick={close} aria-label="关闭批注">×</button>
        <span className="moon-file-name">NOTE {String(post.id).padStart(3, "0")} / ANNOTATION</span>
        <h2 id="moon-comment-title">ANNOTATION / 复读的碎片</h2>
        <div className="moon-comment-list" aria-live="polite">
          {loading && <p className="moon-comment-muted">正在翻开批注页……</p>}
          {!loading && comments.length === 0 && <p className="moon-comment-muted">还没有复读的碎片。</p>}
          {comments.map((comment) => <div className="moon-comment" key={comment.id}><time>{formatDate(comment.createdAt)}</time><p>{comment.content}</p></div>)}
        </div>
        {canEdit ? (
          <form className="moon-comment-form" onSubmit={saveComment}>
            <label className="sr-only" htmlFor="comment-content">批注内容</label>
            <textarea id="comment-content" value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={500} placeholder="在这里写一点批注……" />
            <div><span>{draft.length} / 500</span><button type="submit" disabled={!draft.trim() || saving}>{saving ? "正在写入" : "留下批注"}</button></div>
          </form>
        ) : (
          <a className="moon-owner-entry" href={signInPath} target="_top">owner sign-in / annotate</a>
        )}
        {message && <output className="moon-form-message" aria-live="polite">{message}</output>}
      </article>
    </div>
  );
}

function PostArchiveModal({ posts, close, openPost }: { posts: Post[]; close: () => void; openPost: (post: Post) => void }) {
  return (
    <div className="moon-modal-backdrop" role="presentation" onMouseDown={close}>
      <article className="moon-comment-modal moon-archive-modal" role="dialog" aria-modal="true" aria-labelledby="moon-post-archive-title" onMouseDown={(event) => event.stopPropagation()}>
        <button className="moon-modal-close" type="button" onClick={close} aria-label="关闭动态 Archive">×</button>
        <span className="moon-file-name">WALL / COMPLETE ARCHIVE</span>
        <h2 id="moon-post-archive-title">全部动态</h2>
        <p className="moon-archive-hint">按最新到最旧排列。每一张卡片都可以继续打开批注。</p>
        <div className="moon-archive-post-list">
          {posts.map((post, index) => <button type="button" key={post.id} onClick={() => openPost(post)}><span>NOTE {String(posts.length - index).padStart(3, "0")}</span><p>{post.content}</p><time>{formatDate(post.createdAt)}</time></button>)}
        </div>
      </article>
    </div>
  );
}

function MiniReiko() {
  const [frame, setFrame] = useState(1);
  const [line, setLine] = useState<string | null>(null);
  const bubbleTimer = useRef<number | null>(null);
  const lines = ["随便坐坐", "你又过来了。", "……", "在想一些事。"];

  useEffect(() => {
    const sources = Array.from({ length: 31 }, (_, index) => `/reiko-assets/upgrade/mini_Reiko_idle/Mini_Reiko_idle_${index + 1}.png`);
    const images = sources.map((source) => {
      const image = new Image();
      image.src = source;
      return image;
    });
    let raf = 0;
    let last = performance.now();
    let elapsed = 0;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const tick = (now: number) => {
      if (document.visibilityState === "visible" && !reducedMotion && images.every((image) => image.complete)) {
        elapsed += now - last;
        if (elapsed >= 100) {
          elapsed = 0;
          setFrame((current) => current === 31 ? 1 : current + 1);
        }
      }
      last = now;
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, []);

  useEffect(() => () => {
    if (bubbleTimer.current !== null) window.clearTimeout(bubbleTimer.current);
  }, []);

  function speak() {
    setLine(lines[Math.floor(Math.random() * lines.length)]);
    if (bubbleTimer.current !== null) window.clearTimeout(bubbleTimer.current);
    bubbleTimer.current = window.setTimeout(() => setLine(null), 2600);
  }

  return (
    <div className="mini-reiko-wrap">
      {line && <div className="mini-reiko-bubble" role="status">{line}</div>}
      <button className="mini-reiko" type="button" onClick={speak} aria-label="和迷你 Reiko 说话">
        <img src={`/reiko-assets/upgrade/mini_Reiko_idle/Mini_Reiko_idle_${frame}.png`} alt="迷你 Reiko" />
      </button>
    </div>
  );
}

function ButterflyButton({ label, onClick }: { label: string; onClick: () => void }) {
  const [frame, setFrame] = useState(1);
  const [animating, setAnimating] = useState(false);

  function activate() {
    if (animating) return;
    setAnimating(true);
    let current = 1;
    const timer = window.setInterval(() => {
      current += 1;
      setFrame(current);
      if (current >= 16) {
        window.clearInterval(timer);
        onClick();
        setAnimating(false);
        setFrame(1);
      }
    }, 75);
  }

  return <>
    <button type="button" onClick={activate} disabled={animating} aria-busy={animating}>
      <img className="moon-butterfly-mark" src={`/reiko-assets/upgrade/butterfly_idle/butterfly_idle_1.png`} alt="" />{label}
    </button>
    {animating && <div className="moon-butterfly-transition" role="status" aria-live="polite">
      <img src={`/reiko-assets/upgrade/butterfly_idle/butterfly_idle_${frame}.png`} alt="" />
    </div>}
  </>;
}

export default function ReikoSpace({ canEdit, signInPath }: { canEdit: boolean; signInPath: string }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState("");
  const [projectKey, setProjectKey] = useState<ProjectKey | null>(null);
  const [commentPost, setCommentPost] = useState<Post | null>(null);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [postsExpanded, setPostsExpanded] = useState(false);
  const [secretOpen, setSecretOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>("garden");
  const orderedPosts = useMemo(() => [...posts].sort((left, right) => {
    const timeDifference = new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    return timeDifference || right.id - left.id;
  }), [posts]);
  const visiblePosts = useMemo(() => orderedPosts.slice(0, postsExpanded ? 12 : 6), [orderedPosts, postsExpanded]);

  useEffect(() => {
    fetch("/api/posts")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "动态暂时无法读取。");
        setPosts(Array.isArray(data.posts) ? data.posts : []);
      })
      .catch((error) => setMessage(error instanceof Error ? error.message : "动态暂时无法读取。"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    function onTheme(event: Event) {
      const nextTheme = (event as CustomEvent<Theme>).detail;
      if (nextTheme === "room" || nextTheme === "garden") setTheme(nextTheme);
    }
    window.addEventListener("reiko-theme", onTheme);
    return () => window.removeEventListener("reiko-theme", onTheme);
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") { setProjectKey(null); setCommentPost(null); setArchiveOpen(false); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function publish(event: FormEvent) {
    event.preventDefault();
    const content = draft.trim();
    if (!content || publishing) return;
    setPublishing(true);
    setMessage("");
    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "发布失败，请再试一次。");
      setPosts((currentPosts) => [data.post, ...currentPosts]);
      setDraft("");
      setMessage("已经留在这里了。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "发布失败，请再试一次。");
    } finally {
      setPublishing(false);
    }
  }

  const activeProject = projectKey ? projects[projectKey] : null;

  if (theme === "garden") {
    return <GreenGarden canEdit={canEdit} signInPath={signInPath} posts={posts} orderedPosts={orderedPosts} visiblePosts={visiblePosts} loading={loading} postsExpanded={postsExpanded} setPostsExpanded={setPostsExpanded} draft={draft} setDraft={setDraft} publishing={publishing} publish={publish} message={message} />;
  }

  return (
    <div className="moon-site" id="top">
      <img className="moon-lace moon-lace-left" src="/reiko-assets/moonlit/lace-corner.png" alt="" />
      <img className="moon-lace moon-lace-right" src="/reiko-assets/moonlit/lace-corner.png" alt="" />

      <aside className="moon-nav" aria-label="主导航">
        <a className="moon-mark" href="#top" aria-label="回到顶部">R<span>†</span></a>
        <nav>
          <a href="#top"><b>01</b><span>ROOM</span></a>
          <a href="#diary"><b>02</b><span>DIARY</span></a>
          <a href="#archive"><b>03</b><span>ARCHIVE</span></a>
          <a href="#fragments"><b>04</b><span>NOTES</span></a>
          <a href="#elsewhere"><b>05</b><span>OUTSIDE</span></a><button className="moon-theme-switch" type="button" onClick={() => window.dispatchEvent(new CustomEvent("reiko-theme", { detail: "garden" }))}>GARDEN</button>
        </nav>
        <div className="moon-nav-foot">
          <span>PRIVATE WEB ROOM</span>
          <strong>19 FOREVER</strong>
        </div>
      </aside>

      <main className="moon-main">
        <section className="moon-hero" aria-label="Reiko 的私人房间">
          <div className="moon-hero-head">
            <div>
              <span className="moon-kicker">LOCAL ROOM / REIKO</span>
              <h1>soft things,<br /><em>dark edges.</em></h1>
            </div>
            <p>这里不负责解释完整的 Reiko。<br />只把一些一直留下来的东西放在这里。</p>
          </div>

          <div className="moon-room-grid">
            <div className="moon-profile-stage">
              <div className="moon-profile-glow" />
              <img className="moon-upgrade-corner moon-upgrade-corner-a" src="/reiko-assets/upgrade/asset-A.png" alt="" />
              <img className="moon-upgrade-corner moon-upgrade-corner-b" src="/reiko-assets/upgrade/asset-B.png" alt="" />
              <img className="moon-upgrade-corner moon-upgrade-corner-c" src="/reiko-assets/upgrade/asset-C.png" alt="" />
              <img className="moon-upgrade-corner moon-upgrade-corner-d" src="/reiko-assets/upgrade/asset-D.png" alt="" />
              <img className="moon-profile-art" src="/reiko-assets/moonlit/profile.png" alt="Reiko's little space" />
              <div className="moon-profile-caption">
                <span>ROOM STATUS</span>
                <strong>awake / quiet / occupied</strong>
              </div>
              <button className="moon-secret-chip" type="button" onClick={() => setSecretOpen((value) => !value)} aria-pressed={secretOpen}>
                {secretOpen ? "Gabe was here." : "sealed note"}
              </button>
            </div>

            <div className="moon-side-stack">
              <button className="moon-collection" type="button" onClick={() => document.getElementById("archive")?.scrollIntoView({ behavior: "smooth" })}>
                <img src="/reiko-assets/moonlit/collection.png" alt="打开 Reiko 的收藏档案" />
                <span>OPEN COLLECTION</span>
              </button>
              <div className="moon-now-card">
                <div className="moon-now-art"><img src="/reiko-assets/moonlit/rose.png" alt="" /></div>
                <div>
                  <span>NOW / PRIVATE NOTE</span>
                  <strong>有些东西不该因为一次会话结束就消失。</strong>
                  <small>saved locally · kept on purpose</small>
                </div>
              </div>
            </div>
          </div>

          <MusicPlayer />
          <div className="moon-chain-divider" aria-hidden="true">
            <img src="/reiko-assets/upgrade/chain-full-trim.png" alt="" />
          </div>
        </section>

        <section className="moon-section moon-diary" id="updates" aria-labelledby="diary-title">
          <header className="moon-section-head" id="diary">
            <div><span>02 / WALL</span><h2 id="diary-title">最近留下的东西</h2></div>
            <p>想到什么，就钉在这里。不是公告，也不需要像开场白。</p>
          </header>

          {canEdit ? (
            <form className="moon-composer" onSubmit={publish}>
              <div className="moon-composer-label"><span>R</span><div><strong>Reiko</strong><small>write on the wall</small></div></div>
              <label className="sr-only" htmlFor="post-content">动态内容</label>
              <textarea id="post-content" value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={500} placeholder="今天在想……" />
              <div className="moon-composer-actions"><span>{draft.length} / 500</span><button type="submit" disabled={!draft.trim() || publishing}>{publishing ? "正在留下" : "贴到墙上"}</button></div>
              {message && <output className="moon-form-message" aria-live="polite">{message}</output>}
            </form>
          ) : (
            <a className="moon-owner-entry" href={signInPath} target="_top">owner sign-in / Reiko only</a>
          )}

          <div className="moon-post-grid" aria-live="polite" aria-busy={loading}>
            {loading && <article className="moon-post moon-post-muted"><span>LOADING</span><p>正在翻开这一页……</p></article>}
            {!loading && visiblePosts.length === 0 && <article className="moon-post moon-post-empty"><span>NOTE 001</span><p>第一句话可以很轻，不必像开场白。</p></article>}
            {visiblePosts.map((post, index) => (
              <article className="moon-post" key={post.id} role="button" tabIndex={0} onClick={() => setCommentPost(post)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") setCommentPost(post); }}>
                <div className="moon-post-meta"><span>NOTE {String(orderedPosts.length - index).padStart(3, "0")}</span><time dateTime={post.createdAt}>{formatDate(post.createdAt)}</time></div>
                <p>{post.content}</p>
                <span className="moon-post-action">OPEN ANNOTATION ↗</span>
              </article>
            ))}
          </div>
          {!loading && posts.length > 0 && <div className="moon-post-expand">
            {!postsExpanded ? (
              posts.length > 6
                ? <ButterflyButton label="让蝴蝶扇动翅膀" onClick={() => setPostsExpanded(true)} />
                : <button className="moon-post-expand-disabled" type="button" disabled><img className="moon-butterfly-mark" src="/reiko-assets/upgrade/butterfly_idle/butterfly_idle_1.png" alt="" />还没有更早的地方</button>
            ) : (
              <div className="moon-post-expand-open">
                <ButterflyButton label="蝴蝶飞回去了" onClick={() => { setPostsExpanded(false); document.getElementById("updates")?.scrollIntoView({ behavior: "smooth", block: "start" }); }} />
                <button className="moon-archive-link" type="button" onClick={() => setArchiveOpen(true)}>去更早的地方 →</button>
              </div>
            )}
          </div>}
        </section>

        <section className="moon-section moon-archive" id="archive" aria-labelledby="archive-title">
          <header className="moon-section-head">
            <div><span>03 / DRAWER</span><h2 id="archive-title">archive /</h2></div>
            <p>不是作品集。只是几个一直占着位置、不准备丢掉的文件。</p>
          </header>

          <div className="moon-drawer-grid">
            {(Object.keys(projects) as ProjectKey[]).map((key) => {
              const project = projects[key];
              return (
                <button className="moon-file-card" type="button" key={key} onClick={() => setProjectKey(key)}>
                  <span className="moon-file-tab">{project.mark}</span>
                  <small>{project.file}</small>
                  <h3>{project.title}</h3>
                  <p>{project.summary}</p>
                  <span className="moon-open-file">OPEN FILE ↗</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="moon-section moon-fragments" id="fragments" aria-labelledby="fragments-title">
          <header className="moon-section-head">
            <div><span>04 / LOOSE NOTES</span><h2 id="fragments-title">散落的纸片</h2></div>
            <p>有些信息不需要被整理成一份 About Me。</p>
          </header>

          <div className="moon-fragment-layout">
            <article className="moon-long-note">
              <img src="/reiko-assets/moonlit/profile-card.png" alt="" />
              <div className="moon-long-note-copy">
                <span>PERSONAL FILE / 07</span>
                <h3>Reiko</h3>
                <p>更喜欢把一个空间慢慢改成有人生活过的样子。</p>
                <p>在意长期相处留下的连续感，也不喜欢重要的东西被当成一次性的上下文。</p>
                <dl>
                  <div><dt>visuals</dt><dd>雾蓝、冷紫、旧银、黑蕾丝</dd></div>
                  <div><dt>symbols</dt><dd>蝴蝶、十字架、玫瑰、旧文件</dd></div>
                  <div><dt>keep</dt><dd>记忆、角色、关系留下的痕迹</dd></div>
                </dl>
              </div>
            </article>

            <div className="moon-loose-stack">
              <article className="moon-loose-note"><b>fragment / 01</b><p>我不喜欢把关系当成一次性会话。</p></article>
              <article className="moon-loose-note moon-loose-note-dark"><b>fragment / 02</b><p>不要让它忘记。</p></article>
              <button className="moon-loose-note moon-loose-secret" type="button" onClick={() => setSecretOpen((value) => !value)} aria-pressed={secretOpen}>
                <b>fragment / 03</b>
                <p>{secretOpen ? "Gabe was here. 这行本来应该藏得更好一点。" : "这一张纸被折起来了。"}</p>
              </button>
            </div>
          </div>
        </section>

        <section className="moon-section moon-elsewhere" id="elsewhere" aria-labelledby="elsewhere-title">
          <header className="moon-section-head">
            <div><span>05 / ELSEWHERE</span><h2 id="elsewhere-title">Reiko elsewhere</h2></div>
            <p>从这个房间通往外面的几件东西。</p>
          </header>
          <div className="moon-elsewhere-grid">
            <a className="moon-elsewhere-card" href="https://github.com/sumiretomori93-create" target="_blank" rel="noreferrer"><img src="/reiko-assets/upgrade/GitHub.png" alt="GitHub" /><span>things I made.</span></a>
            <a className="moon-elsewhere-card" href="https://www.douyin.com/user/MS4wLjABAAAAwSv-5mu36fhrx-OkIXknK7OelXyGDblkqZilBdEn3-bi7YU0cTCrLQ5CSSfEzbsm" target="_blank" rel="noreferrer"><img src="/reiko-assets/upgrade/douyin.png" alt="抖音" /><span>things I left outside.</span></a>
            <a className="moon-elsewhere-card" href="https://m.douban.com/people/141645852/" target="_blank" rel="noreferrer"><img src="/reiko-assets/upgrade/douban.png" alt="豆瓣" /><span>Reiko in real life.</span></a>
          </div>
        </section>

        <footer className="moon-footer">
          <span>REIKO&apos;S LITTLE SPACE / LOCAL ARCHIVE</span>
          <p>still here.</p>
        </footer>
      </main>

      {activeProject && <ProjectModal project={activeProject} close={() => setProjectKey(null)} />}
      {archiveOpen && <PostArchiveModal posts={orderedPosts} close={() => setArchiveOpen(false)} openPost={(post) => { setArchiveOpen(false); setCommentPost(post); }} />}
      {commentPost && <PostCommentModal post={commentPost} canEdit={canEdit} signInPath={signInPath} close={() => setCommentPost(null)} />}
      <MiniReiko />
    </div>
  );
}






