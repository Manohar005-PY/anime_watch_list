"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, AlertCircle, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { AppHeader } from "@/components/layout/AppHeader";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Invalid email or password.";
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
              AUTHENTICATION
            </span>
            <h1 className="mt-1 text-xl font-bold tracking-tight text-white uppercase">
              Access Library
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
                Email Address
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
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block font-mono text-[11px] uppercase tracking-wider text-kage-text-secondary"
                >
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="font-mono text-[10px] text-kage-text-muted hover:text-white"
                >
                  Forgot?
                </Link>
              </div>
              <div className="relative mt-1">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-kage-border bg-kage-bg px-3 py-2 pr-9 text-xs text-kage-text-primary placeholder:text-kage-text-muted focus:border-kage-border-focus focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2.5 text-kage-text-muted hover:text-white"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center space-x-2 border border-kage-text-primary bg-kage-text-primary py-2.5 text-xs font-semibold tracking-wider text-kage-bg transition-transform hover:opacity-90 active:scale-95 disabled:opacity-50"
            >
              <span>{loading ? "Authenticating..." : "Sign In"}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 border-t border-kage-border pt-4 text-center">
            <p className="text-xs text-kage-text-muted">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="font-semibold text-white hover:underline">
                Create one now
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
