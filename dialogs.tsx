"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { COLORS, ICONS, TIMES, WEEKDAYS, type Habit, type HabitInput, type Settings } from "@/lib/tracker";
import { Icon } from "./icon";

export function Modal({ title, subtitle, children, onClose, className = "" }: { title: string; subtitle?: string; children: ReactNode; onClose: () => void; className?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = "hidden";
    return () => { dialog?.close(); document.body.style.overflow = previous; };
  }, []);
  return <dialog ref={ref} className={`modal ${className}`} onCancel={(event) => { event.preventDefault(); onClose(); }} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }} aria-label={title}>
    <div className="modal-content">
      <header className="modal-header"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div><button type="button" className="icon-button close-button" onClick={onClose} aria-label="Закрыть"><Icon name="close"/></button></header>
      {children}
    </div>
  </dialog>;
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return <button type="button" role="switch" aria-checked={checked} aria-label={label} className={`toggle ${checked ? "on" : ""}`} onClick={onChange}><span/></button>;
}

export function HabitDialog({ habit, startDate, onClose, onSave }: { habit: Habit | null; startDate: string; onClose: () => void; onSave: (input: HabitInput, id?: string) => Promise<void> }) {
  const [input, setInput] = useState<HabitInput>(habit ? { ...habit } : { name: "", category: "Здоровье", icon: "water", color: "lime", timeOfDay: "morning", schedule: [0, 1, 2, 3, 4, 5, 6], startDate, notification: false, reminderTime: "09:00" });
  const [daily, setDaily] = useState(input.schedule.length === 7);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  function field<K extends keyof HabitInput>(key: K, value: HabitInput[K]) { setInput((previous) => ({ ...previous, [key]: value })); }
  return <Modal title={habit ? "Редактировать привычку" : "Новая привычка"} subtitle="Большие перемены начинаются с маленьких действий." onClose={onClose} className="habit-modal">
    <form onSubmit={async (event) => { event.preventDefault(); if (!input.schedule.length) { setError("Выберите хотя бы один день недели"); return; } setSaving(true); setError(""); try { await onSave(input, habit?.id); } catch (err) { setError(err instanceof Error ? err.message : "Не удалось сохранить привычку"); setSaving(false); } }}>
      <div className="form-body">
        <label className="field-label" htmlFor="habit-name">Название привычки</label>
        <div className="name-input-row"><span className={`habit-icon color-${input.color}`}><Icon name={input.icon} size={23}/></span><input id="habit-name" autoFocus required maxLength={80} placeholder="Например, читать 20 минут" value={input.name} onChange={(event) => field("name", event.target.value)}/></div>
        <div className="appearance-row"><div><span className="field-label">Иконка</span><div className="icon-picker">{ICONS.map((icon) => <button key={icon} type="button" aria-label={`Иконка ${icon}`} aria-pressed={input.icon === icon} className={`icon-choice ${input.icon === icon ? "selected" : ""}`} onClick={() => field("icon", icon)}><Icon name={icon} size={19}/></button>)}</div></div></div>
        <div className="color-field"><span className="field-label">Цвет</span><div className="color-picker">{COLORS.map((color, i) => <button type="button" key={color} aria-label={["Лаймовый", "Голубой", "Лавандовый", "Персиковый", "Розовый", "Песочный"][i]} aria-pressed={input.color === color} className={`color-choice color-${color} ${input.color === color ? "selected" : ""}`} onClick={() => field("color", color)}>{input.color === color && <Icon name="check" size={16}/>}</button>)}</div></div>
        <div className="form-two-columns"><label><span className="field-label">Категория</span><select value={input.category} onChange={(event) => field("category", event.target.value)}>{["Здоровье", "Развитие", "Баланс", "Другое"].map((item) => <option key={item}>{item}</option>)}</select></label><label><span className="field-label">Дата начала</span><input aria-label="Дата начала привычки" type="date" required min="2000-01-01" max="2099-12-31" value={input.startDate} onChange={(event) => field("startDate", event.target.value)}/></label></div>
        <div><span className="field-label">Когда удобнее?</span><div className="time-options">{Object.entries(TIMES).map(([value, label]) => <button type="button" key={value} className={input.timeOfDay === value ? "selected" : ""} onClick={() => field("timeOfDay", value)}><Icon name={value === "morning" ? "sun" : value === "afternoon" ? "sunset" : "moon"} size={17}/>{label}</button>)}</div></div>
        <div><span className="field-label">Периодичность</span><div className="frequency-options"><button type="button" className={daily ? "selected" : ""} onClick={() => { setDaily(true); field("schedule", [0, 1, 2, 3, 4, 5, 6]); }}><span className="radio-dot"/>Каждый день</button><button type="button" className={!daily ? "selected" : ""} onClick={() => { setDaily(false); field("schedule", [0, 1, 2, 3, 4]); }}><span className="radio-dot"/>По дням недели</button></div>{!daily && <div className="weekday-picker">{WEEKDAYS.map((day, index) => <button type="button" key={day} aria-pressed={input.schedule.includes(index)} className={input.schedule.includes(index) ? "selected" : ""} onClick={() => field("schedule", input.schedule.includes(index) ? input.schedule.filter((item) => item !== index) : [...input.schedule, index].sort())}>{day}</button>)}</div>}</div>
        <div className="reminder-field"><div className="reminder-label"><span className="reminder-icon"><Icon name="bell" size={19}/></span><div><span>Напоминать о привычке <small className="demo-badge">Демо</small></span><p>Мягкое напоминание внутри приложения</p></div><Toggle label="Напоминать о привычке" checked={input.notification} onChange={() => field("notification", !input.notification)}/></div>{input.notification && <label className="reminder-time"><span>Время напоминания</span><input type="time" required value={input.reminderTime} onChange={(event) => field("reminderTime", event.target.value)}/></label>}</div>
        {error && <p className="form-error" role="alert"><Icon name="info" size={16}/>{error}</p>}
      </div>
      <footer className="modal-footer"><button type="button" className="button secondary" onClick={onClose}>Отмена</button><button type="submit" className="button primary" disabled={saving}>{saving ? <span className="spinner"/> : <Icon name={habit ? "check" : "plus"} size={18}/>} {saving ? "Сохраняем…" : habit ? "Сохранить изменения" : "Создать привычку"}</button></footer>
    </form>
  </Modal>;
}

export function SettingsDialog({ settings, onClose, onSave }: { settings: Settings; onClose: () => void; onSave: (value: Settings) => Promise<void> }) {
  const [value, setValue] = useState(settings);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  return <Modal title="Твоё пространство" subtitle="Пусть трекер подстраивается под тебя." onClose={onClose}>
    <form onSubmit={async (event) => { event.preventDefault(); setSaving(true); setError(""); try { await onSave(value); } catch (err) { setError(err instanceof Error ? err.message : "Ошибка сохранения"); setSaving(false); } }}>
      <div className="form-body settings-body">
        <label><span className="field-label">Как тебя зовут?</span><input required maxLength={40} value={value.displayName} onChange={(event) => setValue({ ...value, displayName: event.target.value })}/></label>
        <div className="setting-theme"><div className="theme-preview"><span/><span/><span/></div><div><strong>Тёмная тема</strong><p>Меньше шума. Больше фокуса.</p></div><Icon name="checkCircle" className="text-accent"/></div>
        <div className="reminder-field"><div className="reminder-label"><span className="reminder-icon"><Icon name="bell"/></span><div><span>Уведомления <small className="demo-badge">Демо</small></span><p>Напоминания в центре уведомлений</p></div><Toggle label="Включить уведомления" checked={value.notificationsEnabled} onChange={() => setValue({ ...value, notificationsEnabled: !value.notificationsEnabled })}/></div></div>
        <label><span className="field-label">Время ежедневного напоминания</span><input required type="time" value={value.reminderTime} onChange={(event) => setValue({ ...value, reminderTime: event.target.value })}/></label>
        <div className="info-note"><Icon name="info" size={18}/><p>Уведомления работают в демо-режиме. Push-сообщения и письма не отправляются. Все привычки и отметки сохраняются в базе данных этого пространства.</p></div>
        {error && <p className="form-error" role="alert">{error}</p>}
      </div>
      <footer className="modal-footer"><button type="button" className="button secondary" onClick={onClose}>Отмена</button><button className="button primary" disabled={saving}>{saving ? <span className="spinner"/> : <Icon name="check" size={18}/>}Сохранить</button></footer>
    </form>
  </Modal>;
}

export function ExportDialog({ onClose, onExport }: { onClose: () => void; onExport: (days: 7 | 30, format: "csv" | "json") => Promise<void> }) {
  const [days, setDays] = useState<7 | 30>(30);
  const [format, setFormat] = useState<"csv" | "json">("csv");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  return <Modal title="Твой прогресс — с тобой" subtitle="Скачай статистику, чтобы сохранить свои достижения." onClose={onClose}>
    <div className="form-body export-body"><div className="export-illustration"><Icon name="download" size={30}/><span className="export-spark"><Icon name="sparkles" size={17}/></span></div><div><span className="field-label">Период</span><div className="time-options export-period">{([7, 30] as const).map((item) => <button type="button" key={item} className={days === item ? "selected" : ""} onClick={() => setDays(item)}>Последние {item} дней</button>)}</div></div><div><span className="field-label">Формат файла</span><div className="export-formats">{(["csv", "json"] as const).map((item) => <button type="button" key={item} className={format === item ? "selected" : ""} onClick={() => setFormat(item)}><span className="format-icon">{item.toUpperCase()}</span><span><strong>{item === "csv" ? "Таблица CSV" : "Данные JSON"}</strong><small>{item === "csv" ? "Для Excel и Google Таблиц" : "Для анализа и резервной копии"}</small></span><span className="radio-dot"/></button>)}</div></div><div className="info-note"><Icon name="lock" size={17}/><p>В экспорт войдут привычки, расписание и история выполнения за выбранный период.</p></div>{error && <p className="form-error" role="alert">{error}</p>}</div>
    <footer className="modal-footer"><button type="button" className="button secondary" onClick={onClose}>Отмена</button><button type="button" className="button primary" disabled={saving} onClick={async () => { setSaving(true); setError(""); try { await onExport(days, format); onClose(); } catch (err) { setError(err instanceof Error ? err.message : "Не удалось экспортировать"); setSaving(false); } }}>{saving ? <span className="spinner"/> : <Icon name="download" size={17}/>}Скачать {format.toUpperCase()}</button></footer>
  </Modal>;
}

export function HelpDialog({ onClose }: { onClose: () => void }) {
  return <Modal title="Начни с малого" subtitle="Ритм — это не про идеальность. Это про тебя." onClose={onClose}>
    <div className="form-body help-body">{[
      ["Создай свою привычку", "Выбери действие, иконку и удобные дни недели. Начни с того, на что точно хватит сил."],
      ["Отмечай маленькие победы", "Нажми на клетку в календаре, когда привычка выполнена. Отметку всегда можно снять."],
      ["Планируй в своём темпе", "Переключай недели стрелками. Для привычек на будущее укажи дату начала при создании."],
      ["Замечай свой прогресс", "Смотри историю за 7 или 30 дней и скачивай статистику. Пропущенный день — не повод останавливаться."],
    ].map(([title, text], index) => <div className="help-step" key={title}><span>{String(index + 1).padStart(2, "0")}</span><div><h3>{title}</h3><p>{text}</p></div></div>)}<div className="info-note"><Icon name="leaf" size={19}/><p>Напоминания пока работают в демо-режиме. Настроить их можно в параметрах пространства.</p></div></div>
    <footer className="modal-footer"><button type="button" className="button primary full-width" onClick={onClose}>Всё понятно. Продолжаем <Icon name="arrowRight" size={18}/></button></footer>
  </Modal>;
}
