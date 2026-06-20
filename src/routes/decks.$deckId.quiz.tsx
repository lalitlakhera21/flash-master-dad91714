import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, useEffect, useRef } from "react";
import { useStore, Card } from "@/lib/store";
import { EmptyState, PageHeader, PageShell } from "@/components/Layout";
import { fireConfetti } from "@/lib/confetti";
import { Check, X, Sparkles, Timer, Flame, ChevronRight, Trophy } from "lucide-react";

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
  const navigate = useNavigate();
  const decks = useStore((s) => s.decks);
  const allCards = useStore((s) => s.cards);
  const recordQuiz = useStore((s) => s.recordQuiz);
  const streak = useStore((s) => s.streak);
  const deck = useMemo(() => decks.find((d) => d.id === deckId), [decks, deckId]);
  const cards = useMemo(() => allCards.filter((c) => c.deckId === deckId), [allCards, deckId]);

  const questions = useMemo(() => buildQuestions(cards), [cards]);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [shake, setShake] = useState(false);
  const [exitDir, setExitDir] = useState<null | "left" | "right">(null);
  const [done, setDone] = useState(false);
  const [recorded, setRecorded] = useState(false);
  const [xpPop, setXpPop] = useState<{ id: number; amount: number } | null>(null);
  const [combo, setCombo] = useState(0);
  const [xp, setXp] = useState(0);
  const startTime = useRef(Date.now());
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTimer(Math.floor((Date.now() - startTime.current) / 1000)), 1000);
    return () => clearInterval(t);
  }, []);

  if (!deck) {
    return (
      <PageShell>
        <PageHeader title="Deck not found" back="/decks" />
        <EmptyState emoji="📚" title="Deck not found" description="Open a deck from the decks page." />
      </PageShell>
    );
  }
  if (cards.length < 2) {
    return (
      <PageShell>
        <PageHeader title="Quiz" back={`/decks/${deckId}`} />
        <EmptyState emoji="🎯" title="Need at least 2 cards" description="Add more cards to this deck to take a quiz." />
      </PageShell>
    );
  }

  const q = questions[idx];
  const progressPct = ((idx + (selected !== null ? 1 : 0)) / questions.length) * 100;
  const mm = String(Math.floor(timer / 60)).padStart(2, "0");
  const ss = String(timer % 60).padStart(2, "0");

  function pick(i: number) {
    if (selected !== null) return;
    setSelected(i);
    const isRight = i === q.correctIdx;
    if (isRight) {
      const gain = 10 + Math.min(20, combo * 2);
      setCorrect((c) => c + 1);
      setCombo((c) => c + 1);
      setXp((x) => x + gain);
      setXpPop({ id: Date.now(), amount: gain });
      fireConfetti();
    } else {
      setCombo(0);
      setShake(true);
      setTimeout(() => setShake(false), 480);
    }
  }

  function next() {
    setExitDir(selected === q.correctIdx ? "right" : "left");
    setTimeout(() => {
      if (idx === questions.length - 1) {
        const score = Math.round((correct / questions.length) * 100);
        if (!recorded && deck) {
          recordQuiz({ deckId: deck.id, deckName: deck.name, score, correct, total: questions.length });
          setRecorded(true);
          if (score >= 80) fireConfetti();
        }
        setDone(true);
      } else {
        setIdx((i) => i + 1);
        setSelected(null);
        setExitDir(null);
        setXpPop(null);
      }
    }, 360);
  }

  if (done) {
    const score = Math.round((correct / questions.length) * 100);
    const great = score >= 80;
    const emoji = great ? "🏆" : score >= 50 ? "👏" : "💪";
    return (
      <div className="min-h-svh bg-background flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center animate-fade-up max-w-md mx-auto">
          <div className="text-8xl mb-4 animate-pop-in">{emoji}</div>
          <h1 className="text-3xl font-extrabold tracking-tight">Quiz complete!</h1>
          <p className="text-muted-foreground mt-1">{deck.name}</p>

          <div className="mt-6 w-full rounded-3xl gradient-primary p-6 text-primary-foreground shadow-elegant relative overflow-hidden">
            <Trophy className="w-7 h-7 mb-2 opacity-90" />
            <p className="text-xs uppercase tracking-widest opacity-80">Final score</p>
            <p className="text-6xl font-extrabold mt-1">{score}%</p>
            <p className="text-sm opacity-90 mt-1">{correct} of {questions.length} correct</p>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-5 w-full">
            <div className="glass rounded-2xl p-4 shadow-soft">
              <p className="text-2xl font-extrabold text-amber-600">+{xp}</p>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">XP earned</p>
            </div>
            <div className="glass rounded-2xl p-4 shadow-soft">
              <p className="text-2xl font-extrabold">{mm}:{ss}</p>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">Time</p>
            </div>
          </div>

          <div className="mt-7 flex gap-3 w-full">
            <Link
              to="/decks/$deckId"
              params={{ deckId }}
              className="flex-1 h-12 rounded-2xl glass font-bold inline-flex items-center justify-center text-sm"
            >
              Back to deck
            </Link>
            <button
              onClick={() => location.reload()}
              className="flex-1 h-12 rounded-2xl gradient-primary text-primary-foreground font-bold inline-flex items-center justify-center text-sm shadow-elegant"
            >
              Retake <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-svh bg-background flex flex-col">
      {/* HUD */}
      <header className="px-4 pt-3 pb-2 sticky top-0 z-40 bg-background/85 backdrop-blur-md">
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <button
            onClick={() => {
              if (selected === null || confirm("Quit quiz? Progress won't be saved.")) {
                navigate({ to: "/decks/$deckId", params: { deckId } });
              }
            }}
            className="w-10 h-10 rounded-2xl glass flex items-center justify-center shrink-0"
            aria-label="Exit"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
            <div className="h-full gradient-primary rounded-full transition-all duration-500 ease-out" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="inline-flex items-center gap-1 px-2.5 h-9 rounded-2xl bg-rose-500/10 text-rose-600 text-xs font-extrabold shrink-0">
            <Flame className="w-4 h-4 fill-rose-500 text-rose-500" />
            {streak.current}
          </div>
        </div>
        <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground mt-2 max-w-2xl mx-auto">
          <span>Question {idx + 1} of {questions.length}</span>
          <span className="inline-flex items-center gap-3">
            <span className="inline-flex items-center gap-1 text-amber-600"><Sparkles className="w-3 h-3" /> {xp} XP</span>
            {combo >= 2 && <span className="inline-flex items-center gap-1 text-orange-600">🔥 x{combo}</span>}
            <span className="inline-flex items-center gap-1"><Timer className="w-3 h-3" /> {mm}:{ss}</span>
          </span>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center px-4 py-5 max-w-2xl w-full mx-auto relative">
        {/* XP floater */}
        {xpPop && xpPop.amount > 0 && (
          <div key={xpPop.id} className="absolute left-1/2 top-6 z-30 pointer-events-none animate-xp-float">
            <div className="px-4 py-2 rounded-full gradient-success text-white text-base font-extrabold shadow-elegant inline-flex items-center gap-1">
              <Sparkles className="w-4 h-4" /> +{xpPop.amount} XP
            </div>
          </div>
        )}

        {/* Flashcard question */}
        <div
          key={q.card.id}
          className={`relative w-full max-w-md isolate ${shake ? "animate-shake" : ""} ${
            exitDir === "left" ? "swipe-left" : exitDir === "right" ? "swipe-right" : "animate-card-enter"
          }`}
        >
          <div className={`stack-card-2 bg-gradient-to-br ${deck.color}`} aria-hidden />
          <div className={`stack-card-3 bg-gradient-to-br ${deck.color}`} aria-hidden />
          <div className={`relative rounded-3xl bg-gradient-to-br ${deck.color} p-6 text-primary-foreground shadow-elegant overflow-hidden min-h-[220px] flex flex-col`}>
            <div className="absolute -right-6 -bottom-6 text-[140px] leading-none opacity-15">{deck.emoji}</div>
            <div className="flex items-center justify-between relative">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wider bg-white/25 backdrop-blur">
                QUIZ
              </span>
              <span className="text-[10px] font-bold opacity-80">{deck.name}</span>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center text-center relative py-4">
              <p className="text-[10px] uppercase tracking-[0.25em] opacity-70 mb-3">Question</p>
              <p className="text-2xl sm:text-3xl font-extrabold leading-snug">{q.card.front}</p>
            </div>
          </div>
        </div>

        {/* Options */}
        <div className="w-full max-w-md space-y-2.5 mt-5">
          {q.options.map((opt, i) => {
            const isCorrect = i === q.correctIdx;
            const isPicked = selected === i;
            let cls = "glass hover:scale-[1.01] active:scale-[0.99]";
            if (selected !== null) {
              if (isCorrect) cls = "bg-emerald-500 text-white border-emerald-500 shadow-elegant";
              else if (isPicked) cls = "bg-rose-500 text-white border-rose-500 shadow-elegant";
              else cls = "glass opacity-50";
            }
            return (
              <button
                key={i}
                onClick={() => pick(i)}
                disabled={selected !== null}
                className={`w-full text-left p-4 rounded-2xl border-2 border-border font-semibold text-sm transition-all flex items-center gap-3 animate-fade-up ${cls}`}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <span className="w-8 h-8 shrink-0 rounded-xl bg-foreground/10 flex items-center justify-center text-sm font-extrabold">
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="flex-1">{opt}</span>
                {selected !== null && isCorrect && <Check className="w-5 h-5" />}
                {selected !== null && isPicked && !isCorrect && <X className="w-5 h-5" />}
              </button>
            );
          })}
        </div>
      </main>

      {/* Bottom bar */}
      <footer className="px-4 pb-5 pt-3 sticky bottom-0 bg-gradient-to-t from-background via-background to-transparent">
        <div className="max-w-md mx-auto">
          {selected === null ? (
            <p className="text-center text-xs uppercase tracking-widest text-muted-foreground font-bold">
              Pick the correct answer
            </p>
          ) : (
            <div className="animate-fade-up space-y-3">
              {selected !== q.correctIdx && (
                <div className="glass rounded-2xl p-3 border-l-4 border-rose-500">
                  <p className="text-[10px] uppercase tracking-wider font-extrabold text-rose-600 mb-0.5">Correct answer</p>
                  <p className="text-sm font-semibold">{q.card.back}</p>
                </div>
              )}
              <button
                onClick={next}
                className={`w-full h-14 rounded-2xl text-primary-foreground font-extrabold shadow-elegant text-sm uppercase tracking-wider inline-flex items-center justify-center gap-2 ${
                  selected === q.correctIdx ? "bg-emerald-500" : "gradient-primary"
                }`}
              >
                {idx === questions.length - 1 ? "See results" : "Next question"} <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}
