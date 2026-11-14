import { getTrackerData } from "@/lib/tracker-server";
import { addDays, dateKey, isScheduled, periodStats, scheduleLabel } from "@/lib/tracker";

export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const days = url.searchParams.get("days") === "7" ? 7 : 30;
    const format = url.searchParams.get("format") === "json" ? "json" : "csv";
    const data = await getTrackerData();
    const today = new Date();
    const entries = new Set(data.checkIns.map((item) => `${item.habitId}:${item.date}`));
    const stats = periodStats(data.habits, entries, today, days);
    const rows: string[][] = [["Дата", "Привычка", "Категория", "Расписание", "Статус"]];
    for (let offset = days - 1; offset >= 0; offset--) {
      const date = addDays(today, -offset);
      for (const habit of data.habits) {
        if (isScheduled(habit, date)) rows.push([dateKey(date), habit.name, habit.category, scheduleLabel(habit), entries.has(`${habit.id}:${dateKey(date)}`) ? "Выполнено" : "Не выполнено"]);
      }
    }
    const filename = `rhythm-${days}-days-${dateKey(today)}.${format}`;
    if (format === "json") return new Response(JSON.stringify({ exportedAt: new Date().toISOString(), period: { from: dateKey(addDays(today, 1 - days)), to: dateKey(today), days }, summary: stats, habits: data.habits, history: rows.slice(1).map(([date, habit, category, schedule, status]) => ({ date, habit, category, schedule, status })) }, null, 2), { headers: { "Content-Type": "application/json; charset=utf-8", "Content-Disposition": `attachment; filename="${filename}"`, "Cache-Control": "no-store" } });
    const csv = "\uFEFF" + rows.map((row) => row.map((cell) => `"${/^[=+@-]/.test(cell) ? "'" : ""}${cell.replaceAll('"', '""')}"`).join(";")).join("\r\n");
    return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${filename}"`, "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Не удалось экспортировать статистику" }, { status: 500 });
  }
}
