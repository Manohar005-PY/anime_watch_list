"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Film,
  Plus,
  ArrowRight,
  Star,
  CheckCircle2,
  Clock,
  Compass,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { AnimeEntry, UserStats, animeApi, statsApi } from "@/lib/api";
import { AppHeader } from "@/components/layout/AppHeader";
import { AnimeCard } from "@/components/anime/AnimeCard";
import { AddAnimeModal } from "@/components/anime/AddAnimeModal";
import { AnimeDetailModal } from "@/components/anime/AnimeDetailModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { CURATED_CLASSICS, CuratedAnime } from "@/lib/curated-anime";

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading, reduceMotion } = useAuth();

  const [stats, setStats] = useState<UserStats | null>(null);
  const [watchingList, setWatchingList] = useState<AnimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedAnime, setSelectedAnime] = useState<AnimeEntry | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsData, watchingData] = await Promise.all([
        statsApi.get(),
        animeApi.list({ status: "WATCHING", page_size: 12, sort_by: "updated_at", sort_order: "desc" }),
      ]);
      setStats(statsData);
      setWatchingList(watchingData.items);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load dashboard data.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (user) {
      fetchDashboardData();
    }
  }, [user, authLoading, router, fetchDashboardData]);

  const handleIncrementProgress = async (anime: AnimeEntry) => {
    try {
      const updated = await animeApi.updateProgress(anime.id, anime.watched_episodes + 1);
      fetchDashboardData();
      if (selectedAnime?.id === anime.id) {
        setSelectedAnime(updated);
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to update progress");
    }
  };

  const handleToggleFavorite = async (anime: AnimeEntry) => {
    try {
      await animeApi.toggleFavorite(anime.id);
      fetchDashboardData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to toggle favorite");
    }
  };

  const handleQuickAdd = async (preset: CuratedAnime) => {
    try {
      await animeApi.create({
        title: preset.title,
        alternate_title: preset.native,
        poster_url: preset.cover,
        status: "WATCHING",
        total_episodes: preset.episodes,
        watched_episodes: 1,
        rating: Math.round(preset.score / 10),
        genres: preset.genres,
        is_favorite: true,
        notes: preset.tagline,
      });
      fetchDashboardData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to add anime.");
    }
  };

  const handleAnimeAdded = () => {
    fetchDashboardData();
  };

  const handleAnimeUpdated = () => {
    fetchDashboardData();
  };

  const handleAnimeDeleted = () => {
    setSelectedAnime(null);
    fetchDashboardData();
  };

  if (authLoading || (!user && loading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-kage-bg font-mono text-xs text-kage-text-muted">
        LOADING ARCHIVE...
      </div>
    );
  }

  // Top active watching entry for the Now Screening spotlight
  const spotlightAnime = watchingList.length > 0 ? watchingList[0] : null;

  return (
    <div className="flex min-h-screen flex-col bg-kage-bg text-kage-text-primary selection:bg-white selection:text-black">
      <AppHeader onOpenAddModal={() => setIsAddOpen(true)} />

      <main className="flex-1 pb-16">
        {/* Editorial Subheader Banner */}
        <section className="relative border-b border-kage-border bg-kage-surface/60 py-8">
          <div className="pointer-events-none absolute inset-0 manga-screentone opacity-20" />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center space-x-2 font-mono text-[10px] tracking-widest text-kage-text-muted uppercase">
                  <span className="h-1.5 w-1.5 bg-white" />
                  <span>DASHBOARD // TELEMETRY</span>
                  <span>•</span>
                  <span>個人用アニメ目録</span>
                </div>
                <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-white uppercase">
                  {user?.display_name ? `${user.display_name}'s Library` : "Personal Archive"}
                </h1>
                <p className="mt-1 text-xs text-kage-text-secondary">
                  Persistent watch progress, rating indices, and authentic library telemetry.
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setIsAddOpen(true)}
                  className="flex items-center space-x-2 border border-white bg-white px-5 py-2.5 text-xs font-bold tracking-wider text-black transition-all hover:bg-neutral-200 active:scale-95 shadow-tactile"
                >
                  <Plus className="h-4 w-4" />
                  <span>ADD TITLE</span>
                </button>
              </div>
            </div>

            {/* KPI Metric Strip */}
            {stats && (
              <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 border-t border-kage-border/80 pt-6">
                <div className="border border-kage-border bg-kage-bg p-3.5 shadow-tactile">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-kage-text-muted">
                    Total Titles
                  </span>
                  <div className="mt-1 font-mono text-xl font-extrabold text-white">
                    {stats.total_titles}
                  </div>
                </div>

                <div className="border border-kage-border bg-kage-bg p-3.5 shadow-tactile">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-kage-text-muted">
                    Watching
                  </span>
                  <div className="mt-1 font-mono text-xl font-extrabold text-white">
                    {stats.watching_count}
                  </div>
                </div>

                <div className="border border-kage-border bg-kage-bg p-3.5 shadow-tactile">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-kage-text-muted">
                    Completed
                  </span>
                  <div className="mt-1 font-mono text-xl font-extrabold text-white">
                    {stats.completed_count}
                  </div>
                </div>

                <div className="border border-kage-border bg-kage-bg p-3.5 shadow-tactile">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-kage-text-muted">
                    Planned
                  </span>
                  <div className="mt-1 font-mono text-xl font-extrabold text-white">
                    {stats.planned_count}
                  </div>
                </div>

                <div className="border border-kage-border bg-kage-bg p-3.5 shadow-tactile">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-kage-text-muted">
                    Episodes Watched
                  </span>
                  <div className="mt-1 font-mono text-xl font-extrabold text-white">
                    {stats.total_episodes_watched}
                  </div>
                </div>

                <div className="border border-kage-border bg-kage-bg p-3.5 flex items-center justify-between shadow-tactile">
                  <div>
                    <span className="font-mono text-[9px] uppercase tracking-wider text-kage-text-muted">
                      Completion
                    </span>
                    <div className="mt-1 font-mono text-xl font-extrabold text-white">
                      {stats.completion_rate}%
                    </div>
                  </div>
                  <ProgressRing value={stats.completion_rate} size={36} strokeWidth={3} showLabel={false} />
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Content Section */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-10 space-y-12">
          {/* Spotlight Hero: Currently Screening Anime */}
          {spotlightAnime && (
            <section className="border border-kage-border bg-kage-surface shadow-2xl p-6 sm:p-8">
              <div className="flex items-center justify-between border-b border-kage-border pb-3 font-mono text-[10px] text-kage-text-muted mb-6">
                <span className="flex items-center space-x-2 text-white font-bold">
                  <span className="h-2 w-2 bg-white animate-pulse" />
                  <span>NOW SCREENING // PRIORITY ARCHIVE</span>
                </span>
                <span>REC ● 24FPS</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                {/* Poster Artwork */}
                <div className="md:col-span-4 lg:col-span-3">
                  <div
                    onClick={() => setSelectedAnime(spotlightAnime)}
                    className="relative aspect-[3/4] w-full max-w-[240px] mx-auto border-2 border-white bg-black shadow-tactile-hover overflow-hidden cursor-pointer group"
                  >
                    {spotlightAnime.poster_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={spotlightAnime.poster_url}
                        alt={spotlightAnime.title}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center font-mono text-2xl text-neutral-600">
                        影
                      </div>
                    )}
                  </div>
                </div>

                {/* Metadata & Tactile Controls */}
                <div className="md:col-span-8 lg:col-span-9 flex flex-col justify-between space-y-6">
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="border border-kage-border bg-kage-bg px-2 py-0.5 font-mono text-[10px] text-white uppercase">
                          ACTIVE WATCHING
                        </span>
                        <h2
                          onClick={() => setSelectedAnime(spotlightAnime)}
                          className="text-2xl sm:text-3xl font-extrabold text-white uppercase tracking-tight mt-2 cursor-pointer hover:underline"
                        >
                          {spotlightAnime.title}
                        </h2>
                        {spotlightAnime.alternate_title && (
                          <p className="font-mono text-xs text-kage-text-muted mt-1">
                            {spotlightAnime.alternate_title}
                          </p>
                        )}
                      </div>

                      {spotlightAnime.rating && (
                        <div className="flex items-center space-x-1.5 border border-kage-border bg-kage-bg px-3 py-1 font-mono text-sm text-white">
                          <Star className="h-4 w-4 fill-white text-white" />
                          <span>{spotlightAnime.rating}/10</span>
                        </div>
                      )}
                    </div>

                    {spotlightAnime.notes && (
                      <p className="mt-4 text-xs sm:text-sm text-kage-text-secondary italic border-l-2 border-white pl-3 py-0.5">
                        &ldquo;{spotlightAnime.notes}&rdquo;
                      </p>
                    )}
                  </div>

                  {/* Progress Controller Bar */}
                  <div className="border border-kage-border bg-kage-bg p-5 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center space-x-4">
                      <ProgressRing
                        value={
                          spotlightAnime.total_episodes
                            ? Math.round(
                                (spotlightAnime.watched_episodes / spotlightAnime.total_episodes) * 100
                              )
                            : 0
                        }
                        size={52}
                        strokeWidth={4}
                        showLabel={false}
                      />
                      <div>
                        <span className="font-mono text-[10px] text-kage-text-muted uppercase">
                          WATCHED EPISODES
                        </span>
                        <div className="flex items-baseline space-x-2 font-mono">
                          <span className="text-2xl font-extrabold text-white">
                            {spotlightAnime.watched_episodes}
                          </span>
                          <span className="text-sm text-kage-text-muted">
                            / {spotlightAnime.total_episodes || "—"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      {(!spotlightAnime.total_episodes ||
                        spotlightAnime.watched_episodes < spotlightAnime.total_episodes) && (
                        <button
                          onClick={() => handleIncrementProgress(spotlightAnime)}
                          className="flex items-center space-x-2 border border-white bg-white px-5 py-2.5 text-xs font-mono font-bold tracking-wider text-black transition-all hover:bg-neutral-200 active:scale-95 shadow-tactile"
                        >
                          <Plus className="h-4 w-4" />
                          <span>+1 EPISODE</span>
                        </button>
                      )}

                      <button
                        onClick={() => setSelectedAnime(spotlightAnime)}
                        className="border border-kage-border bg-kage-surface px-4 py-2.5 text-xs font-mono text-white hover:border-white transition-colors"
                      >
                        VIEW DETAILS
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Currently Watching Grid */}
          <section>
            <div className="flex items-center justify-between border-b border-kage-border pb-3">
              <div className="flex items-center space-x-2">
                <Film className="h-4 w-4 text-white" />
                <h2 className="text-sm font-bold tracking-wider text-white uppercase">
                  Currently Watching
                </h2>
                <span className="font-mono text-xs text-kage-text-muted">
                  ({watchingList.length})
                </span>
              </div>
              <Link
                href="/collection?status=WATCHING"
                className="flex items-center space-x-1 text-xs text-kage-text-muted hover:text-white font-mono"
              >
                <span>View all in collection</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {watchingList.length > 0 ? (
              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {watchingList.map((anime) => (
                  <AnimeCard
                    key={anime.id}
                    anime={anime}
                    onSelect={(a) => setSelectedAnime(a)}
                    onIncrementProgress={handleIncrementProgress}
                    onToggleFavorite={handleToggleFavorite}
                  />
                ))}
              </div>
            ) : (
              <div className="mt-6 space-y-6">
                <EmptyState
                  title="No active titles in progress"
                  description="Add an anime to your collection and set status to 'Watching' to track active episode progress here."
                  actionLabel="Add Custom Title"
                  onAction={() => setIsAddOpen(true)}
                />

                {/* Archival Starters Tray for New Users */}
                <div className="border border-kage-border bg-kage-surface p-6">
                  <div className="flex items-center space-x-2 font-mono text-xs text-kage-text-muted border-b border-kage-border pb-3">
                    <Sparkles className="h-3.5 w-3.5 text-white" />
                    <span className="font-bold text-white uppercase">
                      One-Click Archival Starters
                    </span>
                    <span className="hidden sm:inline">— Populate your library with verified classics</span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                    {CURATED_CLASSICS.slice(0, 5).map((preset) => (
                      <div
                        key={preset.id}
                        className="border border-kage-border bg-kage-bg p-3 flex flex-col justify-between"
                      >
                        <div className="aspect-[3/4] w-full overflow-hidden bg-black border border-kage-border mb-2.5">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={preset.cover}
                            alt={preset.title}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        </div>
                        <div>
                          <h4 className="truncate text-xs font-bold text-white">
                            {preset.title}
                          </h4>
                          <span className="font-mono text-[10px] text-kage-text-muted">
                            {preset.episodes} eps • {preset.year}
                          </span>
                        </div>
                        <button
                          onClick={() => handleQuickAdd(preset)}
                          className="mt-3 flex items-center justify-center space-x-1 border border-white bg-white py-1.5 text-[10px] font-mono font-bold text-black hover:bg-neutral-200 transition-colors"
                        >
                          <Plus className="h-3 w-3" />
                          <span>ADD</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Favorites Showcase */}
          {stats?.favorite_titles && stats.favorite_titles.length > 0 && (
            <section>
              <div className="flex items-center justify-between border-b border-kage-border pb-3">
                <div className="flex items-center space-x-2">
                  <Star className="h-4 w-4 fill-white text-white" />
                  <h2 className="text-sm font-bold tracking-wider text-white uppercase">
                    Personal Favorites
                  </h2>
                  <span className="font-mono text-xs text-kage-text-muted">
                    ({stats.favorite_titles.length})
                  </span>
                </div>
                <Link
                  href="/collection?is_favorite=true"
                  className="flex items-center space-x-1 text-xs text-kage-text-muted hover:text-white font-mono"
                >
                  <span>Filter collection by favorites</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {stats.favorite_titles.map((anime) => (
                  <AnimeCard
                    key={anime.id}
                    anime={anime}
                    onSelect={(a) => setSelectedAnime(a)}
                    onIncrementProgress={handleIncrementProgress}
                    onToggleFavorite={handleToggleFavorite}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Recently Updated Activity */}
          {stats?.recent_updates && stats.recent_updates.length > 0 && (
            <section>
              <div className="flex items-center justify-between border-b border-kage-border pb-3">
                <div className="flex items-center space-x-2">
                  <Compass className="h-4 w-4 text-white" />
                  <h2 className="text-sm font-bold tracking-wider text-white uppercase">
                    Recently Updated Entries
                  </h2>
                </div>
                <Link
                  href="/collection?sort_by=updated_at&sort_order=desc"
                  className="flex items-center space-x-1 text-xs text-kage-text-muted hover:text-white font-mono"
                >
                  <span>Full Collection</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              <div className="mt-4 divide-y divide-kage-border border border-kage-border bg-kage-surface shadow-tactile">
                {stats.recent_updates.map((anime) => (
                  <div
                    key={anime.id}
                    onClick={() => setSelectedAnime(anime)}
                    className="flex cursor-pointer items-center justify-between p-4 hover:bg-kage-surface-raised transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="border border-kage-border px-1.5 py-0.5 text-[9px] font-mono text-kage-text-secondary uppercase">
                          {anime.status}
                        </span>
                        <h3 className="truncate text-xs font-bold text-white hover:underline">
                          {anime.title}
                        </h3>
                      </div>
                      <p className="mt-1 font-mono text-[10px] text-kage-text-muted">
                        Progress: {anime.watched_episodes} / {anime.total_episodes || "—"} eps
                      </p>
                    </div>

                    <div className="pl-4 font-mono text-[10px] text-kage-text-muted">
                      {new Date(anime.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Add Anime Modal */}
      <AddAnimeModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onAnimeAdded={handleAnimeAdded}
      />

      {/* Anime Detail / Edit Modal */}
      <AnimeDetailModal
        anime={selectedAnime}
        isOpen={Boolean(selectedAnime)}
        onClose={() => setSelectedAnime(null)}
        onAnimeUpdated={handleAnimeUpdated}
        onAnimeDeleted={handleAnimeDeleted}
      />
    </div>
  );
}
