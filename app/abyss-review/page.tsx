"use client";
import {useEffect,useState} from "react";
import Abyss from "../abyss";
const examples=[{id:-1,createdAt:"2026-11-05T08:00:00Z",content:"今天留下的一页。"},{id:-2,createdAt:"2026-11-04T08:00:00Z",content:"一些小事，慢慢记。"},{id:-3,createdAt:"2026-11-03T08:00:00Z",content:"留一张纸，放一点喜欢的东西。"}];
export default function Review(){const [draft,setDraft]=useState("");useEffect(()=>{const change=(event:Event)=>{const theme=(event as CustomEvent<string>).detail;if(["room","white-archive","oumagatoki"].includes(theme))window.location.assign("/?theme="+theme);};window.addEventListener("reiko-theme",change);return()=>window.removeEventListener("reiko-theme",change);},[]);return <><div className="abyss-preview-note"><span>视觉预览 / 示例纸页</span><a href="/abyss-review/mobile">查看手机排版</a></div><Abyss canEdit={false} signInPath="/?theme=abyss" orderedPosts={examples} loading={false} draft={draft} setDraft={setDraft} publishing={false} publish={e=>e.preventDefault()} message=""/></>}
