import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useStore, TAG_OPTIONS, Card } from "@/lib/store";
import { PageHeader, PageShell, EmptyState } from "@/components/Layout";
import { Heart, Trash2, Plus, Play, Trophy, Edit3, X, Lock } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/decks/$deckId/")({
  head: () => ({ meta: [{ title: "Deck — FlashMaster" }] }),
  component: DeckDetail,
});

function DeckDetail() {
  const { deckId } = Route.useParams();
  const navigate = useNavigate();
  const decks = useStore((s) => s.decks);
  const allCards = useStore((s) => s.cards);
  const deleteDeck = useStore((s) => s.deleteDeck);
  const deleteCard = useStore((s) => s.deleteCard);
  const toggleFavorite = useStore((s) => s.toggleFavorite);
  const isAdmin = useStore((s) => s.isAdmin);
  const deck = decks.find((d) => d.id === deckId);
  const cards = allCards.filter((c) => c.deckId === deckId);
  const [editing, setEditing] = useState<Card | null>(null);
  const [adding, setAdding] = useState(false);

  if (!deck) {
    return (
      <PageShell>
        <PageHeader title="Deck not found" back="/decks" />
        <EmptyState emoji="🔍" title="Not found" description="This deck doesn't exist." />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        title={deck.name}
        subtitle={`${cards.length} cards · ${deck.description}`}
        back="/decks"
        right={
          isAdmin ? (
            <button
              onClick={() => {
                if (confirm("Delete this deck and all its cards?")) {
                  deleteDeck(deck.id);
                  toast.success("Deck deleted");
                  navigate({ to: "/decks" });
                }
              }}
              className="w-10 h-10 rounded-2xl glass flex items-center justify-center text-destructive"
              aria-label="Delete deck"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          ) : null
        }
      />

      <div className={`rounded-3xl bg-gradient-to-br ${deck.color} p-5 text-white shadow-elegant mb-4 relative overflow-hidden`}>
        <div className="absolute -right-4 -bottom-4 text-[120px] opacity-20 leading-none">{deck.emoji}</div>
        <div className="grid grid-cols-2 gap-3 relative">
          <Link
            to="/decks/$deckId/study"
            params={{ deckId: deck.id }}
            className="rounded-2xl bg-white/20 backdrop-blur p-4 hover:bg-white/30 transition-colors"
          >
            <Play className="w-5 h-5 mb-2" />
            <p className="font-bold">Study</p>
            <p className="text-xs opacity-80">Flip & learn</p>
          </Link>
          <Link
            to="/decks/$deckId/quiz"
            params={{ deckId: deck.id }}
            className="rounded-2xl bg-white/20 backdrop-blur p-4 hover:bg-white/30 transition-colors"
          >
            <Trophy className="w-5 h-5 mb-2" />
            <p className="font-bold">Quiz</p>
            <p className="text-xs opacity-80">Test yourself</p>
          </Link>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold">Cards ({cards.length})</h3>
        {isAdmin ? (
          <button
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1.5 px-3 h-9 rounded-2xl gradient-primary text-primary-foreground text-sm font-semibold shadow-soft"
          >
            <Plus className="w-4 h-4" /> Add card
          </button>
        ) : (
          <Link to="/profile" className="inline-flex items-center gap-1.5 px-3 h-9 rounded-2xl glass text-xs font-semibold text-muted-foreground">
            <Lock className="w-3.5 h-3.5" /> Admin only
          </Link>
        )}
      </div>

      {cards.length === 0 ? (
        <EmptyState
          emoji="📝"
          title="No cards yet"
          description={isAdmin ? "Add your first card to start studying." : "Only an admin can add cards."}
          action={
            isAdmin ? (
              <button onClick={() => setAdding(true)} className="rounded-2xl gradient-primary px-5 py-2.5 text-primary-foreground text-sm font-semibold shadow-elegant">
                Add card
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {cards.map((c, i) => (
            <div key={c.id} className="glass rounded-2xl p-4 shadow-soft animate-fade-up" style={{ animationDelay: `${i * 30}ms` }}>
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm leading-snug">{c.front}</p>
                  <p className="text-[11px] text-muted-foreground mt-1 italic">Answer hidden — open Study to reveal</p>
                  {c.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {c.tags.map((t) => (
                        <span key={t} className="px-2 py-0.5 rounded-full bg-secondary text-[10px] font-semibold">{t}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <button onClick={() => toggleFavorite(c.id)} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-secondary">
                    <Heart className={`w-4 h-4 ${c.isFavorite ? "fill-rose-500 text-rose-500" : ""}`} />
                  </button>
                  {isAdmin && (
                    <>
                      <button onClick={() => setEditing(c)} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-secondary">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button onClick={() => { deleteCard(c.id); toast.success("Card deleted"); }} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-secondary text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {(adding || editing) && (
        <CardModal
          card={editing}
          deckId={deck.id}
          onClose={() => { setAdding(false); setEditing(null); }}
        />
      )}
    </PageShell>
  );
}

function CardModal({ card, deckId, onClose }: { card: Card | null; deckId: string; onClose: () => void }) {
  const addCard = useStore((s) => s.addCard);
  const updateCard = useStore((s) => s.updateCard);
  const [front, setFront] = useState(card?.front ?? "");
  const [back, setBack] = useState(card?.back ?? "");
  const [tags, setTags] = useState<string[]>(card?.tags ?? []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!front.trim() || !back.trim()) return;
    if (card) {
      updateCard(card.id, { front: front.trim(), back: back.trim(), tags });
      toast.success("Card updated");
    } else {
      addCard({ deckId, front: front.trim(), back: back.trim(), tags });
      toast.success("Card added");
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-up" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-card rounded-t-3xl sm:rounded-3xl shadow-elegant animate-pop-in flex flex-col max-h-[88vh] sm:max-h-[85vh]"
      >
        <div className="flex items-center justify-between p-5 pb-3 border-b border-border/50 shrink-0">
          <h3 className="text-lg font-bold">{card ? "Edit card" : "New card"}</h3>
          <button onClick={onClose} className="w-9 h-9 rounded-xl hover:bg-secondary flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={submit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <label className="block">
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1.5 block">Question (front)</span>
              <textarea value={front} onChange={(e) => setFront(e.target.value)} rows={2} className="w-full p-3 rounded-2xl border border-border bg-background text-sm focus:border-primary outline-none" autoFocus />
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1.5 block">Answer (back)</span>
              <textarea value={back} onChange={(e) => setBack(e.target.value)} rows={3} className="w-full p-3 rounded-2xl border border-border bg-background text-sm focus:border-primary outline-none" />
            </label>
            <div>
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1.5 block">Tags</span>
              <div className="flex flex-wrap gap-1.5">
                {TAG_OPTIONS.map((t) => {
                  const on = tags.includes(t);
                  return (
                    <button type="button" key={t} onClick={() => setTags(on ? tags.filter((x) => x !== t) : [...tags, t])}
                      className={`px-3 h-8 rounded-full text-xs font-semibold transition-all ${on ? "gradient-primary text-primary-foreground shadow-soft" : "bg-secondary text-secondary-foreground"}`}>
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="p-5 pt-3 border-t border-border/50 shrink-0 bg-card rounded-b-3xl">
            <button type="submit" className="w-full h-12 rounded-2xl gradient-primary text-primary-foreground font-bold shadow-elegant">
              {card ? "Save changes" : "Add card"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
