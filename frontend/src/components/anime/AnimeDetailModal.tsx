"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Star,
  Film,
  Trash2,
  Calendar,
  Save,
  Plus,
  Minus,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { AnimeEntry, AnimeStatus, animeApi, refreshApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

interface AnimeDetailModalProps {
  anime: AnimeEntry | null;
  isOpen: boolean;
  onClose: () => void;
  onAnimeUpdated: (updated: AnimeEntry) => void;
  onAnimeDeleted: (id: string) => void;
}

export function AnimeDetailModal({
  anime,
  isOpen,
  onClose,
  onAnimeUpdated,
  onAnimeDeleted,
}: AnimeDetailModalProps) {
  const { reduceMotion } = useAuth();
  const [imgError, setImgError] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState(anime?.title || "");
  const [alternateTitle, setAlternateTitle] = useState(anime?.alternate_title || "");
  const [status, setStatus] = useState<AnimeStatus>(anime?.status || "WATCHING");
  const [watchedEpisodes, setWatchedEpisodes] = useState<number>(anime?.watched_episodes || 0);
  const [totalEpisodes, setTotalEpisodes] = useState<string>(
    anime?.total_episodes ? anime.total_episodes.toString() : ""
  );
  const [rating, setRating] = useState<string>(anime?.rating ? anime.rating.toString() : "");
  const [notes, setNotes] = useState(anime?.notes || "");
  const [posterUrl, setPosterUrl] = useState(anime?.poster_url || "");
  const [isFavorite, setIsFavorite] = useState(anime?.is_favorite || false);

  // Sync state when selected anime changes
  React.useEffect(() => {
    if (anime) {
      setTitle(anime.title);
      setAlternateTitle(anime.alternate_title || "");
      setStatus(anime.status);
      setWatchedEpisodes(anime.watched_episodes);
      setTotalEpisodes(anime.total_episodes ? anime.total_episodes.toString() : "");
      setRating(anime.rating ? anime.rating.toString() : "");
      setNotes(anime.notes || "");
      setPosterUrl(anime.poster_url || "");
      setIsFavorite(anime.is_favorite);
      setIsEditing(false);
      setConfirmDelete(false);
      setError(null);
      setImgError(false);
    }
  }, [anime]);

  if (!isOpen || !anime) return null;

  const handleProgressChange = async (newVal: number) => {
    const totalEp = anime.total_episodes;
    if (newVal < 0) return;
    if (totalEp !== undefined && totalEp !== null && newVal > totalEp) return;

    setWatchedEpisodes(newVal);
    try {
      const updated = await animeApi.updateProgress(anime.id, newVal);
      onAnimeUpdated(updated);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update progress";
      setError(msg);
      setWatchedEpisodes(anime.watched_episodes);
    }
  };

  const handleStatusChange = async (newStatus: AnimeStatus) => {
    setStatus(newStatus);
    try {
      const updated = await animeApi.updateStatus(anime.id, newStatus);
      onAnimeUpdated(updated);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update status";
      setError(msg);
      setStatus(anime.status);
    }
  };

  const handleToggleFavorite = async () => {
    const nextVal = !isFavorite;
    setIsFavorite(nextVal);
    try {
      const updated = await animeApi.toggleFavorite(anime.id);
      onAnimeUpdated(updated);
    } catch {
      setIsFavorite(!nextVal);
    }
  };

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const totalEp = totalEpisodes ? parseInt(totalEpisodes, 10) : undefined;
    const rateVal = rating ? parseInt(rating, 10) : undefined;

    if (totalEp !== undefined && watchedEpisodes > totalEp) {
      setError(`Watched episodes (${watchedEpisodes}) cannot exceed total episodes (${totalEp}).`);
      setLoading(false);
      return;
    }

    try {
      const updated = await animeApi.update(anime.id, {
        title: title.trim(),
        alternate_title: alternateTitle.trim() || undefined,
        status,
        total_episodes: totalEp,
        watched_episodes: watchedEpisodes,
        rating: rateVal,
        notes: notes.trim() || undefined,
        poster_url: posterUrl.trim() || undefined,
        is_favorite: isFavorite,
      });

      onAnimeUpdated(updated);
      setIsEditing(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save anime details.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await animeApi.delete(anime.id);
      onAnimeDeleted(anime.id);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete anime.";
      setError(msg);
      setLoading(false);
    }
  };

  const handleRefreshMetadata = async () => {
    if (!anime) return;
    try {
      setRefreshing(true);
      setRefreshMessage(null);
      const res = await refreshApi.refreshAnime(anime.id);
      setRefreshMessage(res.message);
      const updated = await animeApi.get(anime.id);
      onAnimeUpdated(updated);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to sync metadata.";
      setRefreshMessage(`Sync error: ${msg}`);
    } finally {
      setRefreshing(false);
    }
  };

  const progressPercent = anime.total_episodes
    ? Math.min(100, Math.round((watchedEpisodes / anime.total_episodes) * 100))
    : 0;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/85 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.95, y: reduceMotion ? 0 : 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: reduceMotion ? 1 : 0.95, y: reduceMotion ? 0 : 20 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 w-full max-w-2xl border border-kage-border bg-kage-surface p-6 shadow-2xl max-h-[92vh] overflow-y-auto"
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between border-b border-kage-border pb-3">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs uppercase tracking-widest text-kage-text-muted">
                SHOW DETAILS
              </span>
              <span className="text-kage-border">/</span>
              <span className="font-mono text-xs text-kage-text-secondary">{anime.status}</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleToggleFavorite}
                title={isFavorite ? "Favorited" : "Favorite"}
                className="p-1 text-kage-text-muted transition-colors hover:text-white"
              >
                <Star
                  className={`h-4 w-4 ${isFavorite ? "fill-white text-white" : "text-kage-text-muted"}`}
                />
              </button>
              <button
                onClick={onClose}
                className="p-1 text-kage-text-muted hover:text-kage-text-primary"
                aria-label="Close dialog"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-4 flex items-start space-x-2 border border-red-500/30 bg-red-950/20 p-3 text-xs text-red-200">
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {!isEditing ? (
            /* View Mode */
            <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-3">
              {/* Left Column: Poster / Artwork */}
              <div className="sm:col-span-1">
                <div className="relative aspect-[3/4] w-full overflow-hidden border border-kage-border bg-kage-bg">
                  {anime.poster_url && !imgError ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={anime.poster_url}
                      alt={anime.title}
                      onError={() => setImgError(true)}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center p-4 text-center">
                      <Film className="h-10 w-10 stroke-[1] text-kage-border-focus" />
                      <span className="mt-2 font-mono text-[9px] tracking-widest text-kage-text-muted uppercase">
                        No Image
                      </span>
                    </div>
                  )}
                </div>

                {/* Progress bar */}
                {anime.total_episodes && (
                  <div className="mt-3">
                    <div className="flex justify-between font-mono text-[10px] text-kage-text-muted">
                      <span>WATCHED</span>
                      <span>{progressPercent}%</span>
                    </div>
                    <div className="mt-1 h-1.5 w-full bg-kage-border">
                      <div className="h-full bg-white transition-all" style={{ width: `${progressPercent}%` }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Right Columns: Metadata & Controls */}
              <div className="space-y-5 sm:col-span-2">
                <div>
                  <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-kage-text-primary">
                    {anime.title}
                  </h1>
                  {anime.alternate_title && (
                    <p className="font-mono text-xs sm:text-sm text-kage-text-muted mt-0.5">
                      {anime.alternate_title}
                    </p>
                  )}
                </div>

                {/* Metadata Conflict Notice */}
                {anime.metadata_sync_status === "CONFLICT_EPISODES" && (
                  <div className="border border-amber-500/40 bg-amber-950/20 p-3.5 flex items-start space-x-2.5 text-xs sm:text-sm text-amber-300">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Progress Protected:</span> You&apos;ve watched {anime.watched_episodes} episodes, but the database says there are only {anime.total_episodes} episodes total. We kept your progress safe.
                    </div>
                  </div>
                )}

                {/* Refresh Message Feedback */}
                {refreshMessage && (
                  <div className="border border-kage-border bg-kage-bg p-2.5 text-xs sm:text-sm font-mono text-white flex items-center justify-between">
                    <span>{refreshMessage}</span>
                    <button
                      type="button"
                      onClick={() => setRefreshMessage(null)}
                      className="text-kage-text-muted hover:text-white text-xs"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Interactive Status Selector */}
                <div>
                  <span className="block font-mono text-xs uppercase tracking-wider text-kage-text-muted mb-2">
                    Status
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {([
                      { value: "WATCHING", label: "Watching" },
                      { value: "COMPLETED", label: "Completed" },
                      { value: "PLANNED", label: "Plan to Watch" },
                      { value: "PAUSED", label: "On Hold" },
                      { value: "DROPPED", label: "Dropped" },
                    ] as const).map(({ value: st, label }) => (
                      <button
                        key={st}
                        onClick={() => handleStatusChange(st as AnimeStatus)}
                        className={`border px-3 py-1.5 text-xs sm:text-sm font-mono tracking-wider transition-colors ${
                          status === st
                            ? "border-kage-text-primary bg-kage-text-primary text-kage-bg font-semibold"
                            : "border-kage-border bg-kage-bg text-kage-text-secondary hover:border-kage-border-focus hover:text-kage-text-primary"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Episode Progress Stepper */}
                <div className="border border-kage-border bg-kage-bg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono text-xs uppercase tracking-wider text-kage-text-muted">
                        Episodes Watched
                      </span>
                      <div className="mt-1 flex items-baseline space-x-1.5 font-mono text-xl font-bold text-kage-text-primary">
                        <span>{watchedEpisodes}</span>
                        <span className="text-sm text-kage-text-muted">
                          / {anime.total_episodes ? anime.total_episodes : "—"}
                        </span>
                      </div>
                    </div>

                    {/* Stepper controls */}
                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => handleProgressChange(watchedEpisodes - 1)}
                        disabled={watchedEpisodes <= 0}
                        className="flex h-9 w-9 items-center justify-center border border-kage-border text-kage-text-muted hover:border-kage-text-primary hover:text-white disabled:opacity-30"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleProgressChange(watchedEpisodes + 1)}
                        disabled={Boolean(anime.total_episodes && watchedEpisodes >= anime.total_episodes)}
                        className="flex h-9 w-9 items-center justify-center border border-kage-border text-kage-text-muted hover:border-kage-text-primary hover:text-white disabled:opacity-30"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Rating & Genres */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="block font-mono text-xs uppercase tracking-wider text-kage-text-muted">
                      My Rating
                    </span>
                    <div className="mt-1 flex items-center space-x-1.5 font-mono text-base font-semibold text-kage-text-primary">
                      <Star className={`h-4 w-4 ${anime.rating ? "fill-white text-white" : "text-kage-text-muted"}`} />
                      <span>{anime.rating ? `${anime.rating} / 10` : "Unrated"}</span>
                    </div>
                  </div>

                  {anime.genres && anime.genres.length > 0 && (
                    <div>
                      <span className="block font-mono text-xs uppercase tracking-wider text-kage-text-muted">
                        Genres
                      </span>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {anime.genres.map((g) => (
                          <span
                            key={g}
                            className="border border-kage-border bg-kage-bg px-2.5 py-0.5 text-xs font-mono text-kage-text-secondary"
                          >
                            {g}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Notes */}
                {anime.notes && (
                  <div>
                    <span className="block font-mono text-xs uppercase tracking-wider text-kage-text-muted">
                      My Notes
                    </span>
                    <p className="mt-1 border-l-2 border-kage-border-focus pl-3 text-sm sm:text-base text-kage-text-secondary leading-relaxed">
                      {anime.notes}
                    </p>
                  </div>
                )}

                {/* Timestamps & Metadata Tracking */}
                <div className="flex flex-wrap items-center gap-3 border-t border-kage-border/80 pt-3 font-mono text-xs text-kage-text-muted">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Added: {new Date(anime.created_at).toLocaleDateString()}</span>
                  </div>
                  {anime.completed_at && (
                    <div>
                      <span>Finished: {new Date(anime.completed_at).toLocaleDateString()}</span>
                    </div>
                  )}
                  {anime.metadata_provider && (
                    <div className="flex items-center space-x-1 border border-kage-border px-2 py-0.5 text-kage-text-secondary">
                      <span>Source: {anime.metadata_provider}</span>
                      {anime.metadata_last_checked_at && (
                        <span>
                          • Updated: {new Date(anime.metadata_last_checked_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Action Bar */}
                <div className="flex items-center justify-between border-t border-kage-border pt-4">
                  {confirmDelete ? (
                    <div className="flex items-center space-x-2">
                      <span className="text-xs sm:text-sm text-red-400">Permanently delete?</span>
                      <button
                        onClick={handleDelete}
                        disabled={loading}
                        className="border border-red-500 bg-red-950 px-3 py-1.5 text-xs sm:text-sm font-semibold text-red-200 hover:bg-red-900"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setConfirmDelete(false)}
                        className="px-2.5 py-1.5 text-xs sm:text-sm text-kage-text-muted hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(true)}
                      className="flex items-center space-x-1.5 text-xs sm:text-sm text-kage-text-muted hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Delete</span>
                    </button>
                  )}

                  <div className="flex items-center space-x-2.5">
                    <button
                      type="button"
                      onClick={handleRefreshMetadata}
                      disabled={refreshing}
                      className="flex items-center space-x-1.5 border border-kage-border bg-kage-bg px-3.5 py-2 text-xs sm:text-sm font-mono text-kage-text-secondary hover:border-white hover:text-white disabled:opacity-40 transition-colors"
                    >
                      <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                      <span>{refreshing ? "Refreshing..." : "Refresh Details"}</span>
                    </button>

                    <button
                      onClick={() => setIsEditing(true)}
                      className="border border-kage-border bg-kage-surface-raised px-4 py-2 text-xs sm:text-sm font-semibold tracking-wider text-kage-text-primary hover:border-white transition-colors"
                    >
                      Edit Show
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Edit Form */
            <form onSubmit={handleSaveDetails} className="mt-4 space-y-4">
              <div>
                <label className="block font-mono text-[11px] uppercase tracking-wider text-kage-text-secondary">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 w-full border border-kage-border bg-kage-bg px-3 py-2 text-xs text-kage-text-primary focus:border-kage-border-focus focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-mono text-[11px] uppercase tracking-wider text-kage-text-secondary">
                  Alternate Title
                </label>
                <input
                  type="text"
                  value={alternateTitle}
                  onChange={(e) => setAlternateTitle(e.target.value)}
                  className="mt-1 w-full border border-kage-border bg-kage-bg px-3 py-2 text-xs text-kage-text-primary focus:border-kage-border-focus focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-[11px] uppercase tracking-wider text-kage-text-secondary">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as AnimeStatus)}
                    className="mt-1 w-full border border-kage-border bg-kage-bg px-3 py-2 text-xs text-kage-text-primary focus:border-kage-border-focus focus:outline-none"
                  >
                    <option value="WATCHING">Watching</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="PLANNED">Plan to Watch</option>
                    <option value="PAUSED">On Hold</option>
                    <option value="DROPPED">Dropped</option>
                  </select>
                </div>

                <div>
                  <label className="block font-mono text-[11px] uppercase tracking-wider text-kage-text-secondary">
                    Rating
                  </label>
                  <select
                    value={rating}
                    onChange={(e) => setRating(e.target.value)}
                    className="mt-1 w-full border border-kage-border bg-kage-bg px-3 py-2 text-xs text-kage-text-primary focus:border-kage-border-focus focus:outline-none"
                  >
                    <option value="">No Rating</option>
                    {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((r) => (
                      <option key={r} value={r}>
                        {r} / 10
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-[11px] uppercase tracking-wider text-kage-text-secondary">
                    Episodes Watched
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={watchedEpisodes}
                    onChange={(e) => setWatchedEpisodes(parseInt(e.target.value || "0", 10))}
                    className="mt-1 w-full border border-kage-border bg-kage-bg px-3 py-2 text-xs font-mono text-kage-text-primary focus:border-kage-border-focus focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[11px] uppercase tracking-wider text-kage-text-secondary">
                    Total Episodes
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={totalEpisodes}
                    onChange={(e) => setTotalEpisodes(e.target.value)}
                    className="mt-1 w-full border border-kage-border bg-kage-bg px-3 py-2 text-xs font-mono text-kage-text-primary focus:border-kage-border-focus focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono text-[11px] uppercase tracking-wider text-kage-text-secondary">
                  Poster Image URL
                </label>
                <input
                  type="url"
                  value={posterUrl}
                  onChange={(e) => setPosterUrl(e.target.value)}
                  className="mt-1 w-full border border-kage-border bg-kage-bg px-3 py-2 text-xs text-kage-text-primary focus:border-kage-border-focus focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-mono text-[11px] uppercase tracking-wider text-kage-text-secondary">
                  My Notes
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1 w-full border border-kage-border bg-kage-bg px-3 py-2 text-xs text-kage-text-primary focus:border-kage-border-focus focus:outline-none resize-none"
                />
              </div>

              <div className="flex justify-end space-x-3 border-t border-kage-border pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-xs text-kage-text-muted hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center space-x-1.5 border border-kage-text-primary bg-kage-text-primary px-4 py-2 text-xs font-semibold text-kage-bg hover:opacity-90 active:scale-95 disabled:opacity-50"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>{loading ? "Saving..." : "Save Changes"}</span>
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
