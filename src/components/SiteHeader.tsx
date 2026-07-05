import { Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getMenu, type MenuItem } from "@/lib/cms";
import { logoDataUri } from "@/lib/logo";
import { UserMenu } from "@/components/UserMenu";

export function SiteHeader({ dark, onToggleDark }: { dark?: boolean; onToggleDark?: () => void }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<MenuItem[]>([]);
  const router = useRouter();

  useEffect(() => {
    setItems(getMenu().filter((m) => m.enabled));
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const go = (route: string) => {
    setOpen(false);
    router.navigate({ to: route });
  };

  return (
    <>
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-5 sm:py-4">
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="group flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-card/70 backdrop-blur transition-all duration-200 hover:scale-105 hover:border-blue-500/40 hover:shadow-[0_0_20px_-4px_rgba(37,99,235,0.5)] active:scale-95"
        >
          <div className="flex flex-col gap-[5px]">
            <span className="block h-[2px] w-5 rounded-full bg-foreground transition-all duration-300 group-hover:w-6" />
            <span className="block h-[2px] w-5 rounded-full bg-foreground transition-all duration-300" />
            <span className="block h-[2px] w-5 rounded-full bg-foreground transition-all duration-300 group-hover:w-4" />
          </div>
        </button>

        <Link to="/" className="flex min-w-0 items-center gap-2">
          <img src={logoDataUri} alt="Image Compressor" className="h-9 w-9 shrink-0 rounded-xl shadow" />
          <span className="truncate font-[Space_Grotesk] text-base font-bold tracking-tight sm:text-lg">
            Image Compressor
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-2">
          {onToggleDark && (
            <button
              onClick={onToggleDark}
              aria-label="Toggle dark mode"
              className="hidden rounded-full border border-border bg-card/70 px-3 py-1.5 text-xs font-medium backdrop-blur transition hover:bg-card sm:inline-flex"
            >
              {dark ? "☀" : "☾"}
            </button>
          )}
          <UserMenu />
        </div>
      </header>

      {/* Overlay */}
      <div
        onClick={() => setOpen(false)}
        aria-hidden
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Sidebar */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Site navigation"
        className={`fixed left-0 top-0 z-50 flex h-full w-[82%] max-w-[320px] flex-col bg-neutral-950/95 text-white shadow-2xl backdrop-blur-xl transition-transform duration-[320ms] ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ backgroundImage: "linear-gradient(160deg, rgba(168,85,247,0.14), rgba(37,99,235,0.10) 40%, rgba(16,185,129,0.10))" }}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <img src={logoDataUri} alt="" className="h-8 w-8 rounded-lg" />
            <span className="font-[Space_Grotesk] font-bold">Menu</span>
          </div>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="flex h-9 w-9 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white active:scale-95"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {items.map((item, i) => (
              <li
                key={item.id}
                style={{
                  transitionDelay: open ? `${i * 40}ms` : "0ms",
                }}
                className={`transform transition-all duration-300 ${
                  open ? "translate-x-0 opacity-100" : "-translate-x-3 opacity-0"
                }`}
              >
                <button
                  onClick={() => go(item.route)}
                  className="group flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-[15px] font-medium text-white/90 transition-all duration-200 hover:bg-white/10 hover:pl-5 active:scale-[0.98]"
                >
                  <span>{item.title}</span>
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4 -translate-x-2 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path strokeLinecap="round" d="M9 6l6 6-6 6" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-white/10 px-5 py-4 text-[11px] text-white/50">
          © {new Date().getFullYear()} Image Compressor
        </div>
      </aside>
    </>
  );
}
