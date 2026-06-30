import { Link, useRouter } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

const SESSION_KEY = "ic.admin.session";

export function UserMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [authed, setAuthed] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setAuthed(sessionStorage.getItem(SESSION_KEY) === "1");
    const onStorage = () => setAuthed(sessionStorage.getItem(SESSION_KEY) === "1");
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const signOut = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setAuthed(false);
    setOpen(false);
    router.navigate({ to: "/" });
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Account menu"
        aria-haspopup="menu"
        aria-expanded={open}
        className="brand-gradient flex h-9 w-9 items-center justify-center rounded-full text-white shadow-md transition hover:brightness-110"
      >
        {authed ? (
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="8" r="3.5" />
            <path strokeLinecap="round" d="M4.5 20a7.5 7.5 0 0115 0" />
          </svg>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="glass-card brand-glow absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-2xl p-1.5 text-sm shadow-xl"
        >
          <div className="px-3 py-2.5">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {authed ? "Signed in" : "Account"}
            </div>
            <div className="mt-0.5 truncate text-sm font-semibold">
              {authed ? "Admin" : "Guest"}
            </div>
          </div>
          <div className="my-1 h-px bg-border/70" />

          {!authed ? (
            <>
              <MenuLink to="/admin" onSelect={() => setOpen(false)} icon="login">
                Login
              </MenuLink>
            </>
          ) : (
            <>
              <MenuLink to="/admin" onSelect={() => setOpen(false)} icon="dash">
                Admin dashboard
              </MenuLink>
              <button
                role="menuitem"
                onClick={signOut}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left font-medium text-destructive transition hover:bg-destructive/10"
              >
                <Icon name="logout" />
                Sign out
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function MenuLink({
  to,
  onSelect,
  icon,
  children,
}: {
  to: string;
  onSelect: () => void;
  icon: IconName;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      onClick={onSelect}
      role="menuitem"
      className="flex items-center gap-2.5 rounded-xl px-3 py-2 font-medium transition hover:bg-secondary"
    >
      <Icon name={icon} />
      {children}
    </Link>
  );
}

type IconName = "login" | "logout" | "dash";

function Icon({ name }: { name: IconName }) {
  const cls = "h-4 w-4 text-muted-foreground";
  if (name === "login")
    return (
      <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H3m0 0l4-4m-4 4l4 4M14 4h5a2 2 0 012 2v12a2 2 0 01-2 2h-5" />
      </svg>
    );
  if (name === "logout")
    return (
      <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h12m0 0l-4-4m4 4l-4 4M10 4H5a2 2 0 00-2 2v12a2 2 0 002 2h5" />
      </svg>
    );
  return (
    <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  );
}
