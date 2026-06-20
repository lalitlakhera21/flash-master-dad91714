import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useStore } from "@/lib/store";
import { PageHeader, PageShell, EmptyState } from "@/components/Layout";
import { Search as SearchIcon } from "lucide-react";

export const Route = createFileRoute("/search")({
  head: () => ({ meta: [{ title: "Search — FlashMaster" }] }),
  component: Search,
});

function Search() {
  const { cards, decks } = useStore();
  const [q, setQ] = useState("");
  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return [];
    return cards.filter((c) => {
      const deck = decks.find((d) => d.id === c.deckId);
      return c.front.toLowerCase().includes(t)
        || c.back.toLowerCase().includes(t)
        || c.tags.some((tag) => tag.toLowerCase().includes(t))
        || (deck?.name.toLowerCase().includes(t) ?? false);
    });
  }, [q, cards, decks]);

  return (
    <PageShell>
      <PageHeader title="Search" back="/" />
      <div className="glass rounded-2xl p-2 shadow-soft mb-4 flex items-center gap-2">
        <SearchIcon className="w-4 h-4 ml-3 text-muted-foreground" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search questions, answers, tags, decks..."
          className="flex-1 bg-transparent outline-none p-2 text-sm"
        />
      </div>

      {q && results.length === 0 && (
        <EmptyState emoji="🔍" title="No matches" description="Try different keywords." />
      )}

      <div className="space-y-2">
        {results.map((c) => {
          const deck = decks.find((d) => d.id === c.deckId);
          return (
            <Link key={c.id} to="/decks/$deckId" params={{ deckId: c.deckId }} className="block glass rounded-2xl p-4 shadow-soft">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{deck?.name}</p>
              <p className="font-semibold text-sm">{c.front}</p>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{c.back}</p>
            </Link>
          );
        })}
      </div>
    </PageShell>
  );
}
