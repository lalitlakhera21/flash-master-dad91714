import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { PageHeader, PageShell } from "@/components/Layout";
import { toast } from "sonner";

export const Route = createFileRoute("/decks/new")({
  head: () => ({ meta: [{ title: "New Deck — FlashMaster" }] }),
  component: NewDeck,
});

const EMOJIS = ["📚", "🧠", "🧮", "📐", "🎯", "🐍", "🧩", "⚛️", "🔬", "🌍", "💡", "🚀", "📝", "🎨", "🎵", "💻"];
const COLORS = [
  "from-indigo-500 to-violet-500",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
  "from-rose-500 to-pink-500",
  "from-sky-500 to-cyan-500",
  "from-fuchsia-500 to-purple-500",
  "from-lime-500 to-green-500",
  "from-red-500 to-rose-500",
];

function NewDeck() {
  const navigate = useNavigate();
  const addDeck = useStore((s) => s.addDeck);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [emoji, setEmoji] = useState(EMOJIS[0]);
  const [color, setColor] = useState(COLORS[0]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const id = addDeck({ name: name.trim(), description: description.trim(), emoji, color });
    toast.success("Deck created");
    navigate({ to: "/decks/$deckId", params: { deckId: id } });
  }

  return (
    <PageShell>
      <PageHeader title="New Deck" back="/decks" />
      <form onSubmit={submit} className="space-y-5 animate-fade-up">
        <div className="glass rounded-3xl p-5 shadow-soft text-center">
          <div className={`mx-auto w-20 h-20 rounded-3xl bg-gradient-to-br ${color} flex items-center justify-center text-4xl shadow-elegant mb-4`}>{emoji}</div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Preview</p>
        </div>

        <Field label="Deck name">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Spanish Vocabulary" className="input" autoFocus />
        </Field>
        <Field label="Description (optional)">
          <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="A short description" className="input" />
        </Field>

        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">Emoji</p>
          <div className="grid grid-cols-8 gap-2">
            {EMOJIS.map((e) => (
              <button type="button" key={e} onClick={() => setEmoji(e)}
                className={`aspect-square rounded-xl text-xl flex items-center justify-center transition-all ${emoji === e ? "gradient-primary scale-110 shadow-glow" : "glass hover:scale-105"}`}>{e}</button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">Color</p>
          <div className="grid grid-cols-8 gap-2">
            {COLORS.map((c) => (
              <button type="button" key={c} onClick={() => setColor(c)}
                className={`aspect-square rounded-xl bg-gradient-to-br ${c} transition-all ${color === c ? "ring-2 ring-foreground ring-offset-2 ring-offset-background scale-110" : "hover:scale-105"}`} />
            ))}
          </div>
        </div>

        <button type="submit" disabled={!name.trim()} className="w-full h-12 rounded-2xl gradient-primary text-primary-foreground font-bold shadow-elegant disabled:opacity-50 hover:scale-[1.02] transition-transform">
          Create deck
        </button>
      </form>

      <style>{`.input{width:100%;height:48px;padding:0 16px;border-radius:16px;background:color-mix(in oklab,var(--card) 70%,transparent);backdrop-filter:blur(12px);border:1px solid var(--border);outline:none;font-size:15px}.input:focus{border-color:var(--primary);box-shadow:0 0 0 3px color-mix(in oklab,var(--primary) 20%,transparent)}`}</style>
    </PageShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}
