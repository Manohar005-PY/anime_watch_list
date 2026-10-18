"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Star, Plus, Film, CheckCircle2, Clock, PauseCircle, XCircle } from "lucide-react";
import { AnimeEntry, AnimeStatus } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

interface AnimeCardProps {
  anime: AnimeEntry;
  onSelect: (anime: AnimeEntry) => void;
  onIncrementProgress?: (anime: AnimeEntry) => void;
  onToggleFavorite?: (anime: AnimeEntry) => void;
  viewMode?: "grid" | "list";
}

export function AnimeCard({
  anime,
  onSelect,
  onIncrementProgress,
  onToggleFavorite,
  viewMode = "grid",
}: AnimeCardProps) {
  const { reduceMotion } = useAuth();
  const [imgError, setImgError] = useState(false);
  const [isIncrementing, setIsIncrementing] = useState(false);

  const getStatusIcon = (status: AnimeStatus) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle2 className="h-3 w-3" />;
      case "WATCHING":
        return <Film className="h-3 w-3" />;
      case "PLANNED":
        return <Clock className="h-3 w-3" />;
      case "PAUSED":
        return <PauseCircle className="h-3 w-3" />;
      case "DROPPED":
        return <XCircle className="h-3 w-3" />;
    }
  };

  const getStatusLabel = (status: AnimeStatus) => {
    switch (status) {
      case "WATCHING":
        return "Watching";
      case "COMPLETED":
        return "Completed";
      case "PLANNED":
        return "Planned";
      case "PAUSED":
        return "Paused";
      case "DROPPED":
        return "Dropped";
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

  if (viewMode === "list") {
    return (
      <div
        onClick={() => onSelect(anime)}
        className="group flex cursor-pointer items-center justify-between border border-kage-border bg-kage-surface px-4 py-3 transition-colors hover:border-kage-border-focus hover:bg-kage-surface-raised"
      >
        <div className="flex items-center space-x-4 min-w-0 flex-1">
          {/* Status icon */}
          <span className="flex items-center space-x-1.5 border border-kage-border px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-kage-text-secondary">
            {getStatusIcon(anime.status)}
            <span>{getStatusLabel(anime.status)}</span>
          </span>

          <div className="min-w-0 flex-1">
            <h3 className="truncate text-xs font-semibold tracking-wide text-kage-text-primary group-hover:underline">
              {anime.title}
            </h3>
            {anime.alternate_title && (
              <p className="truncate text-[10px] text-kage-text-muted">{anime.alternate_title}</p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-6 pl-4">
          {/* Episode progress */}
          <div className="flex items-center space-x-2 font-mono text-xs">
            <span className="text-kage-text-primary">{anime.watched_episodes}</span>
            <span className="text-kage-text-muted">/</span>
            <span className="text-kage-text-muted">
              {anime.total_episodes ? anime.total_episodes : "—"}
            </span>
          </div>

          {/* Rating */}
          <div className="hidden sm:flex items-center space-x-1 font-mono text-xs text-kage-text-secondary">
            <Star className={`h-3 w-3 ${anime.rating ? "fill-white text-white" : "text-kage-text-muted"}`} />
            <span>{anime.rating ? `${anime.rating}/10` : "—"}</span>
          </div>

          {/* Quick Increment button */}
          {(!anime.total_episodes || anime.watched_episodes < anime.total_episodes) && (
            <button
              onClick={handleIncrement}
              disabled={isIncrementing}
              title="Increment watched episode (+1)"
              className="border border-kage-border p-1 text-kage-text-muted transition-colors hover:border-kage-text-primary hover:text-kage-text-primary"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          )}

          {/* Favorite toggle */}
          <button
            onClick={handleFavorite}
            title={anime.is_favorite ? "Favorited" : "Add to favorites"}
            className="p-1 text-kage-text-muted transition-colors hover:text-kage-text-primary"
          >
            <Star
              className={`h-4 w-4 ${
                anime.is_favorite ? "fill-white text-white" : "text-kage-text-muted hover:text-white"
              }`}
            />
          </button>
        </div>
      </div>
    );
  }

  // Grid view (tactile manga panel)
  return (
    <motion.div
      onClick={() => onSelect(anime)}
      whileHover={reduceMotion ? {} : { y: -3, scale: 1.01 }}
      transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
      className="manga-panel group relative flex cursor-pointer flex-col overflow-hidden shadow-tactile"
    >
      {/* Artwork or designed graphic fallback */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-kage-bg">
        {anime.poster_url && !imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={anime.poster_url}
            alt={anime.title}
            onError={() => setImgError(true)}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center">
            {/* Procedural manga frame silhouette */}
            <div className="mb-3 flex h-16 w-16 items-center justify-center border border-kage-border text-kage-border-focus transition-colors group-hover:border-kage-text-secondary">
              <Film className="h-8 w-8 stroke-[1]" />
            </div>
            <span className="font-mono text-[10px] tracking-widest text-kage-text-muted uppercase">
              No Poster
            </span>
          </div>
        )}

        {/* Favorite Icon Badge */}
        <button
          onClick={handleFavorite}
          title={anime.is_favorite ? "Favorited" : "Favorite"}
          className="absolute right-2 top-2 z-10 border border-kage-border/80 bg-kage-bg/80 p-1.5 backdrop-blur-sm transition-transform active:scale-90"
        >
          <Star
            className={`h-3.5 w-3.5 ${
              anime.is_favorite ? "fill-white text-white" : "text-kage-text-muted hover:text-white"
            }`}
          />
        </button>

        {/* Status Badge */}
        <div className="absolute left-2 top-2 z-10 flex items-center space-x-1 border border-kage-border/90 bg-kage-bg/90 px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider text-kage-text-secondary backdrop-blur-sm">
          {getStatusIcon(anime.status)}
          <span>{getStatusLabel(anime.status)}</span>
        </div>

        {/* Progress bar overlay at bottom of poster */}
        {anime.total_episodes && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-kage-border">
            <div
              className="h-full bg-kage-accent"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}
      </div>

      {/* Metadata card footer */}
      <div className="flex flex-1 flex-col justify-between p-3.5">
        <div>
          <h3 className="line-clamp-1 text-xs font-semibold tracking-wide text-kage-text-primary group-hover:underline">
            {anime.title}
          </h3>
          {anime.alternate_title && (
            <p className="line-clamp-1 text-[10px] text-kage-text-muted">{anime.alternate_title}</p>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-kage-border/80 pt-2 font-mono text-[11px]">
          {/* Episodes count */}
          <div className="flex items-center space-x-1 text-kage-text-secondary">
            <span>EP</span>
            <span className="text-kage-text-primary font-bold">{anime.watched_episodes}</span>
            <span className="text-kage-text-muted">/</span>
            <span className="text-kage-text-muted">
              {anime.total_episodes ? anime.total_episodes : "—"}
            </span>
          </div>

          {/* Quick Increment button */}
          {(!anime.total_episodes || anime.watched_episodes < anime.total_episodes) && (
            <button
              onClick={handleIncrement}
              disabled={isIncrementing}
              title="Add 1 episode"
              className="flex items-center space-x-1 border border-kage-border px-2 py-0.5 text-[10px] text-kage-text-muted transition-colors hover:border-kage-text-primary hover:text-kage-text-primary"
            >
              <Plus className="h-3 w-3" />
              <span>1</span>
            </button>
          )}

          {/* Rating */}
          {anime.rating && (
            <div className="flex items-center space-x-1 text-kage-text-primary">
              <Star className="h-3 w-3 fill-white text-white" />
              <span>{anime.rating}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
