import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import logo from "@/assets/logo.png.asset.json";
import { setPendingFiles } from "@/lib/previewStore";
import { UserMenu } from "@/components/UserMenu";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Image Compressor — Shrink JPG, PNG, WEBP in your browser" },
      {
        name: "description",
        content:
          "Free online image compressor. Reduce JPG, PNG and WEBP file size in seconds — runs 100% in your browser, no upload required.",
      },
      { property: "og:title", content: "Image Compressor — Shrink JPG, PNG, WEBP in your browser" },
      {
        property: "og:description",
        content: "Compress images instantly with adjustable quality. Mobile-friendly. No signup.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const navigate = useNavigate();
  const [dark, setDark] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (dark) root.classList.add("dark");
    else root.classList.remove("dark");
  }, [dark]);

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const arr = Array.from(files).filter((f) => /image\/(jpeg|jpg|png|webp)/.test(f.type));
      if (!arr.length) return;
      setPendingFiles(arr);
      navigate({ to: "/preview" });
    },
    [navigate],
  );

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Ambient gradient blobs */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -left-32 h-[28rem] w-[28rem] rounded-full bg-purple-500/20 blur-3xl" />
        <div className="absolute top-40 -right-32 h-[28rem] w-[28rem] rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-[24rem] w-[24rem] rounded-full bg-emerald-500/15 blur-3xl" />
      </div>

      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link to="/" className="flex items-center gap-2.5">
          <img src={logo.url} alt="Image Compressor" className="h-10 w-10 rounded-xl shadow-md" />
          <div className="flex flex-col leading-tight">
            <span className="font-[Space_Grotesk] text-base font-bold tracking-tight">Image Compressor</span>
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              In-browser · Private
            </span>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDark((d) => !d)}
            className="rounded-full border border-border bg-card/70 px-3 py-1.5 text-xs font-medium backdrop-blur transition hover:bg-card"
            aria-label="Toggle dark mode"
          >
            {dark ? "☀ Light" : "☾ Dark"}
          </button>
          <UserMenu />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 pb-24">
        {/* Hero */}
        <section className="pt-6 pb-8 text-center sm:pt-12 sm:pb-12">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> 100% client-side · nothing uploaded
          </span>
          <h1 className="mt-5 font-[Space_Grotesk] text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
            Squeeze your images{" "}
            <span className="brand-gradient-text">without losing the magic.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground sm:text-base">
            Drop JPG, PNG or WEBP files. Preview the optimized version, then download — right from your browser.
          </p>
        </section>

        {/* Upload card */}
        <section
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`glass-card brand-glow group relative overflow-hidden rounded-3xl p-6 sm:p-10 transition ${
            dragging ? "ring-2 ring-blue-500/60 scale-[1.01]" : ""
          }`}
        >
          <div className="absolute inset-x-0 top-0 h-1 brand-gradient" />
          <div className="flex flex-col items-center text-center">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              aria-label="Select images"
              className="brand-gradient mb-4 flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg transition hover:brightness-110 active:scale-[0.98] cursor-pointer"
            >
              <svg viewBox="0 0 24 24" className="h-8 w-8 text-white" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0l-4 4m4-4l4 4M4 20h16" />
              </svg>
            </button>
            <h2 className="text-lg font-semibold sm:text-xl">Drop images here</h2>
            <p className="mt-1 text-sm text-muted-foreground">or tap to choose from your device</p>
            <button
              onClick={() => inputRef.current?.click()}
              className="brand-gradient mt-5 rounded-full px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:brightness-110 active:scale-[0.98]"
            >
              Select images
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && addFiles(e.target.files)}
            />
            <p className="mt-3 text-[11px] text-muted-foreground">JPG · PNG · WEBP — up to ~25MB each</p>
          </div>
        </section>

        {/* Features strip */}
        <section className="mt-16 grid gap-4 sm:grid-cols-3">
          {[
            { t: "Lightning fast", d: "Canvas-API compression — no server round trip." },
            { t: "Privacy first", d: "Files never leave your device." },
            { t: "Mobile ready", d: "Polished on phones, tablets, and desktop." },
          ].map((f) => (
            <div key={f.t} className="glass-card rounded-2xl p-5">
              <div className="brand-gradient mb-3 h-1.5 w-10 rounded-full" />
              <div className="font-semibold">{f.t}</div>
              <div className="mt-1 text-sm text-muted-foreground">{f.d}</div>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Image Compressor · Built with care
      </footer>
    </div>
  );
}
