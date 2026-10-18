"use client";

import React from "react";
import { Plus, Search } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  isSearchEmpty?: boolean;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  isSearchEmpty = false,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center border border-dashed border-kage-border py-16 px-6 text-center">
      {/* Procedural manga frame icon */}
      <div className="relative mb-4 flex h-20 w-20 items-center justify-center border border-kage-border bg-kage-surface">
        {/* Subtle geometric framing */}
        <div className="absolute inset-1 border border-kage-border/50" />
        {isSearchEmpty ? (
          <Search className="h-8 w-8 stroke-[1] text-kage-text-muted" />
        ) : (
          <svg
            className="h-9 w-9 stroke-[1] text-kage-text-muted"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <rect x="2" y="2" width="20" height="20" rx="1" />
            <path d="M7 2v20" />
            <path d="M17 2v20" />
            <path d="M2 12h20" />
            <circle cx="12" cy="7" r="1.5" />
            <circle cx="12" cy="17" r="1.5" />
          </svg>
        )}
      </div>

      <h3 className="text-sm font-semibold tracking-wider text-kage-text-primary uppercase">
        {title}
      </h3>
      <p className="mt-1 max-w-sm text-xs text-kage-text-muted">{description}</p>

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-5 flex items-center space-x-1.5 border border-kage-text-primary bg-kage-text-primary px-4 py-2 text-xs font-semibold tracking-wider text-kage-bg transition-transform hover:opacity-90 active:scale-95"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
}
