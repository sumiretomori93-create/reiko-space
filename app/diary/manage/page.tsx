import { chatGPTSignInPath, getChatGPTUser } from "../../chatgpt-auth";
import DiaryManager from "./manager";

export const dynamic = "force-dynamic";
export default async function Page() {
  const user = await getChatGPTUser();
  if (user?.email.toLowerCase() !== "sumire.tomori93@gmail.com") return <main style={{padding:40}}><h1>日记管理</h1><p>只有 Reiko 可以管理日记。</p><a href={chatGPTSignInPath("/diary/manage")} target="_top">站主登录</a><p><a href="/">返回个人站</a></p></main>;
  return <DiaryManager />;
}
