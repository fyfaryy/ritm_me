import { db } from "@/db";
import { checkIns, habits } from "@/db/schema";
import { dateKey, isScheduled, isValidDate, parseDate } from "@/lib/tracker";
import { and, eq } from "drizzle-orm";

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    if (typeof body.habitId !== "string" || !isValidDate(body.date) || typeof body.completed !== "boolean") return Response.json({ error: "Некорректная отметка" }, { status: 400 });
    if (body.date > dateKey(new Date())) return Response.json({ error: "Будущий день ещё не наступил" }, { status: 400 });
    const [habit] = await db.select().from(habits).where(eq(habits.id, body.habitId));
    if (!habit) return Response.json({ error: "Привычка не найдена" }, { status: 404 });
    if (!isScheduled(habit, parseDate(body.date))) return Response.json({ error: "Привычка не запланирована на этот день" }, { status: 400 });
    if (body.completed) await db.insert(checkIns).values({ habitId: body.habitId, date: body.date }).onConflictDoNothing();
    else await db.delete(checkIns).where(and(eq(checkIns.habitId, body.habitId), eq(checkIns.date, body.date)));
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Не удалось сохранить отметку" }, { status: 500 });
  }
}
