import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useStore, Card } from "@/lib/store";
import { PageHeader, PageShell, EmptyState } from "@/components/Layout";
import { fireConfetti } from "@/lib/confetti";
import { Check, X } from "lucide-react";

export const Route = createFileRoute("/decks/$deckId/quiz")({
  head: () => ({ meta: [{ title: "Quiz — FlashMaster" }] }),
  component: Quiz,
});

interface Q {
  card: Card;
  options: string[];
  correctIdx: number;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildQuestions(cards: Card[]): Q[] {
  const pool = cards;
  return shuffle(pool).slice(0, Math.min(10, pool.length)).map((card) => {
    const distractors = shuffle(pool.filter((c) => c.id !== card.id)).slice(0, 3).map((c) => c.back);
    while (distractors.length < 3) distractors.push("—");
    const opts = shuffle([card.back, ...distractors]);
    return { card, options: opts, correctIdx: opts.indexOf(card.back) };
  });
}

function Quiz() {
  const { deckId } = Route.useParams();
  const decks = useStore((s) => s.decks);
  const allCards = useStore((s) => s.cards);
  const recordQuiz = useStore((s) => s.recordQuiz);
  const deck = useMemo(() => decks.find((d) => d.id === deckId), [decks, deckId]);
  const cards = useMemo(() => allCards.filter((c) => c.deckId === deckId), [allCards, deckId]);

  const questions = useMemo(() => buildQuestions(cards), [cards]);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [shake, setShake] = useState(false);
  const [done, setDone] = useState(false);
  const [recorded, setRecorded] = useState(false);

  if (!deck) return null;
  if (cards.length < 2) {
    return (
      <PageShell>
        <PageHeader title="Quiz" back={`/decks/${deckId}`} />
        <EmptyState emoji="🎯" title="Need at least 2 cards" description="Add more cards to this deck to take a quiz." />
      </PageShell>
    );
  }

  const q = questions[idx];

  function pick(i: number) {
    if (selected !== null) return;
    setSelected(i);
    if (i === q.correctIdx) setCorrect((c) => c + 1);
    else { setShake(true); setTimeout(() => setShake(false), 500); }
  }

  function next() {
    if (idx === questions.length - 1) {
      setDone(true);
      const score = Math.round((correct / questions.length) * 100);
      if (!recorded && deck) {
        recordQuiz({ deckId: deck.id, deckName: deck.name, score, correct, total: questions.length });
        setRecorded(true);
        if (score >= 80) fireConfetti();
      }
    } else {
      setIdx((i) => i + 1);
      setSelected(null);
    }
  }

  if (done) {
    const score = Math.round((correct / questions.length) * 100);
    const great = score >= 80;
    return (
      <PageShell>
        <PageHeader title="Results" back={`/decks/${deckId}`} />
        <div className="text-center py-8 animate-fade-up">
          <div className="text-7xl mb-4 animate-pop-in">{great ? "🏆" : score >= 50 ? "👏" : "💪"}</div>
          <p className="text-sm uppercase tracking-wider text-muted-foreground font-semibold">You scored</p>
          <p className="text-6xl font-bold text-gradient mt-2">{score}%</p>
          <p className="text-muted-foreground mt-2">{correct} of {questions.length} correct</p>

          <div className="mt-8 glass rounded-3xl p-5 max-w-sm mx-auto shadow-soft">
            <p className="text-sm font-bold mb-2">{great ? "Outstanding work!" : score >= 50 ? "Solid effort!" : "Keep practicing!"}</p>
            <p className="text-xs text-muted-foreground">{great ? "You've mastered most of this deck." : "Review the deck and try again."}</p>
          </div>

          <div className="mt-6 flex flex-wrap gap-3 justify-center">
            <Link to="/decks/$deckId" params={{ deckId }} className="rounded-2xl glass px-5 py-2.5 text-sm font-semibold">Back to deck</Link>
            <button onClick={() => location.reload()} className="rounded-2xl gradient-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold shadow-elegant">Retake</button>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader title={`Question ${idx + 1} / ${questions.length}`} subtitle={deck.name} back={`/decks/${deckId}`} />

      <div className="mb-5 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className="h-full gradient-primary transition-all duration-500" style={{ width: `${((idx + 1) / questions.length) * 100}%` }} />
      </div>

      <div className={`rounded-3xl bg-gradient-to-br ${deck.color} p-6 text-white shadow-elegant mb-4 ${shake ? "animate-shake" : ""}`}>
        <p className="text-xs uppercase tracking-widest opacity-80 mb-2">Question</p>
        <p className="text-xl font-bold leading-snug">{q.card.front}</p>
      </div>

      <div className="space-y-2.5 mb-5">
        {q.options.map((opt, i) => {
          const isCorrect = i === q.correctIdx;
          const isPicked = selected === i;
          let cls = "glass hover:scale-[1.01]";
          if (selected !== null) {
            if (isCorrect) cls = "bg-success text-success-foreground border-success";
            else if (isPicked) cls = "bg-destructive text-destructive-foreground border-destructive";
            else cls = "glass opacity-60";
          }
          return (
            <button
              key={i}
              onClick={() => pick(i)}
              disabled={selected !== null}
              className={`w-full text-left p-4 rounded-2xl border border-border font-medium text-sm transition-all flex items-center gap-3 ${cls}`}
            >
              <span className="w-7 h-7 shrink-0 rounded-full bg-foreground/10 flex items-center justify-center text-xs font-bold">
                {String.fromCharCode(65 + i)}
              </span>
              <span className="flex-1">{opt}</span>
              {selected !== null && isCorrect && <Check className="w-5 h-5" />}
              {selected !== null && isPicked && !isCorrect && <X className="w-5 h-5" />}
            </button>
          );
        })}
      </div>

      {selected !== null && (
        <div className="animate-fade-up">
          {selected !== q.correctIdx && (
            <div className="glass rounded-2xl p-4 mb-3 border-l-4 border-destructive">
              <p className="text-xs uppercase tracking-wider font-semibold text-destructive mb-1">Correct answer</p>
              <p className="text-sm">{q.card.back}</p>
            </div>
          )}
          <button onClick={next} className="w-full h-12 rounded-2xl gradient-primary text-primary-foreground font-bold shadow-elegant">
            {idx === questions.length - 1 ? "See results" : "Next question"}
          </button>
        </div>
      )}
    </PageShell>
  );
}
