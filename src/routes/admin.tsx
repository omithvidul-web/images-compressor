import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  type AdLink,
  getLinks,
  getSettings,
  saveLinks,
  saveSettings,
} from "@/lib/ads";
import {
  DEFAULT_PAGES,
  getAdSense,
  getAdsterra,
  getAllPages,
  getMenu,
  saveAdSense,
  saveAdsterra,
  saveMenu,
  savePage,
  type AdSenseUnit,
  type AdsterraUnit,
  type MenuItem,
  type PageContent,
  type PageKey,
} from "@/lib/cms";
import {
  getAdmobConfig,
  updateAdmobConfig,
  verifyAdmobAdminSecret,
  type AdmobConfig,
} from "@/lib/admob.functions";

const ADMOB_SECRET_KEY = "ic.admob.secret";

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

type Tab = "adsterra-links" | "menu" | "pages" | "adsense" | "adsterra" | "admob";

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>("menu");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
        <Link to="/" className="text-sm font-semibold">← Image Compressor</Link>
        <button onClick={onLogout} className="text-xs text-muted-foreground hover:text-foreground">
          Sign out
        </button>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-5 pb-20">
        <div>
          <h1 className="font-[Space_Grotesk] text-3xl font-bold">Admin Control Center</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage navigation, page content, and monetization.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {(
            [
              ["menu", "Navigation"],
              ["pages", "Pages"],
              ["adsense", "AdSense"],
              ["adsterra", "Adsterra"],
              ["adsterra-links", "Redirect Links"],
              ["admob", "Manage AdMob IDs"],
            ] as [Tab, string][]
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                tab === id
                  ? "brand-gradient text-white shadow"
                  : "border border-border bg-card/70 text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "menu" && <MenuManager />}
        {tab === "pages" && <PagesManager />}
        {tab === "adsense" && <AdSenseManager />}
        {tab === "adsterra" && <AdsterraManager />}
        {tab === "adsterra-links" && <LegacyAdLinks />}
        {tab === "admob" && <AdmobManager />}
      </main>
    </div>
  );
}

// ------- AdMob Manager (Android app config) -------

const ADMOB_FIELDS: { key: keyof AdmobConfig; label: string; placeholder: string }[] = [
  { key: "publisher_id", label: "AdMob Publisher ID", placeholder: "pub-XXXXXXXXXXXXXXXX" },
  { key: "app_id", label: "AdMob App ID", placeholder: "ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX" },
  { key: "app_open_id", label: "App Open Ad ID", placeholder: "ca-app-pub-…/…" },
  { key: "banner_id", label: "Banner Ad ID", placeholder: "ca-app-pub-…/…" },
  { key: "interstitial_id", label: "Interstitial Ad ID", placeholder: "ca-app-pub-…/…" },
  { key: "rewarded_id", label: "Rewarded Ad ID", placeholder: "ca-app-pub-…/…" },
  { key: "rewarded_interstitial_id", label: "Rewarded Interstitial Ad ID", placeholder: "ca-app-pub-…/…" },
  { key: "native_id", label: "Native Advanced Ad ID", placeholder: "ca-app-pub-…/…" },
];

function AdmobManager() {
  const fetchConfig = useServerFn(getAdmobConfig);
  const saveConfig = useServerFn(updateAdmobConfig);
  const verifySecret = useServerFn(verifyAdmobAdminSecret);

  const [secret, setSecret] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [config, setConfig] = useState<AdmobConfig | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchConfig().then((c) => setConfig(c)).catch(() => setStatus("Could not load config."));
    const cached = sessionStorage.getItem(ADMOB_SECRET_KEY);
    if (cached) {
      setSecret(cached);
      verifySecret({ data: { secret: cached } })
        .then((r) => setUnlocked(r.ok))
        .catch(() => {});
    }
  }, [fetchConfig, verifySecret]);

  const unlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setStatus(null);
    try {
      const { ok } = await verifySecret({ data: { secret } });
      if (!ok) {
        setStatus("Incorrect admin secret.");
        return;
      }
      sessionStorage.setItem(ADMOB_SECRET_KEY, secret);
      setUnlocked(true);
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    if (!config) return;
    setBusy(true);
    setStatus(null);
    try {
      const next = await saveConfig({ data: { secret, config } });
      setConfig(next);
      setStatus("Saved.");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setBusy(false);
    }
  };

  if (!unlocked) {
    return (
      <Section title="Unlock AdMob settings">
        <p className="mb-4 text-sm text-muted-foreground">
          Writes to the AdMob config are protected by a server-side admin secret
          (<code className="rounded bg-secondary px-1">ADMOB_ADMIN_SECRET</code>).
          Enter it once per session.
        </p>
        <form onSubmit={unlock} className="flex flex-col gap-3 sm:flex-row">
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="Admin secret"
            className="flex-1 rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/60"
          />
          <button
            disabled={busy || !secret}
            className="brand-gradient rounded-xl px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {busy ? "Checking…" : "Unlock"}
          </button>
        </form>
        {status && <p className="mt-3 text-sm text-destructive">{status}</p>}
      </Section>
    );
  }

  if (!config) {
    return <Section title="Manage AdMob IDs"><EmptyHint text="Loading…" /></Section>;
  }

  return (
    <Section title="Manage AdMob IDs">
      <p className="mb-4 text-xs text-muted-foreground">
        These IDs are served to the Android app from{" "}
        <code className="rounded bg-secondary px-1">/api/public/admob-config</code>.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {ADMOB_FIELDS.map((f) => (
          <Field key={f.key} label={f.label}>
            <Input
              value={(config[f.key] as string) ?? ""}
              placeholder={f.placeholder}
              onChange={(v) => setConfig({ ...config, [f.key]: v })}
            />
          </Field>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          <SmallToggle
            checked={config.is_active}
            onChange={(v) => setConfig({ ...config, is_active: v })}
          />
          <span>Active (served to the app)</span>
        </label>
        <button
          onClick={save}
          disabled={busy}
          className="brand-gradient ml-auto rounded-xl px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save changes"}
        </button>
      </div>
      {status && <p className="mt-3 text-sm text-muted-foreground">{status}</p>}
    </Section>
  );
}

// ------- Menu Manager -------

function MenuManager() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [title, setTitle] = useState("");
  const [route, setRoute] = useState("");

  useEffect(() => setItems(getMenu()), []);

  const persist = (next: MenuItem[]) => {
    const ordered = next.map((it, i) => ({ ...it, order: i }));
    setItems(ordered);
    saveMenu(ordered);
  };

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !route.trim()) return;
    persist([
      ...items,
      {
        id: crypto.randomUUID(),
        title: title.trim(),
        route: route.trim().startsWith("/") ? route.trim() : `/${route.trim()}`,
        enabled: true,
        order: items.length,
      },
    ]);
    setTitle("");
    setRoute("");
  };

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    persist(next);
  };

  return (
    <>
      <Section title="Add menu item">
        <form onSubmit={add} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <Input placeholder="Title (e.g. Blog)" value={title} onChange={setTitle} />
          <Input placeholder="Route (e.g. /blog)" value={route} onChange={setRoute} />
          <button className="brand-gradient rounded-xl px-4 py-2.5 text-sm font-semibold text-white">
            Add
          </button>
        </form>
      </Section>

      <Section title={`Menu items (${items.length})`}>
        <div className="space-y-2">
          {items.map((m, i) => (
            <div key={m.id} className="rounded-xl border border-border bg-card/60 p-3">
              <div className="grid gap-2 sm:grid-cols-[auto_1fr_1fr_auto_auto_auto] sm:items-center">
                <div className="flex flex-col">
                  <button
                    onClick={() => move(i, -1)}
                    className="px-2 text-xs text-muted-foreground hover:text-foreground"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => move(i, 1)}
                    className="px-2 text-xs text-muted-foreground hover:text-foreground"
                  >
                    ▼
                  </button>
                </div>
                <input
                  value={m.title}
                  onChange={(e) => persist(items.map((x) => (x.id === m.id ? { ...x, title: e.target.value } : x)))}
                  className="rounded-lg bg-transparent px-2 py-1.5 text-sm font-medium outline-none focus:bg-secondary"
                />
                <input
                  value={m.route}
                  onChange={(e) => persist(items.map((x) => (x.id === m.id ? { ...x, route: e.target.value } : x)))}
                  className="rounded-lg bg-transparent px-2 py-1.5 text-xs text-muted-foreground outline-none focus:bg-secondary"
                />
                <SmallToggle
                  checked={m.enabled}
                  onChange={(v) => persist(items.map((x) => (x.id === m.id ? { ...x, enabled: v } : x)))}
                />
                <button
                  onClick={() => persist(items.filter((x) => x.id !== m.id))}
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}

// ------- Pages Manager -------

const PAGE_KEYS: PageKey[] = ["home", "about", "contact", "privacy", "terms"];

function PagesManager() {
  const [pages, setPages] = useState<Record<PageKey, PageContent>>(DEFAULT_PAGES);
  const [active, setActive] = useState<PageKey>("about");

  useEffect(() => setPages(getAllPages()), []);

  const update = (patch: Partial<PageContent>) => {
    const next = { ...pages, [active]: { ...pages[active], ...patch } };
    setPages(next);
    savePage(active, next[active]);
  };

  const p = pages[active];

  return (
    <Section title="Edit page content">
      <div className="mb-4 flex flex-wrap gap-2">
        {PAGE_KEYS.map((k) => (
          <button
            key={k}
            onClick={() => setActive(k)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition ${
              active === k
                ? "bg-foreground text-background"
                : "border border-border bg-card/60 text-muted-foreground hover:text-foreground"
            }`}
          >
            {k}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        <Field label="Title">
          <Input value={p.title} onChange={(v) => update({ title: v })} />
        </Field>
        <Field label="Subtitle">
          <Input value={p.subtitle ?? ""} onChange={(v) => update({ subtitle: v })} />
        </Field>
        <Field label="Body (blank lines separate paragraphs)">
          <textarea
            value={p.body}
            onChange={(e) => update({ body: e.target.value })}
            rows={12}
            className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/60"
          />
        </Field>
        <p className="text-xs text-muted-foreground">Saved automatically to this device.</p>
      </div>
    </Section>
  );
}

// ------- AdSense Manager -------

function AdSenseManager() {
  const [units, setUnits] = useState<AdSenseUnit[]>([]);
  const [draft, setDraft] = useState<AdSenseUnit>(newAdSense());

  useEffect(() => setUnits(getAdSense()), []);

  const persist = (next: AdSenseUnit[]) => {
    setUnits(next);
    saveAdSense(next);
  };

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.name.trim() || !draft.slot.trim() || !draft.client.trim()) return;
    persist([...units, { ...draft, id: crypto.randomUUID() }]);
    setDraft(newAdSense());
  };

  return (
    <>
      <Section title="Add AdSense unit">
        <form onSubmit={add} className="grid gap-3 sm:grid-cols-2">
          <Input placeholder="Ad Unit Name" value={draft.name} onChange={(v) => setDraft({ ...draft, name: v })} />
          <Select
            value={draft.type}
            onChange={(v) => setDraft({ ...draft, type: v as AdSenseUnit["type"] })}
            options={[
              ["display", "Display Banner"],
              ["responsive", "Responsive"],
              ["in-article", "In-Article"],
              ["in-feed", "In-Feed"],
            ]}
          />
          <Input placeholder="Client ID (ca-pub-…)" value={draft.client} onChange={(v) => setDraft({ ...draft, client: v })} />
          <Input placeholder="Slot ID" value={draft.slot} onChange={(v) => setDraft({ ...draft, slot: v })} />
          <Select
            value={draft.location}
            onChange={(v) => setDraft({ ...draft, location: v as AdSenseUnit["location"] })}
            options={[
              ["header", "Header"],
              ["sidebar", "Sidebar"],
              ["in-content", "In Content"],
              ["footer", "Footer"],
            ]}
          />
          <button className="brand-gradient rounded-xl px-4 py-2.5 text-sm font-semibold text-white sm:col-span-2">
            Add ad unit
          </button>
        </form>
      </Section>

      <Section title={`AdSense units (${units.length})`}>
        {units.length === 0 && <EmptyHint text="No AdSense units yet." />}
        <div className="space-y-2">
          {units.map((u) => (
            <div key={u.id} className="rounded-xl border border-border bg-card/60 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{u.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {u.type} · {u.location} · {u.client} / {u.slot}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <SmallToggle
                    checked={u.enabled}
                    onChange={(v) => persist(units.map((x) => (x.id === u.id ? { ...x, enabled: v } : x)))}
                  />
                  <button
                    onClick={() => persist(units.filter((x) => x.id !== u.id))}
                    className="rounded-lg px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}

function newAdSense(): AdSenseUnit {
  return {
    id: "",
    name: "",
    type: "responsive",
    client: "",
    slot: "",
    location: "in-content",
    enabled: true,
  };
}

// ------- Adsterra Manager -------

function AdsterraManager() {
  const [units, setUnits] = useState<AdsterraUnit[]>([]);
  const [draft, setDraft] = useState<AdsterraUnit>(newAdsterra());

  useEffect(() => setUnits(getAdsterra()), []);

  const persist = (next: AdsterraUnit[]) => {
    setUnits(next);
    saveAdsterra(next);
  };

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.name.trim() || !draft.code.trim()) return;
    persist([...units, { ...draft, id: crypto.randomUUID() }]);
    setDraft(newAdsterra());
  };

  return (
    <>
      <Section title="Add Adsterra unit">
        <form onSubmit={add} className="grid gap-3 sm:grid-cols-2">
          <Input placeholder="Name" value={draft.name} onChange={(v) => setDraft({ ...draft, name: v })} />
          <Select
            value={draft.type}
            onChange={(v) => setDraft({ ...draft, type: v as AdsterraUnit["type"] })}
            options={[
              ["popunder", "Popunder"],
              ["social-bar", "Social Bar"],
              ["native-banner", "Native Banner"],
              ["direct-link", "Direct Link"],
            ]}
          />
          <div className="sm:col-span-2">
            <textarea
              placeholder={draft.type === "direct-link" || draft.type === "popunder" ? "URL or script" : "Ad script / code"}
              value={draft.code}
              onChange={(e) => setDraft({ ...draft, code: e.target.value })}
              rows={3}
              className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/60"
            />
          </div>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            Cooldown (sec)
            <input
              type="number"
              min={0}
              value={draft.cooldownSec}
              onChange={(e) => setDraft({ ...draft, cooldownSec: Number(e.target.value) || 0 })}
              className="w-24 rounded-lg border border-border bg-card px-2 py-1 text-sm"
            />
          </label>
          <button className="brand-gradient rounded-xl px-4 py-2.5 text-sm font-semibold text-white sm:col-span-2">
            Add
          </button>
        </form>
      </Section>

      <Section title={`Adsterra units (${units.length})`}>
        {units.length === 0 && <EmptyHint text="No Adsterra units yet." />}
        <div className="space-y-2">
          {units.map((u) => (
            <div key={u.id} className="rounded-xl border border-border bg-card/60 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{u.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {u.type} · cooldown {u.cooldownSec}s
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <SmallToggle
                    checked={u.enabled}
                    onChange={(v) => persist(units.map((x) => (x.id === u.id ? { ...x, enabled: v } : x)))}
                  />
                  <button
                    onClick={() => persist(units.filter((x) => x.id !== u.id))}
                    className="rounded-lg px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}

function newAdsterra(): AdsterraUnit {
  return {
    id: "",
    name: "",
    type: "popunder",
    code: "",
    enabled: true,
    cooldownSec: 60,
  };
}

// ------- Legacy download-redirect links -------

function LegacyAdLinks() {
  const [links, setLinks] = useState<AdLink[]>([]);
  const [settings, setSettings] = useState(getSettings());
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");

  useEffect(() => setLinks(getLinks()), []);

  const persist = (next: AdLink[]) => {
    setLinks(next);
    saveLinks(next);
  };
  const persistS = (next: typeof settings) => {
    setSettings(next);
    saveSettings(next);
  };

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    persist([
      ...links,
      { id: crypto.randomUUID(), label: label.trim() || "Redirect link", url: url.trim(), active: true },
    ]);
    setLabel("");
    setUrl("");
  };

  return (
    <>
      <Section title="Download redirect settings">
        <div className="space-y-3">
          <label className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium">Redirect enabled</div>
              <div className="text-xs text-muted-foreground">When off, downloads skip the redirect.</div>
            </div>
            <SmallToggle checked={settings.enabled} onChange={(v) => persistS({ ...settings, enabled: v })} />
          </label>
        </div>
      </Section>

      <Section title="Add link">
        <form onSubmit={add} className="grid gap-3 sm:grid-cols-[1fr_2fr_auto]">
          <Input placeholder="Label (optional)" value={label} onChange={setLabel} />
          <Input placeholder="https://…" value={url} onChange={setUrl} />
          <button className="brand-gradient rounded-xl px-4 py-2.5 text-sm font-semibold text-white">Add</button>
        </form>
      </Section>

      <Section title={`Links (${links.length})`}>
        {links.length === 0 && <EmptyHint text="No links yet." />}
        <div className="space-y-2">
          {links.map((l) => (
            <div key={l.id} className="rounded-xl border border-border bg-card/60 p-3">
              <div className="grid gap-2 sm:grid-cols-[1fr_2fr_auto_auto] sm:items-center">
                <input
                  value={l.label}
                  onChange={(e) => persist(links.map((x) => (x.id === l.id ? { ...x, label: e.target.value } : x)))}
                  className="rounded-lg bg-transparent px-2 py-1.5 text-sm font-medium outline-none focus:bg-secondary"
                />
                <input
                  value={l.url}
                  onChange={(e) => persist(links.map((x) => (x.id === l.id ? { ...x, url: e.target.value } : x)))}
                  className="truncate rounded-lg bg-transparent px-2 py-1.5 text-xs text-muted-foreground outline-none focus:bg-secondary"
                />
                <SmallToggle
                  checked={l.active}
                  onChange={(v) => persist(links.map((x) => (x.id === l.id ? { ...x, active: v } : x)))}
                />
                <button
                  onClick={() => persist(links.filter((x) => x.id !== l.id))}
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}

// ------- Small UI helpers -------

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="glass-card rounded-2xl p-5">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      {children}
    </label>
  );
}

function Input({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/60"
    />
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/60"
    >
      {options.map(([v, l]) => (
        <option key={v} value={v}>
          {l}
        </option>
      ))}
    </select>
  );
}

function SmallToggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
        checked ? "brand-gradient" : "bg-secondary"
      }`}
      aria-pressed={checked}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function EmptyHint({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}
