"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Star, Plus, Film, CheckCircle2, Clock, PauseCircle, XCircle, Check } from "lucide-react";
import { AnimeEntry, AnimeStatus } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

interface AnimeCardProps {
  anime: AnimeEntry;
  onSelect: (anime: AnimeEntry) => void;
  onIncrementProgress?: (anime: AnimeEntry) => void;
  onUpdateStatus?: (anime: AnimeEntry, status: AnimeStatus) => void;
  onToggleFavorite?: (anime: AnimeEntry) => void;
  viewMode?: "grid" | "list";
}

export function AnimeCard({
  anime,
  onSelect,
  onIncrementProgress,
  onUpdateStatus,
  onToggleFavorite,
  viewMode = "grid",
}: AnimeCardProps) {
  const { reduceMotion } = useAuth();
  const [imgError, setImgError] = useState(false);
  const [isIncrementing, setIsIncrementing] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const getStatusIcon = (status: AnimeStatus) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle2 className="h-3 w-3 text-white" />;
      case "WATCHING":
        return <Film className="h-3 w-3 text-white" />;
      case "PLANNED":
        return <Clock className="h-3 w-3 text-neutral-400" />;
      case "PAUSED":
        return <PauseCircle className="h-3 w-3 text-neutral-400" />;
      case "DROPPED":
        return <XCircle className="h-3 w-3 text-neutral-400" />;
    }
  };

  const getStatusLabel = (status: AnimeStatus) => {
    switch (status) {
      case "WATCHING":
        return "Watching";
      case "COMPLETED":
        return "Completed";
      case "PLANNED":
        return "Plan to Watch";
      case "PAUSED":
        return "On Hold";
      case "DROPPED":
        return "Dropped";
    }
  };

  const handleMarkCompleted = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onUpdateStatus || isUpdatingStatus) return;
    setIsUpdatingStatus(true);
    try {
      await onUpdateStatus(anime, "COMPLETED");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleIncrement = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onIncrementProgress || isIncrementing) return;
    setIsIncrementing(true);
    try {
      await onIncrementProgress(anime);
    } finally {
      setIsIncrementing(false);
    }
  };

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite(anime);
    }
  };

  const progressPercent = anime.total_episodes
    ? Math.min(100, Math.round((anime.watched_episodes / anime.total_episodes) * 100))
    : 0;

  // List View: Editorial Horizontal Strip
  if (viewMode === "list") {
    return (
      <div
        onClick={() => onSelect(anime)}
        className="group flex cursor-pointer items-center justify-between border border-kage-border bg-kage-surface px-4 py-3 transition-all hover:border-white hover:bg-kage-surface-raised shadow-tactile"
      >
        <div className="flex items-center space-x-4 min-w-0 flex-1">
          {/* Miniature Poster Thumbnail */}
          <div className="relative h-12 w-9 flex-none overflow-hidden border border-kage-border bg-black">
            {anime.poster_url && !imgError ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={anime.poster_url}
                alt={anime.title}
                onError={() => setImgError(true)}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-mono text-[9px] text-neutral-600">
                影
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2.5">
              <span className="flex items-center space-x-1 border border-kage-border px-2 py-0.5 text-xs font-mono uppercase text-kage-text-secondary">
                {getStatusIcon(anime.status)}
                <span>{getStatusLabel(anime.status)}</span>
              </span>
              <h3 className="truncate text-sm sm:text-base font-bold text-white group-hover:underline">
                {anime.title}
              </h3>
            </div>
            {anime.alternate_title && (
              <p className="truncate text-xs text-kage-text-muted mt-0.5">
                {anime.alternate_title}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-3 sm:space-x-4 pl-4">
          {/* Episode Progress Counter */}
          <div className="flex items-center space-x-1.5 font-mono text-xs sm:text-sm">
            <span className="text-white font-bold">{anime.watched_episodes}</span>
            <span className="text-kage-text-muted">/</span>
            <span className="text-kage-text-muted">
              {anime.total_episodes ? anime.total_episodes : "—"}
            </span>
            <span className="hidden sm:inline text-kage-text-muted text-xs">
              ({progressPercent}%)
            </span>
          </div>

          {/* Quick Increment (+1) */}
          {(!anime.total_episodes || anime.watched_episodes < anime.total_episodes) && (
            <button
              onClick={handleIncrement}
              disabled={isIncrementing}
              title="Add 1 episode"
              aria-label={`Add 1 episode to ${anime.title}`}
              className="border border-kage-border bg-kage-surface-raised p-1.5 text-white hover:border-white hover:bg-white hover:text-black transition-colors"
            >
              <Plus className="h-4 w-4" />
            </button>
          )}

          {/* Direct Mark as Completed Button */}
          {anime.status !== "COMPLETED" ? (
            <button
              onClick={handleMarkCompleted}
              disabled={isUpdatingStatus}
              title="Mark as Completed"
              aria-label={`Mark ${anime.title} as completed`}
              className="flex items-center space-x-1.5 border border-kage-border bg-kage-surface-raised px-3 py-1 text-xs sm:text-sm font-mono text-neutral-300 hover:border-white hover:bg-white hover:text-black transition-colors"
            >
              <Check className="h-4 w-4" />
              <span className="hidden sm:inline">Mark Completed</span>
            </button>
          ) : (
            <span className="hidden sm:flex items-center space-x-1.5 font-mono text-xs sm:text-sm text-green-400">
              <Check className="h-4 w-4" />
              <span>Completed</span>
            </span>
          )}

          {/* Rating */}
          <div className="hidden sm:flex items-center space-x-1 font-mono text-xs text-white">
            <Star className={`h-3.5 w-3.5 ${anime.rating ? "fill-white text-white" : "text-neutral-700"}`} />
            <span>{anime.rating ? `${anime.rating}/10` : "—"}</span>
          </div>

          {/* Favorite Toggle */}
          <button
            onClick={handleFavorite}
            aria-label={anime.is_favorite ? "Remove from favorites" : "Add to favorites"}
            className="p-1.5 text-neutral-500 hover:text-white transition-colors"
          >
            <Star
              className={`h-4 w-4 ${
                anime.is_favorite ? "fill-white text-white" : "text-neutral-700 hover:text-white"
              }`}
            />
          </button>
        </div>
      </div>
    );
  }

  // Grid View: Tactile Manga Panel with Corner Crosshairs
  return (
    <motion.div
      onClick={() => onSelect(anime)}
      whileHover={reduceMotion ? {} : { y: -4, scale: 1.015 }}
      transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
      className="manga-panel group relative flex cursor-pointer flex-col overflow-hidden shadow-tactile border border-kage-border hover:border-white transition-all bg-kage-surface"
    >
      {/* Artwork or Sophisticated Typographic Fallback */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-black">
        {anime.poster_url && !imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={anime.poster_url}
            alt={anime.title}
            onError={() => setImgError(true)}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-106"
          />
        ) : (
          <div className="relative flex h-full w-full flex-col justify-between p-5 manga-screentone">
            <div className="flex items-center justify-between font-mono text-xs text-neutral-500 border-b border-neutral-800 pb-2">
              <span>ANIME</span>
              <span>NO IMAGE</span>
            </div>
            <div className="text-center py-4">
              <span className="font-mono text-4xl font-extrabold text-neutral-800 tracking-tighter">
                影
              </span>
              <p className="mt-2 text-sm font-bold text-neutral-300 line-clamp-2 px-2">
                {anime.title}
              </p>
            </div>
            <div className="border-t border-neutral-800 pt-2 font-mono text-xs text-neutral-500 flex justify-between">
              <span>Ep: {anime.watched_episodes}</span>
              <span>{getStatusLabel(anime.status)}</span>
            </div>
          </div>
        )}

        {/* Favorite Icon Badge */}
        <button
          onClick={handleFavorite}
          aria-label={anime.is_favorite ? "Remove from favorites" : "Add to favorites"}
          className="absolute right-2 top-2 z-10 border border-black/80 bg-black/80 p-1.5 backdrop-blur-xs transition-transform active:scale-90"
        >
          <Star
            className={`h-4 w-4 ${
              anime.is_favorite ? "fill-white text-white" : "text-neutral-500 hover:text-white"
            }`}
          />
        </button>

        {/* Status Badge */}
        <div className="absolute left-2 top-2 z-10 flex items-center space-x-1.5 border border-black/80 bg-black/80 px-2.5 py-1 text-xs font-mono tracking-wider text-white backdrop-blur-xs">
          {getStatusIcon(anime.status)}
          <span>{getStatusLabel(anime.status)}</span>
        </div>

        {/* Progress Bar Overlay at Bottom of Poster */}
        {anime.total_episodes && (
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-neutral-900 border-t border-black">
            <div
              className="h-full bg-white transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}
      </div>

      {/* Card Content & Metadata */}
      <div className="flex flex-1 flex-col justify-between p-4 bg-kage-surface-raised">
        <div>
          <h3 className="line-clamp-1 text-sm sm:text-base font-bold text-white group-hover:underline">
            {anime.title}
          </h3>
          {anime.alternate_title && (
            <p className="line-clamp-1 font-mono text-xs text-kage-text-muted mt-1">
              {anime.alternate_title}
            </p>
          )}
        </div>

        {/* Action Controls & Metric Strip */}
        <div className="mt-3.5 flex items-center justify-between border-t border-kage-border/80 pt-2.5 font-mono text-xs sm:text-sm">
          {/* Episode Counter */}
          <div className="flex items-center space-x-1 text-kage-text-secondary">
            <span>Ep</span>
            <span className="text-white font-bold">{anime.watched_episodes}</span>
            <span className="text-neutral-500">/</span>
            <span className="text-neutral-400">
              {anime.total_episodes ? anime.total_episodes : "—"}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {/* Quick Increment (+1) Button */}
            {(!anime.total_episodes || anime.watched_episodes < anime.total_episodes) && (
              <button
                onClick={handleIncrement}
                disabled={isIncrementing}
                title="Add 1 episode"
                aria-label={`Add 1 episode to ${anime.title}`}
                className="flex items-center space-x-0.5 border border-kage-border bg-black px-2 py-1 text-xs font-bold text-white transition-colors hover:border-white hover:bg-white hover:text-black"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>1</span>
              </button>
            )}

            {/* Direct Status Update to Completed */}
            {anime.status !== "COMPLETED" ? (
              <button
                onClick={handleMarkCompleted}
                disabled={isUpdatingStatus}
                title="Mark as Completed"
                aria-label={`Mark ${anime.title} as completed`}
                className="flex items-center space-x-1 border border-kage-border bg-black px-2.5 py-1 text-xs font-medium text-neutral-300 transition-colors hover:border-white hover:bg-white hover:text-black"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Done</span>
              </button>
            ) : (
              <span className="flex items-center space-x-1 text-xs text-green-400 font-mono font-medium" title="Completed">
                <Check className="h-3.5 w-3.5" />
                <span>Done</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
