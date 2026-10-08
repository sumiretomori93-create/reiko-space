import { eq, sql } from "drizzle-orm";
import { getDb } from "../../../db";
import { nightRecords } from "../../../db/schema";
import { getChatGPTUser } from "../../chatgpt-auth";

const OWNER_EMAIL = "sumire.tomori93@gmail.com";
const response = (data: unknown, status = 200) => Response.json(data, {
  status, headers: { "Cache-Control": "no-store" },
});

export async function GET() {
  try {
    const [record] = await getDb().select().from(nightRecords).where(eq(nightRecords.id, 1)).limit(1);
    return response({ score: record?.score ?? 0 });
  } catch {
    return response({ error: "Reiko 的纪录暂时无法读取。" }, 503);
  }
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (user?.email.toLowerCase() !== OWNER_EMAIL) {
    return response({ error: "只有 Reiko 可以更新这个纪录。" }, 403);
  }
  let score: unknown;
  try { const payload: unknown = await request.json(); score = payload && typeof payload === "object" ? (payload as {score?:unknown}).score : undefined; } catch {
    return response({ error: "成绩格式无效。" }, 400);
  }
  if (typeof score !== "number" || !Number.isSafeInteger(score) || score < 0 || score > 2147483647 || score % 4 !== 0) {
    return response({ error: "成绩格式无效。" }, 400);
  }
  try {
    const [record] = await getDb().insert(nightRecords).values({ id: 1, score })
      .onConflictDoUpdate({ target: nightRecords.id,
        set: { score: sql`max(${nightRecords.score}, excluded.score)`, updatedAt: sql`CURRENT_TIMESTAMP` },
        setWhere: sql`excluded.score > ${nightRecords.score}`,
      }).returning();
    if (record) return response({ score: record.score });
    const [existing] = await getDb().select().from(nightRecords).where(eq(nightRecords.id, 1)).limit(1);
    return response({ score: existing?.score ?? 0 });
  } catch {
    return response({ error: "纪录暂未同步，成绩仍保存在此浏览器。" }, 503);
  }
}
