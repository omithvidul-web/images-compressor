import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { getAdminEmail, getAdminPassword, setAdminPassword } from "@/lib/ads";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in · Image Compressor" }] }),
  component: AuthPage,
});

const SESSION_KEY = "ic.admin.session";

function AuthPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const isAdmin = email.trim().toLowerCase() === getAdminEmail();

    if (!isAdmin) {
      // Regular user "login" — no account system; just return home.
      router.navigate({ to: "/" });
      return;
    }

    const stored = getAdminPassword();
    if (!stored) {
      if (password.length < 4) {
        setError("Set a password of at least 4 characters.");
        return;
      }
      setAdminPassword(password);
    } else if (stored !== password) {
      setError("Incorrect password.");
      return;
    }

    sessionStorage.setItem(SESSION_KEY, "1");
    router.navigate({ to: "/admin" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
        <Link to="/" className="mb-8 text-xs text-muted-foreground hover:text-foreground">
          ← Back to site
        </Link>
        <div className="glass-card brand-glow rounded-3xl p-8">
          <div className="brand-gradient mb-5 h-1 w-12 rounded-full" />
          <form onSubmit={submit} className="space-y-3">
            <input
              type="email"
              placeholder="Email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/60"
            />
            <input
              type="password"
              placeholder="Password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/60"
            />
            {error && <div className="text-xs text-destructive">{error}</div>}
            <button
              type="submit"
              className="brand-gradient w-full rounded-xl px-4 py-3 text-sm font-semibold text-white shadow"
            >
              Sign in
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
