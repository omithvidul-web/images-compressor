import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  type AdLink,
  getLinks,
  getSettings,
  saveLinks,
  saveSettings,
} from "@/lib/ads";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin · Image Compressor" }, { name: "robots", content: "noindex" }] }),
  component: AdminPage,
});

const SESSION_KEY = "ic.admin.session";

function AdminPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    setAuthed(sessionStorage.getItem(SESSION_KEY) === "1");
    setReady(true);
  }, []);

  const signOut = () => {
    sessionStorage.removeItem(SESSION_KEY);
    router.navigate({ to: "/" });
  };

  if (!ready) return <div className="min-h-screen bg-background" />;

  if (!authed) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
          <Link to="/" className="mb-8 text-xs text-muted-foreground hover:text-foreground">
            ← Back to site
          </Link>
          <div className="glass-card brand-glow rounded-3xl p-8">
            <div className="brand-gradient mb-5 h-1 w-12 rounded-full" />
            <p className="mb-4 text-sm text-muted-foreground">Sign in to continue.</p>
            <button
              onClick={() => router.navigate({ to: "/auth" })}
              className="brand-gradient w-full rounded-xl px-4 py-3 text-sm font-semibold text-white shadow"
            >
              Go to sign in
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <Dashboard onLogout={signOut} />;
}

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [links, setLinks] = useState<AdLink[]>([]);
  const [settings, setSettings] = useState(getSettings());
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");

  useEffect(() => {
    setLinks(getLinks());
  }, []);

  const persistLinks = (next: AdLink[]) => {
    setLinks(next);
    saveLinks(next);
  };

  const persistSettings = (next: typeof settings) => {
    setSettings(next);
    saveSettings(next);
  };

  const addLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    const next: AdLink[] = [
      ...links,
      { id: crypto.randomUUID(), label: label.trim() || "Adsterra link", url: url.trim(), active: true },
    ];
    persistLinks(next);
    setLabel("");
    setUrl("");
  };

  const updateLink = (id: string, patch: Partial<AdLink>) => {
    persistLinks(links.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  };

  const removeLink = (id: string) => persistLinks(links.filter((l) => l.id !== id));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="mx-auto flex max-w-4xl items-center justify-between px-5 py-4">
        <Link to="/" className="text-sm font-semibold">← Image Compressor</Link>
        <button onClick={onLogout} className="text-xs text-muted-foreground hover:text-foreground">
          Sign out
        </button>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-5 pb-20">
        <div>
          <h1 className="font-[Space_Grotesk] text-3xl font-bold">Admin</h1>
        </div>

        <section className="glass-card rounded-2xl p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Global settings
          </h2>
          <div className="mt-4 space-y-4">
            <Toggle
              label="Ads enabled"
              hint="When off, downloads skip the redirect entirely."
              checked={settings.enabled}
              onChange={(v) => persistSettings({ ...settings, enabled: v })}
            />
            <div>
              <div className="text-sm font-medium">Redirect behavior</div>
              <div className="mt-2 inline-flex rounded-full bg-secondary p-1 text-xs font-semibold">
                {(["new-tab", "same-tab"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => persistSettings({ ...settings, redirectMode: mode })}
                    className={`rounded-full px-4 py-1.5 transition ${
                      settings.redirectMode === mode ? "brand-gradient text-white" : "text-muted-foreground"
                    }`}
                  >
                    {mode === "new-tab" ? "Open ad in new tab" : "Same tab"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="glass-card rounded-2xl p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Add Adsterra link
          </h2>
          <form onSubmit={addLink} className="mt-4 grid gap-3 sm:grid-cols-[1fr_2fr_auto]">
            <input
              placeholder="Label (optional)"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/60"
            />
            <input
              placeholder="https://…"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/60"
            />
            <button className="brand-gradient rounded-xl px-4 py-2.5 text-sm font-semibold text-white">
              Add
            </button>
          </form>
        </section>

        <section className="glass-card rounded-2xl p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Links ({links.length})
          </h2>
          <div className="mt-4 space-y-2">
            {links.length === 0 && (
              <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                No links yet. Add one above.
              </div>
            )}
            {links.map((l) => (
              <div key={l.id} className="rounded-xl border border-border bg-card/60 p-3">
                <div className="grid gap-2 sm:grid-cols-[1fr_2fr_auto_auto] sm:items-center">
                  <input
                    value={l.label}
                    onChange={(e) => updateLink(l.id, { label: e.target.value })}
                    className="rounded-lg bg-transparent px-2 py-1.5 text-sm font-medium outline-none focus:bg-secondary"
                  />
                  <input
                    value={l.url}
                    onChange={(e) => updateLink(l.id, { url: e.target.value })}
                    className="truncate rounded-lg bg-transparent px-2 py-1.5 text-xs text-muted-foreground outline-none focus:bg-secondary"
                  />
                  <Toggle
                    compact
                    checked={l.active}
                    onChange={(v) => updateLink(l.id, { active: v })}
                  />
                  <button
                    onClick={() => removeLink(l.id)}
                    className="rounded-lg px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
  compact,
}: {
  label?: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  compact?: boolean;
}) {
  return (
    <label className={`flex items-center ${compact ? "justify-center" : "justify-between"} gap-3 cursor-pointer`}>
      {label && (
        <div>
          <div className="text-sm font-medium">{label}</div>
          {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
        </div>
      )}
      <span
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
          checked ? "brand-gradient" : "bg-secondary"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </span>
    </label>
  );
}
