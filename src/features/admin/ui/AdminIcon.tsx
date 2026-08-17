import type { ReactNode, SVGProps } from "react";

export type AdminIconName =
  | "activity" | "arrow-left" | "book" | "check" | "chevron-left"
  | "chevron-right" | "close" | "courses" | "dashboard" | "delete"
  | "edit" | "info" | "listening" | "lock" | "menu" | "plus"
  | "practice" | "pronunciation" | "quiz" | "search" | "sign-out"
  | "sparkle" | "theory";

type Props = SVGProps<SVGSVGElement> & { name: AdminIconName };

const paths: Record<AdminIconName, ReactNode> = {
  activity: <><path d="M4 19V9m6 10V5m6 14v-7m4 7V3" /></>,
  "arrow-left": <><path d="m15 18-6-6 6-6" /><path d="M9 12h11" /></>,
  book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  "chevron-left": <path d="m15 18-6-6 6-6" />,
  "chevron-right": <path d="m9 18 6-6-6-6" />,
  close: <><path d="m6 6 12 12" /><path d="m18 6-12 12" /></>,
  courses: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5Z" /><path d="M4 5.5v16" /></>,
  dashboard: <><rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" /><rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" /></>,
  delete: <><path d="M3 6h18" /><path d="m8 6 1-3h6l1 3" /><path d="M19 6 18 21H6L5 6" /></>,
  edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5m0-8h.01" /></>,
  listening: <><path d="M9 18V5l10-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="16" cy="16" r="3" /></>,
  lock: <><rect width="16" height="11" x="4" y="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
  menu: <><path d="M4 6h16M4 12h16M4 18h16" /></>,
  plus: <><path d="M12 5v14M5 12h14" /></>,
  practice: <><path d="M9 11 12 8l3 3" /><path d="M12 8v8" /><rect width="18" height="18" x="3" y="3" rx="3" /></>,
  pronunciation: <><path d="M12 3v18" /><path d="M8 8a4 4 0 0 1 8 0c0 6-8 6-8 0Z" /></>,
  quiz: <><path d="M9 9a3 3 0 1 1 4.8 2.4c-1.2.9-1.8 1.5-1.8 3" /><path d="M12 18h.01" /><circle cx="12" cy="12" r="10" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
  "sign-out": <><path d="M10 17l5-5-5-5" /><path d="M15 12H3" /><path d="M15 3h5a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-5" /></>,
  sparkle: <><path d="m12 3 1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5Z" /><path d="m19 15 .7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7Z" /></>,
  theory: <><path d="M9 18h6" /><path d="M10 22h4" /><path d="M8.5 14.5A7 7 0 1 1 15.5 14.5C14.5 15.2 14 16 14 18h-4c0-2-.5-2.8-1.5-3.5Z" /></>,
};

export default function AdminIcon({ name, ...props }: Props) {
  return (
    <svg aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round"
      strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24" {...props}>
      {paths[name]}
    </svg>
  );
}
