import ReikoSpace from "./reiko-space";
import { chatGPTSignInPath, getChatGPTUser } from "./chatgpt-auth";

const OWNER_EMAIL = "sumire.tomori93@gmail.com";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getChatGPTUser();
  const canEdit = user?.email.toLowerCase() === OWNER_EMAIL;

  return (
    <>
    <ReikoSpace
      canEdit={canEdit}
      signInPath={chatGPTSignInPath("/#updates")}
    />
    {canEdit && <a href="/keeps" style={{position:"fixed",right:18,bottom:20,zIndex:200,background:"#f2edf1",color:"#66526e",border:"1px solid #bcaec4",padding:"10px 16px",borderRadius:4,fontSize:12,textDecoration:"none",boxShadow:"0 2px 12px #0002"}}>留存管理</a>}
    </>
  );
}
