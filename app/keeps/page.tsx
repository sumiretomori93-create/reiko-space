import type { Metadata } from "next";
import { getChatGPTUser, chatGPTSignInPath } from "../chatgpt-auth";
import KeepsClient from "./keeps-client";
import "./keeps.css";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {title: "留存管理 · Reiko"};
export default async function KeepsPage() {
 const user = await getChatGPTUser();
 if(user?.email.toLowerCase()!=="sumire.tomori93@gmail.com") return <main style={{minHeight:"100vh",padding:"80px 24px",background:"#f6f5f2",color:"#55485f",textAlign:"center"}}><h1>Reiko 的私人留存</h1><p>只有站主可以查看和写入。</p>{!user&&<p><a href={chatGPTSignInPath("/keeps")} target="_top">使用 ChatGPT 登录</a></p>}<p><a href="/">回到个人站</a></p></main>;
 return <KeepsClient/>;
}
