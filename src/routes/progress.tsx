import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { PageHeader, PageShell } from "@/components/Layout";

export const Route = createFileRoute("/progress")({
  head: () => ({ meta: [{ title: "Progress — FlashMaster" }, { name: "description", content: "Your study activity, mastery, and quiz averages." }] }),
  component: Progress,
});

function last7Days() {
  const days: { date: string; label: string }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    days.push({ date: d.toISOString().slice(0, 10), label: d.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 1) });
  }
  return days;
}

function Progress() {
  const { cards, decks, quizHistory, activity, streak } = useStore();

  const mastered = cards.filter((c) => c.difficulty === "easy").length;
  const studied = cards.filter((c) => c.lastReviewed).length;
  const masteryPct = cards.length ? Math.round((mastered / cards.length) * 100) : 0;
  const avgScore = quizHistory.length
    ? Math.round(quizHistory.reduce((a, b) => a + b.score, 0) / quizHistory.length)
    : 0;
  const totalMinutes = activity.reduce((a, b) => a + b.minutes, 0);

  const week = last7Days();
  const weekData = week.map((d) => activity.find((a) => a.date === d.date)?.cards ?? 0);
  const maxWeek = Math.max(1, ...weekData);

  // Monthly (last 30 days)
  const monthData: number[] = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    monthData.push(activity.find((a) => a.date === date)?.cards ?? 0);
  }
  const maxMonth = Math.max(1, ...monthData);

  return (
    <PageShell>
      <PageHeader title="Progress" subtitle="Track your learning journey" />

      {/* Circular mastery */}
      <div className="glass rounded-3xl p-6 shadow-soft mb-4 flex items-center gap-5 animate-fade-up">
        <CircularProgress value={masteryPct} />
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Overall mastery</p>
          <p className="text-3xl font-bold mt-1">{masteryPct}%</p>
          <p className="text-xs text-muted-foreground">{mastered} of {cards.length} cards mastered</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <Tile label="Total decks" value={decks.length} accent="primary" />
        <Tile label="Total cards" value={cards.length} accent="success" />
        <Tile label="Cards studied" value={studied} accent="accent" />
        <Tile label="Quizzes taken" value={quizHistory.length} accent="primary" />
        <Tile label="Avg quiz score" value={`${avgScore}%`} accent="success" />
        <Tile label="Study minutes" value={totalMinutes} accent="accent" />
      </div>

      <div className="glass rounded-3xl p-5 shadow-soft mb-4 animate-fade-up">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold">This week</h3>
          <span className="text-xs text-muted-foreground">{weekData.reduce((a, b) => a + b, 0)} cards</span>
        </div>
        <div className="flex items-end justify-between gap-2 h-32">
          {week.map((d, i) => {
            const h = (weekData[i] / maxWeek) * 100;
            return (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1.5">
                <div className="w-full rounded-t-lg gradient-primary transition-all" style={{ height: `${Math.max(4, h)}%` }} />
                <span className="text-[10px] text-muted-foreground font-semibold">{d.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="glass rounded-3xl p-5 shadow-soft mb-4 animate-fade-up">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold">Last 30 days</h3>
          <span className="text-xs text-muted-foreground">🔥 streak {streak.current}</span>
        </div>
        <div className="flex items-end justify-between gap-px h-20">
          {monthData.map((v, i) => (
            <div key={i} className="flex-1 rounded-sm" style={{
              height: `${Math.max(4, (v / maxMonth) * 100)}%`,
              background: v > 0 ? "var(--gradient-primary)" : "var(--muted)",
            }} />
          ))}
        </div>
      </div>
    </PageShell>
  );
}

function Tile({ label, value, accent }: { label: string; value: number | string; accent: "primary" | "success" | "accent" }) {
  const grad = accent === "primary" ? "gradient-primary" : accent === "success" ? "gradient-success" : "gradient-accent";
  return (
    <div className="glass rounded-2xl p-4 shadow-soft">
      <div className={`w-1.5 h-6 rounded-full ${grad} mb-2`} />
      <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}

function CircularProgress({ value }: { value: number }) {
  const r = 38;
  const c = 2 * Math.PI * r;
  const off = c - (value / 100) * c;
  return (
    <div className="relative w-24 h-24 shrink-0">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r={r} stroke="var(--muted)" strokeWidth="9" fill="none" />
        <circle cx="50" cy="50" r={r} stroke="url(#g1)" strokeWidth="9" fill="none" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={off} style={{ transition: "stroke-dashoffset 0.7s ease" }} />
        <defs>
          <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#4F46E5" />
            <stop offset="100%" stopColor="#A855F7" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center font-bold text-lg">{value}%</div>
    </div>
  );
}
