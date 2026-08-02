import { Link } from "react-router-dom";
import { studentNavigationItems } from "./studentNavigation";

type Props = { className?: string; onNavigate?: () => void };

export default function Sidebar({ className = "", onNavigate }: Props) {
  return (
    <aside className={`w-64 shrink-0 bg-slate-900 p-6 text-white ${className}`}>
      <h2 className="mb-8 text-2xl font-bold">PronounceLab</h2>
      <nav aria-label="Student navigation">
        <ul className="space-y-2">
          {studentNavigationItems.map((item) => (
            <li key={item.label}>
              {"to" in item ? (
                <Link to={item.to} onClick={onNavigate} className="block min-h-11 rounded-lg px-3 py-2.5 font-medium transition hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">{item.label}</Link>
              ) : (
                <span aria-disabled="true" title={`${item.label} is not available yet.`} className="block min-h-11 cursor-not-allowed rounded-lg px-3 py-2.5 text-slate-400">{item.label}</span>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
