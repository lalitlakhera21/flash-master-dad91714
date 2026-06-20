import { createFileRoute, Link } from "@tanstack/react-router";
import { useStore, deckStats } from "@/lib/store";
import { PageHeader, PageShell, EmptyState } from "@/components/Layout";
import { Trophy } from "lucide-react";

export const Route = createFileRoute("/quiz")({
  head: () => ({ meta: [{ title: "Quizzes — FlashMaster" }, { name: "description", content: "Test yourself on any deck." }] }),
  component: QuizHub,
});

function QuizHub() {
  const decks = useStore((s) => s.decks);
  const history = useStore((s) => s.quizHistory);

  return (
    <PageShell>
      <PageHeader title="Quizzes" subtitle="Pick a deck to test yourself" />

      {decks.length === 0 ? (
        <EmptyState emoji="🎯" title="No decks" description="Create a deck first to take a quiz." action={
          <Link to="/decks/new" className="rounded-2xl gradient-primary px-5 py-2.5 text-primary-foreground text-sm font-semibold shadow-elegant">Create deck</Link>
        } />
      ) : (
        <div className="grid gap-3 mb-8">
          {decks.map((d, i) => {
            const s = deckStats(d.id);
            return (
              <Link key={d.id} to="/decks/$deckId/quiz" params={{ deckId: d.id }} className="block animate-fade-up" style={{ animationDelay: `${i * 40}ms` }}>
                <div className="glass rounded-3xl p-4 shadow-soft hover:shadow-elegant hover:-translate-y-0.5 transition-all flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${d.color} flex items-center justify-center text-2xl shadow-soft shrink-0`}>{d.emoji}</div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold truncate">{d.name}</h3>
                    <p className="text-xs text-muted-foreground">{s.total} cards available</p>
                  </div>
                  <Trophy className="w-5 h-5 text-accent" />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <h3 className="text-lg font-bold mb-3">Recent results</h3>
      {history.length === 0 ? (
        <EmptyState emoji="📊" title="No quiz history" description="Take your first quiz to see results here." />
      ) : (
        <div className="space-y-2">
          {history.slice(0, 8).map((r) => (
            <div key={r.id} className="glass rounded-2xl p-4 flex items-center gap-3 shadow-soft">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm ${r.score >= 80 ? "gradient-success text-white" : r.score >= 50 ? "gradient-accent text-white" : "bg-destructive text-destructive-foreground"}`}>
                {r.score}%
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm truncate">{r.deckName}</p>
                <p className="text-xs text-muted-foreground">{r.correct}/{r.total} · {new Date(r.takenAt).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}
