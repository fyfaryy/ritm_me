"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { addDays, dateKey, getStreak, isScheduled, parseDate, periodStats, plural, scheduleLabel, TIMES, WEEKDAYS, weekStart, type Habit, type HabitInput, type Settings, type TrackerData } from "@/lib/tracker";
import { Icon, LogoMark } from "./icon";
import { ExportDialog, HabitDialog, HelpDialog, Modal, SettingsDialog } from "./dialogs";
import { HabitMenu, TimeFilters, TrackerBoard } from "./tracker-board";
import { ActivityCard, MiniCalendar, MotivationCard, ProgressChart, TodayProgress } from "./charts";

type View = "overview" | "habits" | "calendar" | "stats" | "site";
type Toast = { text: string; type: "success" | "error" | "info" };
const NAV: { id: View; label: string; icon: string }[] = [
  { id: "overview", label: "Обзор", icon: "grid" },
  { id: "habits", label: "Мои привычки", icon: "habits" },
  { id: "calendar", label: "Календарь", icon: "calendar" },
  { id: "stats", label: "Статистика", icon: "chart" },
  { id: "site", label: "Сайт", icon: "layers" },
];
const HEADINGS: Record<View, { title: string; subtitle: string; eyebrow: string }> = {
  overview: { title: "В своём ритме", subtitle: "Не нужно быть идеальным. Просто продолжай.", eyebrow: "МАЛЕНЬКИЕ ШАГИ — БОЛЬШИЕ ПЕРЕМЕНЫ" },
  habits: { title: "Привычки, которые меняют", subtitle: "Оставь место для того, что действительно важно.", eyebrow: "ТВОИ ЕЖЕДНЕВНЫЕ РИТУАЛЫ" },
  calendar: { title: "Время для хорошего", subtitle: "Планируй на недели вперёд. Двигайся в удобном темпе.", eyebrow: "ШАГ ЗА ШАГОМ, НЕДЕЛЯ ЗА НЕДЕЛЕЙ" },
  stats: { title: "Ты движешься вперёд", subtitle: "За каждой цифрой — твоя забота о себе.", eyebrow: "ТВОЙ ПРОГРЕСС В ДЕТАЛЯХ" },
  site: { title: "Как сделан этот сайт", subtitle: "Полноценный fullstack-сайт: интерфейс, API и база данных в одном проекте.", eyebrow: "АРХИТЕКТУРА И СТРУКТУРА" },
};

async function requestJson<T>(url: string, method: string, body?: unknown): Promise<T> {
  const response = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Что-то пошло не так. Попробуй ещё раз.");
  return result as T;
}

function updateEntry(previous: TrackerData, habitId: string, date: string, completed: boolean): TrackerData {
  const checkIns = previous.checkIns.filter((entry) => !(entry.habitId === habitId && entry.date === date));
  if (completed) checkIns.push({ habitId, date });
  return { ...previous, checkIns };
}

function MetricCard({ label, value, suffix, detail, icon, color, trend = false }: { label: string; value: string | number; suffix?: string; detail: string; icon: string; color: string; trend?: boolean }) {
  return <section className="card metric-card"><div className="metric-top"><span>{label}</span><span className={`metric-icon color-${color}`}><Icon name={icon} size={17}/></span></div><div className="metric-bottom"><strong>{value}{suffix && <span>{suffix}</span>}</strong><span className={`metric-detail ${trend ? "positive" : ""}`}>{trend && <Icon name="arrowUpRight" size={13}/>} {detail}</span></div></section>;
}

function HabitCards({ habits, filter, entries, today, onFilter, onEdit, onDelete, onToggle, onNew }: { habits: Habit[]; filter: string; entries: Set<string>; today: Date; onFilter: (value: string) => void; onEdit: (habit: Habit) => void; onDelete: (habit: Habit) => void; onToggle: (habit: Habit, date: string) => void; onNew: () => void }) {
  const todayKey = dateKey(today);
  const filtered = habits.filter((habit) => filter === "all" || habit.timeOfDay === filter);
  return <section className="habits-view"><div className="view-toolbar"><TimeFilters value={filter} count={habits.length} onChange={onFilter}/><span className="muted small-text">{filtered.length} {plural(filtered.length, ["привычка", "привычки", "привычек"])}</span></div><div className="habit-cards-grid">{filtered.map((habit) => { const done = entries.has(`${habit.id}:${todayKey}`); const scheduled = isScheduled(habit, today); const streak = getStreak(habit, entries, today); return <article key={habit.id} className="card habit-detail-card"><div className="habit-detail-top"><span className={`habit-icon color-${habit.color}`}><Icon name={habit.icon} size={24}/></span><HabitMenu habit={habit} onEdit={onEdit} onDelete={onDelete}/></div><h2>{habit.name}</h2><div className="habit-card-meta"><span>{habit.category}</span><i/>{TIMES[habit.timeOfDay]}{habit.notification && <span className="habit-reminder-indicator" title={`Демо-напоминание в ${habit.reminderTime}`}><Icon name="bell" size={13}/>{habit.reminderTime}</span>}</div><div className="habit-card-schedule"><span>{scheduleLabel(habit)}</span>{streak > 0 && <span className="mini-streak"><Icon name="fire" size={13}/>{streak} {plural(streak, ["день", "дня", "дней"])}</span>}</div><div className="habit-week-days">{WEEKDAYS.map((day, index) => <span key={day} className={habit.schedule.includes(index) ? "scheduled" : ""}>{day}</span>)}</div><footer><button className="text-button muted" onClick={() => onEdit(habit)}><Icon name="pencil" size={14}/>Изменить</button>{scheduled ? <button className={`habit-today-button ${done ? "done" : ""}`} onClick={() => onToggle(habit, todayKey)}><Icon name={done ? "checkCircle" : "plus"} size={15}/>{done ? "Сегодня выполнено" : "Выполнить сегодня"}</button> : <span className="habit-rest">{habit.startDate > todayKey ? `Старт ${parseDate(habit.startDate).toLocaleDateString("ru", { day: "numeric", month: "short" })}` : "Сегодня выходной"}</span>}</footer></article>; })}<button className="add-habit-card" onClick={onNew}><span><Icon name="plus" size={25}/></span><strong>Ещё один маленький шаг</strong><p>Добавить новую привычку</p></button></div></section>;
}

function HabitBreakdown({ habits, entries, today, period }: { habits: Habit[]; entries: Set<string>; today: Date; period: 7 | 30 }) {
  const list = habits.map((habit) => ({ habit, ...periodStats([habit], entries, today, period) })).sort((a, b) => b.percent - a.percent);
  return <section className="card breakdown-card"><div className="card-heading"><h2>Прогресс по привычкам</h2><Icon name="target" size={18} className="muted"/></div><p className="card-description">Маленькие действия складываются в результат.</p><div className="breakdown-list">{list.map(({ habit, percent, completed, planned }) => <div key={habit.id} className="breakdown-item"><span className={`habit-icon color-${habit.color}`}><Icon name={habit.icon} size={17}/></span><div><div className="breakdown-name"><span>{habit.name}</span><strong>{percent}%</strong></div><div className="breakdown-track"><i style={{ width: `${percent}%` }}/></div><small>{completed} из {planned} выполнено</small></div></div>)}{!list.length && <p className="empty-text">Здесь появится прогресс твоих привычек.</p>}</div></section>;
}

function HistoryTable({ habits, entries, today, period, onPeriodChange, onToggle }: { habits: Habit[]; entries: Set<string>; today: Date; period: 7 | 30; onPeriodChange: (value: 7 | 30) => void; onToggle: (habit: Habit, date: string) => void }) {
  const dates = Array.from({ length: period }, (_, i) => addDays(today, i - period + 1));
  return <section className="card history-card"><div className="card-heading"><div><h2>История выполнения</h2><p>Твои маленькие победы за последние {period} дней.</p></div><div className="period-toggle">{([7, 30] as const).map((days) => <button key={days} className={period === days ? "active" : ""} onClick={() => onPeriodChange(days)}>{days} дней</button>)}</div></div><div className="history-scroll"><table><caption className="sr-only">История привычек за {period} дней</caption><thead><tr><th>Привычка</th>{dates.map((date) => <th key={dateKey(date)}><span>{WEEKDAYS[(date.getDay() + 6) % 7]}</span><strong>{date.getDate()}</strong></th>)}<th>Итого</th></tr></thead><tbody>{habits.map((habit) => <tr key={habit.id}><th><span className={`history-habit-icon color-${habit.color}`}><Icon name={habit.icon} size={15}/></span>{habit.name}</th>{dates.map((date) => { const key = dateKey(date); const completed = entries.has(`${habit.id}:${key}`); return <td key={key}>{isScheduled(habit, date) ? <button className={`check-box history-check ${completed ? "completed" : ""}`} aria-label={`${habit.name}, ${key}: ${completed ? "снять отметку" : "отметить"}`} aria-pressed={completed} onClick={() => onToggle(habit, key)}>{completed && <Icon name="check" size={13} strokeWidth={2.2}/>}</button> : <span className="not-scheduled">—</span>}</td>; })}<td className="history-total">{periodStats([habit], entries, today, period).percent}%</td></tr>)}</tbody></table>{!habits.length && <p className="empty-text">Создай первую привычку, чтобы начать свою историю.</p>}</div></section>;
}

function SiteView({ onOpenTracker, onOpenStats }: { onOpenTracker: () => void; onOpenStats: () => void }) {
  const flow = [
    { icon: "grid", title: "Интерфейс (React)", text: "Страницы и компоненты: обзор, привычки, календарь, статистика" },
    { icon: "layers", title: "Next.js App Router", text: "Серверные компоненты и маршруты в папке src/app" },
    { icon: "chart", title: "API-маршруты", text: "/api/habits, /api/check-ins, /api/export, /api/settings" },
    { icon: "checkCircle", title: "Drizzle ORM", text: "Типизированные запросы к базе без сырого SQL" },
    { icon: "lock", title: "PostgreSQL", text: "Таблицы rhythm_habits, rhythm_check_ins, rhythm_settings" },
  ];
  const features = [
    { icon: "plus", title: "CRUD привычек", text: "Создание, редактирование и удаление с подтверждением" },
    { icon: "calendar", title: "Недельный календарь", text: "Навигация по неделям и планирование на будущее" },
    { icon: "check", title: "Галочки и серии", text: "Отметки выполнения, streak-счётчики и история" },
    { icon: "chart", title: "Графики 7/30 дней", text: "Столбчатые графики, тепловая карта и прогресс по привычкам" },
    { icon: "bell", title: "Уведомления-заглушки", text: "Центр уведомлений и напоминания в демо-режиме" },
    { icon: "download", title: "Экспорт CSV/JSON", text: "Скачивание статистики за 7 или 30 дней" },
  ];
  const steps = [
    { title: "Схема базы данных", text: "Таблицы описаны в src/db/schema.ts и применяются командой npx drizzle-kit push" },
    { title: "API-слой", text: "Маршруты в src/app/api/ читают и пишут данные через Drizzle" },
    { title: "Интерфейс", text: "Компоненты в src/components/ отрисовывают данные и отправляют запросы" },
    { title: "Сборка и запуск", text: "npm run build собирает сайт, а production-сервер раздаёт его по адресу /" },
  ];
  return <div className="site-view">
    <section className="site-hero">
      <span className="site-hero-eyebrow"><Icon name="sparkles" size={13}/>FULLSTACK-САЙТ</span>
      <h2>«Ритм» — это не просто страница.<br/>Это <span>полноценный сайт</span> с базой данных.</h2>
      <p>Интерфейс на React, серверная логика на Next.js и настоящая база PostgreSQL работают вместе: каждая галочка, привычка и настройка сохраняются и остаются после перезагрузки.</p>
      <div className="site-hero-actions"><button className="button primary" onClick={onOpenTracker}><Icon name="grid" size={16}/>Открыть трекер</button><button className="button secondary" onClick={onOpenStats}><Icon name="chart" size={16}/>Смотреть статистику</button></div>
    </section>
    <div className="site-grid">
      <section className="card site-card">
        <h3><Icon name="layers" size={18}/>Как устроен сайт</h3>
        <p>Запрос проходит путь от браузера до базы данных и обратно. Данные не хранятся в браузере — они живут в PostgreSQL.</p>
        <div className="arch-flow">{flow.map((node, index) => <div key={node.title}><div className="arch-node"><span><Icon name={node.icon} size={17}/></span><div><strong>{node.title}</strong><small>{node.text}</small></div></div>{index < flow.length - 1 && <div className="arch-arrow"><Icon name="arrowRight" size={14}/></div>}</div>)}</div>
      </section>
      <section className="card site-card">
        <h3><Icon name="sidebar" size={18}/>Структура проекта</h3>
        <p>Код организован по папкам: страницы, API, компоненты, логика и схема базы.</p>
        <div className="file-tree"><b>src/</b><br/>
  <b>app/</b>            <i>страницы и API-маршруты</i><br/>
    page.tsx          <i>главная страница</i><br/>
    api/habits/       <i>создание и удаление</i><br/>
    api/check-ins/    <i>галочки выполнения</i><br/>
    api/export/       <i>CSV / JSON</i><br/>
  <b>components/</b>    <i>интерфейс</i><br/>
    dashboard.tsx     <i>навигация и экраны</i><br/>
    tracker-board.tsx <i>недельная сетка</i><br/>
    charts.tsx        <i>графики и календарь</i><br/>
  <b>lib/</b>           <i>логика</i><br/>
    tracker.ts        <i>серии, статистика, даты</i><br/>
  <b>db/</b><br/>
    schema.ts         <i>таблицы PostgreSQL</i></div>
        <div className="stack-chips"><span>Next.js 16</span><span>React 19</span><span>TypeScript</span><span>Drizzle ORM</span><span>PostgreSQL</span><span>Tailwind CSS</span></div>
      </section>
      <section className="card site-card">
        <h3><Icon name="checkCircle" size={18}/>Что умеет сайт</h3>
        <div className="feature-list">{features.map((feature) => <div key={feature.title}><span><Icon name={feature.icon} size={14}/></span><div><strong>{feature.title}</strong><p>{feature.text}</p></div></div>)}</div>
      </section>
      <section className="card site-card">
        <h3><Icon name="arrowRight" size={18}/>Как это собрано</h3>
        <div className="steps-list">{steps.map((step, index) => <div key={step.title}><span>{index + 1}</span><div><strong>{step.title}</strong><p>{step.text}</p></div></div>)}</div>
      </section>
    </div>
  </div>;
}

export default function Dashboard({ initialData, todayKey }: { initialData: TrackerData; todayKey: string }) {
  const [data, setData] = useState(initialData);
  const [view, setView] = useState<View>("overview");
  const [weekKey, setWeekKey] = useState(() => dateKey(weekStart(parseDate(todayKey))));
  const [filter, setFilter] = useState("all");
  const [period, setPeriod] = useState<7 | 30>(7);
  const [modal, setModal] = useState<"habit" | "settings" | "export" | "help" | null>(null);
  const [editing, setEditing] = useState<Habit | null>(null);
  const [deleting, setDeleting] = useState<Habit | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<Toast | null>(null);
  const [notifications, setNotifications] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const today = useMemo(() => parseDate(todayKey), [todayKey]);
  const entries = useMemo(() => new Set(data.checkIns.map((entry) => `${entry.habitId}:${entry.date}`)), [data.checkIns]);
  const stats7 = useMemo(() => periodStats(data.habits, entries, today, 7), [data.habits, entries, today]);
  const stats30 = useMemo(() => periodStats(data.habits, entries, today, 30), [data.habits, entries, today]);
  const todayHabits = data.habits.filter((habit) => isScheduled(habit, today));
  const completedToday = todayHabits.filter((habit) => entries.has(`${habit.id}:${todayKey}`)).length;
  const activeHabits = data.habits.filter((habit) => habit.startDate <= todayKey).length;
  const bestStreak = useMemo(() => {
    let best = 0;
    data.habits.forEach((habit) => {
      let current = 0;
      for (let i = 729; i >= 0; i--) {
        const date = addDays(today, -i);
        if (!isScheduled(habit, date)) continue;
        if (entries.has(`${habit.id}:${dateKey(date)}`)) { current++; best = Math.max(best, current); } else current = 0;
      }
    });
    return best;
  }, [data.habits, entries, today]);
  const heading = HEADINGS[view];
  const reminderHabits = data.habits.filter((habit) => habit.notification);

  function notify(text: string, type: Toast["type"] = "success") {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ text, type });
    toastTimer.current = setTimeout(() => setToast(null), 4300);
  }
  function newHabit() { setEditing(null); setModal("habit"); }
  function editHabit(habit: Habit) { setEditing(habit); setModal("habit"); }
  function navigate(next: View) { setView(next); setMobileOpen(false); setFilter("all"); setNotifications(false); }

  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);
  useEffect(() => {
    function keydown(event: KeyboardEvent) {
      if (event.key === "Escape") { setNotifications(false); setMobileOpen(false); }
      const target = event.target as HTMLElement;
      if (event.code === "KeyN" && !event.ctrlKey && !event.metaKey && !event.altKey && !["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) && !document.querySelector("dialog[open]")) { event.preventDefault(); setEditing(null); setModal("habit"); }
    }
    document.addEventListener("keydown", keydown);
    return () => document.removeEventListener("keydown", keydown);
  }, []);
  useEffect(() => {
    if (!notifications) return;
    function click(event: MouseEvent) { const target = event.target as HTMLElement; if (!target.closest(".notification-area") && !target.closest(".notification-nav")) setNotifications(false); }
    document.addEventListener("click", click);
    return () => document.removeEventListener("click", click);
  }, [notifications]);

  async function toggleHabit(habit: Habit, date: string) {
    if (date > todayKey) { notify("Этот день ещё впереди. Привычка уже в твоём плане.", "info"); return; }
    if (!isScheduled(habit, parseDate(date))) return;
    const key = `${habit.id}:${date}`;
    if (pending.has(key)) return;
    const wasCompleted = entries.has(key);
    setPending((previous) => new Set(previous).add(key));
    setData((previous) => updateEntry(previous, habit.id, date, !wasCompleted));
    try {
      await requestJson("/api/check-ins", "PUT", { habitId: habit.id, date, completed: !wasCompleted });
      notify(wasCompleted ? "Отметка снята. Продолжай в своём темпе." : "Ещё одна маленькая победа. Так держать!", wasCompleted ? "info" : "success");
    } catch (error) {
      setData((previous) => updateEntry(previous, habit.id, date, wasCompleted));
      notify(error instanceof Error ? error.message : "Не удалось сохранить отметку", "error");
    } finally { setPending((previous) => { const next = new Set(previous); next.delete(key); return next; }); }
  }
  async function saveHabit(input: HabitInput, id?: string) {
    const saved = await requestJson<Habit>(id ? `/api/habits/${id}` : "/api/habits", id ? "PUT" : "POST", input);
    setData((previous) => ({ ...previous, habits: id ? previous.habits.map((habit) => habit.id === id ? saved : habit) : [...previous.habits, saved], checkIns: previous.checkIns.filter((entry) => entry.habitId !== saved.id || isScheduled(saved, parseDate(entry.date))) }));
    if (input.startDate > todayKey) setWeekKey(dateKey(weekStart(parseDate(input.startDate))));
    else if (!id && dateKey(addDays(parseDate(weekKey), 6)) < input.startDate) setWeekKey(dateKey(weekStart(parseDate(input.startDate))));
    setFilter("all"); setModal(null); setEditing(null);
    notify(id ? "Привычка обновлена. Всё в твоём ритме." : input.startDate > todayKey ? "Привычка добавлена в план на будущее." : "Новая привычка — новый маленький шаг!");
  }
  async function deleteHabit() {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await requestJson(`/api/habits/${deleting.id}`, "DELETE");
      setData((previous) => ({ ...previous, habits: previous.habits.filter((habit) => habit.id !== deleting.id), checkIns: previous.checkIns.filter((entry) => entry.habitId !== deleting.id) }));
      setDeleting(null); notify("Привычка удалена. Освобождаем место для нового.", "info");
    } catch (error) { notify(error instanceof Error ? error.message : "Не удалось удалить привычку", "error"); }
    finally { setDeleteBusy(false); }
  }
  async function saveSettings(value: Settings) {
    const saved = await requestJson<Settings>("/api/settings", "PATCH", value);
    setData((previous) => ({ ...previous, settings: saved })); setModal(null); notify("Настройки сохранены");
  }
  async function exportData(days: 7 | 30, format: "csv" | "json") {
    const response = await fetch(`/api/export?days=${days}&format=${format}`);
    if (!response.ok) throw new Error("Не удалось скачать статистику. Попробуй ещё раз.");
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `rhythm-${days}-days-${todayKey}.${format}`; document.body.appendChild(anchor); anchor.click(); anchor.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify("Статистика скачана. Твой прогресс всегда с тобой.");
  }

  return <div className="app-shell">
    {mobileOpen && <button className="sidebar-backdrop" aria-label="Закрыть меню" onClick={() => setMobileOpen(false)}/>}
    <aside className={`sidebar ${mobileOpen ? "mobile-open" : ""}`}>
      <button className="brand" onClick={() => navigate("overview")} aria-label="Ритм — на главную"><LogoMark/><span>ритм<span className="brand-dot">.</span></span></button>
      <button className="workspace-button" onClick={() => setModal("settings")}><span className="workspace-icon"><Icon name="layers" size={16}/></span><span>Личное пространство</span><Icon name="chevronDown" size={13}/></button>
      <div className="nav-label">ТВОЁ ПРОСТРАНСТВО</div>
      <nav className="main-nav" aria-label="Основная навигация">{NAV.map((item) => <button key={item.id} className={`nav-item ${view === item.id ? "active" : ""}`} onClick={() => navigate(item.id)} aria-current={view === item.id ? "page" : undefined}><Icon name={item.icon} size={19}/><span>{item.label}</span>{item.id === "habits" && <span className="nav-count">{data.habits.length}</span>}{view === item.id && item.id !== "habits" && <i className="nav-active-dot"/>}</button>)}</nav>
      <div className="sidebar-bottom"><div className="sidebar-tip"><div className="tip-symbol"><Icon name="sparkles" size={20}/></div><h3>Твой темп —<br/>правильный.</h3><p>Главное — не скорость,<br/>а постоянство.</p><div className="tip-dots" aria-hidden="true">{Array.from({ length: 7 }, (_, i) => <span className={i < 4 ? "filled" : ""} key={i}/>)}</div><button onClick={() => setModal("help")}>Как это работает<Icon name="arrowUpRight" size={13}/></button></div><div className="utility-nav"><button className="nav-item notification-nav" onClick={() => { setNotifications(!notifications); setMobileOpen(false); }}><Icon name="bell" size={18}/><span>Уведомления</span>{data.settings.notificationsEnabled && <span className="notification-count">{reminderHabits.length + 1}</span>}</button><button className="nav-item" onClick={() => setModal("settings")}><Icon name="settings" size={18}/><span>Настройки</span></button></div><button className="profile-button" onClick={() => setModal("settings")}><span className="avatar">{data.settings.displayName.charAt(0).toUpperCase()}</span><span className="profile-text"><strong>{data.settings.displayName}</strong><small>Забочусь о себе</small></span><Icon name="more" size={17}/></button></div>
    </aside>
    <div className="main-shell"><header className="topbar"><div className="breadcrumbs"><button className="icon-button mobile-menu-button" onClick={() => setMobileOpen(true)} aria-label="Открыть меню"><Icon name="menu"/></button><Icon name="sidebar" size={17} className="desktop-sidebar-icon"/><span>Моё пространство</span><span className="breadcrumb-slash">/</span><strong>{NAV.find((item) => item.id === view)?.label}</strong></div><div className="topbar-right"><span className="header-date"><Icon name="calendar" size={15}/>{today.toLocaleDateString("ru", { day: "numeric", month: "long", year: "numeric" }).replace(" г.", "")}</span><span className="topbar-divider"/><div className="notification-area"><button className={`icon-button notification-bell ${notifications ? "selected" : ""}`} onClick={() => setNotifications(!notifications)} aria-label="Открыть уведомления" aria-expanded={notifications}><Icon name="bell" size={19}/>{data.settings.notificationsEnabled && <i/>}</button>{notifications && <section className="notifications-popover" aria-label="Центр уведомлений"><div className="notification-heading"><h2>Уведомления</h2><span className="demo-badge">Демо</span><button className="icon-button" onClick={() => setNotifications(false)} aria-label="Закрыть уведомления"><Icon name="close" size={16}/></button></div><p className="notification-description">Мягкие напоминания о важном.</p>{data.settings.notificationsEnabled ? <div className="notification-list"><div className="notification-item"><span className="habit-icon color-lime"><Icon name="leaf" size={19}/></span><div><strong>Время вернуться к себе</strong><p>Открой свой день и отметь маленькие победы.</p><small>Каждый день в {data.settings.reminderTime} · демо</small></div></div>{reminderHabits.map((habit) => <div className="notification-item" key={habit.id}><span className={`habit-icon color-${habit.color}`}><Icon name={habit.icon} size={19}/></span><div><strong>{habit.name}</strong><p>{scheduleLabel(habit)} · {habit.reminderTime}</p><small>Напоминание запланировано · демо</small></div></div>)}</div> : <div className="notifications-paused"><Icon name="moon" size={26}/><h3>Сейчас тихо</h3><p>Уведомления на паузе. Включи их, когда будет удобно.</p></div>}<footer><span>Push и письма не отправляются</span><button className="text-button" onClick={() => { setNotifications(false); setModal("settings"); }}>Настроить<Icon name="arrowRight" size={13}/></button></footer></section>}</div><button className="avatar topbar-avatar" onClick={() => setModal("settings")} aria-label="Открыть профиль">{data.settings.displayName.charAt(0).toUpperCase()}</button></div></header>
      <main className="dashboard-main"><section className="page-heading"><div><span className="page-eyebrow"><i/>{heading.eyebrow}</span><h1>{heading.title}<span>.</span></h1><p>{heading.subtitle}</p></div><div className="heading-actions"><button className="button secondary export-button" onClick={() => setModal("export")}><Icon name="download" size={16}/>Экспорт</button><button className="button primary" onClick={newHabit}><Icon name="plus" size={18}/>Новая привычка</button></div></section>
        <div className="metrics-grid"><MetricCard label="Активные привычки" value={activeHabits} detail={data.habits.length > activeHabits ? `Ещё ${data.habits.length - activeHabits} в планах` : "В твоём личном ритме"} icon="layers" color="lime"/><MetricCard label="Выполнено сегодня" value={completedToday} suffix={` / ${todayHabits.length}`} detail={completedToday === todayHabits.length && todayHabits.length > 0 ? "Всё получилось!" : "Каждая галочка — победа"} icon="checkCircle" color="blue"/><MetricCard label="Прогресс за неделю" value={stats7.percent} suffix="%" detail={`${stats7.completed} из ${stats7.planned} выполнено`} icon="chart" color="purple" trend/><MetricCard label="Лучшая серия" value={bestStreak} suffix={` ${plural(bestStreak, ["день", "дня", "дней"])}`} detail="Продолжай в том же духе" icon="fire" color="peach"/></div>
        {(view === "overview" || view === "calendar") && <><div className="overview-grid"><TrackerBoard habits={data.habits} entries={entries} todayKey={todayKey} weekKey={weekKey} filter={filter} pending={pending} onFilter={setFilter} onWeekChange={setWeekKey} onToggle={toggleHabit} onNew={newHabit} onEdit={editHabit} onDelete={setDeleting}/><div className="right-column">{view === "calendar" ? <><MiniCalendar weekKey={weekKey} todayKey={todayKey} onWeekChange={setWeekKey}/><section className="card planning-card"><span className="planning-icon"><Icon name="calendar" size={24}/></span><h2>Хорошее можно<br/>запланировать.</h2><p>Выбери будущую неделю и создай привычку с нужной датой начала.</p><button className="button secondary" onClick={newHabit}><Icon name="plus" size={16}/>В план на неделю</button></section></> : <><TodayProgress completed={completedToday} planned={todayHabits.length} today={today}/><ProgressChart stats={period === 7 ? stats7 : stats30} period={period} onPeriodChange={setPeriod} onExpand={() => navigate("stats")}/></>}</div></div><div className="bottom-insights"><ActivityCard stats={stats30}/><MotivationCard/></div></>}
        {view === "habits" && <HabitCards habits={data.habits} filter={filter} entries={entries} today={today} onFilter={setFilter} onEdit={editHabit} onDelete={setDeleting} onToggle={toggleHabit} onNew={newHabit}/>}
        {view === "site" && <SiteView onOpenTracker={() => navigate("overview")} onOpenStats={() => navigate("stats")}/>}
        {view === "stats" && <div className="statistics-view"><div className="stats-charts-grid"><ProgressChart stats={period === 7 ? stats7 : stats30} period={period} onPeriodChange={setPeriod} large/><HabitBreakdown habits={data.habits} entries={entries} today={today} period={period}/></div><HistoryTable habits={data.habits} entries={entries} today={today} period={period} onPeriodChange={setPeriod} onToggle={toggleHabit}/><ActivityCard stats={stats30}/></div>}
        <footer className="page-footer"><span><Icon name="leaf" size={13}/>Растём понемногу. Каждый день.</span><button onClick={() => setModal("help")}>Нужна подсказка? <Icon name="help" size={13}/></button></footer>
      </main>
    </div>
    {modal === "habit" && <HabitDialog habit={editing} startDate={weekKey > todayKey ? weekKey : todayKey} onClose={() => { setModal(null); setEditing(null); }} onSave={saveHabit}/>}
    {modal === "settings" && <SettingsDialog settings={data.settings} onClose={() => setModal(null)} onSave={saveSettings}/>}
    {modal === "export" && <ExportDialog onClose={() => setModal(null)} onExport={exportData}/>}
    {modal === "help" && <HelpDialog onClose={() => setModal(null)}/>}
    {deleting && <Modal title="Освободим место для нового?" subtitle="Иногда отпустить привычку — тоже хороший шаг." onClose={() => { if (!deleteBusy) setDeleting(null); }} className="delete-modal"><div className="form-body"><div className="delete-habit-preview"><span className={`habit-icon color-${deleting.color}`}><Icon name={deleting.icon} size={22}/></span><strong>{deleting.name}</strong></div><p className="delete-description">Привычка и вся история её выполнения будут удалены. Это действие нельзя отменить.</p></div><footer className="modal-footer"><button className="button secondary" onClick={() => setDeleting(null)} disabled={deleteBusy}>Оставить привычку</button><button className="button danger" onClick={deleteHabit} disabled={deleteBusy}>{deleteBusy ? <span className="spinner"/> : <Icon name="trash" size={16}/>}Удалить</button></footer></Modal>}
    {toast && <div className={`toast toast-${toast.type}`} role={toast.type === "error" ? "alert" : "status"}><span><Icon name={toast.type === "error" ? "info" : toast.type === "info" ? "leaf" : "checkCircle"} size={19}/></span><p>{toast.text}</p><button className="icon-button" aria-label="Закрыть сообщение" onClick={() => setToast(null)}><Icon name="close" size={15}/></button></div>}
  </div>;
}
