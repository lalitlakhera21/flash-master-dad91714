import { createFileRoute, Link } from "@tanstack/react-router";
import { useStore, deckStats } from "@/lib/store";
import { PageShell } from "@/components/Layout";
import { Flame, Target, TrendingUp, Plus, Search, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FlashMaster — Your learning home" },
      { name: "description", content: "Pick up where you left off. Track your streak, today's goal, and recent decks." },
      { property: "og:title", content: "FlashMaster — Your learning home" },
      { property: "og:description", content: "Pick up where you left off. Track your streak, today's goal, and recent decks." },
    ],
  }),
  component: Home,
});

function Home() {
  const { settings, streak, activity, decks, cards } = useStore();
  const today = new Date().toISOString().slice(0, 10);
  const todayCards = activity.find((a) => a.date === today)?.cards ?? 0;
  const goal = settings.dailyGoal;
  const goalPct = Math.min(100, Math.round((todayCards / goal) * 100));

  const recent = [...decks]
    .sort((a, b) => (b.lastStudied ?? b.createdAt) - (a.lastStudied ?? a.createdAt))
    .slice(0, 4);

  const continueDeck = recent.find((d) => d.lastStudied) ?? recent[0];

  return (
    <PageShell>
      <div className="animate-fade-up flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-muted-foreground">Hello,</p>
          <h1 className="text-2xl font-bold tracking-tight">{settings.userName} 👋</h1>
        </div>
        <Link to="/search" className="w-11 h-11 rounded-2xl glass flex items-center justify-center hover:scale-105 transition-transform" aria-label="Search">
          <Search className="w-5 h-5" />
        </Link>
      </div>

      {/* Streak + Goal */}
      <div className="grid grid-cols-2 gap-3 mb-4 animate-fade-up" style={{ animationDelay: "60ms" }}>
        <div className="glass rounded-3xl p-4 shadow-soft">
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            <Flame className="w-3.5 h-3.5 text-amber-500" /> Streak
          </div>
          <div className="mt-2 flex items-end gap-2">
            <span className="text-3xl font-bold">{streak.current}</span>
            <span className="text-xs text-muted-foreground mb-1.5">days · best {streak.longest}</span>
          </div>
        </div>
        <div className="glass rounded-3xl p-4 shadow-soft">
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            <Target className="w-3.5 h-3.5 text-success" /> Today's goal
          </div>
          <div className="mt-2">
            <div className="flex items-end justify-between">
              <span className="text-3xl font-bold">{todayCards}<span className="text-base text-muted-foreground">/{goal}</span></span>
              <span className="text-xs font-semibold text-success">{goalPct}%</span>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full gradient-success transition-all duration-500" style={{ width: `${goalPct}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Continue learning */}
      {continueDeck && (
        <Link
          to="/decks/$deckId"
          params={{ deckId: continueDeck.id }}
          className="block animate-fade-up mb-6"
          style={{ animationDelay: "120ms" }}
        >
          <div className="relative overflow-hidden rounded-3xl gradient-primary p-5 shadow-elegant text-primary-foreground">
            <div className="absolute -right-6 -top-6 text-[120px] opacity-20 select-none">{continueDeck.emoji}</div>
            <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Continue learning</p>
            <h2 className="text-xl font-bold mt-1">{continueDeck.name}</h2>
            <p className="text-sm opacity-80 mt-1">{deckStats(continueDeck.id).total} cards · {deckStats(continueDeck.id).progress}% mastered</p>
            <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur px-3 py-1.5 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" /> Resume study
            </div>
          </div>
        </Link>
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3 mb-6 animate-fade-up" style={{ animationDelay: "180ms" }}>
        <Stat label="Decks" value={decks.length} />
        <Stat label="Cards" value={cards.length} />
        <Stat label="Mastered" value={cards.filter((c) => c.difficulty === "easy").length} />
      </div>

      {/* Recent decks */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold">Recent decks</h3>
        <Link to="/decks" className="text-sm font-semibold text-primary">See all</Link>
      </div>
      <div className="grid grid-cols-2 gap-3 animate-fade-up" style={{ animationDelay: "240ms" }}>
        {recent.map((d) => {
          const s = deckStats(d.id);
          return (
            <Link key={d.id} to="/decks/$deckId" params={{ deckId: d.id }} className="group">
              <div className="glass rounded-3xl p-4 shadow-soft hover:shadow-elegant hover:-translate-y-0.5 transition-all">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${d.color} flex items-center justify-center text-2xl shadow-soft mb-3`}>{d.emoji}</div>
                <p className="font-bold text-sm truncate">{d.name}</p>
                <p className="text-xs text-muted-foreground">{s.total} cards</p>
                <div className="mt-2 h-1 rounded-full bg-muted overflow-hidden">
                  <div className="h-full gradient-primary" style={{ width: `${s.progress}%` }} />
                </div>
              </div>
            </Link>
          );
        })}
        <Link to="/decks/new" className="group">
          <div className="rounded-3xl border-2 border-dashed border-border p-4 h-full min-h-[140px] flex flex-col items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-colors">
            <Plus className="w-6 h-6 mb-1" />
            <span className="text-sm font-semibold">New Deck</span>
          </div>
        </Link>
      </div>

      <Link to="/progress" className="mt-6 block animate-fade-up" style={{ animationDelay: "300ms" }}>
        <div className="glass rounded-3xl p-4 flex items-center gap-3 shadow-soft">
          <div className="w-10 h-10 rounded-2xl gradient-accent flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm">View your progress</p>
            <p className="text-xs text-muted-foreground">Activity, mastery & quiz stats</p>
          </div>
        </div>
      </Link>
    </PageShell>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="glass rounded-2xl p-3 text-center shadow-soft">
      <p className="text-xl font-bold">{value}</p>
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</p>
    </div>
  );
}
