import type { ReactNode } from "react";

const paths: Record<string, ReactNode> = {
  grid: <><rect x="3" y="3" width="7" height="7" rx="1.6"/><rect x="14" y="3" width="7" height="7" rx="1.6"/><rect x="3" y="14" width="7" height="7" rx="1.6"/><rect x="14" y="14" width="7" height="7" rx="1.6"/></>,
  habits: <><rect x="4" y="3" width="16" height="18" rx="3"/><path d="m8 9 1.5 1.5L12 8m2 2h3m-9 5 1.5 1.5L12 14m2 2h3"/></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4m10-4v4M3 11h18m-13 4h.01M12 15h.01M16 15h.01M8 18h.01M12 18h.01"/></>,
  chart: <><path d="M4 3v17a1 1 0 0 0 1 1h16M9 16v-5m5 5V6m5 10V9"/></>,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/><path d="M12 2V1"/></>,
  settings: <><path d="m9.1 3-.6 2-2 .9-2-.4L3 8l1.4 1.6-.2 2.3L3 13.5 4.5 16l2-.4 2 1 .6 2h3l.6-2 2-1 2 .4 1.5-2.5-1.2-1.6-.2-2.3L18.2 8l-1.5-2.5-2 .4-2-.9-.6-2Z" transform="translate(1 1)"/><circle cx="11.6" cy="12" r="3"/></>,
  plus: <path d="M12 5v14M5 12h14"/>,
  close: <path d="m6 6 12 12M6 18 18 6"/>,
  chevronLeft: <path d="m14 6-6 6 6 6"/>,
  chevronRight: <path d="m10 6 6 6-6 6"/>,
  chevronDown: <path d="m6 9 6 6 6-6"/>,
  arrowRight: <path d="M4 12h16m-6-6 6 6-6 6"/>,
  arrowUpRight: <path d="M6 18 18 6H7m11 0v11"/>,
  check: <path d="m5 12 4 4L19 6"/>,
  checkCircle: <><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/></>,
  more: <><circle cx="5" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="19" cy="12" r="1" fill="currentColor"/></>,
  download: <><path d="M12 3v12m-5-5 5 5 5-5M4 16v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4"/></>,
  fire: <path d="M12 2c1 5-3 6-3 10-2-1-2-3-2-3s-4 3-3 7a8 8 0 0 0 16-1c0-4-3-7-3-7s0 5-3 6c2-6-2-12-2-12Z"/>,
  water: <path d="M12 3S5 11 5 15a7 7 0 0 0 14 0c0-4-7-12-7-12Zm-3 13a3 3 0 0 0 3 3"/>,
  book: <><path d="M12 5C8 2 3 4 3 4v15s5-2 9 1c4-3 9-1 9-1V4s-5-2-9 1v15"/><path d="M6 8c1.2-.2 2.2 0 3 .5m6 0c.8-.5 1.8-.7 3-.5"/></>,
  activity: <><path d="m6 6 12 12M3 8l5-5m8 18 5-5M1 6l5-5m12 22 5-5M5 10l5-5m4 14 5-5"/></>,
  flower: <><path d="M12 20c-5 0-9-3-9-8 4 0 7 2 9 8Zm0 0c5 0 9-3 9-8-4 0-7 2-9 8Zm0-4C7 11 8 7 12 3c4 4 5 8 0 13Z"/></>,
  walk: <><circle cx="14" cy="4" r="2"/><path d="m7 21 4-8m5 8-2-7-3-4 2-3 3 4h4M5 12l4-4 4-1"/></>,
  moon: <><path d="M20.7 13.2A9 9 0 0 1 10.8 3.3a9 9 0 1 0 9.9 9.9Z"/><path d="M18 3v4m-2-2h4"/></>,
  target: <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/></>,
  coffee: <><path d="M4 8h13v8a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8Zm13 1h2a3 3 0 0 1 0 6h-2M7 2v3m4-3v3m4-3v3M2 23h18"/></>,
  pencil: <><path d="m15 4 5 5M3 21l5-1L21 7a2 2 0 0 0 0-3l-1-1a2 2 0 0 0-3 0L4 16l-1 5Z"/></>,
  heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>,
  sparkles: <><path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3ZM21 2v4m-2-2h4"/></>,
  sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></>,
  sunset: <><path d="M3 17h18M6 21h12M7 17a5 5 0 0 1 10 0M12 3v5m-2-3 2-2 2 2M3 10l2 2m14 0 2-2"/></>,
  trash: <><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7"/></>,
  info: <><circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10h.01"/></>,
  help: <><circle cx="12" cy="12" r="9"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2-3 4m.1 3h.01"/></>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  menu: <path d="M4 6h16M4 12h16M4 18h16"/>,
  sidebar: <><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/></>,
  leaf: <><path d="M20 3C9 2 3 7 5 14c2 7 15 6 15-11Z"/><path d="M3 22 15 10"/></>,
  layers: <><path d="m12 3 10 5-10 5L2 8l10-5Zm-9 10 9 5 9-5M3 18l9 5 9-5"/></>,
  lock: <><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4m-4 4v3"/></>,
};

export function Icon({ name, size = 20, className = "", strokeWidth = 1.65 }: { name: string; size?: number; className?: string; strokeWidth?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">{paths[name] ?? paths.sparkles}</svg>;
}

export function LogoMark() {
  return <svg width="34" height="34" viewBox="0 0 34 34" fill="none" aria-hidden="true"><rect width="34" height="34" rx="10" fill="#bb72fc"/><rect x="8" y="15" width="4" height="11" rx="2" fill="#281b31"/><rect x="15" y="8" width="4" height="18" rx="2" fill="#281b31"/><rect x="22" y="12" width="4" height="14" rx="2" fill="#281b31"/></svg>;
}
