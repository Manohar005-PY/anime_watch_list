"use client";

import React from "react";
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
      <div className="w-full max-w-sm space-y-4 border border-kage-border bg-kage-surface p-8 shadow-tactile">
        {/* Monogram Brand Frame */}
        <div className="mx-auto flex h-12 w-12 items-center justify-center border border-white font-mono text-xl font-bold text-white">
          影
        </div>

        {/* Loading Indicator and Status Message */}
        <div className="flex flex-col items-center space-y-2 pt-2">
          <div className="flex items-center space-x-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span
                className={`absolute inline-flex h-full w-full rounded-full bg-white opacity-75 ${
                  reduceMotion ? "" : "animate-ping"
                }`}
              />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
            </span>
            <span className="font-mono text-xs sm:text-sm font-semibold tracking-wider text-white uppercase">
              {message}
            </span>
          </div>
          {submessage && (
            <p className="font-mono text-xs text-kage-text-secondary">
              {submessage}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
