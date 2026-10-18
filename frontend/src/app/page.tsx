"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Film,
  ShieldCheck,
  BarChart2,
  ArrowRight,
  Sparkles,
  Database,
  Lock,
  Layers,
  Check,
  Sliders,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { AppHeader } from "@/components/layout/AppHeader";
import { EditorialShowcaseGallery } from "@/components/landing/EditorialShowcaseGallery";
import { InteractiveLibraryDemo } from "@/components/landing/InteractiveLibraryDemo";
import { CURATED_CLASSICS } from "@/lib/curated-anime";
import {
  staggerContainerVariants,
  wordRevealVariants,
  lineRevealVariants,
  panelShutterVariants,
  cardHoverVariants,
} from "@/lib/motion-tokens";

export default function LandingPage() {
  const { user, reduceMotion } = useAuth();
  const [showIntro, setShowIntro] = useState(false);

  useEffect(() => {
    // Only show cinematic intro once per session if not seen and reduced motion is off
    const seen = sessionStorage.getItem("kage_intro_seen");
    if (!seen && !reduceMotion) {
      setShowIntro(true);
      sessionStorage.setItem("kage_intro_seen", "true");
      const timer = setTimeout(() => {
        setShowIntro(false);
      }, 2200);
      return () => clearTimeout(timer);
    }
  }, [reduceMotion]);

  // Featured Hero Anime (Verified authentic metadata & covers)
  const heroPrimary = CURATED_CLASSICS[0]; // Cowboy Bebop
  const heroSecondary = CURATED_CLASSICS[1]; // Evangelion
  const heroTertiary = CURATED_CLASSICS[2]; // Ghost in the Shell

  return (
    <div className="flex min-h-screen flex-col bg-kage-bg text-kage-text-primary selection:bg-white selection:text-black">
      {/* 1. Cinematic Opening Reveal Sequence (Skippable & Non-blocking) */}
      <AnimatePresence>
        {showIntro && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black"
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="text-center"
            >
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center border-2 border-white text-3xl font-bold font-mono">
                影
              </div>
              <h1 className="font-mono text-3xl font-extrabold tracking-[0.35em] text-white">
                KAGE
              </h1>
              <p className="mt-2 font-mono text-xs tracking-widest text-neutral-400 uppercase">
                映画的・個人用アニメ目録
              </p>
              <div className="mt-4 flex items-center justify-center space-x-2 font-mono text-[10px] text-neutral-500">
                <span>[ 24 FPS ]</span>
                <span>•</span>
                <span>[ AUDIO: STEREO ]</span>
                <span>•</span>
                <span>[ TC: 00:00:01 ]</span>
              </div>
            </motion.div>

            <button
              onClick={() => setShowIntro(false)}
              className="absolute bottom-10 border border-neutral-700 px-4 py-1.5 font-mono text-[11px] text-neutral-400 hover:text-white hover:border-white transition-colors"
            >
              SKIP INTRO [ESC]
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AppHeader />

      <main className="flex-1">
        {/* 2. Hero Section: 75–90% Viewport Composition */}
        <section className="relative overflow-hidden border-b border-kage-border pt-12 pb-20 sm:pt-16 sm:pb-28 lg:min-h-[85vh] flex items-center">
          {/* Subtle manga screen-tone pattern backdrop */}
          <div className="pointer-events-none absolute inset-0 manga-screentone opacity-40" />

          {/* Film sprockets top & bottom border accents */}
          <div className="absolute top-0 left-0 right-0 h-2 film-sprockets opacity-20 border-b border-kage-border" />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
              {/* Left Column: Oversized Typographic Hierarchy */}
              <motion.div
                initial="hidden"
                animate="visible"
                variants={staggerContainerVariants}
                className="lg:col-span-7 z-10"
              >
                {/* Film Title Card Badge */}
                <motion.div
                  variants={lineRevealVariants}
                  className="inline-flex items-center space-x-2.5 border border-kage-border bg-kage-surface px-3.5 py-1.5 font-mono text-xs tracking-wider text-kage-text-secondary"
                >
                  <span className="h-2 w-2 bg-white" />
                  <span className="font-bold text-white">KAGE // ARCHIVE SPECIFICATION</span>
                  <span className="text-kage-text-muted">|</span>
                  <span className="hidden sm:inline text-kage-text-muted">個人用アニメ目録</span>
                </motion.div>

                {/* Oversized Monumental Headline */}
                <div className="mt-6 overflow-hidden">
                  <motion.h1
                    variants={wordRevealVariants}
                    className="text-4xl sm:text-6xl xl:text-7xl font-extrabold tracking-tighter text-white uppercase leading-[0.95]"
                  >
                    THE PERSONAL <br />
                    <span className="text-neutral-400">ANIME ARCHIVE.</span>
                  </motion.h1>
                </div>

                <motion.p
                  variants={lineRevealVariants}
                  className="mt-6 max-w-2xl text-base sm:text-lg text-kage-text-secondary leading-relaxed"
                >
                  An art-directed media catalog built with tactile monochrome minimalism,
                  strictly isolated user storage, and authentic progress tracking.
                  Zero synthetic reviews, zero vanity metrics.
                </motion.p>

                {/* Primary & Secondary Call to Actions */}
                <motion.div
                  variants={lineRevealVariants}
                  className="mt-8 flex flex-wrap items-center gap-4"
                >
                  <Link
                    href={user ? "/dashboard" : "/register"}
                    className="group relative flex items-center space-x-3 border border-white bg-white px-7 py-3.5 text-xs sm:text-sm font-bold tracking-wider text-black transition-all hover:bg-neutral-200 active:scale-95 shadow-tactile"
                  >
                    <span>{user ? "ENTER DASHBOARD" : "CREATE YOUR ARCHIVE"}</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>

                  <Link
                    href={user ? "/collection" : "/login"}
                    className="border border-kage-border bg-kage-surface px-7 py-3.5 text-xs sm:text-sm font-semibold tracking-wider text-white hover:border-kage-border-focus hover:bg-kage-surface-raised transition-all"
                  >
                    <span>{user ? "BROWSE LIBRARY" : "EXISTING MEMBER LOGIN"}</span>
                  </Link>
                </motion.div>

                {/* Engineering Specifications Strip */}
                <motion.div
                  variants={lineRevealVariants}
                  className="mt-12 flex flex-wrap items-center gap-6 border-t border-kage-border/80 pt-6 font-mono text-[11px] text-kage-text-muted"
                >
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="h-4 w-4 text-white" />
                    <span>Argon2id Encrypted Sessions</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Database className="h-4 w-4 text-white" />
                    <span>PostgreSQL 16 Isolated Data</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Film className="h-4 w-4 text-white" />
                    <span>Verified AniList Metadata</span>
                  </div>
                </motion.div>
              </motion.div>

              {/* Right Column: Layered Manga Panel Poster Composition */}
              <div className="lg:col-span-5 relative">
                <div className="relative mx-auto w-full max-w-[420px] aspect-[4/5] flex items-center justify-center">
                  {/* Layer 1 (Back Left): Neon Genesis Evangelion */}
                  <motion.div
                    initial={{ opacity: 0, x: -30, y: 20, rotate: -4 }}
                    animate={{ opacity: 0.85, x: 0, y: 0, rotate: -3 }}
                    transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute -left-6 top-8 w-[200px] sm:w-[220px] aspect-[3/4] border border-kage-border bg-black shadow-2xl z-10 overflow-hidden group"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={heroSecondary.cover}
                      alt={heroSecondary.title}
                      loading="lazy"
                      className="h-full w-full object-cover filter grayscale contrast-125 transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute top-2 left-2 border border-black/80 bg-black/80 px-1.5 py-0.5 font-mono text-[8px] text-white">
                      PANEL // 01 • GAINAX
                    </div>
                  </motion.div>

                  {/* Layer 3 (Back Right): Ghost in the Shell: S.A.C. */}
                  <motion.div
                    initial={{ opacity: 0, x: 30, y: -20, rotate: 4 }}
                    animate={{ opacity: 0.85, x: 0, y: 0, rotate: 3 }}
                    transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute -right-6 bottom-8 w-[200px] sm:w-[220px] aspect-[3/4] border border-kage-border bg-black shadow-2xl z-10 overflow-hidden group"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={heroTertiary.cover}
                      alt={heroTertiary.title}
                      loading="lazy"
                      className="h-full w-full object-cover filter grayscale contrast-125 transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute bottom-2 right-2 border border-black/80 bg-black/80 px-1.5 py-0.5 font-mono text-[8px] text-white">
                      PANEL // 03 • PROD. I.G
                    </div>
                  </motion.div>

                  {/* Layer 2 (Center Hero): Cowboy Bebop (LCP image with fetchpriority="high" per modern-web-guidance) */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                    className="relative w-[260px] sm:w-[300px] aspect-[3/4] border-2 border-white bg-black shadow-tactile-hover z-20 overflow-hidden group"
                  >
                    {/* LCP candidate image: fetchpriority high, no loading=lazy */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={heroPrimary.cover}
                      alt="Cowboy Bebop - Primary Archive Specimen"
                      // @ts-expect-error fetchpriority is a modern HTML attribute supported in Chrome/Safari/Firefox per modern-web-guidance
                      fetchpriority="high"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />

                    {/* Manga panel coordinates & crosshair header */}
                    <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/90 to-transparent flex items-center justify-between font-mono text-[10px] text-white">
                      <span className="flex items-center space-x-1.5">
                        <span className="h-1.5 w-1.5 bg-white" />
                        <span>CANON SPECIMEN</span>
                      </span>
                      <span>1998 // SUNRISE</span>
                    </div>

                    {/* Bottom Metadata Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-3.5 bg-gradient-to-t from-black via-black/90 to-transparent border-t border-white/20">
                      <div className="flex items-baseline justify-between">
                        <h3 className="font-bold text-sm text-white">{heroPrimary.title}</h3>
                        <span className="font-mono text-[10px] text-neutral-300">26 EP</span>
                      </div>
                      <div className="mt-1 flex items-center justify-between font-mono text-[9px] text-neutral-400">
                        <span>{heroPrimary.native}</span>
                        <span>SCORE: {(heroPrimary.score / 10).toFixed(1)}/10</span>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Section B: Archival Canon Showcase Gallery */}
        <EditorialShowcaseGallery />

        {/* 4. Section C: Your Library in Motion (Live Interactive Demonstration) */}
        <section className="relative overflow-hidden border-b border-kage-border py-16 sm:py-24 bg-kage-bg">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <div className="flex items-center space-x-2 font-mono text-xs text-kage-text-muted">
                <span className="h-1.5 w-1.5 bg-white" />
                <span>SECTION // 02</span>
              </div>
              <h2 className="mt-2 text-2xl sm:text-4xl font-extrabold tracking-tight text-white uppercase">
                Your library in motion.
              </h2>
              <p className="mt-3 text-sm sm:text-base text-kage-text-secondary">
                Track episode-by-episode progress with tactile controls, animated progress gauges,
                and instant status transitions. Test the interaction below:
              </p>
            </div>

            <div className="mt-10">
              <InteractiveLibraryDemo />
            </div>
          </div>
        </section>

        {/* 5. Section D: Collection Philosophy & Architecture */}
        <section className="relative overflow-hidden border-b border-kage-border py-20 sm:py-28 bg-kage-bg">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="border-b border-kage-border pb-6">
              <span className="font-mono text-xs uppercase tracking-wider text-kage-text-muted">
                ENGINEERING PILLARS // ARCHITECTURE
              </span>
              <h2 className="mt-2 text-2xl sm:text-4xl font-extrabold tracking-tight text-white uppercase">
                Designed for serious anime curation.
              </h2>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
              {/* Pillar 1 */}
              <div className="manga-panel p-8 relative flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between font-mono text-[11px] text-kage-text-muted pb-4 border-b border-kage-border">
                    <span>PILLAR // 01</span>
                    <Lock className="h-4 w-4 text-white" />
                  </div>
                  <h3 className="mt-6 text-lg font-bold text-white uppercase tracking-tight">
                    Cryptographic Isolation
                  </h3>
                  <p className="mt-3 text-xs sm:text-sm text-kage-text-secondary leading-relaxed">
                    Zero public profiling, zero social clutter, and zero data leakage. Every record,
                    note, and rating is encrypted and verified against your authenticated session ID.
                  </p>
                </div>
                <div className="mt-8 border-t border-kage-border/80 pt-4 font-mono text-[10px] text-kage-text-muted">
                  ARGON2ID • SHA-256 SESSIONS • IDOR IMMUNITY
                </div>
              </div>

              {/* Pillar 2 */}
              <div className="manga-panel p-8 relative flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between font-mono text-[11px] text-kage-text-muted pb-4 border-b border-kage-border">
                    <span>PILLAR // 02</span>
                    <Sliders className="h-4 w-4 text-white" />
                  </div>
                  <h3 className="mt-6 text-lg font-bold text-white uppercase tracking-tight">
                    Tactile Episode Curation
                  </h3>
                  <p className="mt-3 text-xs sm:text-sm text-kage-text-secondary leading-relaxed">
                    Strict bounds checking guarantees you never record episode 27 of a 26-episode series.
                    Enjoy instant optimistic updates with server-side rollback resilience.
                  </p>
                </div>
                <div className="mt-8 border-t border-kage-border/80 pt-4 font-mono text-[10px] text-kage-text-muted">
                  STRICT EPISODE CONSTRAINTS • OPTIMISTIC UI
                </div>
              </div>

              {/* Pillar 3 */}
              <div className="manga-panel p-8 relative flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between font-mono text-[11px] text-kage-text-muted pb-4 border-b border-kage-border">
                    <span>PILLAR // 03</span>
                    <BarChart2 className="h-4 w-4 text-white" />
                  </div>
                  <h3 className="mt-6 text-lg font-bold text-white uppercase tracking-tight">
                    Authentic Viewing Geometry
                  </h3>
                  <p className="mt-3 text-xs sm:text-sm text-kage-text-secondary leading-relaxed">
                    View true distribution curves, completion rates, and genre breakdowns computed
                    solely from your persistent database rows. No fake vanity numbers.
                  </p>
                </div>
                <div className="mt-8 border-t border-kage-border/80 pt-4 font-mono text-[10px] text-kage-text-muted">
                  SQL RELATIONAL METRICS • ZERO FABRICATED DATA
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Section E: Final Cinematic Call to Action */}
        <section className="relative overflow-hidden py-24 sm:py-32 bg-black border-b border-kage-border">
          <div className="pointer-events-none absolute inset-0 manga-screentone-dense opacity-20" />
          <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <span className="font-mono text-xs tracking-widest text-neutral-400 uppercase">
              // 映画的・個人用アニメ目録 //
            </span>
            <h2 className="mt-4 text-3xl sm:text-6xl font-extrabold tracking-tighter text-white uppercase leading-[0.95]">
              Begin your anime archive.
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-sm sm:text-base text-kage-text-secondary">
              Step into a quiet, art-directed space built exclusively for your personal watching journey.
              Set up your library in seconds.
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                href={user ? "/dashboard" : "/register"}
                className="border border-white bg-white px-8 py-4 text-xs sm:text-sm font-bold tracking-wider text-black transition-all hover:bg-neutral-200 active:scale-95 shadow-tactile"
              >
                {user ? "OPEN YOUR DASHBOARD" : "CREATE FREE ACCOUNT"}
              </Link>
              <Link
                href={user ? "/collection" : "/login"}
                className="border border-kage-border bg-kage-surface px-8 py-4 text-xs sm:text-sm font-semibold tracking-wider text-white hover:border-kage-border-focus hover:bg-kage-surface-raised transition-all"
              >
                {user ? "VIEW COLLECTION" : "SIGN IN TO ARCHIVE"}
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-kage-border py-12 bg-kage-bg font-mono text-xs text-kage-text-muted">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between px-4 sm:flex-row sm:px-6 lg:px-8 gap-4">
          <div className="flex items-center space-x-3">
            <span className="flex h-6 w-6 items-center justify-center border border-white text-white font-bold text-[10px]">
              影
            </span>
            <span className="font-bold text-white tracking-widest">KAGE</span>
            <span>—</span>
            <span>Cinematic Personal Anime Library</span>
          </div>

          <div className="flex items-center space-x-6 text-[11px]">
            <span>PostgreSQL 16 Engine</span>
            <span>•</span>
            <span>Argon2id Auth</span>
            <span>•</span>
            <span>AniList Verified Metadata</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
