import type { ReactNode } from "react";
import { Home, CalendarDays, Users, Trophy, MapPin, Database } from "lucide-react";
import { useRoute, hrefFor } from "@/lib/router";
import { TimezoneToggle } from "./TimezoneToggle";
import { cn } from "./ui";

const NAV = [
  { path: "/", label: "Dashboard", icon: Home },
  { path: "/matches", label: "Matches", icon: CalendarDays },
  { path: "/groups", label: "Groups", icon: Users },
  { path: "/bracket", label: "Bracket", icon: Trophy },
  { path: "/venues", label: "Venues", icon: MapPin },
  { path: "/data", label: "Data", icon: Database },
];

function isActive(current: string, path: string): boolean {
  return path === "/" ? current === "/" : current.startsWith(path);
}

export function Layout({ children }: { children: ReactNode }) {
  const { path } = useRoute();

  return (
    <div className="min-h-full pb-20 lg:pb-0">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-pitch-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
          <a href={hrefFor("/")} className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gold/90 font-display text-sm font-extrabold text-pitch-950 shadow-glow">
              26
            </span>
            <div className="leading-none">
              <div className="h-display text-sm text-ink">World Cup 2026</div>
              <div className="text-[10px] uppercase tracking-widest text-ink-faint">Explorer</div>
            </div>
          </a>

          {/* Desktop nav */}
          <nav className="ml-4 hidden items-center gap-1 lg:flex">
            {NAV.map((item) => (
              <a
                key={item.path}
                href={hrefFor(item.path)}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive(path, item.path) ? "bg-white/10 text-ink" : "text-ink-muted hover:bg-white/5 hover:text-ink",
                )}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="ml-auto hidden sm:block">
            <TimezoneToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-pitch-950/90 backdrop-blur-xl lg:hidden">
        <div className="flex items-stretch justify-around">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = isActive(path, item.path);
            return (
              <a
                key={item.path}
                href={hrefFor(item.path)}
                className={cn(
                  "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors",
                  active ? "text-gold" : "text-ink-muted",
                )}
              >
                <Icon size={18} />
                {item.label}
              </a>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
