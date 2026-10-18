import React from "react";
import Link from "next/link";
import { Film, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Scene Not Found // 404 - KAGE",
  description: "The requested archive frame could not be found.",
};

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-kage-bg text-kage-text-primary px-4 selection:bg-white selection:text-black">
      <div className="relative mx-auto w-full max-w-lg border border-kage-border bg-kage-surface p-8 sm:p-12 text-center shadow-tactile">
        {/* Subtle crosshair & film mark */}
        <div className="absolute top-3 left-3 font-mono text-[9px] text-kage-text-muted">
          [ 404 // FRAME_LOST ]
        </div>
        <div className="absolute top-3 right-3 font-mono text-[9px] text-kage-text-muted">
          [ TC: --:--:-- ]
        </div>

        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center border-2 border-white text-2xl font-bold font-mono">
          影
        </div>

        <h1 className="font-mono text-3xl sm:text-4xl font-extrabold tracking-tight text-white uppercase">
          Scene Not Found
        </h1>

        <p className="mt-4 text-sm sm:text-base text-kage-text-secondary leading-relaxed">
          The requested record, anime title, or frame does not exist in your collection archive or has been moved.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 border border-white bg-white px-6 py-3 text-xs sm:text-sm font-bold tracking-wider text-black transition-colors hover:bg-neutral-200"
          >
            <Film className="h-4 w-4" />
            <span>OPEN DASHBOARD</span>
          </Link>

          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 border border-kage-border bg-kage-surface-raised px-6 py-3 text-xs sm:text-sm font-semibold tracking-wider text-white hover:border-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>RETURN HOME</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
