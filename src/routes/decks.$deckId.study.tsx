import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, useEffect, useRef } from "react";
import { useStore, type AttemptResult, type CardStatus } from "@/lib/store";
import { PageHeader, PageShell, EmptyState } from "@/components/Layout";
import { Heart, Eye, Brain, Check, AlertCircle, X, Sparkles } from "lucide-react";
import { fireConfetti } from "@/lib/confetti";

export const Route = createFileRoute("/decks/$deckId/study")({
  head: () => ({ meta: [{ title: "Study — FlashMaster" }] }),
  component: Study,
});

type Phase = "question" | "typing" | "reveal" | "rate";

const statusMeta: Record<CardStatus, { label: string; cls: string }> = {
  new: { label: "New", cls: "bg-sky-500/15 text-sky-600" },
  learning: { label: "Learning", cls: "bg-amber-500/15 text-amber-600" },
  revision: { label: "Needs Revision", cls: "bg-rose-500/15 text-rose-600" },
  mastered: { label: "Mastered", cls: "bg-emerald-500/15 text-emerald-600" },
};

function Study() {
  const { deckId } = Route.useParams();
  const decks = useStore((s) => s.decks);
  const allCards = useStore((s) => s.cards);
  const toggleFavorite = useStore((s) => s.toggleFavorite);
  const recordAttempt = useStore((s) => s.recordAttempt);
  const recordStudy = useStore((s) => s.recordStudy);
  const updateDeck = useStore((s) => s.updateDeck);
  const deck = useMemo(() => decks.find((d) => d.id === deckId), [decks, deckId]);
  const cards = useMemo(() => allCards.filter((c) => c.deckId === deckId), [allCards, deckId]);

  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>("question");
  const [typed, setTyped] = useState("");
  const [shake, setShake] = useState(false);
  const [xpGained, setXpGained] = useState<number | null>(null);
  const [stats, setStats] = useState({ correct: 0, partial: 0, wrong: 0, xp: 0 });
  const startTime = useRef(Date.now());
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const card = cards[idx];
  const done = !card;

  useEffect(() => {
    if (phase === "typing") inputRef.current?.focus();
  }, [phase]);

  useEffect(() => {
    return () => {
      const studied = stats.correct + stats.partial + stats.wrong;
      if (studied > 0) {
        const mins = Math.max(1, Math.round((Date.now() - startTime.current) / 60000));
        recordStudy(studied, mins);
        updateDeck(deckId, { lastStudied: Date.now() });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!deck) {
    return (
      <PageShell>
        <PageHeader title="Deck not found" back="/decks" />
        <EmptyState emoji="📚" title="Deck not found" description="Pick a deck from the decks page." />
      </PageShell>
    );
  }
  if (cards.length === 0) {
    return (
      <PageShell>
        <PageHeader title={deck.name} back={`/decks/${deckId}`} />
        <EmptyState emoji="📝" title="No cards" description="Add some cards to study." />
      </PageShell>
    );
  }

  function rate(result: AttemptResult) {
    if (!card) return;
    const gained = recordAttempt(card.id, result);
    setStats((s) => ({
      correct: s.correct + (result === "correct" ? 1 : 0),
      partial: s.partial + (result === "partial" ? 1 : 0),
      wrong: s.wrong + (result === "wrong" ? 1 : 0),
      xp: s.xp + gained,
    }));
    if (result === "correct") {
      fireConfetti();
      setXpGained(gained);
      setTimeout(() => setXpGained(null), 1200);
    } else if (result === "wrong") {
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
    setTimeout(() => {
      setIdx((i) => i + 1);
      setPhase("question");
      setTyped("");
    }, result === "wrong" ? 550 : 400);
  }

  if (done) {
    const total = stats.correct + stats.partial + stats.wrong;
    const accuracy = total ? Math.round((stats.correct / total) * 100) : 0;
    return (
      <PageShell>
        <PageHeader title="Session complete" back={`/decks/${deckId}`} />
        <div className="text-center py-8 animate-fade-up">
          <div className="text-7xl mb-3 animate-pop-in">🎉</div>
          <h2 className="text-2xl font-bold">Great work!</h2>
          <p className="text-muted-foreground mt-1">You earned <span className="font-bold text-primary">+{stats.xp} XP</span></p>
          <div className="grid grid-cols-3 gap-2 mt-6 max-w-sm mx-auto">
            <div className="rounded-2xl glass p-3 text-center">
              <p className="text-2xl font-bold text-emerald-600">{stats.correct}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Correct</p>
            </div>
            <div className="rounded-2xl glass p-3 text-center">
              <p className="text-2xl font-bold text-amber-600">{stats.partial}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Partial</p>
            </div>
            <div className="rounded-2xl glass p-3 text-center">
              <p className="text-2xl font-bold text-rose-600">{stats.wrong}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Wrong</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">Accuracy: <span className="font-bold text-foreground">{accuracy}%</span></p>
          <div className="mt-6 flex gap-3 justify-center">
            <Link to="/decks/$deckId" params={{ deckId }} className="rounded-2xl glass px-5 py-2.5 text-sm font-semibold">Back to deck</Link>
            <Link to="/decks/$deckId/quiz" params={{ deckId }} className="rounded-2xl gradient-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold shadow-elegant">Take quiz</Link>
          </div>
        </div>
      </PageShell>
    );
  }

  const status = card.status ?? "new";
  const meta = statusMeta[status];

  return (
    <PageShell>
      <PageHeader
        title={`Card ${idx + 1} / ${cards.length}`}
        subtitle={deck.name}
        back={`/decks/${deckId}`}
        right={
          <div className="inline-flex items-center gap-1 px-2.5 h-9 rounded-2xl glass text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            {stats.xp} XP
          </div>
        }
      />

      <div className="mb-4 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className="h-full gradient-primary transition-all duration-500" style={{ width: `${(idx / cards.length) * 100}%` }} />
      </div>

      <div className={`relative ${shake ? "animate-shake" : "animate-fade-up"}`} key={card.id}>
        {xpGained !== null && (
          <div className="absolute -top-2 right-2 z-10 px-3 py-1 rounded-full gradient-success text-white text-sm font-bold shadow-elegant animate-pop-in">
            +{xpGained} XP
          </div>
        )}

        {/* Question card */}
        <div className={`rounded-3xl bg-gradient-to-br ${deck.color} p-6 text-white shadow-elegant relative overflow-hidden mb-4 min-h-[220px] flex flex-col`}>
          <div className="flex items-center justify-between mb-3">
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/20 backdrop-blur`}>
              {meta.label.toUpperCase()}
            </span>
            <button
              onClick={() => toggleFavorite(card.id)}
              className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center"
              aria-label="Favorite"
            >
              <Heart className={`w-4 h-4 ${card.isFavorite ? "fill-white" : ""}`} />
            </button>
          </div>
          <p className="text-xs uppercase tracking-widest opacity-70 mb-2">Question</p>
          <p className="text-xl sm:text-2xl font-bold leading-snug flex-1">{card.front}</p>
        </div>

        {phase === "question" && (
          <div className="grid grid-cols-2 gap-3 animate-fade-up">
            <button
              onClick={() => setPhase("typing")}
              className="h-14 rounded-2xl gradient-primary text-primary-foreground font-bold shadow-elegant inline-flex items-center justify-center gap-2"
            >
              <Brain className="w-5 h-5" /> I know it
            </button>
            <button
              onClick={() => setPhase("reveal")}
              className="h-14 rounded-2xl glass font-bold inline-flex items-center justify-center gap-2"
            >
              <Eye className="w-5 h-5" /> Show answer
            </button>
          </div>
        )}

        {phase === "typing" && (
          <div className="animate-fade-up space-y-3">
            <textarea
              ref={inputRef}
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              rows={3}
              placeholder="Type your answer…"
              className="w-full p-4 rounded-2xl border border-border bg-card text-sm focus:border-primary outline-none"
            />
            <button
              onClick={() => setPhase("reveal")}
              disabled={!typed.trim()}
              className="w-full h-12 rounded-2xl gradient-primary text-primary-foreground font-bold shadow-elegant disabled:opacity-40"
            >
              Submit & reveal
            </button>
          </div>
        )}

        {phase === "reveal" && (
          <div className="animate-fade-up space-y-4">
            {typed.trim() && (
              <div className="rounded-2xl glass p-4">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Your answer</p>
                <p className="text-sm">{typed}</p>
              </div>
            )}
            <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-4">
              <p className="text-[10px] uppercase tracking-wider text-primary font-bold mb-1">Correct answer</p>
              <p className="text-base font-semibold leading-snug">{card.back}</p>
            </div>
            <div>
              <p className="text-center text-sm text-muted-foreground mb-3">How close were you?</p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => rate("wrong")}
                  className="h-14 rounded-2xl bg-rose-500 text-white font-semibold text-sm shadow-soft inline-flex flex-col items-center justify-center gap-0.5 transition-transform hover:scale-[1.03]"
                >
                  <X className="w-4 h-4" /> Wrong
                </button>
                <button
                  onClick={() => rate("partial")}
                  className="h-14 rounded-2xl bg-amber-500 text-white font-semibold text-sm shadow-soft inline-flex flex-col items-center justify-center gap-0.5 transition-transform hover:scale-[1.03]"
                >
                  <AlertCircle className="w-4 h-4" /> Partial
                </button>
                <button
                  onClick={() => rate("correct")}
                  className="h-14 rounded-2xl bg-emerald-500 text-white font-semibold text-sm shadow-soft inline-flex flex-col items-center justify-center gap-0.5 transition-transform hover:scale-[1.03]"
                >
                  <Check className="w-4 h-4" /> Correct
                </button>
              </div>
              <p className="text-[11px] text-center text-muted-foreground mt-3">
                Correct: +10 XP · Partial: +5 XP · Wrong reschedules for tomorrow
              </p>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
