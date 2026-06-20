import { createFileRoute, Link } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { PageHeader, PageShell, EmptyState } from "@/components/Layout";
import { Heart } from "lucide-react";

export const Route = createFileRoute("/favorites")({
  head: () => ({ meta: [{ title: "Favorites — FlashMaster" }] }),
  component: Favorites,
});

function Favorites() {
  const { cards, decks, toggleFavorite } = useStore();
  const favs = cards.filter((c) => c.isFavorite);

  return (
    <PageShell>
      <PageHeader title="Favorites" subtitle={`${favs.length} starred cards`} back="/profile" />

      {favs.length === 0 ? (
        <EmptyState emoji="💖" title="No favorites yet" description="Star important cards during study to find them here." />
      ) : (
        <div className="space-y-3">
          {favs.map((c, i) => {
            const deck = decks.find((d) => d.id === c.deckId);
            return (
              <div key={c.id} className="glass rounded-2xl p-4 shadow-soft animate-fade-up" style={{ animationDelay: `${i * 30}ms` }}>
                <div className="flex items-start gap-3">
                  {deck && (
                    <Link to="/decks/$deckId" params={{ deckId: deck.id }} className={`w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br ${deck.color} flex items-center justify-center text-lg shrink-0`}>
                      {deck.emoji}
                    </Link>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{deck?.name}</p>
                    <p className="font-semibold text-sm leading-snug">{c.front}</p>
                    <p className="text-xs text-muted-foreground mt-1">{c.back}</p>
                  </div>
                  <button onClick={() => toggleFavorite(c.id)} className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0">
                    <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
