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
  { id: "d_aiml", name: "Basic English", description: "Simple words and grammar", emoji: "📘", color: "from-indigo-500 to-sky-500" },
  { id: "d_dsa", name: "Basic Maths", description: "Easy numbers and formulas", emoji: "🔢", color: "from-emerald-500 to-teal-500" },
  { id: "d_math", name: "Basic Science", description: "Everyday science facts", emoji: "🔬", color: "from-amber-500 to-orange-500" },
  { id: "d_interview", name: "General Knowledge", description: "Simple GK questions", emoji: "🌍", color: "from-rose-500 to-pink-500" },
  { id: "d_python", name: "Computer Basics", description: "Easy computer terms", emoji: "💻", color: "from-sky-500 to-cyan-500" },
  { id: "d_apt", name: "Hindi Basics", description: "Common Hindi meanings", emoji: "📗", color: "from-fuchsia-500 to-purple-500" },
];

type SampleCard = { deckId: string; front: string; back: string; tags?: string[] };
const SAMPLE_CARDS: SampleCard[] = [
  // Basic English
  { deckId: "d_aiml", front: "What is the opposite of hot?", back: "Cold", tags: ["Easy"] },
  { deckId: "d_aiml", front: "Which word is a noun: run or school?", back: "School", tags: ["Easy"] },
  { deckId: "d_aiml", front: "Fill in the blank: I ___ a student.", back: "am", tags: ["Easy"] },
  { deckId: "d_aiml", front: "What is the plural of book?", back: "Books", tags: ["Easy"] },
  // Basic Maths
  { deckId: "d_dsa", front: "What is 2 + 3?", back: "5", tags: ["Easy"] },
  { deckId: "d_dsa", front: "What is 10 - 4?", back: "6", tags: ["Easy"] },
  { deckId: "d_dsa", front: "What is 5 × 2?", back: "10", tags: ["Easy"] },
  { deckId: "d_dsa", front: "How many sides does a triangle have?", back: "3", tags: ["Easy"] },
  // Basic Science
  { deckId: "d_math", front: "Which planet do we live on?", back: "Earth", tags: ["Easy"] },
  { deckId: "d_math", front: "What do plants need to make food?", back: "Sunlight", tags: ["Easy"] },
  { deckId: "d_math", front: "What do we breathe in?", back: "Oxygen", tags: ["Easy"] },
  { deckId: "d_math", front: "Water freezes into what?", back: "Ice", tags: ["Easy"] },
  // General Knowledge
  { deckId: "d_interview", front: "How many days are in a week?", back: "7 days", tags: ["Easy"] },
  { deckId: "d_interview", front: "How many months are in a year?", back: "12 months", tags: ["Easy"] },
  { deckId: "d_interview", front: "What color is the sky on a clear day?", back: "Blue", tags: ["Easy"] },
  { deckId: "d_interview", front: "Which animal is called the king of the jungle?", back: "Lion", tags: ["Easy"] },
  // Computer Basics
  { deckId: "d_python", front: "What is used to type on a computer?", back: "Keyboard", tags: ["Easy"] },
  { deckId: "d_python", front: "What is used to move the pointer?", back: "Mouse", tags: ["Easy"] },
  { deckId: "d_python", front: "What does CPU stand for?", back: "Central Processing Unit", tags: ["Easy"] },
  { deckId: "d_python", front: "What do we use to see computer output?", back: "Monitor", tags: ["Easy"] },
  // Hindi Basics
  { deckId: "d_apt", front: "What is the Hindi meaning of water?", back: "Paani", tags: ["Easy"] },
  { deckId: "d_apt", front: "What is the Hindi meaning of book?", back: "Kitaab", tags: ["Easy"] },
  { deckId: "d_apt", front: "What is the Hindi meaning of school?", back: "Vidyalaya", tags: ["Easy"] },
  { deckId: "d_apt", front: "What is the Hindi meaning of friend?", back: "Dost", tags: ["Easy"] },
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
      name: "flashmaster-store-v4",
      version: 4,
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
