import { db } from "@/db";
import { checkIns, habits } from "@/db/schema";
import { parseHabitInput } from "@/lib/tracker-server";
import { and, eq, lt, sql } from "drizzle-orm";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const input = parseHabitInput(await request.json());
    const habit = await db.transaction(async (tx) => {
      const [updated] = await tx.update(habits).set(input).where(eq(habits.id, id)).returning();
      if (!updated) return null;
      await tx.delete(checkIns).where(and(eq(checkIns.habitId, id), sql`(${lt(checkIns.date, input.startDate)} or ((extract(isodow from ${checkIns.date})::int - 1) not in (${sql.join(input.schedule.map((day) => sql`${day}`), sql`, `)})))`));
      return updated;
    });
    if (!habit) return Response.json({ error: "Привычка не найдена" }, { status: 404 });
    return Response.json(habit);
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Не удалось обновить привычку" }, { status: 400 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const removed = await db.delete(habits).where(eq(habits.id, id)).returning({ id: habits.id });
    if (!removed.length) return Response.json({ error: "Привычка не найдена" }, { status: 404 });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Не удалось удалить привычку" }, { status: 500 });
  }
}
