import { createFileRoute, Link } from "@tanstack/react-router";
import { useStore, ACHIEVEMENTS } from "@/lib/store";
import { PageHeader, PageShell } from "@/components/Layout";
import { Heart, Settings as SettingsIcon, Download, Upload, Shield, LogOut } from "lucide-react";
import { toast } from "sonner";
import { useRef, useState } from "react";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile — FlashMaster" }, { name: "description", content: "Your stats, achievements and learning data." }] }),
  component: Profile,
});

function Profile() {
  const { settings, cards, quizHistory, activity, achievements, exportData, importData } = useStore();
  const isAdmin = useStore((s) => s.isAdmin);
  const adminLogin = useStore((s) => s.adminLogin);
  const adminLogout = useStore((s) => s.adminLogout);
  const [adminKey, setAdminKey] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const totalMinutes = activity.reduce((a, b) => a + b.minutes, 0);
  const totalCardsStudied = cards.filter((c) => c.lastReviewed).length;

  function downloadJSON() {
    const blob = new Blob([exportData()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `flashmaster-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported JSON");
  }
  function downloadCSV() {
    const rows = [["deck", "front", "back", "tags", "favorite", "difficulty"]];
    const { decks } = useStore.getState();
    cards.forEach((c) => {
      const d = decks.find((x) => x.id === c.deckId)?.name ?? "";
      rows.push([d, c.front, c.back, c.tags.join("|"), String(c.isFavorite), c.difficulty ?? ""]);
    });
    const csv = rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `flashmaster-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported CSV");
  }
  function onImport(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        importData(data.state ?? data);
        toast.success("Data imported");
      } catch { toast.error("Invalid file"); }
    };
    reader.readAsText(f);
  }

  return (
    <PageShell>
      <PageHeader
        title="Profile"
        right={
          <Link to="/settings" className="w-10 h-10 rounded-2xl glass flex items-center justify-center">
            <SettingsIcon className="w-4 h-4" />
          </Link>
        }
      />

      <div className="glass rounded-3xl p-6 shadow-soft mb-4 text-center animate-fade-up">
        <div className="mx-auto w-20 h-20 rounded-full gradient-primary flex items-center justify-center text-3xl font-bold text-primary-foreground shadow-elegant mb-3">
          {settings.userName.slice(0, 1).toUpperCase()}
        </div>
        <h2 className="text-xl font-bold">{settings.userName}</h2>
        <p className="text-xs text-muted-foreground">Lifelong learner</p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <Stat label="Study hours" value={(totalMinutes / 60).toFixed(1)} />
        <Stat label="Cards created" value={cards.length} />
        <Stat label="Cards studied" value={totalCardsStudied} />
        <Stat label="Quizzes done" value={quizHistory.length} />
      </div>

      <Link to="/favorites" className="block glass rounded-3xl p-4 shadow-soft mb-6 hover:shadow-elegant transition-all">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-500/20 flex items-center justify-center">
            <Heart className="w-5 h-5 fill-rose-500 text-rose-500" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-sm">Favorites</p>
            <p className="text-xs text-muted-foreground">{cards.filter((c) => c.isFavorite).length} cards saved</p>
          </div>
        </div>
      </Link>

      <h3 className="text-lg font-bold mb-3">Achievements</h3>
      <div className="grid grid-cols-3 gap-2.5 mb-6">
        {ACHIEVEMENTS.map((a) => {
          const unlocked = achievements.includes(a.id);
          return (
            <div key={a.id} className={`rounded-2xl p-3 text-center shadow-soft transition-all ${unlocked ? "gradient-primary text-primary-foreground" : "glass opacity-60 grayscale"}`}>
              <div className="text-2xl mb-1">{a.emoji}</div>
              <p className="text-[11px] font-bold leading-tight">{a.name}</p>
              <p className="text-[9px] mt-0.5 opacity-80 leading-tight">{a.desc}</p>
            </div>
          );
        })}
      </div>

      <h3 className="text-lg font-bold mb-3">Import / Export</h3>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <button onClick={downloadJSON} className="glass rounded-2xl p-3 inline-flex items-center justify-center gap-2 font-semibold text-sm">
          <Download className="w-4 h-4" /> JSON
        </button>
        <button onClick={downloadCSV} className="glass rounded-2xl p-3 inline-flex items-center justify-center gap-2 font-semibold text-sm">
          <Download className="w-4 h-4" /> CSV
        </button>
      </div>
      <button onClick={() => fileRef.current?.click()} className="w-full glass rounded-2xl p-3 inline-flex items-center justify-center gap-2 font-semibold text-sm">
        <Upload className="w-4 h-4" /> Import JSON
      </button>
      <input ref={fileRef} type="file" accept="application/json" onChange={onImport} className="hidden" />

      <h3 className="text-lg font-bold mt-6 mb-3 flex items-center gap-2">
        <Shield className="w-4 h-4" /> Admin access
      </h3>
      {isAdmin ? (
        <div className="glass rounded-2xl p-4 shadow-soft flex items-center justify-between">
          <div>
            <p className="font-bold text-sm text-emerald-600">Admin mode active</p>
            <p className="text-xs text-muted-foreground">You can add, edit and delete cards.</p>
          </div>
          <button
            onClick={() => { adminLogout(); toast.success("Logged out of admin"); }}
            className="inline-flex items-center gap-1.5 px-3 h-9 rounded-2xl glass text-sm font-semibold"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (adminLogin(adminKey.trim())) {
              toast.success("Admin unlocked");
              setAdminKey("");
            } else {
              toast.error("Invalid admin key");
            }
          }}
          className="glass rounded-2xl p-4 shadow-soft space-y-3"
        >
          <p className="text-xs text-muted-foreground">Enter the admin key to manage cards.</p>
          <input
            type="password"
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
            placeholder="Admin key"
            className="w-full p-3 rounded-2xl border border-border bg-background text-sm focus:border-primary outline-none"
          />
          <button type="submit" className="w-full h-11 rounded-2xl gradient-primary text-primary-foreground font-bold text-sm shadow-elegant">
            Unlock admin
          </button>
        </form>
      )}
    </PageShell>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="glass rounded-2xl p-4 shadow-soft">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</p>
    </div>
  );
}
