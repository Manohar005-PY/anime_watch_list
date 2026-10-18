"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Film, ShieldCheck, BarChart2, ArrowRight, Star, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { AppHeader } from "@/components/layout/AppHeader";

export default function LandingPage() {
  const { user, reduceMotion } = useAuth();
  const [showIntro, setShowIntro] = useState(false);

  useEffect(() => {
    // Only show cinematic intro once per session if not seen
    const seen = sessionStorage.getItem("kage_intro_seen");
    if (!seen && !reduceMotion) {
      setShowIntro(true);
      sessionStorage.setItem("kage_intro_seen", "true");
      const timer = setTimeout(() => {
        setShowIntro(false);
      }, 2600);
      return () => clearTimeout(timer);
    }
  }, [reduceMotion]);

  return (
    <div className="flex min-h-screen flex-col">
      {/* Cinematic Logo Reveal Sequence (Skippable) */}
      <AnimatePresence>
        {showIntro && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="text-center"
            >
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center border-2 border-white text-2xl font-bold font-mono">
                影
              </div>
              <h1 className="font-mono text-2xl font-bold tracking-[0.3em] text-white">
                KAGE
              </h1>
              <p className="mt-2 font-mono text-[11px] tracking-widest text-neutral-400 uppercase">
                A Cinematic Personal Anime Library
              </p>
            </motion.div>

            <button
              onClick={() => setShowIntro(false)}
              className="absolute bottom-10 border border-neutral-700 px-3 py-1 font-mono text-[10px] text-neutral-400 hover:text-white hover:border-white transition-colors"
            >
              SKIP INTRO
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AppHeader />

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-kage-border py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
              {/* Text content */}
              <div className="lg:col-span-7">
                <div className="inline-flex items-center space-x-2 border border-kage-border bg-kage-surface px-3 py-1 font-mono text-[11px] tracking-wider text-kage-text-secondary">
                  <span className="h-1.5 w-1.5 bg-white" />
                  <span>EDITORIAL PERSONAL CATALOGUE</span>
                </div>

                <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-white sm:text-6xl sm:leading-[1.1]">
                  A cinematic archive for your anime collection.
                </h1>

                <p className="mt-5 max-w-2xl text-base text-kage-text-secondary sm:text-lg">
                  KAGE is a personal anime library built with tactile monochrome minimalism,
                  strictly isolated user storage, and authentic progress tracking.
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <Link
                    href={user ? "/dashboard" : "/register"}
                    className="flex items-center space-x-2 border border-kage-text-primary bg-kage-text-primary px-6 py-3 text-xs font-semibold tracking-wider text-kage-bg transition-transform hover:opacity-90 active:scale-95"
                  >
                    <span>{user ? "Go to Dashboard" : "Create Personal Library"}</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>

                  <Link
                    href={user ? "/collection" : "/login"}
                    className="border border-kage-border bg-kage-surface px-6 py-3 text-xs font-semibold tracking-wider text-kage-text-primary hover:border-kage-border-focus hover:bg-kage-surface-raised transition-colors"
                  >
                    <span>{user ? "View Collection" : "Existing Member Log In"}</span>
                  </Link>
                </div>

                {/* Technical badges */}
                <div className="mt-12 flex flex-wrap gap-6 border-t border-kage-border/80 pt-6 font-mono text-[11px] text-kage-text-muted">
                  <div className="flex items-center space-x-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-white" />
                    <span>Server-Isolated Ownership</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <BarChart2 className="h-3.5 w-3.5 text-white" />
                    <span>Real Metrics & Statistics</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <Film className="h-3.5 w-3.5 text-white" />
                    <span>Zero Fabricated Data</span>
                  </div>
                </div>
              </div>

              {/* Graphic Manga Panel Preview */}
              <div className="lg:col-span-5">
                <div className="relative border border-kage-border bg-kage-surface p-6 shadow-2xl">
                  {/* Decorative Frame Header */}
                  <div className="flex items-center justify-between border-b border-kage-border pb-3 font-mono text-[10px] text-kage-text-muted">
                    <span>PANEL // 01</span>
                    <span>LIVE SPECIMEN</span>
                  </div>

                  {/* Sample anime card simulation */}
                  <div className="mt-4 border border-kage-border bg-kage-bg p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="border border-kage-border px-2 py-0.5 text-[9px] font-mono uppercase text-kage-text-secondary">
                          WATCHING
                        </span>
                        <h3 className="mt-2 text-sm font-bold text-white">
                          Ghost in the Shell: Stand Alone Complex
                        </h3>
                        <p className="font-mono text-[10px] text-kage-text-muted">
                          攻殻機動隊 STAND ALONE COMPLEX
                        </p>
                      </div>
                      <Star className="h-4 w-4 fill-white text-white" />
                    </div>

                    {/* Progress representation */}
                    <div className="mt-6">
                      <div className="flex justify-between font-mono text-xs text-kage-text-secondary mb-1.5">
                        <span>EPISODES</span>
                        <span>24 / 26</span>
                      </div>
                      <div className="h-1.5 w-full bg-kage-surface border border-kage-border">
                        <div className="h-full bg-white" style={{ width: "92%" }} />
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-kage-border pt-3 font-mono text-[11px]">
                      <span className="text-kage-text-muted">RATING: 10/10</span>
                      <span className="text-kage-text-secondary">Cyberpunk, Mystery</span>
                    </div>
                  </div>

                  <p className="mt-4 font-mono text-[10px] text-kage-text-muted text-center">
                    Rendered with strict monochrome typography and tactile borders.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="py-20 bg-kage-bg">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="border-b border-kage-border pb-4">
              <span className="font-mono text-[11px] uppercase tracking-wider text-kage-text-muted">
                CORE PRINCIPLES
              </span>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-white">
                Engineered for serious collection curation.
              </h2>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div className="border border-kage-border bg-kage-surface p-6">
                <div className="flex h-10 w-10 items-center justify-center border border-kage-border text-white">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-sm font-bold text-white uppercase tracking-wider">
                  Isolated User Ownership
                </h3>
                <p className="mt-2 text-xs text-kage-text-muted leading-relaxed">
                  Every query is scoped strictly to your authenticated session. Another user cannot
                  read, update, delete, or infer your private library records.
                </p>
              </div>

              <div className="border border-kage-border bg-kage-surface p-6">
                <div className="flex h-10 w-10 items-center justify-center border border-kage-border text-white">
                  <Film className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-sm font-bold text-white uppercase tracking-wider">
                  Tactile Progress Curation
                </h3>
                <p className="mt-2 text-xs text-kage-text-muted leading-relaxed">
                  Record exact watched counts, total episode limits, personal notes, scores, and
                  start/completion dates with instant optimistic UI feedback.
                </p>
              </div>

              <div className="border border-kage-border bg-kage-surface p-6">
                <div className="flex h-10 w-10 items-center justify-center border border-kage-border text-white">
                  <BarChart2 className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-sm font-bold text-white uppercase tracking-wider">
                  Authentic Viewing Analytics
                </h3>
                <p className="mt-2 text-xs text-kage-text-muted leading-relaxed">
                  Real distribution curves, completion gauges, and score distributions computed solely
                  from your genuine persistent database records.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-kage-border py-8 bg-kage-bg">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between px-4 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center space-x-2 font-mono text-xs text-kage-text-muted">
            <span className="font-bold text-white">KAGE / 影</span>
            <span>—</span>
            <span>Cinematic Personal Anime Library</span>
          </div>
          <div className="mt-4 sm:mt-0 font-mono text-[11px] text-kage-text-muted">
            <span>Production Container Architecture // PostgreSQL 16</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
