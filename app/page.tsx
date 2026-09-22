import ReikoSpace from "./reiko-space";
import { chatGPTSignInPath, getChatGPTUser } from "./chatgpt-auth";

const OWNER_EMAIL = "sumire.tomori93@gmail.com";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getChatGPTUser();
  const canEdit = user?.email.toLowerCase() === OWNER_EMAIL;

  return (
    <ReikoSpace
      canEdit={canEdit}
      signInPath={chatGPTSignInPath("/#updates")}
    />
  );
}
