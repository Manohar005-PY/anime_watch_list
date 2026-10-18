"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, ChevronLeft, ChevronRight, Film } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { AnimeEntry, AnimeStatus, animeApi } from "@/lib/api";
import { AppHeader } from "@/components/layout/AppHeader";
import { FilterBar } from "@/components/anime/FilterBar";
import { AnimeCard } from "@/components/anime/AnimeCard";
import { AddAnimeModal } from "@/components/anime/AddAnimeModal";
import { AnimeDetailModal } from "@/components/anime/AnimeDetailModal";
import { EmptyState } from "@/components/ui/EmptyState";

function CollectionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  // State from URL or defaults
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [statusFilter, setStatusFilter] = useState<AnimeStatus | "ALL">(
    (searchParams.get("status") as AnimeStatus) || "ALL"
  );
  const [ratingFilter, setRatingFilter] = useState<number | null>(
    searchParams.get("rating") ? parseInt(searchParams.get("rating")!, 10) : null
  );
  const [sortBy, setSortBy] = useState(searchParams.get("sort_by") || "updated_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(
    (searchParams.get("sort_order") as "asc" | "desc") || "desc"
  );
  const [viewMode, setViewMode] = useState<"grid" | "list">(
    user?.preferences?.display_mode || "grid"
  );
  const [page, setPage] = useState(1);

  const [animeList, setAnimeList] = useState<AnimeEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedAnime, setSelectedAnime] = useState<AnimeEntry | null>(null);

  const fetchAnime = useCallback(async () => {
    try {
      setLoading(true);
      const res = await animeApi.list({
        status: statusFilter === "ALL" ? undefined : statusFilter,
        rating: ratingFilter || undefined,
        q: search.trim() || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
        page,
        page_size: 24,
      });
      setAnimeList(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (err: unknown) {
      console.error("Failed to load anime collection:", err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, ratingFilter, search, sortBy, sortOrder, page]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (user) {
      fetchAnime();
    }
  }, [user, authLoading, router, fetchAnime]);

  const handleIncrementProgress = async (anime: AnimeEntry) => {
    try {
      const updated = await animeApi.updateProgress(anime.id, anime.watched_episodes + 1);
      setAnimeList((prev) => prev.map((item) => (item.id === anime.id ? updated : item)));
      if (selectedAnime?.id === anime.id) {
        setSelectedAnime(updated);
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to update progress");
    }
  };

  const handleToggleFavorite = async (anime: AnimeEntry) => {
    try {
      const updated = await animeApi.toggleFavorite(anime.id);
      setAnimeList((prev) => prev.map((item) => (item.id === anime.id ? updated : item)));
      if (selectedAnime?.id === anime.id) {
        setSelectedAnime(updated);
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to toggle favorite");
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-kage-bg">
      <AppHeader onOpenAddModal={() => setIsAddOpen(true)} />

      <main className="flex-1 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8">
          {/* Header Title */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-kage-border pb-6">
            <div>
              <span className="font-mono text-[10px] tracking-widest text-kage-text-muted uppercase">
                COLLECTION // INDEX
              </span>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-white uppercase">
                Personal Archive
              </h1>
              <p className="mt-1 text-xs text-kage-text-secondary">
                {total} {total === 1 ? "title" : "titles"} registered in your private collection.
              </p>
            </div>

            <button
              onClick={() => setIsAddOpen(true)}
              className="flex items-center space-x-1.5 border border-kage-text-primary bg-kage-text-primary px-4 py-2 text-xs font-semibold tracking-wider text-kage-bg transition-transform hover:opacity-90 active:scale-95"
            >
              <Plus className="h-4 w-4" />
              <span>Add Anime</span>
            </button>
          </div>

          {/* Filter Bar */}
          <div className="mt-6">
            <FilterBar
              search={search}
              onSearchChange={(v) => {
                setSearch(v);
                setPage(1);
              }}
              statusFilter={statusFilter}
              onStatusFilterChange={(s) => {
                setStatusFilter(s);
                setPage(1);
              }}
              ratingFilter={ratingFilter}
              onRatingFilterChange={(r) => {
                setRatingFilter(r);
                setPage(1);
              }}
              sortBy={sortBy}
              onSortByChange={setSortBy}
              sortOrder={sortOrder}
              onSortOrderChange={setSortOrder}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />
          </div>

          {/* Anime Items Grid / List */}
          <div className="mt-6">
            {loading ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {Array.from({ length: 12 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="border border-kage-border bg-kage-surface aspect-[3/4] animate-pulse"
                  />
                ))}
              </div>
            ) : animeList.length > 0 ? (
              <>
                {viewMode === "grid" ? (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                    {animeList.map((anime) => (
                      <AnimeCard
                        key={anime.id}
                        anime={anime}
                        viewMode="grid"
                        onSelect={(a) => setSelectedAnime(a)}
                        onIncrementProgress={handleIncrementProgress}
                        onToggleFavorite={handleToggleFavorite}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {animeList.map((anime) => (
                      <AnimeCard
                        key={anime.id}
                        anime={anime}
                        viewMode="list"
                        onSelect={(a) => setSelectedAnime(a)}
                        onIncrementProgress={handleIncrementProgress}
                        onToggleFavorite={handleToggleFavorite}
                      />
                    ))}
                  </div>
                )}

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-between border-t border-kage-border pt-4 font-mono text-xs">
                    <div className="text-kage-text-muted">
                      Showing Page <span className="text-white">{page}</span> of{" "}
                      <span className="text-white">{totalPages}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page <= 1}
                        className="flex items-center space-x-1 border border-kage-border px-3 py-1.5 text-kage-text-secondary hover:text-white disabled:opacity-30"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                        <span>Prev</span>
                      </button>
                      <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages}
                        className="flex items-center space-x-1 border border-kage-border px-3 py-1.5 text-kage-text-secondary hover:text-white disabled:opacity-30"
                      >
                        <span>Next</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <EmptyState
                title={search || statusFilter !== "ALL" ? "No matching titles" : "Empty Collection"}
                description={
                  search || statusFilter !== "ALL"
                    ? "No anime in your collection match the current search or status filter."
                    : "You haven't added any anime to your library yet. Start your collection now."
                }
                actionLabel={search || statusFilter !== "ALL" ? "Clear Filters" : "Add Anime"}
                onAction={() => {
                  if (search || statusFilter !== "ALL" || ratingFilter !== null) {
                    setSearch("");
                    setStatusFilter("ALL");
                    setRatingFilter(null);
                  } else {
                    setIsAddOpen(true);
                  }
                }}
                isSearchEmpty={Boolean(search || statusFilter !== "ALL")}
              />
            )}
          </div>
        </div>
      </main>

      <AddAnimeModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onAnimeAdded={() => fetchAnime()}
      />

      <AnimeDetailModal
        anime={selectedAnime}
        isOpen={Boolean(selectedAnime)}
        onClose={() => setSelectedAnime(null)}
        onAnimeUpdated={() => fetchAnime()}
        onAnimeDeleted={() => {
          setSelectedAnime(null);
          fetchAnime();
        }}
      />
    </div>
  );
}

export default function CollectionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-kage-bg flex items-center justify-center font-mono text-xs text-kage-text-muted">LOADING ARCHIVE...</div>}>
      <CollectionContent />
    </Suspense>
  );
}
