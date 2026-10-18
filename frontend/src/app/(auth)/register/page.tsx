"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, Check } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { AppHeader } from "@/components/layout/AppHeader";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await register(email, password, displayName || undefined);
      router.push("/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Registration failed.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-kage-bg">
      <AppHeader />

      <main className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-md border border-kage-border bg-kage-surface p-8 shadow-2xl">
          {/* Header */}
          <div className="border-b border-kage-border pb-4 text-center">
            <span className="font-mono text-xs tracking-widest text-kage-text-muted uppercase">
              NEW MEMBER
            </span>
            <h1 className="mt-1 text-xl font-bold tracking-tight text-white uppercase">
              Create Library Account
            </h1>
          </div>

          {error && (
            <div className="mt-4 flex items-start space-x-2 border border-red-500/30 bg-red-950/20 p-3 text-xs text-red-200">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block font-mono text-[11px] uppercase tracking-wider text-kage-text-secondary"
              >
                Email Address *
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="mt-1 w-full border border-kage-border bg-kage-bg px-3 py-2 text-xs text-kage-text-primary placeholder:text-kage-text-muted focus:border-kage-border-focus focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="displayName"
                className="block font-mono text-[11px] uppercase tracking-wider text-kage-text-secondary"
              >
                Display Name (Optional)
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Spike"
                className="mt-1 w-full border border-kage-border bg-kage-bg px-3 py-2 text-xs text-kage-text-primary placeholder:text-kage-text-muted focus:border-kage-border-focus focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block font-mono text-[11px] uppercase tracking-wider text-kage-text-secondary"
              >
                Password (Min 8 Characters) *
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full border border-kage-border bg-kage-bg px-3 py-2 text-xs text-kage-text-primary placeholder:text-kage-text-muted focus:border-kage-border-focus focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block font-mono text-[11px] uppercase tracking-wider text-kage-text-secondary"
              >
                Confirm Password *
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 w-full border border-kage-border bg-kage-bg px-3 py-2 text-xs text-kage-text-primary placeholder:text-kage-text-muted focus:border-kage-border-focus focus:outline-none"
              />
            </div>

            {/* Security pledge */}
            <div className="flex items-start space-x-2 border border-kage-border/80 bg-kage-bg p-3 text-[11px] text-kage-text-muted">
              <Check className="h-3.5 w-3.5 shrink-0 text-white mt-0.5" />
              <span>
                Your library records and personal notes are strictly isolated and hashed using
                Argon2id.
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center space-x-2 border border-kage-text-primary bg-kage-text-primary py-2.5 text-xs font-semibold tracking-wider text-kage-bg transition-transform hover:opacity-90 active:scale-95 disabled:opacity-50"
            >
              <span>{loading ? "Creating Account..." : "Create Account"}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 border-t border-kage-border pt-4 text-center">
            <p className="text-xs text-kage-text-muted">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-white hover:underline">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
