"use client";

import React, { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, ChevronLeft, ChevronRight, Film, UploadCloud } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { AnimeEntry, AnimeStatus, animeApi } from "@/lib/api";
import { AppHeader } from "@/components/layout/AppHeader";
import { FilterBar } from "@/components/anime/FilterBar";
import { AnimeCard } from "@/components/anime/AnimeCard";
import { AddAnimeModal } from "@/components/anime/AddAnimeModal";
import { AnimeDetailModal } from "@/components/anime/AnimeDetailModal";
import { ImportWizardModal } from "@/components/import/ImportWizardModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingScreen } from "@/components/ui/LoadingScreen";

function CollectionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  // State from URL or defaults
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get("q") || "");
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
  const [initialLoaded, setInitialLoaded] = useState(false);

  // Active request tracking to cancel/disregard obsolete responses
  const activeRequestRef = useRef(0);

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedAnime, setSelectedAnime] = useState<AnimeEntry | null>(null);

  // Debounce search input by 300ms to avoid unnecessary API requests
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchAnime = useCallback(async () => {
    const requestId = ++activeRequestRef.current;
    try {
      setLoading(true);
      const res = await animeApi.list({
        status: statusFilter === "ALL" ? undefined : statusFilter,
        rating: ratingFilter || undefined,
        q: debouncedSearch.trim() || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
        page,
        page_size: 24,
      });

      // Disregard response if a newer search/filter request was launched
      if (requestId !== activeRequestRef.current) return;

      setAnimeList(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (err: unknown) {
      if (requestId !== activeRequestRef.current) return;
      console.error("Failed to load anime collection:", err);
    } finally {
      if (requestId === activeRequestRef.current) {
        setLoading(false);
        setInitialLoaded(true);
      }
    }
  }, [statusFilter, ratingFilter, debouncedSearch, sortBy, sortOrder, page]);

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
    const prevList = animeList;
    const nextEpisode = anime.watched_episodes + 1;
    const isNowCompleted = !!anime.total_episodes && nextEpisode >= anime.total_episodes;

    // Apply optimistic update immediately
    setAnimeList((prev) =>
      prev.map((item) =>
        item.id === anime.id
          ? {
              ...item,
              watched_episodes: nextEpisode,
              status: isNowCompleted ? "COMPLETED" : item.status,
            }
          : item
      )
    );
    if (selectedAnime?.id === anime.id) {
      setSelectedAnime({
        ...selectedAnime,
        watched_episodes: nextEpisode,
        status: isNowCompleted ? "COMPLETED" : selectedAnime.status,
      });
    }

    try {
      const updated = await animeApi.updateProgress(anime.id, nextEpisode);
      setAnimeList((prev) => prev.map((item) => (item.id === anime.id ? updated : item)));
      if (selectedAnime?.id === anime.id) {
        setSelectedAnime(updated);
      }
    } catch (err: unknown) {
      // Rollback on failure
      setAnimeList(prevList);
      if (selectedAnime?.id === anime.id) {
        setSelectedAnime(anime);
      }
      alert(err instanceof Error ? err.message : "Failed to update progress. Changes restored.");
    }
  };

  const handleToggleFavorite = async (anime: AnimeEntry) => {
    const prevList = animeList;
    const optimisticVal = !anime.is_favorite;

    // Apply optimistic update immediately
    setAnimeList((prev) =>
      prev.map((item) => (item.id === anime.id ? { ...item, is_favorite: optimisticVal } : item))
    );
    if (selectedAnime?.id === anime.id) {
      setSelectedAnime({ ...selectedAnime, is_favorite: optimisticVal });
    }

    try {
      const updated = await animeApi.toggleFavorite(anime.id);
      setAnimeList((prev) => prev.map((item) => (item.id === anime.id ? updated : item)));
      if (selectedAnime?.id === anime.id) {
        setSelectedAnime(updated);
      }
    } catch (err: unknown) {
      // Rollback on failure
      setAnimeList(prevList);
      if (selectedAnime?.id === anime.id) {
        setSelectedAnime(anime);
      }
      alert(err instanceof Error ? err.message : "Failed to toggle favorite. Changes restored.");
    }
  };

  const handleUpdateStatus = async (anime: AnimeEntry, newStatus: AnimeStatus) => {
    try {
      const updated = await animeApi.updateStatus(anime.id, newStatus);
      setAnimeList((prev) => prev.map((item) => (item.id === anime.id ? updated : item)));
      if (selectedAnime?.id === anime.id) {
        setSelectedAnime(updated);
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to update status");
    }
  };

  // Meaningful full-page loading state with authentic anime quote on first load
  if (authLoading || (!initialLoaded && loading)) {
    return (
      <div className="flex min-h-screen flex-col bg-kage-bg">
        <AppHeader />
        <main className="flex flex-1 items-center justify-center">
          <LoadingScreen
            message="Loading your anime list..."
            submessage="Retrieving your collection records"
          />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-kage-bg text-kage-text-primary">
      <AppHeader
        onOpenAddModal={() => setIsAddOpen(true)}
        onOpenImportModal={() => setIsImportOpen(true)}
      />

      <main className="flex-1 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8">
          {/* Header Title */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-kage-border pb-6">
            <div>
              <span className="font-mono text-xs tracking-widest text-kage-text-muted uppercase">
                MY COLLECTION
              </span>
              <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                My Anime List
              </h1>
              <p className="mt-1 text-sm sm:text-base text-kage-text-secondary">
                {total} {total === 1 ? "show" : "shows"} in your list.
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsImportOpen(true)}
                className="flex items-center space-x-2 border border-kage-border bg-kage-surface px-4 py-2.5 text-xs sm:text-sm font-semibold tracking-wider text-kage-text-primary transition-colors hover:border-white active:scale-95"
              >
                <UploadCloud className="h-4 w-4" />
                <span>Import Anime List</span>
              </button>

              <button
                onClick={() => setIsAddOpen(true)}
                className="flex items-center space-x-2 border border-kage-text-primary bg-kage-text-primary px-4 py-2.5 text-xs sm:text-sm font-semibold tracking-wider text-kage-bg transition-transform hover:opacity-90 active:scale-95 shadow-tactile"
              >
                <Plus className="h-4 w-4" />
                <span>Add Anime</span>
              </button>
            </div>
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
                        onUpdateStatus={handleUpdateStatus}
                        onToggleFavorite={handleToggleFavorite}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {animeList.map((anime) => (
                      <AnimeCard
                        key={anime.id}
                        anime={anime}
                        viewMode="list"
                        onSelect={(a) => setSelectedAnime(a)}
                        onIncrementProgress={handleIncrementProgress}
                        onUpdateStatus={handleUpdateStatus}
                        onToggleFavorite={handleToggleFavorite}
                      />
                    ))}
                  </div>
                )}

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-between border-t border-kage-border pt-5 font-mono text-xs sm:text-sm">
                    <div className="text-kage-text-muted">
                      Showing Page <span className="text-white font-bold">{page}</span> of{" "}
                      <span className="text-white font-bold">{totalPages}</span>
                    </div>

                    <div className="flex items-center space-x-2.5">
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page <= 1}
                        className="flex items-center space-x-1.5 border border-kage-border px-3.5 py-2 text-kage-text-secondary hover:text-white disabled:opacity-30 transition-colors"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        <span>Prev</span>
                      </button>
                      <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages}
                        className="flex items-center space-x-1.5 border border-kage-border px-3.5 py-2 text-kage-text-secondary hover:text-white disabled:opacity-30 transition-colors"
                      >
                        <span>Next</span>
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <EmptyState
                title={search || statusFilter !== "ALL" ? "No shows found" : "Your list is empty"}
                description={
                  search || statusFilter !== "ALL"
                    ? "We couldn't find any shows matching your search or filters. Try adjusting your query."
                    : "You haven't added any shows to your watchlist yet. Search and add your favorite anime or import your existing list."
                }
                actionLabel={search || statusFilter !== "ALL" ? "Reset Filters" : "Add Your First Anime"}
                onAction={() => {
                  if (search || statusFilter !== "ALL") {
                    setSearch("");
                    setStatusFilter("ALL");
                    setRatingFilter(null);
                  } else {
                    setIsAddOpen(true);
                  }
                }}
              />
            )}
          </div>
        </div>
      </main>

      {/* Add Anime Modal */}
      <AddAnimeModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onAnimeAdded={() => fetchAnime()}
      />

      {/* Detail Modal */}
      {selectedAnime && (
        <AnimeDetailModal
          anime={selectedAnime}
          isOpen={!!selectedAnime}
          onClose={() => setSelectedAnime(null)}
          onAnimeUpdated={(updated: AnimeEntry) => {
            setAnimeList((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
            setSelectedAnime(updated);
          }}
          onAnimeDeleted={(id: string) => {
            setAnimeList((prev) => prev.filter((item) => item.id !== id));
            setSelectedAnime(null);
          }}
        />
      )}

      {/* Smart Import Wizard Modal */}
      <ImportWizardModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportComplete={() => fetchAnime()}
      />
    </div>
  );
}

export default function CollectionPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col bg-kage-bg">
          <AppHeader />
          <main className="flex flex-1 items-center justify-center">
            <LoadingScreen message="Loading collection..." />
          </main>
        </div>
      }
    >
      <CollectionContent />
    </Suspense>
  );
}
