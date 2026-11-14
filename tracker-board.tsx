"use client";

import { useEffect, useRef, useState } from "react";
import { addDays, dateKey, formatWeek, getStreak, isScheduled, parseDate, scheduleLabel, TIMES, WEEKDAYS, weekStart, type Habit } from "@/lib/tracker";
import { Icon } from "./icon";

export function TimeFilters({ value, count, onChange }: { value: string; count: number; onChange: (value: string) => void }) {
  return <div className="time-filters" role="group" aria-label="Время привычки"><button className={value === "all" ? "active" : ""} onClick={() => onChange("all")}>Все привычки <span>{count}</span></button>{Object.entries(TIMES).map(([key, label]) => <button key={key} className={value === key ? "active" : ""} onClick={() => onChange(key)}><Icon name={key === "morning" ? "sun" : key === "afternoon" ? "sunset" : "moon"} size={14}/>{label}</button>)}</div>;
}

export function HabitMenu({ habit, onEdit, onDelete }: { habit: Habit; onEdit: (habit: Habit) => void; onDelete: (habit: Habit) => void }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function close(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);
  return <div ref={menuRef} className="habit-menu"><button className={`icon-button more-button ${open ? "is-open" : ""}`} onClick={(event) => { event.stopPropagation(); setOpen((previous) => !previous); }} aria-label={`Действия: ${habit.name}`} aria-expanded={open}><Icon name="more" size={17}/></button>{open && <div className="dropdown-menu" onClick={(event) => event.stopPropagation()}><button onClick={() => { setOpen(false); onEdit(habit); }}><Icon name="pencil" size={15}/>Редактировать</button><button className="danger-text" onClick={() => { setOpen(false); onDelete(habit); }}><Icon name="trash" size={15}/>Удалить привычку</button></div>}</div>;
}

export function TrackerBoard({ habits, entries, todayKey, weekKey, filter, pending, onFilter, onWeekChange, onToggle, onNew, onEdit, onDelete }: {
  habits: Habit[]; entries: Set<string>; todayKey: string; weekKey: string; filter: string; pending: Set<string>;
  onFilter: (value: string) => void; onWeekChange: (value: string) => void; onToggle: (habit: Habit, day: string) => void;
  onNew: () => void; onEdit: (habit: Habit) => void; onDelete: (habit: Habit) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const area = scrollRef.current;
    if (!area) return;
    area.scrollLeft = 0;
    if (window.innerWidth <= 670) {
      const current = area.querySelector<HTMLElement>(".day-heading.is-today");
      if (current) {
        const overflow = current.getBoundingClientRect().right - area.getBoundingClientRect().right + 64;
        if (overflow > 0) area.scrollLeft = overflow;
      }
    }
  }, [weekKey, todayKey]);
  const start = parseDate(weekKey);
  const today = parseDate(todayKey);
  const dates = Array.from({ length: 7 }, (_, index) => addDays(start, index));
  const weekHabits = habits.filter((habit) => habit.startDate <= dateKey(addDays(start, 6)));
  const filtered = weekHabits.filter((habit) => filter === "all" || habit.timeOfDay === filter);
  const thisWeek = weekKey === dateKey(weekStart(today));
  return <section className="card tracker-card" aria-label="Недельный трекер привычек">
    <div className="tracker-heading"><div><h2>Мои привычки <span className="small-count">{weekHabits.length}</span></h2><p>Немного заботы о себе. Каждый день.</p></div><button className="icon-button subtle-button" onClick={onNew} aria-label="Добавить привычку"><Icon name="plus" size={19}/></button></div>
    <div className="tracker-controls"><TimeFilters value={filter} count={weekHabits.length} onChange={onFilter}/></div>
    <div className="week-navigation"><div className="week-label"><Icon name="calendar" size={15}/><span>{formatWeek(start)}</span>{thisWeek && <span className="current-week-label">Эта неделя</span>}</div><div className="week-actions"><button className="icon-button" onClick={() => onWeekChange(dateKey(addDays(start, -7)))} aria-label="Предыдущая неделя"><Icon name="chevronLeft" size={15}/></button><button className="today-button" onClick={() => onWeekChange(dateKey(weekStart(today)))}>Сегодня</button><button className="icon-button" onClick={() => onWeekChange(dateKey(addDays(start, 7)))} aria-label="Следующая неделя"><Icon name="chevronRight" size={15}/></button></div></div>
    {weekKey > todayKey && <div className="future-banner"><Icon name="calendar" size={17}/><span>Твой план на будущее. Отметки станут доступны в нужный день.</span></div>}
    <div className="mobile-scroll-hint">Листай неделю в сторону <Icon name="arrowRight" size={12}/></div>
    <div ref={scrollRef} className="tracker-scroll"><div className="tracker-table" role="table" aria-label={formatWeek(start)}>
      <div className="tracker-grid table-head" role="row"><div className="habit-column-label" role="columnheader">ПРИВЫЧКА</div>{dates.map((date, index) => <div key={index} className={`day-heading ${dateKey(date) === todayKey ? "is-today" : ""} ${index > 4 ? "weekend" : ""}`} role="columnheader"><span>{WEEKDAYS[index]}</span><strong>{date.getDate()}</strong>{dateKey(date) === todayKey && <i/>}</div>)}<div/></div>
      {filtered.map((habit) => { const streak = getStreak(habit, entries, today); return <div key={habit.id} className="tracker-grid habit-row" role="row"><div className="habit-info" role="rowheader"><span className={`habit-icon color-${habit.color}`}><Icon name={habit.icon} size={20}/></span><div className="habit-text"><button className="habit-name" onClick={() => onEdit(habit)} title={`Редактировать: ${habit.name}`}>{habit.name}</button><div className="habit-schedule"><span>{scheduleLabel(habit)}</span>{streak > 0 && <span className="mini-streak" title={`Серия: ${streak}`}><Icon name="fire" size={11}/>{streak}</span>}</div></div></div>{dates.map((date) => { const key = dateKey(date); const completed = entries.has(`${habit.id}:${key}`); const scheduled = isScheduled(habit, date); const future = key > todayKey; return <div key={key} className={`day-cell ${key === todayKey ? "today-cell" : ""}`} role="cell">{scheduled ? <button className={`check-box ${completed ? "completed" : ""} ${future ? "future" : ""} ${pending.has(`${habit.id}:${key}`) ? "pending" : ""}`} aria-label={`${habit.name}, ${date.toLocaleDateString("ru", { day: "numeric", month: "long" })}: ${completed ? "выполнено, снять отметку" : future ? "запланировано" : "отметить выполнение"}`} aria-pressed={completed} disabled={pending.has(`${habit.id}:${key}`)} onClick={() => onToggle(habit, key)} title={future ? "Этот день ещё впереди" : completed ? "Снять отметку" : "Отметить выполнение"}>{completed && <Icon name="check" size={16} strokeWidth={2.4}/>}</button> : <span className="not-scheduled" title="На этот день не запланировано">—</span>}</div>; })}<div className="row-actions" role="cell"><HabitMenu habit={habit} onEdit={onEdit} onDelete={onDelete}/></div></div>; })}
      {!filtered.length && <div className="empty-state"><span className="empty-icon"><Icon name={habits.length ? "sun" : "leaf"} size={28}/></span><h3>{habits.length ? "Здесь пока свободно" : "Начни с одной привычки"}</h3><p>{habits.length ? "Добавь привычку на эту неделю или выбери другое время дня." : "Маленький шаг сегодня — большие перемены завтра."}</p><button className="button secondary" onClick={onNew}><Icon name="plus" size={16}/>Добавить привычку</button></div>}
    </div></div>
    <footer className="tracker-footer"><div className="tracker-legend"><span><i className="legend-done"/>Выполнено</span><span><i className="legend-pending"/>В планах</span></div><button className="text-button" onClick={onNew}><Icon name="plus" size={14}/>Добавить привычку</button></footer>
  </section>;
}
