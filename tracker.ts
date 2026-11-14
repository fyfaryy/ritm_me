export type Habit = {
  id: string;
  name: string;
  category: string;
  icon: string;
  color: string;
  timeOfDay: string;
  schedule: number[];
  startDate: string;
  notification: boolean;
  reminderTime: string;
  position: number;
};
export type CheckIn = { habitId: string; date: string };
export type Settings = { displayName: string; notificationsEnabled: boolean; reminderTime: string };
export type TrackerData = { habits: Habit[]; checkIns: CheckIn[]; settings: Settings };
export type HabitInput = Omit<Habit, "id" | "position">;

export const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
export const COLORS = ["lime", "blue", "purple", "peach", "pink", "sand"];
export const ICONS = ["water", "book", "activity", "flower", "walk", "moon", "target", "coffee", "pencil", "heart"];
export const TIMES: Record<string, string> = { morning: "Утро", afternoon: "День", evening: "Вечер" };

export function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function parseDate(value: string): Date { return new Date(`${value}T12:00:00`); }
export function addDays(date: Date, amount: number): Date { const next = new Date(date); next.setDate(next.getDate() + amount); return next; }
export function weekday(date: Date): number { return (date.getDay() + 6) % 7; }
export function weekStart(date: Date): Date { return addDays(date, -weekday(date)); }
export function isScheduled(habit: Habit, date: Date): boolean { return dateKey(date) >= habit.startDate && habit.schedule.includes(weekday(date)); }
export function isValidDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !isNaN(parseDate(value).getTime()) && dateKey(parseDate(value)) === value;
}
export function formatWeek(date: Date): string {
  const end = addDays(date, 6);
  const month = new Intl.DateTimeFormat("ru", { day: "numeric", month: "long" }).formatToParts(end).find((part) => part.type === "month")?.value ?? "";
  if (date.getMonth() === end.getMonth()) return `${date.getDate()}–${end.getDate()} ${month}, ${end.getFullYear()}`;
  const left = date.toLocaleDateString("ru", { day: "numeric", month: "short" }).replace(".", "");
  return `${left} – ${end.getDate()} ${month}, ${end.getFullYear()}`;
}
export function plural(value: number, forms: [string, string, string]): string {
  const n = Math.abs(value) % 100;
  const n1 = n % 10;
  return n > 10 && n < 20 ? forms[2] : n1 === 1 ? forms[0] : n1 >= 2 && n1 <= 4 ? forms[1] : forms[2];
}
export function scheduleLabel(habit: Habit): string {
  if (habit.schedule.length === 7) return "Каждый день";
  if (habit.schedule.join(",") === "0,1,2,3,4") return "По будням";
  return habit.schedule.map((day) => WEEKDAYS[day]).join(", ");
}
export function getStreak(habit: Habit, entries: Set<string>, today: Date): number {
  let streak = 0;
  let date = today;
  if (isScheduled(habit, date) && !entries.has(`${habit.id}:${dateKey(date)}`)) date = addDays(date, -1);
  for (let i = 0; i < 730; i++, date = addDays(date, -1)) {
    if (dateKey(date) < habit.startDate) break;
    if (!isScheduled(habit, date)) continue;
    if (!entries.has(`${habit.id}:${dateKey(date)}`)) break;
    streak++;
  }
  return streak;
}
export function periodStats(habits: Habit[], entries: Set<string>, endDate: Date, days: number) {
  let planned = 0;
  let completed = 0;
  const points: { date: string; planned: number; completed: number; percent: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = addDays(endDate, -i);
    const key = dateKey(date);
    const scheduled = habits.filter((h) => isScheduled(h, date));
    const done = scheduled.filter((h) => entries.has(`${h.id}:${key}`)).length;
    planned += scheduled.length;
    completed += done;
    points.push({ date: key, planned: scheduled.length, completed: done, percent: scheduled.length ? Math.round(done / scheduled.length * 100) : 0 });
  }
  return { planned, completed, percent: planned ? Math.round(completed / planned * 100) : 0, points };
}
