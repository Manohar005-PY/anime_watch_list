"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Plus, CheckCircle2, Film, RotateCcw, Sparkles } from "lucide-react";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { useAuth } from "@/lib/auth-context";

export function InteractiveLibraryDemo() {
  const { reduceMotion } = useAuth();

  // Interactive demo specimen state
  const [watchedEpisodes, setWatchedEpisodes] = useState(24);
  const totalEpisodes = 26;
  const [status, setStatus] = useState<"WATCHING" | "COMPLETED">("WATCHING");
  const [isFavorite, setIsFavorite] = useState(true);
  const [rating, setRating] = useState(10);
  const [justCompleted, setJustCompleted] = useState(false);

  const handleIncrement = () => {
    if (watchedEpisodes < totalEpisodes) {
      const next = watchedEpisodes + 1;
      setWatchedEpisodes(next);
      if (next === totalEpisodes) {
        setStatus("COMPLETED");
        setJustCompleted(true);
        setTimeout(() => setJustCompleted(false), 3000);
      }
    }
  };

  const handleReset = () => {
    setWatchedEpisodes(20);
    setStatus("WATCHING");
    setJustCompleted(false);
  };

  const handleStatusChange = (newStatus: "WATCHING" | "COMPLETED") => {
    setStatus(newStatus);
    if (newStatus === "COMPLETED") {
      setWatchedEpisodes(totalEpisodes);
      setJustCompleted(true);
      setTimeout(() => setJustCompleted(false), 3000);
    } else {
      if (watchedEpisodes === totalEpisodes) {
        setWatchedEpisodes(totalEpisodes - 2);
      }
    }
  };

  const progressPercent = Math.round((watchedEpisodes / totalEpisodes) * 100);

  return (
    <div className="relative border border-kage-border bg-kage-surface p-6 sm:p-8 shadow-2xl overflow-hidden">
      {/* Decorative Technical Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-kage-border pb-4 font-mono text-[11px] text-kage-text-muted gap-2">
        <div className="flex items-center space-x-2">
          <span className="h-2 w-2 bg-white animate-pulse" />
          <span className="text-white font-semibold">LIVE PREVIEW</span>
          <span className="hidden sm:inline text-kage-text-muted">— TRY OUT THE CONTROLS</span>
        </div>
        <div className="flex items-center space-x-3">
          <span className="border border-kage-border px-2 py-0.5 text-[10px]">
            {status}
          </span>
          <button
            onClick={handleReset}
            className="flex items-center space-x-1 hover:text-white transition-colors"
            title="Reset specimen"
          >
            <RotateCcw className="h-3 w-3" />
            <span>RESET</span>
          </button>
        </div>
      </div>

      {/* Main Specimen Card Layout */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        {/* Specimen Poster */}
        <div className="md:col-span-5 relative group">
          <div className="relative aspect-[3/4] w-full max-w-[280px] mx-auto border border-kage-border bg-black overflow-hidden shadow-tactile">
            {/* Real verified AniList poster for Cowboy Bebop */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx1-GCsPm7waJ4kS.png"
              alt="Cowboy Bebop Demo Specimen"
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
            />

            {/* Corner Coordinates */}
            <span className="absolute top-2 left-2 border border-black/80 bg-black/80 px-1.5 py-0.5 font-mono text-[9px] text-white">
              CLASSIC // 1998
            </span>

            {/* Completion Celebration Overlay */}
            <AnimatePresence>
              {justCompleted && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-4 text-center z-20"
                >
                  <Sparkles className="h-8 w-8 text-white mb-2" />
                  <span className="font-mono text-xs font-bold text-white tracking-widest uppercase">
                    FINISHED!
                  </span>
                  <span className="mt-1 font-mono text-[10px] text-kage-text-secondary">
                    All 26 episodes watched.
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Interactive Controls & Live Metrics */}
        <div className="md:col-span-7 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono text-[10px] tracking-wider text-kage-text-muted uppercase">
                  SUNRISE // SHINICHIRO WATANABE
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-1">
                  Cowboy Bebop
                </h3>
                <p className="font-mono text-xs text-kage-text-secondary mt-0.5">
                  カウボーイビバップ • 1998
                </p>
              </div>

              {/* Favorite Toggle Button */}
              <button
                onClick={() => setIsFavorite(!isFavorite)}
                title={isFavorite ? "Favorited" : "Add to favorites"}
                className="p-2 border border-kage-border bg-kage-surface-raised hover:border-white transition-colors"
              >
                <Star
                  className={`h-4 w-4 ${
                    isFavorite ? "fill-white text-white" : "text-kage-text-muted hover:text-white"
                  }`}
                />
              </button>
            </div>

            <p className="mt-4 text-xs sm:text-sm text-kage-text-secondary leading-relaxed">
              See how smooth tracking your progress is. Click the +1 episode button or switch the
              status to see the instant update.
            </p>
          </div>

          {/* Live Progress Ring & Episode Stepper */}
          <div className="border border-kage-border bg-kage-bg p-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <ProgressRing
                value={progressPercent}
                size={58}
                strokeWidth={5}
                showLabel={false}
              />
              <div>
                <div className="font-mono text-[11px] text-kage-text-muted uppercase">
                  EPISODES WATCHED
                </div>
                <div className="flex items-baseline space-x-1.5 font-mono">
                  <span className="text-2xl font-extrabold text-white">
                    {watchedEpisodes}
                  </span>
                  <span className="text-sm text-kage-text-muted">/ {totalEpisodes}</span>
                  <span className="text-xs text-kage-text-secondary ml-2">
                    ({progressPercent}%)
                  </span>
                </div>
              </div>
            </div>

            {/* Quick +1 Stepper Button */}
            <motion.button
              whileTap={reduceMotion ? {} : { scale: 0.95 }}
              onClick={handleIncrement}
              disabled={watchedEpisodes >= totalEpisodes}
              className={`flex items-center space-x-2 px-5 py-3 text-xs font-mono font-bold tracking-wider transition-all ${
                watchedEpisodes >= totalEpisodes
                  ? "border border-kage-border bg-kage-surface text-kage-text-muted cursor-not-allowed"
                  : "border border-white bg-white text-black hover:bg-neutral-200 active:scale-95 shadow-tactile"
              }`}
            >
              <Plus className="h-4 w-4" />
              <span>+1 EPISODE</span>
            </motion.button>
          </div>

          {/* Status Segmented Switcher & Personal Rating */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <span className="block font-mono text-[10px] text-kage-text-muted uppercase mb-2">
                WATCH STATUS
              </span>
              <div className="flex border border-kage-border bg-kage-bg p-1 space-x-1 font-mono text-[11px]">
                <button
                  onClick={() => handleStatusChange("WATCHING")}
                  className={`flex-1 py-1.5 transition-colors ${
                    status === "WATCHING"
                      ? "bg-white text-black font-bold"
                      : "text-kage-text-muted hover:text-white"
                  }`}
                >
                  WATCHING
                </button>
                <button
                  onClick={() => handleStatusChange("COMPLETED")}
                  className={`flex-1 py-1.5 transition-colors ${
                    status === "COMPLETED"
                      ? "bg-white text-black font-bold"
                      : "text-kage-text-muted hover:text-white"
                  }`}
                >
                  COMPLETED
                </button>
              </div>
            </div>

            <div>
              <span className="block font-mono text-[10px] text-kage-text-muted uppercase mb-2">
                MY RATING
              </span>
              <div className="flex items-center space-x-1 border border-kage-border bg-kage-bg p-2 font-mono text-xs">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((starVal) => (
                  <button
                    key={starVal}
                    onClick={() => setRating(starVal)}
                    className="p-0.5 text-neutral-600 hover:text-white transition-colors"
                    title={`Rate ${starVal}/10`}
                  >
                    <Star
                      className={`h-3 w-3 ${
                        starVal <= rating ? "fill-white text-white" : "text-neutral-700"
                      }`}
                    />
                  </button>
                ))}
                <span className="text-white font-bold ml-auto">{rating}/10</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Disclaimer */}
      <div className="mt-6 border-t border-kage-border/80 pt-3 flex items-center justify-between font-mono text-[10px] text-kage-text-muted">
        <span>INTERACTIVE PREVIEW // CREATE AN ACCOUNT TO SAVE YOUR PROGRESS</span>
        <span>NO FAKE REVIEWS</span>
      </div>
    </div>
  );
}
