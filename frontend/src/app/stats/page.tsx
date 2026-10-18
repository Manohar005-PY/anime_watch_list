"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, RefreshCw } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { UserStats, statsApi } from "@/lib/api";
import { AppHeader } from "@/components/layout/AppHeader";
import { StatsCharts } from "@/components/stats/StatsCharts";
import { EmptyState } from "@/components/ui/EmptyState";

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

  return (
    <div className="flex min-h-screen flex-col bg-kage-bg">
      <AppHeader />

      <main className="flex-1 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-kage-border pb-6">
            <div>
              <span className="font-mono text-[10px] tracking-widest text-kage-text-muted uppercase">
                ANALYTICS // TELEMETRY
              </span>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-white uppercase">
                Library Statistics
              </h1>
              <p className="mt-1 text-xs text-kage-text-secondary">
                Verifiable metrics derived exclusively from your authenticated library database records.
              </p>
            </div>

            <button
              onClick={fetchStats}
              title="Refresh statistics"
              className="flex items-center space-x-1.5 border border-kage-border bg-kage-surface px-3 py-1.5 text-xs font-mono text-kage-text-secondary hover:text-white hover:border-kage-border-focus"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>

          <div className="mt-8">
            {loading ? (
              <div className="flex h-64 items-center justify-center font-mono text-xs text-kage-text-muted">
                COMPUTING METRICS...
              </div>
            ) : stats && stats.total_titles > 0 ? (
              <StatsCharts stats={stats} />
            ) : (
              <EmptyState
                title="No viewing metrics yet"
                description="Add anime titles to your collection and record episode progress to generate real viewing statistics."
                actionLabel="Go to Collection"
                onAction={() => router.push("/collection")}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
