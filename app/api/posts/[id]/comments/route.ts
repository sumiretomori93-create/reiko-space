import { and, asc, eq } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { postComments, posts } from "../../../../../db/schema";
import { getChatGPTUser } from "../../../../../app/chatgpt-auth";

const OWNER_EMAIL = "sumire.tomori93@gmail.com";
const MAX_COMMENT_LENGTH = 500;

function parsePostId(value: string) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function errorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "Unexpected error";
  return message.includes("no such table")
    ? "批注存储还没有准备好，请稍后再试。"
    : "批注暂时无法读取，请稍后再试。";
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const id = parsePostId((await context.params).id);
  if (!id) return Response.json({ error: "动态编号无效。" }, { status: 400 });

  try {
    const [post] = await getDb().select({ id: posts.id }).from(posts).where(eq(posts.id, id)).limit(1);
    if (!post) return Response.json({ error: "这条动态不存在。" }, { status: 404 });
    const comments = await getDb().select().from(postComments).where(eq(postComments.postId, id)).orderBy(asc(postComments.createdAt), asc(postComments.id));
    return Response.json({ comments });
  } catch (error) {
    return Response.json({ error: errorMessage(error) }, { status: 500 });
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const id = parsePostId((await context.params).id);
  if (!id) return Response.json({ error: "动态编号无效。" }, { status: 400 });

  try {
    const user = await getChatGPTUser();
    if (user?.email.toLowerCase() !== OWNER_EMAIL) {
      return Response.json({ error: "只有 Reiko 可以写批注。" }, { status: 403 });
    }
    const payload = (await request.json()) as { content?: unknown };
    const content = typeof payload.content === "string" ? payload.content.trim() : "";
    if (!content) return Response.json({ error: "先写点批注。" }, { status: 400 });
    if (content.length > MAX_COMMENT_LENGTH) return Response.json({ error: `批注最多 ${MAX_COMMENT_LENGTH} 字。` }, { status: 400 });
    const [post] = await getDb().select({ id: posts.id }).from(posts).where(and(eq(posts.id, id))).limit(1);
    if (!post) return Response.json({ error: "这条动态不存在。" }, { status: 404 });
    const [comment] = await getDb().insert(postComments).values({ postId: id, content }).returning();
    return Response.json({ comment }, { status: 201 });
  } catch (error) {
    return Response.json({ error: errorMessage(error) }, { status: 500 });
  }
}
