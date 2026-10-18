"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, AlertCircle, ArrowRight, ShieldCheck, Film } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { AppHeader } from "@/components/layout/AppHeader";
import { AnimeQuoteCard } from "@/components/ui/AnimeQuoteCard";

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
    <div className="flex min-h-screen flex-col bg-kage-bg text-kage-text-primary">
      <AppHeader />

      <main className="flex flex-1 items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-5xl border border-kage-border bg-kage-surface shadow-tactile-hover overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          {/* Left Column: Atmospheric Anime Manga Panel with Authentic Quote */}
          <div className="relative hidden lg:flex lg:col-span-5 flex-col justify-between p-8 bg-black border-r border-kage-border overflow-hidden">
            {/* Background anime poster artwork with subtle film grain */}
            <div className="absolute inset-0 z-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx339-xF2wp1NQuQ4r.png"
                alt="Serial Experiments Lain"
                className="h-full w-full object-cover filter grayscale contrast-125 opacity-25"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/85 to-black/40" />
            </div>

            <div className="relative z-10 font-mono text-sm text-kage-text-muted">
              <div className="flex items-center space-x-2.5">
                <span className="flex h-6 w-6 items-center justify-center border border-white text-white font-bold text-xs">
                  影
                </span>
                <span className="tracking-widest text-white font-bold">KAGE</span>
              </div>
              <p className="mt-2 text-xs text-neutral-400 uppercase tracking-wider">
                PERSONAL ANIME WATCHLIST
              </p>
            </div>

            {/* Authentic Anime Quotation Component */}
            <div className="relative z-10 my-auto py-8">
              <AnimeQuoteCard variant="panel" />
            </div>

            <div className="relative z-10 border-t border-neutral-800 pt-4 font-mono text-xs text-neutral-500 flex items-center justify-between">
              <span>SECURE LOGIN</span>
              <span>24 FPS</span>
            </div>
          </div>

          {/* Right Column: High-Legibility Editorial Form */}
          <div className="p-6 sm:p-10 lg:col-span-7 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-kage-border pb-5">
                <div>
                  <span className="font-mono text-xs tracking-widest text-kage-text-muted uppercase">
                    WELCOME BACK
                  </span>
                  <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-white uppercase">
                    Log In
                  </h1>
                </div>
                <div className="flex h-9 w-9 items-center justify-center border border-kage-border text-white text-sm font-mono font-bold">
                  影
                </div>
              </div>

              {/* Mobile-Only Quote Showcase */}
              <div className="block lg:hidden mt-5">
                <AnimeQuoteCard variant="compact" />
              </div>

              {error && (
                <div className="mt-6 flex items-start space-x-2.5 border border-red-500/40 bg-red-950/30 p-4 text-sm text-red-200">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                <div>
                  <label
                    htmlFor="email"
                    className="block font-mono text-xs sm:text-sm font-semibold uppercase tracking-wider text-kage-text-secondary"
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
                    placeholder="you@example.com"
                    className="mt-2 w-full border border-kage-border bg-kage-bg px-4 py-3 text-sm sm:text-base text-kage-text-primary placeholder:text-neutral-600 focus:border-white focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="password"
                      className="block font-mono text-xs sm:text-sm font-semibold uppercase tracking-wider text-kage-text-secondary"
                    >
                      Password
                    </label>
                    <Link
                      href="/forgot-password"
                      className="font-mono text-xs sm:text-sm text-kage-text-muted hover:text-white transition-colors"
                    >
                      Forgot Password?
                    </Link>
                  </div>
                  <div className="relative mt-2">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full border border-kage-border bg-kage-bg px-4 py-3 pr-11 text-sm sm:text-base text-kage-text-primary placeholder:text-neutral-600 focus:border-white focus:outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute right-3.5 top-3.5 text-neutral-500 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center space-x-2.5 border border-white bg-white py-3.5 text-sm sm:text-base font-bold tracking-wider text-black transition-all hover:bg-neutral-200 active:scale-98 disabled:opacity-50 shadow-tactile mt-3"
                >
                  <span>{loading ? "LOGGING IN..." : "LOG IN"}</span>
                  {!loading && <ArrowRight className="h-4 w-4" />}
                </button>
              </form>
            </div>

            <div className="mt-8 border-t border-kage-border pt-5 text-center">
              <p className="font-mono text-xs sm:text-sm text-kage-text-muted">
                Don&apos;t have an account?{" "}
                <Link
                  href="/register"
                  className="text-white font-bold underline underline-offset-4 hover:text-neutral-300"
                >
                  Sign up here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
