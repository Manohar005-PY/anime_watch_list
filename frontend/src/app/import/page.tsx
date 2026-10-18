"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, ArrowLeft, CheckCircle2, Film } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { AppHeader } from "@/components/layout/AppHeader";
import { ImportWizardModal } from "@/components/import/ImportWizardModal";
import Link from "next/link";

export default function ImportPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [modalOpen, setModalOpen] = useState(true);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-kage-bg font-mono text-xs text-kage-text-muted">
        Loading import...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-kage-bg text-kage-text-primary selection:bg-white selection:text-black">
      <AppHeader />

      <main className="flex-1 pb-16">
        <section className="relative border-b border-kage-border bg-kage-surface/60 py-12">
          <div className="pointer-events-none absolute inset-0 manga-screentone opacity-20" />
          <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <Link
              href="/collection"
              className="inline-flex items-center space-x-1 font-mono text-xs text-kage-text-muted hover:text-white transition-colors mb-4"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to My List</span>
            </Link>

            <div className="flex items-center space-x-2 font-mono text-[10px] tracking-widest text-kage-text-muted uppercase">
              <span className="h-1.5 w-1.5 bg-white" />
              <span>IMPORT SHOWS</span>
              <span>•</span>
              <span>ANIME LIST</span>
            </div>

            <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-white uppercase">
              Import Anime List
            </h1>
            <p className="mt-2 text-sm text-kage-text-secondary max-w-2xl">
              Paste show titles or upload a file. We&apos;ll automatically find the posters, episode counts, and details for your list.
            </p>

            <div className="mt-6 flex flex-wrap gap-4">
              <button
                onClick={() => setModalOpen(true)}
                className="flex items-center space-x-2 border border-white bg-white px-6 py-2.5 text-xs font-bold tracking-wider text-black transition-all hover:bg-neutral-200 active:scale-95 shadow-tactile uppercase"
              >
                <UploadCloud className="h-4 w-4" />
                <span>Start Import</span>
              </button>

              <Link
                href="/collection"
                className="flex items-center space-x-2 border border-kage-border bg-kage-bg px-5 py-2.5 text-xs font-bold tracking-wider text-white transition-all hover:border-white uppercase"
              >
                <Film className="h-4 w-4" />
                <span>View My List</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Feature Highlights Section */}
        <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="font-mono text-xs uppercase tracking-widest text-kage-text-muted mb-6">
            HOW IT WORKS
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border border-kage-border bg-kage-surface p-6 shadow-tactile">
              <div className="font-mono text-xs font-bold text-white uppercase mb-2">
                1. Automatic Details
              </div>
              <p className="text-xs text-kage-text-secondary leading-relaxed">
                We automatically find official posters, Japanese and English titles, and total episode counts for every show.
              </p>
            </div>

            <div className="border border-kage-border bg-kage-surface p-6 shadow-tactile">
              <div className="font-mono text-xs font-bold text-white uppercase mb-2">
                2. Accurate Show Matching
              </div>
              <p className="text-xs text-kage-text-secondary leading-relaxed">
                We easily tell Season 1, Season 2, and movies apart so you get the exact show you&apos;re looking for.
              </p>
            </div>

            <div className="border border-kage-border bg-kage-surface p-6 shadow-tactile">
              <div className="font-mono text-xs font-bold text-white uppercase mb-2">
                3. Your Progress Stays Safe
              </div>
              <p className="text-xs text-kage-text-secondary leading-relaxed">
                Your watched episodes, ratings, and custom notes are always protected and never overwritten.
              </p>
            </div>
          </div>
        </section>
      </main>

      <ImportWizardModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onImportComplete={() => router.push("/collection")}
      />
    </div>
  );
}
