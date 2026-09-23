import { Moon, Network, Sun } from "lucide-react";
import { href } from "../router.js";

const NAV = [
  { label: "Home", route: { name: "home" }, active: ["home", "lesson"] },
  { label: "Tracks", route: { name: "tracks" }, active: ["tracks", "timeline"] },
  { label: "Practice", route: { name: "practice" }, active: ["practice"] },
  { label: "Library", route: { name: "library" }, active: ["library"] },
];

export function TopBar({ route, theme, onToggleTheme }) {
  const next = theme === "dusk" ? "light" : "dusk";
  return (
    <header className="topbar">
      <a className="brand" href={href({ name: "home" })}>
        <Network size={22} aria-hidden="true" />
        learn system design
      </a>
      <nav className="nav" aria-label="Main">
        {NAV.map((item) => (
          <a key={item.label} href={href(item.route)} aria-current={item.active.includes(route.name) ? "page" : undefined}>
            {item.label}
          </a>
        ))}
        <button className="iconbtn" onClick={onToggleTheme} aria-label={`Switch to ${next} mode`}>
          {theme === "dusk" ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
        </button>
      </nav>
    </header>
  );
}
