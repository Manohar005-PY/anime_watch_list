"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log unexpected client runtime errors for diagnostics
    console.error("KAGE runtime error captured:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-kage-bg text-kage-text-primary px-4 selection:bg-white selection:text-black">
      <div className="relative mx-auto w-full max-w-lg border border-red-500/30 bg-kage-surface p-8 sm:p-12 text-center shadow-tactile">
        <div className="absolute top-3 left-3 font-mono text-[9px] text-red-400">
          [ 500 // SYSTEM_ANOMALY ]
        </div>
        <div className="absolute top-3 right-3 font-mono text-[9px] text-kage-text-muted">
          [ DIGEST: {error.digest || "UNKNOWN"} ]
        </div>

        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center border-2 border-red-400/80 text-red-400 text-2xl font-bold font-mono">
          <AlertTriangle className="h-8 w-8" />
        </div>

        <h1 className="font-mono text-2xl sm:text-3xl font-extrabold tracking-tight text-white uppercase">
          Playback Interrupted
        </h1>

        <p className="mt-4 text-sm sm:text-base text-kage-text-secondary leading-relaxed">
          An unexpected anomaly occurred while rendering this frame. Your personal data in the database remains intact and secure.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 border border-white bg-white px-6 py-3 text-xs sm:text-sm font-bold tracking-wider text-black transition-colors hover:bg-neutral-200"
          >
            <RotateCcw className="h-4 w-4" />
            <span>RETRY FRAME</span>
          </button>

          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 border border-kage-border bg-kage-surface-raised px-6 py-3 text-xs sm:text-sm font-semibold tracking-wider text-white hover:border-white transition-colors"
          >
            <Home className="h-4 w-4" />
            <span>RETURN HOME</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
