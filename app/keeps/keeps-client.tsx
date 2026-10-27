"use client";
import { useEffect, useRef, useState } from "react";
type Tab = "notes" | "anniversaries";
async function api(action="", body?:unknown) {
 const response=await fetch(`/api/keeps${action?`?${action}`:""}`,body?{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)}:{cache:"no-store"});
 if(response.status===401)throw Error("请先登录，再打开这本留存。");
 const result:any=await response.json();if(!response.ok)throw Error(result.error||"没有完成，请重试。");return result;
}
export default function KeepsClient(){
 const [connected,setConnected]=useState<boolean|null>(null),[tab,setTab]=useState<Tab>("notes"),[items,setItems]=useState<any[]>([]),[next,setNext]=useState<string|null>(null);
 const [loading,setLoading]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState(""),[composer,setComposer]=useState(false),[setup,setSetup]=useState(false),[search,setSearch]=useState("");
 const [url,setURL]=useState("https://composed-terrier-239437.upstash.io"),[token,setToken]=useState("");
 const [title,setTitle]=useState(""),[content,setContent]=useState(""),[signature,setSignature]=useState("Reiko"),[name,setName]=useState(""),[date,setDate]=useState(""),[note,setNote]=useState("");
 const requestId=useRef<string>(""),attempted=useRef(false),latest=useRef(0);
 async function load(append=false,cursor:string|null=null){
  const ticket=++latest.current;setLoading(true);setError("");
  try{const result=await api(`action=${tab}${cursor?`&before=${cursor}`:""}`);if(ticket!==latest.current)return;setItems(old=>append?[...old,...result.items]:result.items);setNext(result.next||null);}
  catch(e){if(ticket===latest.current)setError((e as Error).message);}finally{if(ticket===latest.current)setLoading(false);}
 }
 useEffect(()=>{api().then(r=>setConnected(r.connected)).catch(e=>setError(e.message));},[]);
 useEffect(()=>{setItems([]);setNext(null);setSearch("");if(connected)void load();},[connected,tab]);
 function openComposer(){requestId.current=crypto.randomUUID();attempted.current=false;setComposer(true);setNotice("");setError("");}
 async function connect(event:React.FormEvent){event.preventDefault();setBusy(true);setError("");try{await api("",{op:"connect",url,token});setToken("");setConnected(true);setSetup(false);setNotice("已连接，和小克共用同一本记录。");await load();}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 async function save(event:React.FormEvent){event.preventDefault();setBusy(true);setError("");attempted.current=true;try{
  await api("",tab==="notes"?{op:"note",request_id:requestId.current,title,text:content,signature}:{op:"anniversary",request_id:requestId.current,name,date,note});
  setComposer(false);setTitle("");setContent("");setName("");setDate("");setNote("");setNotice("已保存到共享数据库。");await load();
 }catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 function edit(){if(attempted.current){requestId.current=crypto.randomUUID();attempted.current=false;}}
 const filtered=items.filter(item=>(tab==="notes"?`${item.title}\n${item.text}\n${item.signature}`:`${item.name}\n${item.note}\n${item.date}`).toLowerCase().includes(search.toLowerCase()));
 const showSetup=connected===false||setup;
 return <div className="keeps-app"><div className="shell">
  <aside><a className="wordmark" href="/">留存<span>REIKO'S KEEPS</span></a><p className="aside-text">一些话，一些日子。<br/>都可以自己记下来。</p><nav aria-label="记录分类"><button className={tab==="notes"?"active":""} onClick={()=>{setTab("notes");setComposer(false);setNotice("");}}>留言<span>NOTES</span></button><button className={tab==="anniversaries"?"active":""} onClick={()=>{setTab("anniversaries");setComposer(false);setNotice("");}}>纪念日<span>DATES</span></button></nav><div className="aside-bottom"><span className="private-dot"/>私人空间<br/><small>仅你的账号可以打开</small></div></aside>
  <main><header><a className="back-home" href="/">返回个人站</a><button className="quiet" onClick={()=>{setSetup(!showSetup);setComposer(false);setError("");}}>{connected?"连接设置":"连接数据库"}</button></header>
  <section className="heading"><div><p className="chapter">{tab==="notes"?"01 / NOTES":"02 / ANNIVERSARIES"}</p><h1>{tab==="notes"?"留下想记的话。":"值得记住的日子。"}</h1><p>{tab==="notes"?"你写的，小克写的，都在同一本里。":"记下开始，也看看走过了多久。"}</p></div>{connected&&!showSetup&&<button className="primary" onClick={openComposer}>{tab==="notes"?"写一条留言":"添加纪念日"}</button>}</section>
  {error&&<div role="alert" className="alert">{error}{error.includes("登录")&&<a href="/signin-with-chatgpt?return_to=%2Fkeeps" target="_top">使用 ChatGPT 登录</a>}</div>}
  {notice&&<div role="status" className="notice">{notice}</div>}
  {showSetup?<section className="setup card"><p className="eyebrow">ONE-TIME CONNECTION</p><h2>接上你已经建好的数据库</h2><p>这里只连接一次。之后你和小克写下的内容，会出现在同一个地方。</p><form onSubmit={connect}><label>REST 地址<input type="url" required value={url} onChange={e=>setURL(e.target.value)} placeholder="https://你的数据库.upstash.io" autoComplete="off"/></label><label>读写 Token<input type="password" required value={token} onChange={e=>setToken(e.target.value)} placeholder="粘贴 Upstash 的完整 REST Token" autoComplete="new-password"/></label><p className="hint">从 Upstash 的 Connect / REST 复制。不要勾选 Read-Only Token。密钥加密保存在服务端，连接后不会再次显示。</p><button className="primary" disabled={busy}>{busy?"正在连接…":"连接现有数据库"}</button>{connected&&<button type="button" className="quiet" onClick={()=>setSetup(false)}>取消</button>}</form></section>:connected===null?<div className="empty">{error?"登录后即可继续。":"正在打开你的留存…"}</div>:<>
  {composer&&<section className="composer card"><div className="section-title"><h2>{tab==="notes"?"新的留言":"新的纪念日"}</h2><button className="quiet" disabled={busy} onClick={()=>setComposer(false)}>收起</button></div><form onSubmit={save} onChange={edit}>{tab==="notes"?<><label>标题<input required maxLength={120} value={title} onChange={e=>setTitle(e.target.value)} placeholder="想给这条留言起个什么名字"/></label><label>正文<textarea required maxLength={10000} value={content} onChange={e=>setContent(e.target.value)} placeholder="慢慢写，不用整理得很完整。" rows={6}/></label><label className="short">署名<input required maxLength={80} value={signature} onChange={e=>setSignature(e.target.value)}/></label></>:<><label>纪念日名称<input required maxLength={200} value={name} onChange={e=>setName(e.target.value)} placeholder="例如：在一起"/></label><label className="short">起始日期<input required type="date" min="0001-01-01" max="9999-12-31" value={date} onChange={e=>setDate(e.target.value)}/></label><label>补充的话，可不填<textarea maxLength={2000} rows={3} value={note} onChange={e=>setNote(e.target.value)}/></label></>}<button className="primary" disabled={busy}>{busy?"正在保存…":"保存这条记录"}</button><span className="save-hint">保存后，小克也能读到。</span></form></section>}
  <div className="toolbar"><label className="search"><span className="sr-only">搜索记录</span><input placeholder={tab==="notes"?"搜索已加载的留言…":"搜索纪念日…"} value={search} onChange={e=>setSearch(e.target.value)}/></label><button className="quiet" disabled={loading} onClick={()=>load()}>{loading?"读取中…":"刷新记录"}</button></div>
  {!loading&&!filtered.length&&!error&&<section className="empty"><div className="empty-line"/><h2>{search?"暂时没找到匹配内容。":tab==="notes"?"这里还没有留言。":"这里还没有纪念日。"}</h2><p>{search&&next?"还有更早的留言，可以继续加载后查找。":search?"试试换一个词。":"写下第一条，它就会留在这里。"}</p></section>}
  <section className={tab==="anniversaries"?"dates-grid":"notes-list"}>{filtered.map(item=>tab==="notes"?<article className="note card" key={item.id}><div className="note-top"><span className="note-date">{new Date(item.created_at).toLocaleString("zh-CN",{timeZone:"Asia/Shanghai",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hour12:false})}</span><span className="signature">{item.signature}</span></div><h2>{item.title}</h2><p className="note-body">{item.text}</p></article>:<article className="date-card card" key={item.id}><span className="date-origin">始于 {item.date.replaceAll("-"," / ")}</span><h2>{item.name}</h2><div className="days"><strong>{item.days_since>=0?item.days_since:-item.days_since}</strong><span>{item.days_since>=0?"天，已经一起走过":"天，距离开始"}</span></div>{item.note&&<p className="date-note">{item.note}</p>}<div className="date-next">{item.days_until_next===0?"今天就是纪念日":`下次纪念日还有 ${item.days_until_next} 天`}<small>{item.next_occurrence}</small></div></article>)}</section>
  {next&&<div className="pagination"><button className="secondary" disabled={loading} onClick={()=>load(true,next)}>{loading?"读取中…":"加载更早的留言"}</button></div>}
  <footer>{tab==="notes"?"只保存明确写下的留言，不会自动收集聊天。":"日期按北京时间计算，起始当天为第 0 天；闰日逢非闰年按 2 月 28 日计算。"}<span>{tab==="notes"?"署名为填写标签。":"记录日期不会自动设置提醒。"}</span></footer></>}
  </main></div></div>;
}
