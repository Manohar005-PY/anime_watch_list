"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, AlertCircle, ArrowRight, ShieldCheck, Film } from "lucide-react";
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
    <div className="flex min-h-screen flex-col bg-kage-bg text-kage-text-primary">
      <AppHeader />

      <main className="flex flex-1 items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-4xl border border-kage-border bg-kage-surface shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          {/* Left Column: Atmospheric Anime Manga Panel */}
          <div className="relative hidden lg:flex lg:col-span-5 flex-col justify-between p-8 bg-black border-r border-kage-border overflow-hidden">
            {/* Background anime poster artwork with subtle film grain */}
            <div className="absolute inset-0 z-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx339-xF2wp1NQuQ4r.png"
                alt="Serial Experiments Lain"
                className="h-full w-full object-cover filter grayscale contrast-125 opacity-30"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
            </div>

            <div className="relative z-10 font-mono text-xs text-kage-text-muted">
              <div className="flex items-center space-x-2">
                <span className="flex h-5 w-5 items-center justify-center border border-white text-white font-bold text-[9px]">
                  影
                </span>
                <span className="tracking-widest text-white font-bold">KAGE</span>
              </div>
              <p className="mt-2 text-[10px] text-neutral-400">
                WELCOME BACK
              </p>
            </div>

            <div className="relative z-10 my-auto py-12">
              <span className="font-mono text-xs tracking-widest text-neutral-400 uppercase">
                // 認証 //
              </span>
              <h2 className="text-2xl font-extrabold text-white uppercase tracking-tight mt-2">
                Welcome back to your anime list.
              </h2>
              <p className="mt-4 text-xs text-neutral-300 italic font-mono leading-relaxed">
                &ldquo;Close the world, open the nExt.&rdquo;
              </p>
            </div>

            <div className="relative z-10 border-t border-neutral-800 pt-4 font-mono text-[10px] text-neutral-500 flex items-center justify-between">
              <span>SECURE LOGIN</span>
              <span>24 FPS</span>
            </div>
          </div>

          {/* Right Column: High-Legibility Editorial Form */}
          <div className="p-6 sm:p-10 lg:col-span-7 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-kage-border pb-4">
                <div>
                  <span className="font-mono text-[10px] tracking-widest text-kage-text-muted uppercase">
                    SIGN IN
                  </span>
                  <h1 className="mt-1 text-xl sm:text-2xl font-bold tracking-tight text-white uppercase">
                    Log In
                  </h1>
                </div>
                <div className="flex h-8 w-8 items-center justify-center border border-kage-border text-white text-xs font-mono">
                  影
                </div>
              </div>

              {error && (
                <div className="mt-6 flex items-start space-x-2 border border-red-500/40 bg-red-950/30 p-3.5 text-xs text-red-200">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                <div>
                  <label
                    htmlFor="email"
                    className="block font-mono text-[11px] uppercase tracking-wider text-kage-text-secondary"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="mt-1.5 w-full border border-kage-border bg-kage-bg px-3.5 py-2.5 text-xs text-kage-text-primary placeholder:text-neutral-600 focus:border-white focus:outline-none transition-colors"
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
                      className="font-mono text-[10px] text-kage-text-muted hover:text-white transition-colors"
                    >
                      Forgot Password?
                    </Link>
                  </div>
                  <div className="relative mt-1.5">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full border border-kage-border bg-kage-bg px-3.5 py-2.5 pr-10 text-xs text-kage-text-primary placeholder:text-neutral-600 focus:border-white focus:outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute right-3 top-2.5 text-neutral-500 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center space-x-2 border border-white bg-white py-3 text-xs sm:text-sm font-bold tracking-wider text-black transition-all hover:bg-neutral-200 active:scale-98 disabled:opacity-50 shadow-tactile mt-2"
                >
                  <span>{loading ? "LOGGING IN..." : "LOG IN"}</span>
                  {!loading && <ArrowRight className="h-4 w-4" />}
                </button>
              </form>
            </div>

            <div className="mt-8 border-t border-kage-border pt-4 text-center">
              <p className="font-mono text-xs text-kage-text-muted">
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
