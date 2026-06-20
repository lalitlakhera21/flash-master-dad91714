import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Layers, Trophy, BarChart3, User } from "lucide-react";

const tabs: { to: string; label: string; icon: typeof Home; exact?: boolean }[] = [
  { to: "/", label: "Home", icon: Home, exact: true },
  { to: "/decks", label: "Decks", icon: Layers },
  { to: "/quiz", label: "Quiz", icon: Trophy },
  { to: "/progress", label: "Progress", icon: BarChart3 },
  { to: "/profile", label: "Profile", icon: User },
];

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  // Hide on immersive screens (study / quiz) so the floating nav doesn't overlap action buttons.
  if (/\/decks\/[^/]+\/(study|quiz)$/.test(pathname)) return null;
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto max-w-2xl px-3 pb-3">
        <div className="glass rounded-3xl shadow-elegant flex items-center justify-around px-1 py-1.5">
          {tabs.map(({ to, label, icon: Icon, exact }) => {
            const active = exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");
            return (
              <Link
                key={to}
                to={to}
                className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 rounded-2xl transition-all"
              >
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-2xl transition-all ${
                    active ? "gradient-primary shadow-glow text-primary-foreground scale-110" : "text-muted-foreground"
                  }`}
                >
                  <Icon className="w-5 h-5" strokeWidth={2.2} />
                </div>
                <span className={`text-[10px] font-semibold ${active ? "text-foreground" : "text-muted-foreground"}`}>
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
