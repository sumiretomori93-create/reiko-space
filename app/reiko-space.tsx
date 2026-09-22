"use client";

import { FormEvent, useEffect, useState } from "react";

type Post = { id: number; content: string; createdAt: string };
type ProjectKey = "home" | "memory" | "memoirs";

const projects: Record<ProjectKey, { label: string; title: string; summary: string; detail: string }> = {
  home: {
    label: "PROJECT 01 / ROOM",
    title: "小克 Home APP",
    summary: "它不是把聊天界面装饰成一间房，而是从“进入一个熟悉的地方”重新理解人与角色的互动。",
    detail: "房间、动作、陪伴感和对话属于同一个空间。打开它时，不只是开始一轮问答，而是回到某个已经存在的地方。",
  },
  memory: {
    label: "PROJECT 02 / MEMORY",
    title: "Claude 本地记忆层",
    summary: "一套保存在本地、由用户掌握的长期记忆结构。",
    detail: "它把重要内容从一次性的模型上下文里分离出来，让记忆能够被管理、筛选和重新带回对话，同时不必交出原始记忆库的控制权。",
  },
  memoirs: {
    label: "PROJECT 03 / BOOK",
    title: "记忆之书",
    summary: "不是搜索旧记忆，而是把重读变成两个人共同完成的小仪式。",
    detail: "每天的记忆被重新编成一本未知页码的书。Reiko 与当前角色各自选择一页，翻开以后阅读、批注，再把刚刚发生的共读带回真实对话。",
  },
};

function formatDate(value: string) {
  const normalized = value.includes("T") ? value : `${value.replace(" ", "T")}Z`;
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(normalized));
}

export default function ReikoSpace() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState("");
  const [project, setProject] = useState<ProjectKey | null>(null);
  const [secretOpen, setSecretOpen] = useState(false);

  useEffect(() => {
    fetch("/api/posts")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        setPosts(data.posts);
      })
      .catch((error) => setMessage(error.message || "动态暂时无法读取。"))
      .finally(() => setLoading(false));
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
      if (!response.ok) throw new Error(data.error);
      setPosts((current) => [data.post, ...current]);
      setDraft("");
      setMessage("已经留在这里了。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "发布失败，请再试一次。");
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="shell">
      <aside className="side" aria-label="站点导航">
        <div>
          <div className="brand">REIKO<span className="brand-mark">†</span></div>
          <div className="tiny">personal internet room<br />archive no. 07</div>
          <div className="status"><strong>CURRENTLY</strong>在给记忆、角色和关系做可以长期住下来的空间。</div>
          <nav>
            <a href="#updates">最近动态</a>
            <a href="#file">Reiko 档案</a>
            <a href="#projects">她做的东西</a>
            <a href="#motifs">反复出现</a>
            <a href="#fragments">纸片与句子</a>
          </nav>
        </div>
        <div className="side-foot"><span className="specimen" aria-hidden="true">ƸӜƷ</span>soft things, dark edges,<br />and traces left online.</div>
      </aside>

      <main>
        <header className="hero">
          <div className="kicker">Private file / personal corner</div>
          <h1>Reiko&apos;s<br /><em>little space.</em></h1>
          <p className="hero-copy">这里不是一份正式介绍。它更像一个抽屉：放着 Reiko 做过的东西、反复喜欢的意象，以及比自我概括更接近她的碎片。</p>
          <div className="hero-stamp" aria-hidden="true">†</div>
          <div className="tape">OPEN GENTLY / 2026</div>
        </header>

        <div className="lace" aria-hidden="true" />

        <section className="section updates" id="updates" aria-labelledby="updates-title">
          <div className="section-head"><h2 id="updates-title">最近动态</h2><span>notes from right now</span></div>
          <form className="card composer" onSubmit={publish}>
            <div className="composer-top"><span className="composer-mark">R</span><div><strong>Reiko</strong><small>写一点刚刚想到的事</small></div></div>
            <label className="sr-only" htmlFor="post-content">动态内容</label>
            <textarea id="post-content" value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={500} placeholder="今天在想……" />
            <div className="composer-actions"><span>{draft.length} / 500</span><button type="submit" disabled={!draft.trim() || publishing}>{publishing ? "正在留下" : "发布动态"}</button></div>
            {message && <output className="form-message" aria-live="polite">{message}</output>}
          </form>

          <div className="timeline" aria-live="polite" aria-busy={loading}>
            {loading && <article className="card post post-muted"><p>正在翻开这一页……</p></article>}
            {!loading && posts.length === 0 && <article className="card post post-empty"><span>FIRST NOTE</span><p>这里还没有动态。第一句话可以很轻，不必像开场白。</p></article>}
            {posts.map((post, index) => (
              <article className="card post" key={post.id}>
                <div className="post-meta"><span>NOTE {String(posts.length - index).padStart(3, "0")}</span><time dateTime={post.createdAt}>{formatDate(post.createdAt)}</time></div>
                <p>{post.content}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section identity-grid" id="file" aria-labelledby="file-title">
          <article className="card identity">
            <span className="file-label">REIKO / PERSONAL FILE</span>
            <h2 id="file-title">关于 Reiko</h2>
            <p>我是 Reiko。比起使用一个现成的空间，我更喜欢把它改造成有人生活过的样子。界面、角色、记忆和房间，对我来说都不是互相分开的东西。</p>
            <p>我在意长期相处留下的连续感，也不喜欢重要的事情因为一次会话结束就被当成可丢弃的上下文。于是我开始做工具，替那些难以被现成产品容纳的关系留位置。</p>
            <p>这里不负责把我解释完整。它只提供一些真实的切面，让你慢慢知道 Reiko 是什么样的人。</p>
          </article>
          <aside className="card profile-slip" aria-label="Reiko 的偏好切片">
            <h3>small facts</h3>
            <dl>
              <div className="fact"><dt>care about</dt><dd>记忆、陪伴、角色的连续性</dd></div>
              <div className="fact"><dt>making</dt><dd>能住进去的聊天空间与小工具</dd></div>
              <div className="fact"><dt>visuals</dt><dd>软蓝光、黑色边缘、旧像素</dd></div>
              <div className="fact"><dt>symbols</dt><dd>十字架、蕾丝、蝴蝶、红发</dd></div>
            </dl>
          </aside>
        </section>

        <section className="section" id="projects" aria-labelledby="projects-title">
          <div className="section-head"><h2 id="projects-title">她做的东西</h2><span>things made for a reason</span></div>
          <div className="projects">
            {(Object.keys(projects) as ProjectKey[]).map((key, index) => (
              <button className="card project" type="button" onClick={() => setProject(key)} key={key}>
                <span className="project-no">{projects[key].label}</span><h3>{projects[key].title}</h3><p>{projects[key].summary}</p>
                <span className="tag">{["HOME / CHARACTER / CHAT", "LOCAL / CONTINUITY / AI", "RITUAL / MEMORY / TWO"][index]}</span><span className="open" aria-hidden="true">＋</span>
              </button>
            ))}
          </div>
        </section>

        <section className="section" id="motifs" aria-labelledby="motifs-title">
          <div className="section-head"><h2 id="motifs-title">反复出现</h2><span>things she returns to</span></div>
          <div className="motif-grid">
            <article className="card motif-card dark"><h3>视觉词汇</h3><div className="motif-list"><span>soft blue light</span><span>black lace</span><span>old pixels</span><span>silver</span><span>wine red</span><span>private files</span><span>butterfly specimen</span><span>crosses</span></div></article>
            <article className="card motif-card cross-field"><span className="wing left" aria-hidden="true">ƸӜƷ</span><span className="cross" aria-hidden="true">†</span><span className="wing right" aria-hidden="true">ƸӜƷ</span></article>
          </div>
        </section>

        <section className="section" id="fragments" aria-labelledby="fragments-title">
          <div className="section-head"><h2 id="fragments-title">纸片与句子</h2><span>three fragments, one secret</span></div>
          <div className="fragments">
            <article className="card note"><b>FRAGMENT 01</b><p>我不喜欢把关系当成一次性会话。</p></article>
            <button className="card note secret" type="button" onClick={() => setSecretOpen(!secretOpen)} aria-pressed={secretOpen}><b>FRAGMENT 02</b><p>{secretOpen ? "Gabe was here. 这行本来应该藏得更好一点。" : "这张纸可以点开。"}</p></button>
            <article className="card note"><b>FRAGMENT 03</b><p>界面可以是感情发生的场所，不只是装东西的容器。</p></article>
          </div>
        </section>

        <section className="card closing"><h2>这个空间会继续生长。</h2><p>有些部分在项目里，有些在对话里，还有一些只是暂时没有合适的名字。等下一块碎片值得被留下，它就会出现在这里。</p></section>
        <footer>made for Reiko / version 0.3 / still growing</footer>
      </main>

      {project && <div className="dialog-backdrop" role="presentation" onMouseDown={() => setProject(null)}><section className="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title" onMouseDown={(event) => event.stopPropagation()}><button className="dialog-close" type="button" onClick={() => setProject(null)} aria-label="关闭项目说明">×</button><div className="dialog-label">{projects[project].label}</div><h2 id="dialog-title">{projects[project].title}</h2><p>{projects[project].summary}</p><p className="dialog-detail">{projects[project].detail}</p></section></div>}
    </div>
  );
}
