import { desc } from "drizzle-orm";
import { getDb } from "../../../db";
import { posts } from "../../../db/schema";
import { getChatGPTUser } from "../../chatgpt-auth";

const MAX_POST_LENGTH = 500;
const OWNER_EMAIL = "sumire.tomori93@gmail.com";

function errorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "Unexpected error";
  return message.includes("no such table")
    ? "动态存储还没有准备好，请稍后再试。"
    : "动态暂时无法读取，请稍后再试。";
}

export async function GET() {
  try {
    const rows = await getDb()
      .select()
      .from(posts)
      .orderBy(desc(posts.createdAt), desc(posts.id))
      .limit(100);
    return Response.json({ posts: rows });
  } catch (error) {
    return Response.json({ error: errorMessage(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getChatGPTUser();
    if (user?.email.toLowerCase() !== OWNER_EMAIL) {
      return Response.json(
        { error: "只有 Reiko 可以发布动态。" },
        { status: 403 },
      );
    }

    const payload = (await request.json()) as { content?: unknown };
    const content = typeof payload.content === "string" ? payload.content.trim() : "";

    if (!content) {
      return Response.json({ error: "先写点什么再发布。" }, { status: 400 });
    }
    if (content.length > MAX_POST_LENGTH) {
      return Response.json({ error: `一条动态最多 ${MAX_POST_LENGTH} 字。` }, { status: 400 });
    }

    const [post] = await getDb().insert(posts).values({ content }).returning();
    return Response.json({ post }, { status: 201 });
  } catch (error) {
    return Response.json({ error: errorMessage(error) }, { status: 500 });
  }
}
