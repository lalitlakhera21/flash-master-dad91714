import { createFileRoute, Link } from "@tanstack/react-router";
import { useStore, deckStats } from "@/lib/store";
import { PageHeader, PageShell, EmptyState } from "@/components/Layout";
import { Plus, Clock } from "lucide-react";

export const Route = createFileRoute("/decks/")({
  head: () => ({ meta: [{ title: "Your Decks — FlashMaster" }, { name: "description", content: "Browse your flashcard decks and track mastery." }] }),
  component: DecksList,
});

function DecksList() {
  const decks = useStore((s) => s.decks);

  return (
    <PageShell>
      <PageHeader
        title="Your Decks"
        subtitle={`${decks.length} decks`}
        right={
          <Link to="/decks/new" className="h-10 px-4 rounded-2xl gradient-primary text-primary-foreground font-semibold text-sm inline-flex items-center gap-1.5 shadow-elegant hover:scale-105 transition-transform">
            <Plus className="w-4 h-4" /> New
          </Link>
        }
      />

      {decks.length === 0 ? (
        <EmptyState
          emoji="📚"
          title="No decks yet"
          description="Create your first deck to start building your flashcard library."
          action={
            <Link to="/decks/new" className="rounded-2xl gradient-primary px-5 py-2.5 text-primary-foreground text-sm font-semibold shadow-elegant">
              Create deck
            </Link>
          }
        />
      ) : (
        <div className="grid gap-3">
          {decks.map((d, i) => {
            const s = deckStats(d.id);
            const last = d.lastStudied ? new Date(d.lastStudied).toLocaleDateString() : "Not studied";
            return (
              <Link
                key={d.id}
                to="/decks/$deckId"
                params={{ deckId: d.id }}
                className="block animate-fade-up"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="glass rounded-3xl p-4 shadow-soft hover:shadow-elegant hover:-translate-y-0.5 transition-all flex items-center gap-4">
                  <div className={`w-14 h-14 shrink-0 rounded-2xl bg-gradient-to-br ${d.color} flex items-center justify-center text-2xl shadow-soft`}>
                    {d.emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold truncate">{d.name}</h3>
                    <p className="text-xs text-muted-foreground truncate">{d.description}</p>
                    <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">{s.total} cards</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {last}</span>
                    </div>
                    <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full gradient-primary transition-all duration-500" style={{ width: `${s.progress}%` }} />
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold text-gradient">{s.progress}%</p>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">mastered</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
