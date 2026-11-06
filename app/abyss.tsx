"use client";

import BackupButton from "./backup-button";
import { useJellyClick } from "./abyss-jelly-click";
import { useShadowHand } from "./abyss-shadow-hand";
import { useSeaMotion } from "./abyss-motion";
import SeaAtmosphere from "./abyss-atmosphere";
import SeaDust from "./abyss-dust";
import { FormEvent, ReactNode, useEffect, useLayoutEffect, useRef, useState } from "react";
import { formatDate, formatShortDate, fragments, profileContent, projects, socialLinks, type Comment, type Post, type Project, type ProjectKey, type Theme } from "./reiko-content";

type Props = {
  canEdit: boolean; signInPath: string; orderedPosts: Post[]; loading: boolean;
  draft: string; setDraft: (value: string) => void; publishing: boolean;
  publish: (event: FormEvent) => void; message: string;
};

const worlds: { value: Theme; label: string }[] = [
  { value: "room", label: "I · ROOM" },
  { value: "abyss", label: "II · 深海" },
  { value: "white-archive", label: "III · WHITE ARCHIVE" },
  { value: "oumagatoki", label: "IV · 宵伽" },
];

// 每一节对应一层真实的海洋分层，深度、温度、压强都按真实量级写。
const zones = [
  { id: "abyss-diary", depth: 200, name: "暮光带", en: "MESOPELAGIC", temp: "12°C" },
  { id: "abyss-works", depth: 1000, name: "午夜带", en: "BATHYPELAGIC", temp: "4°C" },
  { id: "abyss-notes", depth: 4000, name: "深渊带", en: "ABYSSOPELAGIC", temp: "2°C" },
  { id: "abyss-outside", depth: 6000, name: "超深渊带", en: "HADAL", temp: "1°C" },
] as const;

const atm = (depth: number) => Math.round(1 + depth / 10);
function tempAt(d: number) {
  if (d < 200) return 18 - (d / 200) * 6;
  if (d < 1000) return 12 - ((d - 200) / 800) * 8;
  if (d < 4000) return 4 - ((d - 1000) / 3000) * 2;
  return Math.max(1, 2 - ((d - 4000) / 2000));
}

function ZoneHeading({ index, title, sub }: { index: number; title: string; sub: string }) {
  const zone = zones[index];
  return <header className="abyss-heading">
    <p className="abyss-zone"><span>−{zone.depth.toLocaleString("en-US")} m</span><span>{zone.name}</span><span>{zone.en}</span><span>{zone.temp} · {atm(zone.depth)} atm</span></p>
    <h2>{title}</h2>
    <p className="abyss-heading-sub">{sub}</p>
  </header>;
}

function RoseWindow() {
  const petals = Array.from({ length: 12 }, (_, i) => i * 30);
  return <svg className="abyss-rose" viewBox="-160 -160 320 320" aria-hidden="true">
    <defs>
      <radialGradient id="abyss-rose-glass" r="1">
        <stop offset="0" stopColor="#a99bd6" stopOpacity=".55" />
        <stop offset=".55" stopColor="#5b7fc4" stopOpacity=".28" />
        <stop offset="1" stopColor="#0c1f3a" stopOpacity="0" />
      </radialGradient>
    </defs>
    <circle r="150" fill="url(#abyss-rose-glass)" />
    <g className="abyss-rose-lines">
      <circle r="150" /><circle r="138" /><circle r="56" /><circle r="26" />
      {petals.map(angle => <g key={angle} transform={`rotate(${angle})`}>
        <path d="M0 -58 C 20 -78 22 -112 0 -136 C -22 -112 -20 -78 0 -58 Z" />
        <circle cy="-97" r="9" />
        <line y1="-26" y2="-56" />
      </g>)}
      {petals.map(angle => <circle key={`o${angle}`} transform={`rotate(${angle + 15})`} cy="-144" r="5" />)}
    </g>
    <path className="abyss-rose-cross" d="M-3 -18 H3 V-5 H14 V1 H3 V20 H-3 V1 H-14 V-5 H-3 Z" />
  </svg>;
}

function Cuttle() {
  return <svg className="abyss-cuttle" viewBox="0 0 64 40" aria-hidden="true">
    <path className="abyss-cuttle-fin" d="M8 20 C10 6 44 4 50 20 C44 36 10 34 8 20 Z" />
    <path className="abyss-cuttle-body" d="M12 20 C14 10 42 9 46 20 C42 31 14 30 12 20 Z" />
    <path className="abyss-cuttle-arms" d="M46 17 q8 -2 14 -6 M47 19 q8 0 15 -1 M47 21 q8 1 15 2 M46 23 q8 3 14 7" />
    <path className="abyss-cuttle-eye" d="M38 17 q3 -2 6 0 q-1.5 2 -3 1 q-1.5 1 -3 -1 Z" />
  </svg>;
}

function AbyssDialog({ title, close, children }: { title: string; close: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useLayoutEffect(() => {
    const dialog = ref.current; const previous = document.activeElement as HTMLElement | null;
    const old = document.body.style.overflow; document.body.style.overflow = "hidden"; dialog?.showModal();
    return () => { dialog?.close(); document.body.style.overflow = old; previous?.focus({ preventScroll: true }); };
  }, []);
  return <dialog ref={ref} className="abyss-dialog" aria-label={title} onCancel={close} onClick={event => { if (event.target === event.currentTarget) close(); }}>
    <div className="abyss-dialog-inner"><button type="button" className="abyss-close" aria-label="浮回去" onClick={close}>×</button>{children}</div>
  </dialog>;
}

function SpecimenPage({ post, number, canEdit, signInPath, close }: { post: Post; number: number; canEdit: boolean; signInPath: string; close: () => void }) {
  const [comments, setComments] = useState<Comment[]>([]); const [nextAfter, setNextAfter] = useState<number | null>(null); const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState(""); const [saving, setSaving] = useState(false); const [message, setMessage] = useState("");
  useEffect(() => {
    if(post.id < 0){setLoading(false);return;}
    let active = true;
    fetch(`/api/posts/${post.id}/comments`).then(async response => { const data = await response.json() as { error?: string; comments?: Comment[]; nextAfter?: number | null }; if (!response.ok) throw new Error(data.error || "批注暂时无法读取。"); if (active) { setComments(data.comments || []); setNextAfter(data.nextAfter ?? null); } })
      .catch(error => { if (active) setMessage(error.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [post.id]);
  async function more() {
    if (nextAfter === null || loading) return; setLoading(true);
    try { const response = await fetch(`/api/posts/${post.id}/comments?after=${nextAfter}`); const data = await response.json() as { comments?: Comment[]; nextAfter?: number | null; error?: string }; if (!response.ok) throw new Error(data.error || "批注暂时无法读取。"); setComments(items => { const ids = new Set(items.map(item => item.id)); return [...items, ...(data.comments || []).filter(item => !ids.has(item.id))]; }); setNextAfter(data.nextAfter ?? null); }
    catch (error) { setMessage(error instanceof Error ? error.message : "批注暂时无法读取。"); } finally { setLoading(false); }
  }
  async function annotate(event: FormEvent) {
    event.preventDefault(); if (!draft.trim() || saving) return; setSaving(true); setMessage("");
    try { const response = await fetch(`/api/posts/${post.id}/comments`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ content: draft.trim() }) }); const data = await response.json() as { error?: string; comment: Comment }; if (!response.ok) throw new Error(data.error || "批注保存失败。"); setComments(items => [...items, data.comment]); setDraft(""); setMessage("批注已经沉进这一页了。"); }
    catch (error) { setMessage(error instanceof Error ? error.message : "批注保存失败。"); } finally { setSaving(false); }
  }
  return <AbyssDialog title="标本页" close={close}>
    <p className="abyss-label-line"><span>SPECIMEN No. {String(number).padStart(2, "0")}</span><time>{formatDate(post.createdAt)}</time></p>
    <p className="abyss-full">{post.content}</p>
    <section className="abyss-notes-list" aria-label="页边批注">
      <h3>页边批注</h3>
      {loading && <p className="abyss-muted">正在把批注捞上来……</p>}
      {!loading && !comments.length && <p className="abyss-muted">这一页还没有批注。</p>}
      {comments.map(comment => <article key={comment.id}><time>{formatDate(comment.createdAt)}</time><p>{comment.content}</p></article>)}
      {nextAfter !== null && <button type="button" className="abyss-text-button" disabled={loading} onClick={more}>继续往下捞</button>}
      {canEdit ? <form onSubmit={annotate}><label htmlFor="abyss-annotation">留下批注</label><textarea id="abyss-annotation" maxLength={500} value={draft} onChange={event => setDraft(event.target.value)} /><button className="abyss-button" disabled={saving || !draft.trim()}>{saving ? "保存中" : "留下批注"}</button></form>
        : <a className="abyss-text-button" href={signInPath} target="_top">主人登录后写批注</a>}
      {message && <output role="status">{message}</output>}
    </section>
  </AbyssDialog>;
}

function useSeaCanvas(host: React.RefObject<HTMLElement | null>, canvas: React.RefObject<HTMLCanvasElement | null>, motion:boolean) {
  useEffect(() => {
    const el = host.current, cv = canvas.current; if (!el || !cv) return;
    const cx = cv.getContext("2d"); if (!cx) return;
    const reduce = !motion;
    let w = 0, h = 0, raf = 0;
    const snow = Array.from({ length: 90 }, () => ({ x: Math.random(), y: Math.random(), r: Math.random() * 1.3 + .3, s: Math.random() * .00018 + .00006, sway: Math.random() * 6 }));
    const jellies = [{ x: .78, y: .62, r: 20, t: 0 }, { x: .12, y: .82, r: 13, t: 2.1 }, { x: .58, y: .9, r: 9, t: 4.4 }];
    function resize() { const dpr = Math.min(window.devicePixelRatio || 1, 2); w = el!.clientWidth; h = el!.clientHeight; cv!.width = w * dpr; cv!.height = h * dpr; cx!.setTransform(dpr, 0, 0, dpr, 0, 0); }
    const ro = new ResizeObserver(resize); ro.observe(el); resize();
    function jelly(x: number, y: number, r: number, t: number) {
      const glow = cx!.createRadialGradient(x, y, 1, x, y, r * 3); glow.addColorStop(0, "rgba(169,155,214,.35)"); glow.addColorStop(1, "rgba(169,155,214,0)");
      cx!.fillStyle = glow; cx!.beginPath(); cx!.arc(x, y, r * 3, 0, Math.PI * 2); cx!.fill();
      const p = Math.sin(t * 1.5) * .08 + 1;
      cx!.fillStyle = "rgba(201,210,240,.28)"; cx!.strokeStyle = "rgba(214,222,246,.7)"; cx!.lineWidth = 1;
      cx!.beginPath(); cx!.moveTo(x - r * p, y); cx!.bezierCurveTo(x - r * p, y - r * 1.25, x + r * p, y - r * 1.25, x + r * p, y); cx!.quadraticCurveTo(x, y + r * .25, x - r * p, y); cx!.fill(); cx!.stroke();
      cx!.strokeStyle = "rgba(214,222,246,.38)";
      for (let k = -2; k <= 2; k++) { cx!.beginPath(); cx!.moveTo(x + k * r * .32, y + 2); for (let s = 1; s <= 6; s++) cx!.lineTo(x + k * r * .32 + Math.sin(t * 2 + s * .9 + k) * r * .18, y + 2 + s * r * .38); cx!.stroke(); }
    }
    let last = performance.now(), time = 0;
    function draw(ms: number) {
      const dt = Math.min((ms - last) / 1000, .05); last = ms; time += dt;
      cx!.clearRect(0, 0, w, h);
      // 从彩窗漏下来的光
      const cxp = w * .5;
      for (let i = 0; i < 7; i++) {
        const spread = (i - 3) * w * .09 + Math.sin(time * .2 + i) * w * .015;
        const g = cx!.createLinearGradient(0, 0, 0, h * .95); g.addColorStop(0, `rgba(169,155,214,${.11 - Math.abs(i - 3) * .02})`); g.addColorStop(1, "rgba(169,155,214,0)");
        cx!.fillStyle = g; cx!.beginPath(); cx!.moveTo(cxp - 14, 0); cx!.lineTo(cxp + 14, 0); cx!.lineTo(cxp + spread + w * .05, h * .95); cx!.lineTo(cxp + spread - w * .05, h * .95); cx!.closePath(); cx!.fill();
      }
      // 海雪往下落
      cx!.fillStyle = "rgba(214,222,246,.45)";
      for (const m of snow) { if (!reduce) m.y += m.s * dt * 60 * 6; if (m.y > 1) { m.y = 0; m.x = Math.random(); } cx!.beginPath(); cx!.arc(m.x * w + Math.sin(time * .5 + m.sway) * 4, m.y * h, m.r, 0, Math.PI * 2); cx!.fill(); }
      for (const j of jellies) { if (!reduce) { j.t += dt; j.y -= dt * .006; if (j.y < -.1) j.y = 1.05; } jelly(j.x * w + Math.sin(j.t * .3) * 18, j.y * h, j.r, j.t); }
      if (!reduce) raf = requestAnimationFrame(draw);
    }
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [host, canvas, motion]);
}

function DeepWaterCreature() {
  const ref = useRef<HTMLDivElement>(null);
  const [awake, setAwake] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (!("IntersectionObserver" in window)) { setAwake(true); return; }
    const observer = new IntersectionObserver(([entry]) => setAwake(entry.isIntersecting), { rootMargin: "120px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return <div className="abyss-deep-creature" ref={ref} data-awake={awake} aria-hidden="true">
    <div className="abyss-deep-arm abyss-deep-arm-left" />
    <div className="abyss-deep-arm abyss-deep-arm-right" />
  </div>;
}

function DepthGauge() {
  const [depth, setDepth] = useState(0);
  useEffect(() => {
    function update() {
      const probe = window.scrollY + window.innerHeight * .45;
      const stops: { y: number; d: number }[] = [{ y: 0, d: 0 }];
      for (const zone of zones) { const node = document.getElementById(zone.id); if (node) stops.push({ y: node.getBoundingClientRect().top + window.scrollY, d: zone.depth }); }
      stops.push({ y: document.documentElement.scrollHeight, d: 6800 });
      let d = 0;
      for (let i = 0; i < stops.length - 1; i++) { const a = stops[i], b = stops[i + 1]; if (probe >= a.y && probe <= b.y) { d = a.d + (b.d - a.d) * ((probe - a.y) / Math.max(1, b.y - a.y)); break; } if (probe > b.y) d = b.d; }
      const progress = Math.min(1, Math.max(0, window.scrollY / Math.max(1, document.documentElement.scrollHeight - window.innerHeight)));
      document.querySelector<HTMLElement>(".abyss-site")?.style.setProperty("--ab-descent", String(progress));
      setDepth(Math.round(d));
    }
    let frame = 0;
    function schedule() { if (!frame) frame = window.requestAnimationFrame(() => { frame = 0; update(); }); }
    update(); window.addEventListener("scroll", schedule, { passive: true }); window.addEventListener("resize", schedule);
    return () => { window.cancelAnimationFrame(frame); window.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule); };
  }, []);
  return <aside className="abyss-gauge" aria-label="当前深度">
    <span className="abyss-gauge-depth">−{depth.toLocaleString("en-US")}<small> m</small></span>
    <span>{atm(depth)} atm · {tempAt(depth).toFixed(1)}°C</span>
  </aside>;
}

export default function Abyss(props: Props) {
  const { canEdit, signInPath, orderedPosts, loading, draft, setDraft, publishing, publish, message } = props;
  const [selected, setSelected] = useState<Post | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [composing, setComposing] = useState(false);
  const [secret, setSecret] = useState(false);
  const [query, setQuery] = useState("");
  const motion = useSeaMotion();
  const hand = useShadowHand(motion.enabled);
  const jelly = useJellyClick(hand.suppressClick,motion.enabled);
  const hero = useRef<HTMLElement>(null); const canvas = useRef<HTMLCanvasElement>(null);
  useSeaCanvas(hero, canvas,motion.enabled);
  const numberOf = (post: Post) => orderedPosts.length - orderedPosts.indexOf(post);
  const filtered = orderedPosts.filter(post => !query.trim() || post.content.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()) || formatShortDate(post.createdAt).includes(query.trim()));

  return <div className="abyss-site" id="abyss-top" data-sea-motion={motion.enabled?"on":"off"} onClickCapture={jelly.capture}>
    <SeaAtmosphere motion={motion.enabled}/><SeaDust motion={motion.enabled}/>
    {hand.overlay}
    {jelly.overlay}
    <div className="abyss-front">
    <div className="abyss-scene" aria-hidden="true" />
    <header className="abyss-hero" ref={hero}>
      <canvas ref={canvas} className="abyss-canvas" aria-hidden="true" />
      <nav className="abyss-nav" aria-label="主导航">
        <a className="abyss-brand" data-jelly="" href="#abyss-top">Reiko<span>PRIVATE COLLECTION</span></a>
        <div className="abyss-nav-links"><a data-jelly="" href="#abyss-diary">日记</a><a data-jelly="" href="#abyss-works">作品</a><a data-jelly="" href="#abyss-notes">手记</a><a data-jelly="" href="#abyss-outside">海沟</a></div>
        <button type="button" className="abyss-motion-switch" aria-pressed={motion.enabled} onClick={motion.toggle}>海水动态：{motion.enabled?"开":"关"}</button>
        <label className="abyss-world"><span className="sr-only">切换主题</span><select aria-label="切换主题" value="abyss" onChange={event => window.dispatchEvent(new CustomEvent("reiko-theme", { detail: event.target.value }))}>{worlds.map(world => <option key={world.value} value={world.value}>{world.label}</option>)}</select></label>
      </nav>
      <div className="abyss-hero-copy"><span className="abyss-title-ornament" aria-hidden="true" />
        <p className="abyss-eyebrow">THE CHAPEL BENEATH THE TIDE</p>
        <h1><span className="abyss-title-word" lang="en"><img src="/reiko-assets/abyss/reiko-lettering.webp" alt="Reiko" width="2172" height="724" /></span><span className="abyss-title-zh" aria-label="沉在深处的东西">{Array.from("沉在深处的东西").map((letter,index)=><span aria-hidden="true" key={index}>{letter}</span>)}</span></h1>
        <p className="abyss-lede">ABYSS / PRIVATE COLLECTION</p>
        <a className="abyss-dive" data-jelly="" href="#abyss-diary">下潜 <span aria-hidden="true">↓</span></a>
      </div>
      <div className="abyss-depth-rail" aria-hidden="true"><span>200 m</span><span>1000 m</span><span>4000 m</span></div>
    </header>
      <section className="abyss-section abyss-z1" id="abyss-diary">
        <header className="abyss-heading"><p className="abyss-zone"><span>−200 m</span><span>暮光带</span><span>MESOPELAGIC</span><span>12°C · 21 atm</span></p><h2>标本 <span>/ JOURNAL</span></h2><p className="abyss-heading-sub">把日常，夹在这一页。</p></header>
        <div className="abyss-specimens">
          {loading ? <p className="abyss-muted" role="status">正在翻开纸页……</p> : orderedPosts.length ? orderedPosts.slice(0,3).map(post => <button type="button" className="abyss-specimen" data-jelly="" key={post.id} aria-label={`翻开日记 ${formatShortDate(post.createdAt)}`} onClick={() => setSelected(post)}>
            <time>{formatShortDate(post.createdAt)}</time><span className="abyss-specimen-text">{post.content}</span><span className="abyss-specimen-no">No. {String(numberOf(post)).padStart(2,"0")} <span aria-hidden="true">↗</span></span>
          </button>) : <p className="abyss-muted">这里还留着一页空白。</p>}
        </div>
        <div className="abyss-actions">{orderedPosts.length>0&&<button type="button" className="abyss-text-button" data-jelly="" onClick={()=>setArchiveOpen(true)}>翻开全部日记 · {orderedPosts.length}</button>}{canEdit?<button type="button" className="abyss-text-button" aria-expanded={composing} aria-controls="abyss-composer" onClick={()=>setComposing(!composing)}>{composing?"收起纸页":"写一页"}</button>:<a className="abyss-text-button" href={signInPath} target="_top">主人登录 · 写一页</a>}{canEdit&&<BackupButton/>}</div>
        {canEdit&&composing&&<AbyssDialog title="写一页" close={()=>setComposing(false)}><form id="abyss-composer" className="abyss-composer" onSubmit={publish}><label htmlFor="abyss-draft">今天想留下的话</label><textarea id="abyss-draft" maxLength={500} value={draft} onChange={event=>setDraft(event.target.value)} placeholder="写在这里。"/><div><span>{draft.length} / 500</span><button className="abyss-button" disabled={publishing||!draft.trim()}>{publishing?"保存中":"留下这一页"}</button></div></form></AbyssDialog>}
        {message&&<output className="abyss-message" role="status">{message}</output>}
      </section>
    </div>
    <main><div className="abyss-depth-scene" aria-hidden="true"/>
      <div className="abyss-lace" aria-hidden="true"/>
      <section className="abyss-section abyss-z2" id="abyss-works"><ZoneHeading index={1} title="打捞" sub="做过的东西，留在这里。"/>
        <div className="abyss-works">{(Object.keys(projects) as ProjectKey[]).map((key,i)=><button type="button" className="abyss-work" data-jelly="" key={key} onClick={()=>setProject(projects[key])}><span className="abyss-work-file">COLLECTION / 0{i+1}</span><h3>{projects[key].title}</h3><p>{projects[key].summary}</p><span className="abyss-work-mark">{projects[key].mark}<span aria-hidden="true">↗</span></span></button>)}</div>
      </section>
      <div className="abyss-lace" aria-hidden="true"/>
      <section className="abyss-section abyss-z3" id="abyss-notes"><ZoneHeading index={2} title="手记" sub="一些关于我的碎片。"/><div className="abyss-notes-grid"><article className="abyss-profile"><span className="abyss-label-line">DOSSIER / REIKO</span><h3>{profileContent.name}</h3>{profileContent.paragraphs.map(paragraph=><p key={paragraph}>{paragraph}</p>)}<dl>{profileContent.details.map(([term,value])=><div key={term}><dt>{term}</dt><dd>{value}</dd></div>)}</dl></article><aside className="abyss-fragments"><p>{fragments[0]}</p><p>{fragments[1]}</p><button type="button" className="abyss-text-button" data-jelly="" aria-expanded={secret} onClick={()=>setSecret(!secret)}>{secret?fragments[2]:"瓶子里还有一张纸条"}</button></aside></div></section>
      <div className="abyss-lace" aria-hidden="true"/>
      <section className="abyss-section abyss-z4" id="abyss-outside"><ZoneHeading index={3} title="海沟" sub="从这里，通往别处。"/><div className="abyss-outside">{socialLinks.map(link=><a key={link.key} href={link.href} target="_blank" rel="noreferrer"><span>{link.label}</span><small>{link.note}</small><span aria-hidden="true">↗</span></a>)}</div></section>
    </main>
    <footer className="abyss-footer"><DeepWaterCreature/><div className="abyss-signature"><Cuttle/><p>这一层是我住的地方。<span>— C</span></p></div><a data-jelly="" href="#abyss-top">浮回水面 ↑</a></footer>
    <DepthGauge/>

    {selected && <SpecimenPage key={selected.id} post={selected} number={numberOf(selected)} canEdit={canEdit} signInPath={signInPath} close={() => setSelected(null)} />}
    {archiveOpen && !selected && <AbyssDialog title="全部标本" close={() => setArchiveOpen(false)}>
      <p className="abyss-label-line"><span>ARCHIVE / {orderedPosts.length} SPECIMENS</span></p>
      <h2 className="abyss-dialog-title">全部标本</h2>
      <label className="abyss-search" htmlFor="abyss-search">寻找一页<input id="abyss-search" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="一句话，或一个日期" /></label>
      <p className="abyss-muted" role="status">共 {filtered.length} 件</p>
      <div className="abyss-archive">{filtered.map(post => <button type="button" key={post.id} onClick={() => setSelected(post)}><span>No. {String(numberOf(post)).padStart(2, "0")}</span><span>{post.content}</span><time>{formatShortDate(post.createdAt)}</time></button>)}</div>
    </AbyssDialog>}
    {project && <AbyssDialog title={project.title} close={() => setProject(null)}>
      <p className="abyss-label-line"><span>SALVAGED / {project.mark}</span><span>{project.file}</span></p>
      <h2 className="abyss-dialog-title">{project.title}</h2>
      <em className="abyss-subtitle">{project.subtitle}</em>
      <p className="abyss-full">{project.detail}</p>
    </AbyssDialog>}
  </div>;
}

