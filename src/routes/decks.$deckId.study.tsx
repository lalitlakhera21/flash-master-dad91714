import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { PageHeader, PageShell, EmptyState } from "@/components/Layout";
import { Heart, RotateCw, ChevronLeft, ChevronRight, Check } from "lucide-react";

export const Route = createFileRoute("/decks/$deckId/study")({
  head: () => ({ meta: [{ title: "Study — FlashMaster" }] }),
  component: Study,
});

function Study() {
  const { deckId } = Route.useParams();
  const deck = useStore((s) => s.decks.find((d) => d.id === deckId));
  const cards = useStore((s) => s.cards.filter((c) => c.deckId === deckId));
  const { setDifficulty, toggleFavorite, reviewCard, recordStudy, updateDeck } = useStore();

  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [exit, setExit] = useState<null | "left" | "right">(null);
  const [studied, setStudied] = useState(0);
  const startTime = useMemo(() => Date.now(), [deckId]);

  const card = cards[idx];

  useEffect(() => () => {
    if (studied > 0) {
      const mins = Math.max(1, Math.round((Date.now() - startTime) / 60000));
      recordStudy(studied, mins);
      updateDeck(deckId, { lastStudied: Date.now() });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!deck) return null;
  if (cards.length === 0) {
    return (
      <PageShell>
        <PageHeader title={deck.name} back={`/decks/${deckId}`} />
        <EmptyState emoji="📝" title="No cards" description="Add some cards to study." />
      </PageShell>
    );
  }

  function advance(dir: "left" | "right") {
    if (!card) return;
    setExit(dir);
    setTimeout(() => {
      reviewCard(card.id);
      setStudied((s) => s + 1);
      setFlipped(false);
      setExit(null);
      setIdx((i) => Math.min(cards.length - 1, i + 1));
    }, 320);
  }

  function prev() {
    setFlipped(false);
    setIdx((i) => Math.max(0, i - 1));
  }

  const done = idx >= cards.length - 1 && studied >= cards.length;

  return (
    <PageShell>
      <PageHeader
        title={`Card ${Math.min(idx + 1, cards.length)} / ${cards.length}`}
        subtitle={deck.name}
        back={`/decks/${deckId}`}
      />

      {/* progress */}
      <div className="mb-5 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className="h-full gradient-primary transition-all duration-500" style={{ width: `${((idx + 1) / cards.length) * 100}%` }} />
      </div>

      {done ? (
        <div className="text-center py-12 animate-fade-up">
          <div className="text-7xl mb-4 animate-pop-in">🎉</div>
          <h2 className="text-2xl font-bold">Session complete!</h2>
          <p className="text-muted-foreground mt-1">You reviewed {studied} cards.</p>
          <div className="mt-6 flex gap-3 justify-center">
            <Link to="/decks/$deckId" params={{ deckId }} className="rounded-2xl glass px-5 py-2.5 text-sm font-semibold">Back to deck</Link>
            <Link to="/decks/$deckId/quiz" params={{ deckId }} className="rounded-2xl gradient-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold shadow-elegant">Take quiz</Link>
          </div>
        </div>
      ) : (
        <>
          <div
            className={`card-3d w-full aspect-[3/4] mb-5 ${exit === "left" ? "swipe-left" : exit === "right" ? "swipe-right" : ""}`}
            onClick={() => setFlipped((f) => !f)}
          >
            <div className={`card-inner ${flipped ? "flipped" : ""}`}>
              <div className={`card-face rounded-3xl bg-gradient-to-br ${deck.color} p-6 flex flex-col items-center justify-center text-center shadow-elegant text-white cursor-pointer`}>
                <p className="text-xs uppercase tracking-widest opacity-70 mb-3">Question</p>
                <p className="text-2xl font-bold leading-snug">{card.front}</p>
                <div className="absolute bottom-5 inline-flex items-center gap-1.5 text-xs opacity-80">
                  <RotateCw className="w-3.5 h-3.5" /> Tap to flip
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleFavorite(card.id); }}
                  className="absolute top-4 right-4 w-9 h-9 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center"
                  aria-label="Favorite"
                >
                  <Heart className={`w-4 h-4 ${card.isFavorite ? "fill-white text-white" : ""}`} />
                </button>
              </div>
              <div className="card-face card-face-back rounded-3xl glass p-6 flex flex-col items-center justify-center text-center shadow-elegant cursor-pointer">
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Answer</p>
                <p className="text-xl font-semibold leading-snug">{card.back}</p>
                <div className="absolute bottom-5 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <RotateCw className="w-3.5 h-3.5" /> Tap to flip
                </div>
              </div>
            </div>
          </div>

          {flipped && (
            <div className="grid grid-cols-3 gap-2 mb-4 animate-fade-up">
              {(["easy", "medium", "hard"] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => { setDifficulty(card.id, d); advance(d === "hard" ? "left" : "right"); }}
                  className={`h-12 rounded-2xl font-semibold text-sm shadow-soft transition-all hover:scale-[1.03] ${
                    d === "easy" ? "gradient-success text-white" : d === "medium" ? "gradient-accent text-white" : "bg-destructive text-destructive-foreground"
                  }`}
                >
                  {d === "easy" && <Check className="w-4 h-4 inline mr-1" />}
                  {d[0].toUpperCase() + d.slice(1)}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between gap-3">
            <button onClick={prev} disabled={idx === 0} className="flex-1 h-12 rounded-2xl glass font-semibold inline-flex items-center justify-center gap-1.5 disabled:opacity-40">
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <button onClick={() => setFlipped((f) => !f)} className="w-12 h-12 rounded-2xl gradient-primary text-primary-foreground flex items-center justify-center shadow-elegant" aria-label="Flip">
              <RotateCw className="w-5 h-5" />
            </button>
            <button onClick={() => advance("right")} className="flex-1 h-12 rounded-2xl glass font-semibold inline-flex items-center justify-center gap-1.5">
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </>
      )}
    </PageShell>
  );
}
