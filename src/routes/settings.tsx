import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { PageHeader, PageShell } from "@/components/Layout";
import { Bell, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — FlashMaster" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { settings, setSettings, resetAll, loadSampleData } = useStore();

  return (
    <PageShell>
      <PageHeader title="Settings" back="/profile" />

      <Section title="Profile">
        <Row label="Display name">
          <input value={settings.userName} onChange={(e) => setSettings({ userName: e.target.value })}
            className="bg-transparent text-right font-semibold outline-none w-40" />
        </Row>
      </Section>

      <Section title="Appearance">
        <Row label="Theme">
          <button onClick={toggleTheme} className="inline-flex items-center gap-2 px-3 h-9 rounded-2xl gradient-primary text-primary-foreground text-sm font-semibold">
            {settings.theme === "dark" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            {settings.theme === "dark" ? "Dark" : "Light"}
          </button>
        </Row>
      </Section>

      <Section title="Study">
        <Row label="Daily goal (cards)">
          <input type="number" min={5} max={200} value={settings.dailyGoal}
            onChange={(e) => setSettings({ dailyGoal: Math.max(5, Number(e.target.value) || 5) })}
            className="bg-transparent text-right font-semibold outline-none w-20" />
        </Row>
        <Row label={<><Bell className="w-4 h-4 inline mr-1" />Notifications</>}>
          <button onClick={() => setSettings({ notifications: !settings.notifications })}
            className={`w-12 h-7 rounded-full transition-colors relative ${settings.notifications ? "bg-primary" : "bg-muted"}`}>
            <span className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${settings.notifications ? "left-6" : "left-1"}`} />
          </button>
        </Row>
      </Section>

      <Section title="Data">
        <button onClick={() => { loadSampleData(); toast.success("Sample data loaded"); }} className="w-full glass rounded-2xl p-4 text-sm font-semibold">
          Reload sample decks
        </button>
        <button onClick={() => { if (confirm("Delete ALL data?")) { resetAll(); toast.success("All data reset"); } }}
          className="mt-2 w-full bg-destructive/10 text-destructive rounded-2xl p-4 text-sm font-semibold inline-flex items-center justify-center gap-2">
          <Trash2 className="w-4 h-4" /> Reset all data
        </button>
      </Section>

      <p className="text-center text-xs text-muted-foreground mt-8">FlashMaster · v1.0</p>
    </PageShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2 px-1">{title}</h3>
      <div className="glass rounded-3xl shadow-soft overflow-hidden">{children}</div>
    </div>
  );
}
function Row({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between p-4 border-b border-border last:border-0">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </div>
  );
}
