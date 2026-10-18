"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Film, Star, CheckCircle2, Calendar, Plus, Minus, Trash2, Edit3 } from "lucide-react";
import { AnimeEntry, AnimeStatus, animeApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { AppHeader } from "@/components/layout/AppHeader";
import { AnimeDetailModal } from "@/components/anime/AnimeDetailModal";

export default function AnimeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const { user, loading: authLoading } = useAuth();

  const [anime, setAnime] = useState<AnimeEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (user && id) {
      animeApi
        .get(id)
        .then((data) => setAnime(data))
        .catch((err: unknown) => {
          const msg = err instanceof Error ? err.message : "Anime not found.";
          setError(msg);
        })
        .finally(() => setLoading(false));
    }
  }, [user, authLoading, id, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-kage-bg font-mono text-xs text-kage-text-muted">
        LOADING ENTRY...
      </div>
    );
  }

  if (error || !anime) {
    return (
      <div className="flex min-h-screen flex-col bg-kage-bg">
        <AppHeader />
        <main className="flex flex-1 flex-col items-center justify-center p-4 text-center">
          <h1 className="text-xl font-bold uppercase tracking-wider text-white">404 // Not Found</h1>
          <p className="mt-2 text-xs text-kage-text-muted">
            The requested anime does not exist in your personal collection.
          </p>
          <Link
            href="/collection"
            className="mt-6 inline-flex items-center space-x-1 border border-kage-border bg-kage-surface px-4 py-2 text-xs text-white hover:border-kage-border-focus"
          >
            <ArrowLeft className="h-3 w-3" />
            <span>Return to Collection</span>
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-kage-bg">
      <AppHeader />

      <main className="flex-1 pb-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-8">
          <Link
            href="/collection"
            className="inline-flex items-center space-x-1.5 font-mono text-xs text-kage-text-muted hover:text-white mb-6"
          >
            <ArrowLeft className="h-3 w-3" />
            <span>Back to Collection</span>
          </Link>

          {/* Main Editorial Hero */}
          <div className="border border-kage-border bg-kage-surface p-6 sm:p-8">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
              {/* Poster Column */}
              <div className="md:col-span-4">
                <div className="relative aspect-[3/4] w-full overflow-hidden border border-kage-border bg-kage-bg">
                  {anime.poster_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={anime.poster_url}
                      alt={anime.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center">
                      <Film className="h-12 w-12 stroke-[1] text-kage-border-focus" />
                      <span className="mt-2 font-mono text-[10px] uppercase tracking-widest text-kage-text-muted">
                        No Artwork
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Details Column */}
              <div className="md:col-span-8 flex flex-col justify-between space-y-6">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="border border-kage-border px-2 py-0.5 font-mono text-[10px] uppercase text-kage-text-secondary">
                      {anime.status}
                    </span>
                    {anime.is_favorite && (
                      <span className="flex items-center space-x-1 font-mono text-[10px] text-white">
                        <Star className="h-3 w-3 fill-white text-white" />
                        <span>FAVORITE</span>
                      </span>
                    )}
                  </div>

                  <h1 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                    {anime.title}
                  </h1>
                  {anime.alternate_title && (
                    <p className="mt-1 font-mono text-xs text-kage-text-muted">
                      {anime.alternate_title}
                    </p>
                  )}
                </div>

                {/* Progress Strip */}
                <div className="border border-kage-border bg-kage-bg p-4">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-kage-text-muted">
                    Episode Progress
                  </span>
                  <div className="mt-1 font-mono text-2xl font-bold text-white">
                    {anime.watched_episodes}{" "}
                    <span className="text-sm text-kage-text-muted">
                      / {anime.total_episodes || "—"}
                    </span>
                  </div>
                  {anime.total_episodes && (
                    <div className="mt-3 h-1.5 w-full bg-kage-surface border border-kage-border">
                      <div
                        className="h-full bg-white"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.round((anime.watched_episodes / anime.total_episodes) * 100)
                          )}%`,
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Rating and Genres */}
                <div className="grid grid-cols-2 gap-4 font-mono text-xs">
                  <div>
                    <span className="text-[10px] text-kage-text-muted uppercase">Rating</span>
                    <div className="mt-1 font-bold text-white flex items-center space-x-1">
                      <Star className={`h-3.5 w-3.5 ${anime.rating ? "fill-white text-white" : "text-kage-text-muted"}`} />
                      <span>{anime.rating ? `${anime.rating} / 10` : "Unrated"}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-kage-text-muted uppercase">Added</span>
                    <div className="mt-1 text-kage-text-secondary">
                      {new Date(anime.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {anime.notes && (
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-kage-text-muted">
                      Notes
                    </span>
                    <p className="mt-1 text-xs text-kage-text-secondary leading-relaxed border-l-2 border-kage-border-focus pl-3">
                      {anime.notes}
                    </p>
                  </div>
                )}

                {/* Edit Button */}
                <div className="border-t border-kage-border pt-4">
                  <button
                    onClick={() => setIsEditOpen(true)}
                    className="flex items-center space-x-2 border border-kage-text-primary bg-kage-text-primary px-4 py-2 text-xs font-semibold tracking-wider text-kage-bg hover:opacity-90 active:scale-95"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    <span>Edit & Track</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <AnimeDetailModal
        anime={anime}
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onAnimeUpdated={(updated) => setAnime(updated)}
        onAnimeDeleted={() => router.push("/collection")}
      />
    </div>
  );
}
