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
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { AnimeEntry, UserStats, animeApi, statsApi } from "@/lib/api";
import { AppHeader } from "@/components/layout/AppHeader";
import { AnimeCard } from "@/components/anime/AnimeCard";
import { AddAnimeModal } from "@/components/anime/AddAnimeModal";
import { AnimeDetailModal } from "@/components/anime/AnimeDetailModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProgressRing } from "@/components/ui/ProgressRing";

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
      // Refresh dashboard to sync counts and lists
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

  return (
    <div className="flex min-h-screen flex-col bg-kage-bg">
      <AppHeader onOpenAddModal={() => setIsAddOpen(true)} />

      <main className="flex-1 pb-16">
        {/* Editorial Subheader Banner */}
        <section className="border-b border-kage-border bg-kage-surface/50 py-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="font-mono text-[10px] tracking-widest text-kage-text-muted uppercase">
                  DASHBOARD // OVERVIEW
                </span>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-white uppercase">
                  {user?.display_name ? `${user.display_name}'s Library` : "Personal Archive"}
                </h1>
                <p className="mt-1 text-xs text-kage-text-secondary">
                  Persistent watch progress, rating indices, and authentic library telemetry.
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setIsAddOpen(true)}
                  className="flex items-center space-x-1.5 border border-kage-text-primary bg-kage-text-primary px-4 py-2 text-xs font-semibold tracking-wider text-kage-bg transition-transform hover:opacity-90 active:scale-95"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Anime</span>
                </button>
              </div>
            </div>

            {/* KPI Metric Strip */}
            {stats && (
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 border-t border-kage-border/80 pt-6">
                <div className="border border-kage-border bg-kage-bg p-3">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-kage-text-muted">
                    Total Titles
                  </span>
                  <div className="mt-1 font-mono text-lg font-bold text-white">
                    {stats.total_titles}
                  </div>
                </div>

                <div className="border border-kage-border bg-kage-bg p-3">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-kage-text-muted">
                    Watching
                  </span>
                  <div className="mt-1 font-mono text-lg font-bold text-white">
                    {stats.watching_count}
                  </div>
                </div>

                <div className="border border-kage-border bg-kage-bg p-3">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-kage-text-muted">
                    Completed
                  </span>
                  <div className="mt-1 font-mono text-lg font-bold text-white">
                    {stats.completed_count}
                  </div>
                </div>

                <div className="border border-kage-border bg-kage-bg p-3">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-kage-text-muted">
                    Planned
                  </span>
                  <div className="mt-1 font-mono text-lg font-bold text-white">
                    {stats.planned_count}
                  </div>
                </div>

                <div className="border border-kage-border bg-kage-bg p-3">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-kage-text-muted">
                    Episodes Watched
                  </span>
                  <div className="mt-1 font-mono text-lg font-bold text-white">
                    {stats.total_episodes_watched}
                  </div>
                </div>

                <div className="border border-kage-border bg-kage-bg p-3 flex items-center justify-between">
                  <div>
                    <span className="font-mono text-[9px] uppercase tracking-wider text-kage-text-muted">
                      Completion
                    </span>
                    <div className="mt-1 font-mono text-lg font-bold text-white">
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
              <div className="mt-6">
                <EmptyState
                  title="No active titles in progress"
                  description="Add an anime to your collection and set status to 'Watching' to track active episode progress here."
                  actionLabel="Add First Anime"
                  onAction={() => setIsAddOpen(true)}
                />
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

              <div className="mt-4 divide-y divide-kage-border border border-kage-border bg-kage-surface">
                {stats.recent_updates.map((anime) => (
                  <div
                    key={anime.id}
                    onClick={() => setSelectedAnime(anime)}
                    className="flex cursor-pointer items-center justify-between p-3.5 hover:bg-kage-surface-raised transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="border border-kage-border px-1.5 py-0.5 text-[9px] font-mono text-kage-text-secondary">
                          {anime.status}
                        </span>
                        <h3 className="truncate text-xs font-semibold text-white">
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
