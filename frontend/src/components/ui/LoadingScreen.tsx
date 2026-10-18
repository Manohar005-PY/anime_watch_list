"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AnimeQuoteCard } from "@/components/ui/AnimeQuoteCard";
import { useAuth } from "@/lib/auth-context";

interface LoadingScreenProps {
  message?: string;
  submessage?: string;
  className?: string;
}

export function LoadingScreen({
  message = "Loading collection...",
  submessage = "Retrieving your private records",
  className = "",
}: LoadingScreenProps) {
  const { reduceMotion } = useAuth();

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex min-h-[50vh] flex-col items-center justify-center p-6 text-center ${className}`}
    >
      <div className="w-full max-w-lg space-y-6">
        {/* Understated Anime Quote Panel */}
        <AnimeQuoteCard variant="panel" />

        {/* Loading Indicator and Status Message */}
        <div className="flex flex-col items-center space-y-3 pt-2">
          <div className="flex items-center space-x-2">
            <span className="relative flex h-3 w-3">
              <span
                className={`absolute inline-flex h-full w-full rounded-full bg-white opacity-75 ${
                  reduceMotion ? "" : "animate-ping"
                }`}
              />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-white" />
            </span>
            <span className="font-mono text-sm font-semibold tracking-wider text-white uppercase">
              {message}
            </span>
          </div>
          {submessage && (
            <p className="font-mono text-xs text-kage-text-muted">
              {submessage}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
