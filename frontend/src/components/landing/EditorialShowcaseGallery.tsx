"use client";

import React, { useRef } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Star, Film } from "lucide-react";
import { CURATED_CLASSICS, CuratedAnime } from "@/lib/curated-anime";
import { useAuth } from "@/lib/auth-context";

export function EditorialShowcaseGallery() {
  const { reduceMotion } = useAuth();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const offset = direction === "left" ? -380 : 380;
      scrollContainerRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  return (
    <section className="relative overflow-hidden border-b border-kage-border py-16 sm:py-24 bg-kage-bg">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-kage-border pb-6 gap-4">
          <div>
            <div className="flex items-center space-x-2 font-mono text-xs text-kage-text-muted">
              <span className="h-1.5 w-1.5 bg-white" />
              <span>POPULAR CLASSICS // TIMELESS ANIME</span>
            </div>
            <h2 className="mt-2 text-2xl sm:text-4xl font-extrabold tracking-tight text-white uppercase">
              Iconic shows worth watching.
            </h2>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center space-x-2 font-mono text-xs">
            <button
              onClick={() => scroll("left")}
              aria-label="Scroll gallery left"
              className="border border-kage-border p-2.5 text-kage-text-secondary hover:border-white hover:text-white transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => scroll("right")}
              aria-label="Scroll gallery right"
              className="border border-kage-border p-2.5 text-kage-text-secondary hover:border-white hover:text-white transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Horizontal Scroll Track */}
        <div
          ref={scrollContainerRef}
          tabIndex={0}
          role="region"
          aria-label="Anime poster showcase gallery"
          className="mt-8 flex space-x-6 overflow-x-auto pb-6 pt-2 scrollbar-none focus:outline-none focus-visible:ring-1 focus-visible:ring-white"
          style={{ scrollSnapType: "x mandatory" }}
        >
          {CURATED_CLASSICS.map((anime: CuratedAnime, idx: number) => (
            <motion.div
              key={anime.id}
              whileHover={reduceMotion ? {} : { y: -6, scale: 1.02 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              style={{ scrollSnapAlign: "start" }}
              className="group relative flex-none w-[240px] sm:w-[280px] border border-kage-border bg-kage-surface shadow-tactile overflow-hidden cursor-pointer"
            >
              {/* Poster Image with Fetch Priority & Lazy Loading per modern-web-guidance */}
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-black">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={anime.cover}
                  alt={anime.title}
                  loading={idx < 2 ? "eager" : "lazy"}
                  decoding="async"
                  // @ts-expect-error fetchpriority attribute supported in modern browsers
                  fetchpriority={idx === 0 ? "high" : "auto"}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-108"
                />

                {/* Index & Year Stamp */}
                <div className="absolute top-2 left-2 z-10 flex items-center space-x-1.5 border border-black/80 bg-black/80 px-2 py-0.5 font-mono text-[9px] text-white backdrop-blur-xs">
                  <span>#{String(idx + 1).padStart(2, "0")}</span>
                  <span>{"//"}</span>
                  <span>{anime.year}</span>
                </div>

                {/* Rating Badge */}
                <div className="absolute top-2 right-2 z-10 flex items-center space-x-1 border border-black/80 bg-black/80 px-2 py-0.5 font-mono text-[9px] text-white backdrop-blur-xs">
                  <Star className="h-3 w-3 fill-white text-white" />
                  <span>{(anime.score / 10).toFixed(1)}</span>
                </div>

                {/* Interactive Secondary Details Overlay on Hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                  <span className="font-mono text-[10px] text-neutral-400 uppercase tracking-widest">
                    {anime.studio}
                  </span>
                  <p className="font-mono text-xs text-white font-bold mt-1">
                    Dir: {anime.director || "Classic Studio"}
                  </p>
                  <p className="text-[11px] text-neutral-300 italic mt-2 line-clamp-2">
                    &ldquo;{anime.tagline}&rdquo;
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1 font-mono text-[9px]">
                    {anime.genres.map((g) => (
                      <span
                        key={g}
                        className="border border-neutral-700 bg-neutral-900/90 px-1.5 py-0.5 text-neutral-300"
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="border-t border-kage-border p-3.5 bg-kage-surface-raised">
                <h3 className="truncate text-xs font-bold text-white group-hover:underline">
                  {anime.title}
                </h3>
                <div className="mt-1 flex items-center justify-between font-mono text-[10px] text-kage-text-muted">
                  <span className="truncate max-w-[140px]">{anime.native}</span>
                  <span>{anime.episodes} Ep</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
