import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, useEffect, useRef } from "react";
import { useStore, type AttemptResult, type CardStatus } from "@/lib/store";
import { EmptyState, PageHeader, PageShell } from "@/components/Layout";
import { Heart, Eye, Brain, X, ArrowLeft, Flame, Sparkles, Timer, ChevronRight } from "lucide-react";
import { fireConfetti } from "@/lib/confetti";

export const Route = createFileRoute("/decks/$deckId/study")({
  head: () => ({ meta: [{ title: "Study — FlashMaster" }] }),
  component: Study,
});

type Phase = "question" | "flipped" | "typing" | "compare";

const statusMeta: Record<CardStatus, { label: string; cls: string }> = {
  new: { label: "NEW", cls: "bg-white/25" },
  learning: { label: "LEARNING", cls: "bg-amber-400/30" },
  revision: { label: "REVIEW", cls: "bg-rose-400/30" },
  mastered: { label: "MASTERED", cls: "bg-emerald-400/30" },
};

function Study() {
  const { deckId } = Route.useParams();
  const navigate = useNavigate();
  const decks = useStore((s) => s.decks);
  const allCards = useStore((s) => s.cards);
  const toggleFavorite = useStore((s) => s.toggleFavorite);
  const recordAttempt = useStore((s) => s.recordAttempt);
  const recordStudy = useStore((s) => s.recordStudy);
  const updateDeck = useStore((s) => s.updateDeck);
  const streak = useStore((s) => s.streak);
  const dailyGoal = useStore((s) => s.settings.dailyGoal);

  const deck = useMemo(() => decks.find((d) => d.id === deckId), [decks, deckId]);
  const cards = useMemo(() => allCards.filter((c) => c.deckId === deckId), [allCards, deckId]);

  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>("question");
  const [typed, setTyped] = useState("");
  const [shake, setShake] = useState(false);
  const [exitDir, setExitDir] = useState<null | "left" | "right">(null);
  const [xpPop, setXpPop] = useState<{ id: number; amount: number } | null>(null);
  const [stats, setStats] = useState({ correct: 0, partial: 0, wrong: 0, xp: 0 });
  const startTime = useRef(Date.now());
  const [timer, setTimer] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const card = cards[idx];
  const done = !card;
  const progressPct = (idx / Math.max(1, cards.length)) * 100;
  const studiedCount = stats.correct + stats.partial + stats.wrong;

  useEffect(() => {
    const t = setInterval(() => setTimer(Math.floor((Date.now() - startTime.current) / 1000)), 1000);
    return () => clearInterval(t);
  }, []);

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
      setXpPop({ id: Date.now(), amount: gained });
      setExitDir("right");
    } else if (result === "partial") {
      setXpPop({ id: Date.now(), amount: gained });
      setExitDir("right");
    } else {
      setShake(true);
      setExitDir("left");
    }

    setTimeout(() => setShake(false), 480);
    setTimeout(() => {
      setIdx((i) => i + 1);
      setPhase("question");
      setTyped("");
      setExitDir(null);
      setXpPop(null);
    }, 700);
  }

  // Session complete
  if (done) {
    const total = studiedCount;
    const accuracy = total ? Math.round((stats.correct / total) * 100) : 0;
    return (
      <div className="min-h-svh bg-background flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center animate-fade-up">
          <div className="text-8xl mb-4 animate-pop-in">🏆</div>
          <h1 className="text-3xl font-extrabold tracking-tight">Session complete!</h1>
          <p className="text-muted-foreground mt-1">You crushed {total} cards</p>

          <div className="mt-7 w-full max-w-sm rounded-3xl gradient-primary p-6 text-primary-foreground shadow-elegant relative overflow-hidden">
            <Sparkles className="w-7 h-7 mb-2 opacity-90" />
            <p className="text-xs uppercase tracking-widest opacity-80">Total XP earned</p>
            <p className="text-5xl font-extrabold mt-1">+{stats.xp}</p>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-5 w-full max-w-sm">
            <Stat n={stats.correct} label="Correct" cls="text-emerald-600" />
            <Stat n={stats.partial} label="Almost" cls="text-amber-600" />
            <Stat n={stats.wrong} label="Wrong" cls="text-rose-600" />
          </div>

          <p className="mt-5 text-sm">
            Accuracy: <span className="font-extrabold">{accuracy}%</span>
          </p>

          <div className="mt-7 flex gap-3 w-full max-w-sm">
            <Link
              to="/decks/$deckId"
              params={{ deckId }}
              className="flex-1 h-12 rounded-2xl glass font-bold inline-flex items-center justify-center text-sm"
            >
              Done
            </Link>
            <Link
              to="/decks/$deckId/quiz"
              params={{ deckId }}
              className="flex-1 h-12 rounded-2xl gradient-primary text-primary-foreground font-bold inline-flex items-center justify-center text-sm shadow-elegant"
            >
              Take quiz <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const status = card.status ?? "new";
  const meta = statusMeta[status];
  const accuracy = card.attempts ? Math.round(((card.correct ?? 0) / card.attempts) * 100) : 0;
  const mastery = Math.min(100, ((card.correct ?? 0) / 3) * 100);
  const goalPct = Math.min(100, Math.round((studiedCount / dailyGoal) * 100));
  const mm = String(Math.floor(timer / 60)).padStart(2, "0");
  const ss = String(timer % 60).padStart(2, "0");

  return (
    <div className="min-h-svh bg-background flex flex-col">
      {/* Top bar — Duolingo style */}
      <header className="px-4 pt-3 pb-2 sticky top-0 z-40 bg-background/85 backdrop-blur-md">
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <button
            onClick={() => {
              if (studiedCount === 0 || confirm("End session and save progress?")) {
                navigate({ to: "/decks/$deckId", params: { deckId } });
              }
            }}
            className="w-10 h-10 rounded-2xl glass flex items-center justify-center shrink-0"
            aria-label="Exit"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Progress bar */}
          <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden relative">
            <div
              className="h-full gradient-primary rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <div className="inline-flex items-center gap-1 px-2.5 h-9 rounded-2xl bg-rose-500/10 text-rose-600 text-xs font-extrabold shrink-0">
            <Flame className="w-4 h-4 fill-rose-500 text-rose-500" />
            {streak.current}
          </div>
        </div>

        {/* meta row */}
        <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground mt-2 max-w-2xl mx-auto">
          <span>Question {idx + 1} of {cards.length}</span>
          <span className="inline-flex items-center gap-3">
            <span className="inline-flex items-center gap-1 text-amber-600"><Sparkles className="w-3 h-3" /> {stats.xp} XP</span>
            <span className="inline-flex items-center gap-1"><Timer className="w-3 h-3" /> {mm}:{ss}</span>
            <span>Goal {Math.min(studiedCount, dailyGoal)}/{dailyGoal}</span>
          </span>
        </div>
        <div className="h-1 rounded-full bg-muted overflow-hidden mt-1 max-w-2xl mx-auto">
          <div className="h-full bg-amber-500 transition-all duration-500" style={{ width: `${goalPct}%` }} />
        </div>
      </header>

      {/* Main stage */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-6 max-w-2xl w-full mx-auto relative overflow-hidden">
        {/* Ambient glows */}
        <div className="pointer-events-none absolute -top-10 -left-10 w-72 h-72 rounded-full bg-primary/25 blur-3xl animate-pulse-slow" aria-hidden />
        <div className="pointer-events-none absolute -bottom-10 -right-10 w-72 h-72 rounded-full bg-accent/25 blur-3xl animate-pulse-slow" aria-hidden />
        {/* XP floater */}
        {xpPop && xpPop.amount > 0 && (
          <div
            key={xpPop.id}
            className="absolute left-1/2 top-10 z-30 pointer-events-none animate-xp-float"
          >
            <div className="px-4 py-2 rounded-full gradient-success text-white text-base font-extrabold shadow-elegant inline-flex items-center gap-1">
              <Sparkles className="w-4 h-4" /> +{xpPop.amount} XP
            </div>
          </div>
        )}

        {phase === "typing" ? (
          /* Full-screen typing challenge */
          <div className="w-full animate-fade-up">
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-2">Active recall</p>
            <h2 className="text-2xl font-extrabold leading-snug mb-1">{card.front}</h2>
            <p className="text-sm text-muted-foreground mb-5">Type your answer before checking.</p>
            <textarea
              ref={inputRef}
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              rows={5}
              placeholder="Your answer…"
              className="w-full p-4 rounded-3xl border-2 border-border bg-card text-base focus:border-primary outline-none transition-colors"
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setPhase("question")}
                className="h-13 px-5 rounded-2xl glass font-bold text-sm"
              >
                <ArrowLeft className="w-4 h-4 inline mr-1" /> Back
              </button>
              <button
                onClick={() => setPhase("compare")}
                disabled={!typed.trim()}
                className="flex-1 h-13 rounded-2xl gradient-primary text-primary-foreground font-extrabold shadow-elegant disabled:opacity-40 text-sm uppercase tracking-wider"
              >
                Check answer
              </button>
            </div>
          </div>
        ) : phase === "compare" ? (
          /* Side-by-side comparison — auto judged */
          (() => {
            const evalResult = evaluateAnswer(typed, card.back, card.front);
            const { verdict, score, mode } = evalResult;
            const verdictMeta = {
              correct: { label: "Correct", emoji: "🎉", cls: "bg-emerald-500" },
              partial: { label: "Partial", emoji: "🤏", cls: "bg-amber-500" },
              wrong: { label: "Wrong", emoji: "❌", cls: "bg-rose-500" },
            }[verdict];
            return (
              <div className="w-full animate-fade-up space-y-3">
                <div className={`rounded-3xl ${verdictMeta.cls} text-white p-4 animate-pop-in shadow-elegant`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest font-extrabold opacity-90">
                        AI Evaluation · {mode === "exact" ? "Exact match" : "Semantic"}
                      </p>
                      <p className="text-xl font-extrabold mt-0.5">{verdictMeta.emoji} {verdictMeta.label}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-widest font-extrabold opacity-90">Match</p>
                      <p className="text-3xl font-extrabold leading-none">{score}%</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-3xl border-2 border-primary bg-primary/5 p-4">
                  <p className="text-[10px] uppercase tracking-wider text-primary font-extrabold mb-1">Correct answer</p>
                  <pre className="text-base font-extrabold leading-snug whitespace-pre-wrap font-mono break-words">{card.back}</pre>
                </div>
                <div className="rounded-3xl border-2 border-border bg-card p-4">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">Your answer</p>
                  <pre className="text-base font-semibold leading-snug whitespace-pre-wrap font-mono break-words">{typed}</pre>
                </div>
                <button
                  onClick={() => rate(verdict)}
                  className="w-full h-13 rounded-2xl gradient-primary text-primary-foreground font-extrabold shadow-elegant text-sm uppercase tracking-wider"
                >
                  Continue <ChevronRight className="w-4 h-4 inline ml-1" />
                </button>
              </div>
            );
          })()
        ) : (
          /* Card phase: question or flipped — single card that flips in 3D */
          <div
            className={`relative w-full max-w-sm isolate card-tilt ${shake ? "animate-shake" : ""} ${
              exitDir === "left" ? "swipe-left" : exitDir === "right" ? "swipe-right" : "animate-card-enter"
            }`}
            key={card.id}
            onClick={() => {
              if (phase === "question") setPhase("flipped");
            }}
            role="button"
            tabIndex={0}
            aria-label={phase === "question" ? "Tap to reveal answer" : "Answer revealed"}
          >
            {/* Stacked illusion */}
            <div className={`stack-card-2 bg-gradient-to-br ${deck.color}`} aria-hidden />
            <div className={`stack-card-3 bg-gradient-to-br ${deck.color}`} aria-hidden />

            <div className="card-3d w-full aspect-[3/4] animate-float">
              <div className={`card-inner ${phase === "flipped" ? "flipped" : ""}`}>
                {/* Front: Question */}
                <div className={`card-face gradient-ring rounded-[1.75rem] bg-gradient-to-br ${deck.color} p-5 flex flex-col text-primary-foreground shadow-elegant relative overflow-hidden`}>
                  <div className="absolute inset-0 shimmer-overlay" aria-hidden />
                  <div className="absolute -right-6 -bottom-6 text-[140px] leading-none opacity-15 select-none">{deck.emoji}</div>
                  <div className="flex items-center justify-between relative z-[2]">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wider backdrop-blur ${meta.cls}`}>
                      {meta.label}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(card.id); }}
                      className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center hover:bg-white/30 transition-colors"
                      aria-label="Favorite"
                    >
                      <Heart className={`w-4 h-4 ${card.isFavorite ? "fill-current" : ""}`} />
                    </button>
                  </div>
                  <div className="flex-1 flex flex-col items-center justify-center text-center relative z-[2] px-1 overflow-y-auto">
                    <p className="text-[10px] uppercase tracking-[0.3em] opacity-70 mb-3">Question</p>
                    <p className="text-xl sm:text-2xl font-extrabold leading-snug drop-shadow-sm break-words">{card.front}</p>
                  </div>
                  <div className="relative z-[2]">
                    <p className="text-center text-[10px] uppercase tracking-widest opacity-80 mb-2 font-bold">Tap card to reveal</p>
                    <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider opacity-80 mb-1">
                      <span>Mastery</span>
                      <span>{Math.round(mastery)}%</span>
                    </div>
                    <div className="h-1 rounded-full bg-white/20 overflow-hidden">
                      <div className="h-full bg-white/90 transition-all duration-500" style={{ width: `${mastery}%` }} />
                    </div>
                  </div>
                </div>

                {/* Back: Answer — same premium gradient as front */}
                <div className={`card-face card-face-back gradient-ring rounded-[1.75rem] bg-gradient-to-br ${deck.color} p-5 flex flex-col text-primary-foreground shadow-elegant relative overflow-hidden`}>
                  <div className="absolute inset-0 shimmer-overlay" aria-hidden />
                  <div className="absolute -left-6 -top-6 text-[140px] leading-none opacity-10 select-none">💡</div>
                  <div className="flex items-center justify-between relative z-[2]">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wider bg-white/25 backdrop-blur">
                      ANSWER
                    </span>
                    <span className="text-[10px] font-bold opacity-80">
                      Accuracy {accuracy}%
                    </span>
                  </div>
                  <div className="flex-1 flex flex-col items-center justify-center text-center px-1 relative z-[2] overflow-y-auto">
                    <p className="text-[10px] uppercase tracking-[0.3em] opacity-70 mb-3">Answer</p>
                    <p className="text-lg sm:text-xl font-extrabold leading-snug drop-shadow-sm break-words whitespace-pre-wrap">{card.back}</p>
                  </div>
                  <p className="text-center text-[10px] opacity-80 font-semibold relative z-[2]">Did you know this?</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Bottom action bar */}
      <footer className="px-4 pb-5 pt-2 sticky bottom-0 bg-gradient-to-t from-background via-background to-transparent">
        <div className="max-w-2xl mx-auto">
          {phase === "question" && (
            <div className="grid grid-cols-2 gap-3 animate-fade-up">
              <button
                onClick={() => setPhase("typing")}
                className="h-14 rounded-2xl gradient-primary text-primary-foreground font-extrabold shadow-elegant inline-flex items-center justify-center gap-2 text-sm uppercase tracking-wider animate-pulse-glow"
              >
                <Brain className="w-5 h-5" /> I know it
              </button>
              <button
                onClick={() => setPhase("flipped")}
                className="h-14 rounded-2xl glass font-extrabold inline-flex items-center justify-center gap-2 text-sm uppercase tracking-wider"
              >
                <Eye className="w-5 h-5" /> Reveal
              </button>
            </div>
          )}

          {phase === "flipped" && (
            <div className="animate-fade-up">
              <p className="text-center text-xs uppercase tracking-widest text-muted-foreground font-bold mb-2">
                You peeked — counted as not known
              </p>
              <button
                onClick={() => rate("wrong")}
                className="w-full h-14 rounded-2xl gradient-primary text-primary-foreground font-extrabold shadow-elegant text-sm uppercase tracking-wider inline-flex items-center justify-center gap-2"
              >
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const dp = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j];
      dp[j] = a[i - 1] === b[j - 1] ? prev : Math.min(prev, dp[j], dp[j - 1]) + 1;
      prev = tmp;
    }
  }
  return dp[b.length];
}

type QuestionKind = "code" | "theory";

function detectKind(question: string, answer: string): QuestionKind {
  const text = `${question}\n${answer}`;
  // Strong code signals: brackets, semicolons, code keywords, SQL, HTML tags, formulas
  const codeSignals = [
    /[{}();\[\]<>]/,            // brackets/symbols
    /[=+\-*/%^]=?/,             // operators
    /["'`]/,                    // quotes
    /\b(SELECT|INSERT|UPDATE|DELETE|FROM|WHERE|JOIN)\b/i,
    /\b(function|def|class|return|const|let|var|import|public|static|void|int|float|print|console|printf|cout|System\.out)\b/,
    /<\/?[a-z][\w-]*[^>]*>/i,   // html tag
    /#include|#define|^\s*#/m,  // C preprocessor / markdown heading
    /\$[a-zA-Z_]/,              // shell var
    /\b(sudo|npm|npx|git|cd|ls|mkdir|rm|chmod|apt|pip|docker|cap|cargo)\b/,
    /\\[a-zA-Z]+\{/,            // latex
  ];
  const questionHints = /\b(code|syntax|command|formula|query|tag|function|method|output|write|print|implement)\b/i;
  if (codeSignals.some((r) => r.test(text))) return "code";
  if (questionHints.test(question)) return "code";
  // Short non-alphanumeric-heavy answers also look like syntax
  const nonAlpha = (answer.match(/[^a-zA-Z0-9\s]/g) ?? []).length;
  if (answer.length > 0 && nonAlpha / answer.length > 0.15) return "code";
  return "theory";
}

function normalizeCode(s: string): string {
  // Preserve symbols, case, structure — collapse only whitespace
  return s.replace(/\r\n/g, "\n").replace(/[ \t]+/g, " ").replace(/\s*\n\s*/g, "\n").trim();
}

export type EvalResult = { verdict: AttemptResult; score: number; mode: "exact" | "semantic" };

function evaluateAnswer(user: string, correct: string, question: string): EvalResult {
  const kind = detectKind(question, correct);
  if (kind === "code") {
    const u = normalizeCode(user);
    const c = normalizeCode(correct);
    if (!u) return { verdict: "wrong", score: 0, mode: "exact" };
    if (u === c) return { verdict: "correct", score: 100, mode: "exact" };
    // Strict: any character difference = wrong. Show char-level similarity as info.
    const dist = levenshtein(u, c);
    const sim = Math.max(0, Math.round((1 - dist / Math.max(u.length, c.length)) * 100));
    return { verdict: "wrong", score: sim, mode: "exact" };
  }
  // Semantic mode for theory/definitions/explanations
  const u = normalize(user);
  const c = normalize(correct);
  if (!u) return { verdict: "wrong", score: 0, mode: "semantic" };
  const userTokens = new Set(u.split(" ").filter(Boolean));
  const correctTokens = c.split(" ").filter(Boolean);
  const overlap = correctTokens.filter((t) => userTokens.has(t)).length;
  const tokenRatio = correctTokens.length ? overlap / correctTokens.length : 0;
  const dist = levenshtein(u, c);
  const sim = 1 - dist / Math.max(u.length, c.length);
  const score = Math.round(Math.max(sim, tokenRatio) * 100);
  const verdict: AttemptResult = score >= 80 ? "correct" : score >= 50 ? "partial" : "wrong";
  return { verdict, score, mode: "semantic" };
}

function Stat({ n, label, cls }: { n: number; label: string; cls: string }) {
  return (
    <div className="rounded-2xl glass p-3 text-center">
      <p className={`text-2xl font-extrabold ${cls}`}>{n}</p>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">{label}</p>
    </div>
  );
}
