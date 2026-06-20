import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Difficulty = "easy" | "medium" | "hard" | null;

export interface Card {
  id: string;
  deckId: string;
  front: string;
  back: string;
  tags: string[];
  difficulty: Difficulty;
  isFavorite: boolean;
  createdAt: number;
  lastReviewed?: number;
  reviewCount: number;
}

export interface Deck {
  id: string;
  name: string;
  description: string;
  emoji: string;
  color: string; // tailwind gradient class suffix
  createdAt: number;
  lastStudied?: number;
}

export interface QuizResult {
  id: string;
  deckId: string;
  deckName: string;
  score: number; // 0-100
  correct: number;
  total: number;
  takenAt: number;
}

export interface Settings {
  theme: "light" | "dark";
  dailyGoal: number; // cards
  notifications: boolean;
  userName: string;
}

interface DayActivity {
  date: string; // YYYY-MM-DD
  cards: number;
  minutes: number;
}

interface State {
  decks: Deck[];
  cards: Card[];
  quizHistory: QuizResult[];
  achievements: string[];
  activity: DayActivity[];
  settings: Settings;
  streak: { current: number; longest: number; lastDate?: string };

  // actions
  addDeck: (d: Omit<Deck, "id" | "createdAt">) => string;
  updateDeck: (id: string, patch: Partial<Deck>) => void;
  deleteDeck: (id: string) => void;

  addCard: (c: Omit<Card, "id" | "createdAt" | "reviewCount" | "isFavorite" | "difficulty"> & Partial<Pick<Card, "isFavorite" | "difficulty">>) => string;
  updateCard: (id: string, patch: Partial<Card>) => void;
  deleteCard: (id: string) => void;
  toggleFavorite: (id: string) => void;
  setDifficulty: (id: string, d: Difficulty) => void;
  reviewCard: (id: string) => void;

  recordStudy: (cards: number, minutes: number) => void;
  recordQuiz: (r: Omit<QuizResult, "id" | "takenAt">) => void;

  unlock: (id: string) => void;

  setSettings: (patch: Partial<Settings>) => void;
  toggleTheme: () => void;

  importData: (data: Partial<State>) => void;
  exportData: () => string;
  resetAll: () => void;
  loadSampleData: () => void;
}

const todayStr = () => new Date().toISOString().slice(0, 10);
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

const SAMPLE_DECKS: Omit<Deck, "createdAt">[] = [
  { id: "d_aiml", name: "AI & Machine Learning", description: "Core ML & AI concepts", emoji: "🧠", color: "from-indigo-500 to-violet-500" },
  { id: "d_dsa", name: "DSA", description: "Data Structures & Algorithms", emoji: "🧮", color: "from-emerald-500 to-teal-500" },
  { id: "d_math", name: "Mathematics", description: "Calculus, linear algebra, probability", emoji: "📐", color: "from-amber-500 to-orange-500" },
  { id: "d_interview", name: "Interview Prep", description: "Behavioral + technical", emoji: "🎯", color: "from-rose-500 to-pink-500" },
  { id: "d_python", name: "Python", description: "Python essentials", emoji: "🐍", color: "from-sky-500 to-cyan-500" },
  { id: "d_apt", name: "Aptitude", description: "Quant & reasoning", emoji: "🧩", color: "from-fuchsia-500 to-purple-500" },
];

type SampleCard = { deckId: string; front: string; back: string; tags?: string[] };
const SAMPLE_CARDS: SampleCard[] = [
  // AI & ML
  { deckId: "d_aiml", front: "What is overfitting?", back: "When a model learns noise in training data and fails to generalize to new data.", tags: ["Important"] },
  { deckId: "d_aiml", front: "Define precision and recall.", back: "Precision = TP/(TP+FP). Recall = TP/(TP+FN).", tags: ["Exam"] },
  { deckId: "d_aiml", front: "What is gradient descent?", back: "Optimization algorithm that iteratively updates parameters in the direction of the negative gradient of the loss.", tags: ["Important"] },
  { deckId: "d_aiml", front: "Bias vs Variance?", back: "Bias = error from wrong assumptions. Variance = error from sensitivity to small fluctuations.", tags: ["Revision"] },
  { deckId: "d_aiml", front: "What is a confusion matrix?", back: "A table showing TP, TN, FP, FN for classifier evaluation.", tags: [] },
  { deckId: "d_aiml", front: "What is dropout?", back: "Regularization technique that randomly zeros activations during training to reduce overfitting.", tags: [] },
  // DSA
  { deckId: "d_dsa", front: "Time complexity of binary search?", back: "O(log n) on a sorted array.", tags: ["Easy"] },
  { deckId: "d_dsa", front: "What is a hash table average lookup?", back: "O(1) average, O(n) worst-case.", tags: ["Important"] },
  { deckId: "d_dsa", front: "Difference between BFS and DFS?", back: "BFS uses a queue and explores by depth levels; DFS uses a stack/recursion and goes deep first.", tags: ["Exam"] },
  { deckId: "d_dsa", front: "What is dynamic programming?", back: "Solving problems by combining solutions to overlapping subproblems with memoization or tabulation.", tags: ["Hard"] },
  { deckId: "d_dsa", front: "Quicksort average complexity?", back: "O(n log n) average, O(n^2) worst.", tags: [] },
  { deckId: "d_dsa", front: "Stack vs Queue?", back: "Stack = LIFO. Queue = FIFO.", tags: ["Easy"] },
  // Math
  { deckId: "d_math", front: "Derivative of sin(x)?", back: "cos(x)", tags: ["Easy"] },
  { deckId: "d_math", front: "Integral of 1/x?", back: "ln|x| + C", tags: [] },
  { deckId: "d_math", front: "What is Bayes' Theorem?", back: "P(A|B) = P(B|A) · P(A) / P(B)", tags: ["Important"] },
  { deckId: "d_math", front: "Determinant of a 2x2 matrix [[a,b],[c,d]]?", back: "ad − bc", tags: [] },
  // Interview
  { deckId: "d_interview", front: "Tell me about yourself — what to cover?", back: "Present → Past → Future. Current role, relevant past, why you're excited about this role.", tags: ["Important"] },
  { deckId: "d_interview", front: "STAR method?", back: "Situation, Task, Action, Result — structure for behavioral answers.", tags: ["Exam"] },
  { deckId: "d_interview", front: "How to answer 'biggest weakness'?", back: "Pick a real one, show self-awareness, describe concrete steps you're taking to improve.", tags: [] },
  // Python
  { deckId: "d_python", front: "Difference between list and tuple?", back: "Lists are mutable; tuples are immutable and hashable.", tags: ["Easy"] },
  { deckId: "d_python", front: "What is a list comprehension?", back: "Concise syntax: [expr for x in iterable if cond]", tags: [] },
  { deckId: "d_python", front: "What does GIL stand for?", back: "Global Interpreter Lock — allows only one thread to execute Python bytecode at a time.", tags: ["Important"] },
  { deckId: "d_python", front: "Shallow vs deep copy?", back: "Shallow copies references to nested objects; deep copy recursively duplicates them.", tags: [] },
  // Aptitude
  { deckId: "d_apt", front: "Average of 1..10?", back: "5.5", tags: ["Easy"] },
  { deckId: "d_apt", front: "If a train 120m crosses a pole in 6s, speed?", back: "20 m/s = 72 km/h", tags: [] },
  { deckId: "d_apt", front: "Compound interest formula?", back: "A = P(1 + r/n)^(nt)", tags: ["Important"] },
];

function buildSample() {
  const now = Date.now();
  const decks: Deck[] = SAMPLE_DECKS.map((d, i) => ({ ...d, createdAt: now - i * 86400000 }));
  const cards: Card[] = SAMPLE_CARDS.map((c) => ({
    id: uid(),
    deckId: c.deckId,
    front: c.front,
    back: c.back,
    tags: c.tags ?? [],
    difficulty: null,
    isFavorite: false,
    createdAt: now,
    reviewCount: 0,
  }));
  return { decks, cards };
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      decks: [],
      cards: [],
      quizHistory: [],
      achievements: [],
      activity: [],
      streak: { current: 0, longest: 0 },
      settings: { theme: "dark", dailyGoal: 20, notifications: true, userName: "Learner" },

      addDeck: (d) => {
        const id = "d_" + uid();
        set((s) => ({ decks: [...s.decks, { ...d, id, createdAt: Date.now() }] }));
        if (get().decks.length === 1) get().unlock("first_deck");
        return id;
      },
      updateDeck: (id, patch) =>
        set((s) => ({ decks: s.decks.map((d) => (d.id === id ? { ...d, ...patch } : d)) })),
      deleteDeck: (id) =>
        set((s) => ({
          decks: s.decks.filter((d) => d.id !== id),
          cards: s.cards.filter((c) => c.deckId !== id),
        })),

      addCard: (c) => {
        const id = "c_" + uid();
        set((s) => ({
          cards: [
            ...s.cards,
            {
              id,
              deckId: c.deckId,
              front: c.front,
              back: c.back,
              tags: c.tags ?? [],
              isFavorite: c.isFavorite ?? false,
              difficulty: c.difficulty ?? null,
              createdAt: Date.now(),
              reviewCount: 0,
            },
          ],
        }));
        return id;
      },
      updateCard: (id, patch) =>
        set((s) => ({ cards: s.cards.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
      deleteCard: (id) => set((s) => ({ cards: s.cards.filter((c) => c.id !== id) })),
      toggleFavorite: (id) =>
        set((s) => ({ cards: s.cards.map((c) => (c.id === id ? { ...c, isFavorite: !c.isFavorite } : c)) })),
      setDifficulty: (id, d) =>
        set((s) => ({ cards: s.cards.map((c) => (c.id === id ? { ...c, difficulty: d } : c)) })),
      reviewCard: (id) =>
        set((s) => ({
          cards: s.cards.map((c) =>
            c.id === id ? { ...c, lastReviewed: Date.now(), reviewCount: c.reviewCount + 1 } : c
          ),
        })),

      recordStudy: (cards, minutes) => {
        const today = todayStr();
        const s = get();
        const existing = s.activity.find((a) => a.date === today);
        const activity = existing
          ? s.activity.map((a) => (a.date === today ? { ...a, cards: a.cards + cards, minutes: a.minutes + minutes } : a))
          : [...s.activity, { date: today, cards, minutes }];

        // streak
        const last = s.streak.lastDate;
        let current = s.streak.current;
        if (last !== today) {
          const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
          current = last === yesterday ? current + 1 : 1;
        }
        const longest = Math.max(current, s.streak.longest);
        set({ activity, streak: { current, longest, lastDate: today } });

        if (current >= 7) get().unlock("streak_7");
        if (current >= 30) get().unlock("streak_30");
      },
      recordQuiz: (r) => {
        const result: QuizResult = { ...r, id: "q_" + uid(), takenAt: Date.now() };
        set((s) => ({ quizHistory: [result, ...s.quizHistory] }));
        get().unlock("first_quiz");
        if (r.score >= 90) get().unlock("quiz_master");
        if (get().quizHistory.length >= 10) get().unlock("quiz_veteran");
      },

      unlock: (id) =>
        set((s) => (s.achievements.includes(id) ? s : { achievements: [...s.achievements, id] })),

      setSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
      toggleTheme: () =>
        set((s) => ({ settings: { ...s.settings, theme: s.settings.theme === "dark" ? "light" : "dark" } })),

      importData: (data) => set((s) => ({ ...s, ...data })),
      exportData: () => JSON.stringify(get(), null, 2),
      resetAll: () =>
        set({
          decks: [], cards: [], quizHistory: [], achievements: [], activity: [],
          streak: { current: 0, longest: 0 },
        }),
      loadSampleData: () => {
        const { decks, cards } = buildSample();
        set({ decks, cards });
      },
    }),
    {
      name: "flashmaster-store-v2",
      version: 2,
      onRehydrateStorage: () => (state) => {
        if (state && state.decks.length === 0 && state.cards.length === 0) {
          state.loadSampleData();
        }
      },
    }
  )
);

// Selectors / helpers
export const deckStats = (deckId: string) => {
  const s = useStore.getState();
  const cards = s.cards.filter((c) => c.deckId === deckId);
  const mastered = cards.filter((c) => c.difficulty === "easy").length;
  const progress = cards.length ? Math.round((mastered / cards.length) * 100) : 0;
  return { total: cards.length, mastered, progress };
};

export const ACHIEVEMENTS: { id: string; name: string; desc: string; emoji: string }[] = [
  { id: "first_deck", name: "First Deck", desc: "Created your first deck", emoji: "📚" },
  { id: "first_quiz", name: "First Quiz", desc: "Completed your first quiz", emoji: "🎯" },
  { id: "streak_7", name: "7-Day Streak", desc: "Studied 7 days in a row", emoji: "🔥" },
  { id: "streak_30", name: "30-Day Streak", desc: "Studied 30 days in a row", emoji: "🏆" },
  { id: "quiz_master", name: "Quiz Master", desc: "Scored 90%+ on a quiz", emoji: "🧠" },
  { id: "quiz_veteran", name: "Flashcard Expert", desc: "Completed 10 quizzes", emoji: "⭐" },
];

export const TAG_OPTIONS = ["Easy", "Medium", "Hard", "Revision", "Important", "Exam"] as const;
