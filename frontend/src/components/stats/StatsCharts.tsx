"use client";

import React from "react";
import { UserStats } from "@/lib/api";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { CheckCircle2, Film, Clock, PauseCircle, XCircle, Star, Tv } from "lucide-react";

interface StatsChartsProps {
  stats: UserStats;
}

export function StatsCharts({ stats }: StatsChartsProps) {
  const maxRatingCount = Math.max(1, ...Object.values(stats.ratings_distribution || {}));

  const metrics = [
    { label: "TOTAL TITLES", value: stats.total_titles, icon: Film },
    { label: "CURRENTLY WATCHING", value: stats.watching_count, icon: Film },
    { label: "COMPLETED", value: stats.completed_count, icon: CheckCircle2 },
    { label: "PLAN TO WATCH", value: stats.planned_count, icon: Clock },
    { label: "TOTAL EPISODES", value: stats.total_episodes_watched, icon: Tv },
    {
      label: "MEAN RATING",
      value: stats.mean_rating ? `${stats.mean_rating}/10` : "—",
      icon: Star,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Primary KPI Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.label}
              className="border border-kage-border bg-kage-surface p-4 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between text-kage-text-muted">
                <span className="font-mono text-[9px] uppercase tracking-wider">{m.label}</span>
                <Icon className="h-3 w-3" />
              </div>
              <div className="mt-2 font-mono text-xl font-bold tracking-tight text-kage-text-primary">
                {m.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* Completion Rate & Status Distribution Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Completion Gauge Card */}
        <div className="border border-kage-border bg-kage-surface p-6 flex flex-col justify-between">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-wider text-kage-text-muted">
              LIBRARY COMPLETION
            </span>
            <h3 className="text-sm font-semibold tracking-wide text-kage-text-primary mt-1">
              Overall Progress Rate
            </h3>
            <p className="mt-1 text-xs text-kage-text-muted">
              Percentage of tracked anime marked as completed.
            </p>
          </div>

          <div className="my-6 flex items-center justify-center">
            <ProgressRing value={stats.completion_rate} size={110} strokeWidth={6} />
          </div>

          <div className="border-t border-kage-border/80 pt-3 text-center font-mono text-xs text-kage-text-secondary">
            <span>{stats.completed_count} completed</span>
            <span className="mx-2 text-kage-text-muted">/</span>
            <span>{stats.total_titles} total titles</span>
          </div>
        </div>

        {/* Status Distribution Horizontal Bars */}
        <div className="border border-kage-border bg-kage-surface p-6 lg:col-span-2 flex flex-col justify-between">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-wider text-kage-text-muted">
              STATUS BREAKDOWN
            </span>
            <h3 className="text-sm font-semibold tracking-wide text-kage-text-primary mt-1">
              Collection Watch Statuses
            </h3>
          </div>

          {/* Progress stack */}
          <div className="my-6 space-y-3">
            {[
              {
                label: "Watching",
                count: stats.watching_count,
                color: "bg-white",
              },
              {
                label: "Completed",
                count: stats.completed_count,
                color: "bg-neutral-400",
              },
              {
                label: "Plan to Watch",
                count: stats.planned_count,
                color: "bg-neutral-600",
              },
              {
                label: "Paused",
                count: stats.paused_count,
                color: "bg-neutral-700",
              },
              {
                label: "Dropped",
                count: stats.dropped_count,
                color: "bg-neutral-800",
              },
            ].map((item) => {
              const pct = stats.total_titles > 0 ? (item.count / stats.total_titles) * 100 : 0;
              return (
                <div key={item.label}>
                  <div className="flex justify-between font-mono text-xs text-kage-text-secondary mb-1">
                    <span>{item.label}</span>
                    <span>
                      {item.count} ({Math.round(pct)}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-kage-bg overflow-hidden border border-kage-border">
                    <div
                      className={`h-full ${item.color} transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <p className="font-mono text-[10px] text-kage-text-muted border-t border-kage-border/80 pt-3">
            All counts computed directly from your current persistent database records.
          </p>
        </div>
      </div>

      {/* Ratings Distribution Chart & Top Genres */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Ratings Bar Chart (1-10) */}
        <div className="border border-kage-border bg-kage-surface p-6 lg:col-span-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-kage-text-muted">
            RATINGS DISTRIBUTION
          </span>
          <h3 className="text-sm font-semibold tracking-wide text-kage-text-primary mt-1">
            Personal Score Curve (1 to 10)
          </h3>

          <div className="mt-8 flex h-48 items-end justify-between gap-2 border-b border-kage-border pb-2 px-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => {
              const count = stats.ratings_distribution?.[score] || 0;
              const heightPct = maxRatingCount > 0 ? (count / maxRatingCount) * 100 : 0;
              return (
                <div key={score} className="flex flex-1 flex-col items-center group">
                  <span className="font-mono text-[10px] text-kage-text-muted mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {count}
                  </span>
                  <div className="w-full max-w-[28px] bg-kage-bg border border-kage-border h-36 flex items-end">
                    <div
                      className="w-full bg-white transition-all duration-500 group-hover:bg-neutral-300"
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                  <span className="mt-2 font-mono text-xs text-kage-text-secondary group-hover:text-white">
                    {score}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex justify-between font-mono text-[10px] text-kage-text-muted">
            <span>1 = Disaster</span>
            <span>10 = Masterpiece</span>
          </div>
        </div>

        {/* Top Genres Breakdown */}
        <div className="border border-kage-border bg-kage-surface p-6">
          <span className="font-mono text-[10px] uppercase tracking-wider text-kage-text-muted">
            GENRES
          </span>
          <h3 className="text-sm font-semibold tracking-wide text-kage-text-primary mt-1">
            Top Tags in Library
          </h3>

          <div className="mt-6 flex flex-wrap gap-2">
            {stats.genre_distribution && Object.keys(stats.genre_distribution).length > 0 ? (
              Object.entries(stats.genre_distribution).map(([genre, count]) => (
                <div
                  key={genre}
                  className="flex items-center space-x-1.5 border border-kage-border bg-kage-bg px-2.5 py-1 font-mono text-xs text-kage-text-secondary"
                >
                  <span>{genre}</span>
                  <span className="border-l border-kage-border pl-1.5 text-kage-text-muted text-[10px]">
                    {count}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-kage-text-muted italic">
                No genre tags recorded yet. Add tags when adding anime titles.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
