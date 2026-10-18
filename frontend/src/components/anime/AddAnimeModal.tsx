"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, AlertCircle, Film } from "lucide-react";
import { AnimeEntry, AnimeStatus, animeApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

import { CURATED_CLASSICS, CuratedAnime } from "@/lib/curated-anime";

interface AddAnimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnimeAdded: (anime: AnimeEntry) => void;
}

export function AddAnimeModal({ isOpen, onClose, onAnimeAdded }: AddAnimeModalProps) {
  const { reduceMotion } = useAuth();
  const [title, setTitle] = useState("");
  const [alternateTitle, setAlternateTitle] = useState("");
  const [posterUrl, setPosterUrl] = useState("");
  const [status, setStatus] = useState<AnimeStatus>("WATCHING");
  const [totalEpisodes, setTotalEpisodes] = useState<string>("");
  const [watchedEpisodes, setWatchedEpisodes] = useState<string>("0");
  const [rating, setRating] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [genresText, setGenresText] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleQuickFill = (preset: CuratedAnime) => {
    setTitle(preset.title);
    setAlternateTitle(preset.native);
    setPosterUrl(preset.cover);
    setTotalEpisodes(preset.episodes.toString());
    setGenresText(preset.genres.join(", "));
    setRating(Math.round(preset.score / 10).toString());
  };

  const resetForm = () => {
    setTitle("");
    setAlternateTitle("");
    setPosterUrl("");
    setStatus("WATCHING");
    setTotalEpisodes("");
    setWatchedEpisodes("0");
    setRating("");
    setNotes("");
    setGenresText("");
    setIsFavorite(false);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    const totalEp = totalEpisodes ? parseInt(totalEpisodes, 10) : undefined;
    const watchedEp = watchedEpisodes ? parseInt(watchedEpisodes, 10) : 0;
    const rateVal = rating ? parseInt(rating, 10) : undefined;

    if (totalEp !== undefined && watchedEp > totalEp) {
      setError(`Watched episodes (${watchedEp}) cannot exceed total episodes (${totalEp}).`);
      return;
    }

    const genres = genresText
      .split(",")
      .map((g) => g.trim())
      .filter(Boolean);

    setLoading(true);
    setError(null);

    try {
      const created = await animeApi.create({
        title: title.trim(),
        alternate_title: alternateTitle.trim() || undefined,
        poster_url: posterUrl.trim() || undefined,
        status,
        total_episodes: totalEp,
        watched_episodes: watchedEp,
        rating: rateVal,
        notes: notes.trim() || undefined,
        genres,
        is_favorite: isFavorite,
      });

      onAnimeAdded(created);
      resetForm();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create anime entry.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Modal Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.95, y: reduceMotion ? 0 : 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: reduceMotion ? 1 : 0.95, y: reduceMotion ? 0 : 15 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 w-full max-w-lg border border-kage-border bg-kage-surface p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-kage-border pb-4">
            <div className="flex items-center space-x-2">
              <span className="flex h-5 w-5 items-center justify-center border border-kage-text-primary text-[10px] font-mono">
                +
              </span>
              <h2 className="text-sm font-semibold tracking-wider text-kage-text-primary uppercase">
                Add Anime to Library
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-kage-text-muted hover:text-kage-text-primary"
              aria-label="Close modal"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Quick Fill Preset Strip */}
          <div className="mt-3.5 border-b border-kage-border pb-3">
            <span className="block font-mono text-[9px] uppercase tracking-wider text-kage-text-muted mb-1.5">
              QUICK FILL FROM ARCHIVAL CANON:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {CURATED_CLASSICS.slice(0, 6).map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleQuickFill(c)}
                  className="border border-kage-border bg-kage-bg px-2 py-0.5 font-mono text-[10px] text-kage-text-secondary hover:border-white hover:text-white transition-colors"
                >
                  + {c.title}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="mt-4 flex items-start space-x-2 border border-red-500/30 bg-red-950/20 p-3 text-xs text-red-200">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {/* Title */}
            <div>
              <label className="block font-mono text-[11px] uppercase tracking-wider text-kage-text-secondary">
                Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Neon Genesis Evangelion"
                className="mt-1 w-full border border-kage-border bg-kage-bg px-3 py-2 text-xs text-kage-text-primary placeholder:text-kage-text-muted focus:border-kage-border-focus focus:outline-none"
              />
            </div>

            {/* Alternate Title */}
            <div>
              <label className="block font-mono text-[11px] uppercase tracking-wider text-kage-text-secondary">
                Alternate Title / Original Name
              </label>
              <input
                type="text"
                value={alternateTitle}
                onChange={(e) => setAlternateTitle(e.target.value)}
                placeholder="e.g. 新世紀エヴァンゲリオン"
                className="mt-1 w-full border border-kage-border bg-kage-bg px-3 py-2 text-xs text-kage-text-primary placeholder:text-kage-text-muted focus:border-kage-border-focus focus:outline-none"
              />
            </div>

            {/* Status & Poster URL */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block font-mono text-[11px] uppercase tracking-wider text-kage-text-secondary">
                  Watch Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as AnimeStatus)}
                  className="mt-1 w-full border border-kage-border bg-kage-bg px-3 py-2 text-xs text-kage-text-primary focus:border-kage-border-focus focus:outline-none"
                >
                  <option value="WATCHING">Watching</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="PLANNED">Plan to Watch</option>
                  <option value="PAUSED">Paused</option>
                  <option value="DROPPED">Dropped</option>
                </select>
              </div>

              <div>
                <label className="block font-mono text-[11px] uppercase tracking-wider text-kage-text-secondary">
                  Rating (1 to 10)
                </label>
                <select
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                  className="mt-1 w-full border border-kage-border bg-kage-bg px-3 py-2 text-xs text-kage-text-primary focus:border-kage-border-focus focus:outline-none"
                >
                  <option value="">No Rating</option>
                  {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((r) => (
                    <option key={r} value={r}>
                      {r} - {r >= 9 ? "Masterpiece" : r >= 7 ? "Good" : r >= 5 ? "Average" : "Poor"}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Episode tracking */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block font-mono text-[11px] uppercase tracking-wider text-kage-text-secondary">
                  Episodes Watched
                </label>
                <input
                  type="number"
                  min="0"
                  value={watchedEpisodes}
                  onChange={(e) => setWatchedEpisodes(e.target.value)}
                  className="mt-1 w-full border border-kage-border bg-kage-bg px-3 py-2 text-xs font-mono text-kage-text-primary focus:border-kage-border-focus focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-mono text-[11px] uppercase tracking-wider text-kage-text-secondary">
                  Total Episodes (if known)
                </label>
                <input
                  type="number"
                  min="1"
                  value={totalEpisodes}
                  onChange={(e) => setTotalEpisodes(e.target.value)}
                  placeholder="e.g. 26"
                  className="mt-1 w-full border border-kage-border bg-kage-bg px-3 py-2 text-xs font-mono text-kage-text-primary placeholder:text-kage-text-muted focus:border-kage-border-focus focus:outline-none"
                />
              </div>
            </div>

            {/* Poster URL (HTTPS required, client-safe) */}
            <div>
              <label className="block font-mono text-[11px] uppercase tracking-wider text-kage-text-secondary">
                Poster Image URL (https only)
              </label>
              <input
                type="url"
                value={posterUrl}
                onChange={(e) => setPosterUrl(e.target.value)}
                placeholder="https://example.com/poster.jpg"
                className="mt-1 w-full border border-kage-border bg-kage-bg px-3 py-2 text-xs text-kage-text-primary placeholder:text-kage-text-muted focus:border-kage-border-focus focus:outline-none"
              />
            </div>

            {/* Genres */}
            <div>
              <label className="block font-mono text-[11px] uppercase tracking-wider text-kage-text-secondary">
                Genres (comma separated)
              </label>
              <input
                type="text"
                value={genresText}
                onChange={(e) => setGenresText(e.target.value)}
                placeholder="Sci-Fi, Psychological, Mecha"
                className="mt-1 w-full border border-kage-border bg-kage-bg px-3 py-2 text-xs text-kage-text-primary placeholder:text-kage-text-muted focus:border-kage-border-focus focus:outline-none"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block font-mono text-[11px] uppercase tracking-wider text-kage-text-secondary">
                Personal Notes & Impressions
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Key themes, favourite episodes, director notes..."
                className="mt-1 w-full border border-kage-border bg-kage-bg px-3 py-2 text-xs text-kage-text-primary placeholder:text-kage-text-muted focus:border-kage-border-focus focus:outline-none resize-none"
              />
            </div>

            {/* Favorite checkbox */}
            <div className="flex items-center space-x-2 pt-1">
              <input
                type="checkbox"
                id="isFavorite"
                checked={isFavorite}
                onChange={(e) => setIsFavorite(e.target.checked)}
                className="h-4 w-4 rounded border-kage-border bg-kage-bg text-white focus:ring-0"
              />
              <label htmlFor="isFavorite" className="text-xs text-kage-text-secondary select-none cursor-pointer">
                Mark as personal favorite ★
              </label>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 border-t border-kage-border pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs tracking-wider text-kage-text-muted hover:text-kage-text-primary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="border border-kage-text-primary bg-kage-text-primary px-5 py-2 text-xs font-semibold tracking-wider text-kage-bg transition-transform hover:opacity-90 active:scale-95 disabled:opacity-50"
              >
                {loading ? "Adding..." : "Add to Library"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
