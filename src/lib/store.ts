import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Difficulty = "easy" | "medium" | "hard" | null;
export type CardStatus = "new" | "learning" | "revision" | "mastered";
export type AttemptResult = "correct" | "partial" | "wrong";

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
  attempts?: number;
  correct?: number;
  wrong?: number;
  partial?: number;
  nextReview?: number;
  status?: CardStatus;
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
  xp: number;

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
  recordAttempt: (id: string, result: AttemptResult) => number; // returns xp gained

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
  { id: "d_aiml", name: "C Programming", description: "Basics of C language", emoji: "🔡", color: "from-indigo-500 to-sky-500" },
  { id: "d_dsa", name: "Python Basics", description: "Beginner Python concepts", emoji: "🐍", color: "from-emerald-500 to-teal-500" },
  { id: "d_math", name: "HTML Basics", description: "Web page structure", emoji: "🌐", color: "from-amber-500 to-orange-500" },
  { id: "d_interview", name: "CSS Basics", description: "Styling web pages", emoji: "🎨", color: "from-rose-500 to-pink-500" },
  { id: "d_python", name: "Computer Fundamentals", description: "Intro to computers", emoji: "💻", color: "from-sky-500 to-cyan-500" },
  { id: "d_apt", name: "DBMS Basics", description: "Database fundamentals", emoji: "🗄️", color: "from-fuchsia-500 to-purple-500" },
];

type SampleCard = { deckId: string; front: string; back: string; tags?: string[] };
const SAMPLE_CARDS: SampleCard[] = [
  // C Programming
  { deckId: "d_aiml", front: "Who developed the C language?", back: "Dennis Ritchie (1972, Bell Labs)", tags: ["Easy"] },
  { deckId: "d_aiml", front: "Which function is the entry point of a C program?", back: "main()", tags: ["Easy"] },
  { deckId: "d_aiml", front: "Which header file is needed for printf()?", back: "stdio.h", tags: ["Easy"] },
  { deckId: "d_aiml", front: "What symbol ends every C statement?", back: "Semicolon ( ; )", tags: ["Easy"] },
  { deckId: "d_aiml", front: "What is the format specifier for an integer?", back: "%d", tags: ["Easy"] },
  { deckId: "d_aiml", front: "Which keyword is used to declare a constant?", back: "const", tags: ["Easy"] },
  // Python Basics
  { deckId: "d_dsa", front: "Who created Python?", back: "Guido van Rossum (1991)", tags: ["Easy"] },
  { deckId: "d_dsa", front: "How do you print 'Hello' in Python?", back: "print('Hello')", tags: ["Easy"] },
  { deckId: "d_dsa", front: "Which symbol starts a comment in Python?", back: "# (hash)", tags: ["Easy"] },
  { deckId: "d_dsa", front: "What data type is 3.14 in Python?", back: "float", tags: ["Easy"] },
  { deckId: "d_dsa", front: "Which keyword defines a function in Python?", back: "def", tags: ["Easy"] },
  { deckId: "d_dsa", front: "What does len('hello') return?", back: "5", tags: ["Easy"] },
  // HTML Basics
  { deckId: "d_math", front: "What does HTML stand for?", back: "HyperText Markup Language", tags: ["Easy"] },
  { deckId: "d_math", front: "Which tag creates the largest heading?", back: "<h1>", tags: ["Easy"] },
  { deckId: "d_math", front: "Which tag is used to insert an image?", back: "<img>", tags: ["Easy"] },
  { deckId: "d_math", front: "Which tag creates a hyperlink?", back: "<a> (anchor tag)", tags: ["Easy"] },
  { deckId: "d_math", front: "What is the correct HTML5 doctype?", back: "<!DOCTYPE html>", tags: ["Easy"] },
  { deckId: "d_math", front: "Which tag is used for line break?", back: "<br>", tags: ["Easy"] },
  // CSS Basics
  { deckId: "d_interview", front: "What does CSS stand for?", back: "Cascading Style Sheets", tags: ["Easy"] },
  { deckId: "d_interview", front: "Which property changes text color?", back: "color", tags: ["Easy"] },
  { deckId: "d_interview", front: "Which property sets background color?", back: "background-color", tags: ["Easy"] },
  { deckId: "d_interview", front: "Which symbol selects an id in CSS?", back: "# (hash)", tags: ["Easy"] },
  { deckId: "d_interview", front: "Which symbol selects a class in CSS?", back: ". (dot)", tags: ["Easy"] },
  { deckId: "d_interview", front: "Which property makes text bold?", back: "font-weight: bold", tags: ["Easy"] },
  // Computer Fundamentals
  { deckId: "d_python", front: "What does CPU stand for?", back: "Central Processing Unit", tags: ["Easy"] },
  { deckId: "d_python", front: "What does RAM stand for?", back: "Random Access Memory", tags: ["Easy"] },
  { deckId: "d_python", front: "Which is volatile memory: RAM or ROM?", back: "RAM", tags: ["Easy"] },
  { deckId: "d_python", front: "1 Byte = how many bits?", back: "8 bits", tags: ["Easy"] },
  { deckId: "d_python", front: "What does OS stand for?", back: "Operating System", tags: ["Easy"] },
  { deckId: "d_python", front: "Give one example of an input device.", back: "Keyboard / Mouse", tags: ["Easy"] },
  // DBMS Basics
  { deckId: "d_apt", front: "What does DBMS stand for?", back: "Database Management System", tags: ["Easy"] },
  { deckId: "d_apt", front: "What does SQL stand for?", back: "Structured Query Language", tags: ["Easy"] },
  { deckId: "d_apt", front: "Which SQL command fetches data?", back: "SELECT", tags: ["Easy"] },
  { deckId: "d_apt", front: "Which key uniquely identifies a row?", back: "Primary Key", tags: ["Easy"] },
  { deckId: "d_apt", front: "Which command removes a table?", back: "DROP TABLE", tags: ["Easy"] },
  { deckId: "d_apt", front: "Which command adds a new row?", back: "INSERT INTO", tags: ["Easy"] },
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

const initialSample = buildSample();

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      decks: initialSample.decks,
      cards: initialSample.cards,
      quizHistory: [],
      achievements: [],
      activity: [],
      streak: { current: 0, longest: 0 },
      xp: 0,
      settings: { theme: "light", dailyGoal: 20, notifications: true, userName: "Learner" },

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

      recordAttempt: (id, result) => {
        const day = 86400000;
        const intervals: Record<AttemptResult | "mastered", number> = {
          wrong: 1 * day,
          partial: 3 * day,
          correct: 7 * day,
          mastered: 14 * day,
        };
        const xpGain = result === "correct" ? 10 : result === "partial" ? 5 : 0;
        let nextStatus = "learning" as CardStatus;
        set((s) => ({
          xp: s.xp + xpGain,
          cards: s.cards.map((c) => {
            if (c.id !== id) return c;
            const attempts = (c.attempts ?? 0) + 1;
            const correct = (c.correct ?? 0) + (result === "correct" ? 1 : 0);
            const wrong = (c.wrong ?? 0) + (result === "wrong" ? 1 : 0);
            const partial = (c.partial ?? 0) + (result === "partial" ? 1 : 0);
            const accuracy = correct / attempts;
            let status: CardStatus = "learning";
            if (result === "wrong") status = "revision";
            else if (correct >= 3 && accuracy >= 0.8) status = "mastered";
            else if (result === "correct") status = "learning";
            nextStatus = status;
            const interval = status === "mastered" ? intervals.mastered : intervals[result];
            const difficulty: Difficulty =
              status === "mastered" ? "easy" : result === "wrong" ? "hard" : "medium";
            return {
              ...c,
              attempts,
              correct,
              wrong,
              partial,
              status,
              difficulty,
              lastReviewed: Date.now(),
              reviewCount: c.reviewCount + 1,
              nextReview: Date.now() + interval,
            };
          }),
        }));
        if (nextStatus === "mastered") get().unlock("first_mastered");
        return xpGain;
      },


      recordStudy: (cards, minutes) => {
        const today = todayStr();
        const s = get();
        const existing = s.activity.find((a) => a.date === today);
        const activity = existing
          ? s.activity.map((a) => (a.date === today ? { ...a, cards: a.cards + cards, minutes: a.minutes + minutes } : a))
          : [...s.activity, { date: today, cards, minutes }];

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
      toggleTheme: () => {
        /* dark mode removed — light only */
      },

      importData: (data) => set((s) => ({ ...s, ...data })),
      exportData: () => JSON.stringify(get(), null, 2),
      resetAll: () => {
        const fresh = buildSample();
        set({
          decks: fresh.decks,
          cards: fresh.cards,
          quizHistory: [],
          achievements: [],
          activity: [],
          streak: { current: 0, longest: 0 },
        });
      },
      loadSampleData: () => {
        const { decks, cards } = buildSample();
        set({ decks, cards });
      },
    }),
    {
      name: "flashmaster-store-v5",
      version: 5,
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
