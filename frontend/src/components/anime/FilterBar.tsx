"use client";

import React from "react";
import { Search, LayoutGrid, List, X, Star } from "lucide-react";
import { AnimeStatus } from "@/lib/api";

interface FilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: AnimeStatus | "ALL";
  onStatusFilterChange: (status: AnimeStatus | "ALL") => void;
  ratingFilter: number | null;
  onRatingFilterChange: (rating: number | null) => void;
  sortBy: string;
  onSortByChange: (sortBy: string) => void;
  sortOrder: "asc" | "desc";
  onSortOrderChange: (order: "asc" | "desc") => void;
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
}

export function FilterBar({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  ratingFilter,
  onRatingFilterChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
  viewMode,
  onViewModeChange,
}: FilterBarProps) {
  const statusOptions: { label: string; value: AnimeStatus | "ALL" }[] = [
    { label: "All Shows", value: "ALL" },
    { label: "Watching", value: "WATCHING" },
    { label: "Completed", value: "COMPLETED" },
    { label: "Plan to Watch", value: "PLANNED" },
    { label: "On Hold", value: "PAUSED" },
    { label: "Dropped", value: "DROPPED" },
  ];

  return (
    <div className="space-y-3">
      {/* Search and Secondary Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-kage-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search shows by title..."
            className="w-full border border-kage-border bg-kage-surface py-2 pl-9 pr-8 text-xs text-kage-text-primary placeholder:text-kage-text-muted focus:border-kage-border-focus focus:outline-none"
          />
          {search && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-2.5 text-kage-text-muted hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Sorting & View Toggle */}
        <div className="flex items-center space-x-2">
          {/* Rating filter */}
          <select
            value={ratingFilter !== null ? ratingFilter : ""}
            onChange={(e) => onRatingFilterChange(e.target.value ? parseInt(e.target.value, 10) : null)}
            className="border border-kage-border bg-kage-surface px-2.5 py-1.5 text-xs font-mono text-kage-text-secondary focus:border-kage-border-focus focus:outline-none"
          >
            <option value="">All Ratings</option>
            {[10, 9, 8, 7, 6, 5].map((r) => (
              <option key={r} value={r}>
                ★ {r}+
              </option>
            ))}
          </select>

          {/* Sort dropdown */}
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [sb, so] = e.target.value.split("-");
              onSortByChange(sb);
              onSortOrderChange(so as "asc" | "desc");
            }}
            className="border border-kage-border bg-kage-surface px-2.5 py-1.5 text-xs font-mono text-kage-text-secondary focus:border-kage-border-focus focus:outline-none"
          >
            <option value="updated_at-desc">Recently Updated</option>
            <option value="created_at-desc">Recently Added</option>
            <option value="rating-desc">Highest Rated</option>
            <option value="title-asc">Title (A - Z)</option>
            <option value="watched_episodes-desc">Most Episodes</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center border border-kage-border bg-kage-surface">
            <button
              onClick={() => onViewModeChange("grid")}
              title="Grid View"
              className={`p-1.5 transition-colors ${
                viewMode === "grid"
                  ? "bg-kage-surface-raised text-kage-text-primary"
                  : "text-kage-text-muted hover:text-white"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onViewModeChange("list")}
              title="List View"
              className={`p-1.5 transition-colors ${
                viewMode === "list"
                  ? "bg-kage-surface-raised text-kage-text-primary"
                  : "text-kage-text-muted hover:text-white"
              }`}
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-kage-border/80 pb-2">
        {statusOptions.map((opt) => {
          const isSelected = statusFilter === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => onStatusFilterChange(opt.value)}
              className={`px-3 py-1 text-[11px] font-mono tracking-wider transition-colors ${
                isSelected
                  ? "border-b-2 border-kage-text-primary text-kage-text-primary font-bold"
                  : "text-kage-text-muted hover:text-kage-text-secondary"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
