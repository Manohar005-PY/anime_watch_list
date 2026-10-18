"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Quote } from "lucide-react";
import { AnimeQuote, getRandomAnimeQuote } from "@/lib/anime-quotes";
import { useAuth } from "@/lib/auth-context";

interface AnimeQuoteCardProps {
  quote?: AnimeQuote;
  className?: string;
  variant?: "panel" | "minimal" | "compact";
  showSourceNote?: boolean;
}

export function AnimeQuoteCard({
  quote: providedQuote,
  className = "",
  variant = "panel",
  showSourceNote = false,
}: AnimeQuoteCardProps) {
  const { reduceMotion } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [quote, setQuote] = useState<AnimeQuote | null>(providedQuote || null);

  useEffect(() => {
    setMounted(true);
    if (!providedQuote) {
      try {
        setQuote(getRandomAnimeQuote());
      } catch (err) {
        console.error("Failed to load anime quote:", err);
        setQuote(null);
      }
    }
  }, [providedQuote]);

  // Ensure hydration consistency: until mounted on client, render deterministic initial markup
  if (!mounted || !quote) {
    return (
      <div className={`border border-kage-border bg-kage-surface p-6 ${className}`}>
        <div className="flex items-center space-x-2 font-mono text-xs text-kage-text-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-neutral-600" />
          <span>KAGE // CINEMATIC ARCHIVE</span>
        </div>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className={`border-l-2 border-white pl-3 py-1 font-mono text-xs text-neutral-300 ${className}`}>
        <p className="italic text-white">&ldquo;{quote.quote}&rdquo;</p>
        <p className="mt-1 text-xs text-neutral-400">
          — {quote.character}, <span className="text-neutral-500">{quote.anime}</span>
        </p>
      </div>
    );
  }

  if (variant === "minimal") {
    return (
      <div className={`space-y-2 ${className}`}>
        <p className="text-base font-serif italic text-white sm:text-lg leading-relaxed">
          &ldquo;{quote.quote}&rdquo;
        </p>
        <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-kage-text-secondary">
          <span className="font-semibold text-white">{quote.character}</span>
          <span className="text-kage-text-muted">•</span>
          <span className="text-kage-text-muted">{quote.anime}</span>
          {quote.sourceReference && (
            <>
              <span className="text-kage-text-muted">•</span>
              <span className="text-neutral-500">{quote.sourceReference}</span>
            </>
          )}
        </div>
      </div>
    );
  }

  // Variant "panel": Atmospheric Manga Panel Framing
  return (
    <motion.div
      initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={`manga-panel relative overflow-hidden border border-kage-border bg-kage-surface p-6 sm:p-7 shadow-tactile ${className}`}
    >
      {/* Film Strip Header Tag */}
      <div className="flex items-center justify-between border-b border-kage-border pb-3 font-mono text-xs text-kage-text-muted">
        <div className="flex items-center space-x-2">
          <Quote className="h-3.5 w-3.5 text-white" />
          <span className="tracking-widest uppercase text-white font-semibold">
            VOICES OF CINEMA
          </span>
        </div>
        <span className="text-xs text-neutral-500 uppercase">{quote.originalLanguage}</span>
      </div>

      {/* Primary Quotation */}
      <blockquote className="mt-4">
        <p className="text-base sm:text-lg font-serif italic text-white leading-relaxed">
          &ldquo;{quote.quote}&rdquo;
        </p>
      </blockquote>

      {/* Japanese Original if present */}
      {quote.japaneseOriginal && (
        <p className="mt-2 text-xs font-mono text-neutral-500 tracking-wide select-none">
          {quote.japaneseOriginal}
        </p>
      )}

      {/* Attribution Footer */}
      <div className="mt-5 border-t border-kage-border/80 pt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 font-mono text-xs">
        <div>
          <span className="font-bold text-white tracking-wide">{quote.character}</span>
          <span className="mx-2 text-kage-text-muted">/</span>
          <span className="text-neutral-300 font-medium">{quote.anime}</span>
        </div>
        <span className="text-xs text-neutral-500">{quote.sourceReference}</span>
      </div>

      {showSourceNote && quote.translationNote && (
        <p className="mt-3 text-xs font-mono text-neutral-500 leading-normal border-t border-neutral-900 pt-2">
          Note: {quote.translationNote}
        </p>
      )}
    </motion.div>
  );
}
