"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, RefreshCw } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { UserStats, statsApi } from "@/lib/api";
import { AppHeader } from "@/components/layout/AppHeader";
import { StatsCharts } from "@/components/stats/StatsCharts";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingScreen } from "@/components/ui/LoadingScreen";

export default function StatsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await statsApi.get();
      setStats(data);
    } catch (err: unknown) {
      console.error("Failed to load statistics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (user) {
      fetchStats();
    }
  }, [user, authLoading, router]);

  if (authLoading || (loading && !stats)) {
    return (
      <div className="flex min-h-screen flex-col bg-kage-bg">
        <AppHeader />
        <main className="flex flex-1 items-center justify-center">
          <LoadingScreen
            message="Calculating your statistics..."
            submessage="Analyzing completion rate and viewing patterns"
          />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-kage-bg text-kage-text-primary">
      <AppHeader />

      <main className="flex-1 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-kage-border pb-6">
            <div>
              <span className="font-mono text-xs tracking-widest text-kage-text-muted uppercase">
                STATS & HABITS
              </span>
              <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-white uppercase">
                Your Watch Stats
              </h1>
              <p className="mt-1 text-sm sm:text-base text-kage-text-secondary">
                Here is a breakdown of what you&apos;ve watched, your top genres, and ratings.
              </p>
            </div>

            <button
              onClick={fetchStats}
              title="Refresh statistics"
              className="flex items-center space-x-2 border border-kage-border bg-kage-surface px-4 py-2 text-xs sm:text-sm font-semibold text-kage-text-secondary hover:text-white hover:border-white transition-colors shadow-tactile"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>

          <div className="mt-8">
            {stats && stats.total_titles > 0 ? (
              <StatsCharts stats={stats} />
            ) : (
              <EmptyState
                title="No stats yet"
                description="Add shows to your list and log episodes to see your stats here."
                actionLabel="Go to My List"
                onAction={() => router.push("/collection")}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
