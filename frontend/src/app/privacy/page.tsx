import React from "react";
import Link from "next/link";
import { ShieldCheck, ArrowLeft, Download, Trash2 } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";

export const metadata = {
  title: "Privacy & Data Rights // KAGE",
  description: "Learn about KAGE data protection principles, zero-tracking policy, right to erasure, and metadata sourcing.",
};

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-kage-bg text-kage-text-primary selection:bg-white selection:text-black">
      <AppHeader />

      <main className="flex-1">
        {/* Top Header Banner */}
        <section className="border-b border-kage-border py-12 sm:py-16 bg-black">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <Link
              href="/"
              className="inline-flex items-center space-x-2 font-mono text-xs text-kage-text-secondary hover:text-white transition-colors mb-6"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>RETURN TO ARCHIVE</span>
            </Link>

            <div className="flex items-center space-x-3 font-mono text-xs text-kage-text-muted">
              <span className="h-2 w-2 bg-white" />
              <span>LEGAL // GOVERNANCE // DATA INTEGRITY</span>
            </div>

            <h1 className="mt-3 text-3xl sm:text-5xl font-extrabold tracking-tight text-white uppercase">
              Privacy, Security & Data Rights
            </h1>

            <p className="mt-4 font-mono text-xs sm:text-sm text-kage-text-secondary">
              Effective Date: October 2026 // Revision 1.0 // Zero Third-Party Monetization Policy
            </p>
          </div>
        </section>

        {/* Content Body */}
        <section className="py-12 sm:py-16">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-12">
            {/* Core Commitment Card */}
            <div className="border border-white/20 bg-kage-surface p-6 sm:p-8">
              <div className="flex items-center space-x-3 text-white">
                <ShieldCheck className="h-6 w-6" />
                <h2 className="text-xl font-bold uppercase tracking-wide">Our Core Commitment</h2>
              </div>
              <p className="mt-4 text-base leading-relaxed text-kage-text-secondary">
                KAGE is designed from the ground up as a private personal library. We believe your entertainment history, personal reflections, and viewing habits are strictly your own. <strong>We do not run third-party advertising, sell user data, or embed third-party surveillance scripts.</strong>
              </p>
            </div>

            {/* Section 1: Information We Collect */}
            <div className="space-y-4 border-b border-kage-border pb-10">
              <div className="flex items-center space-x-2 font-mono text-xs text-kage-text-muted uppercase">
                <span>01 // INGESTION</span>
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight uppercase">
                1. Information We Collect
              </h2>
              <p className="text-base leading-relaxed text-kage-text-secondary">
                We only collect data that is strictly required to provide the core service:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-base text-kage-text-secondary">
                <li>
                  <strong className="text-white">Account Identification:</strong> Email address and optional display name. Passwords are never stored in plaintext; they are hashed using the state-of-the-art Argon2id algorithm before ever touching our persistent storage.
                </li>
                <li>
                  <strong className="text-white">Watchlist Records:</strong> Anime titles you add to your library, watched episode counts, custom ratings, personal notes, status tags (Watching, Completed, Paused, Dropped, Planned), and favorite flags.
                </li>
                <li>
                  <strong className="text-white">UI Preferences:</strong> User display options (e.g. grid vs. list view, reduced-motion toggle, default sort order).
                </li>
                <li>
                  <strong className="text-white">Diagnostic & Security Telemetry:</strong> Essential server-side operational logs (such as HTTP status codes, correlation request IDs, and IP addresses for brute-force rate-limiting defenses). IP addresses are retained only for transient security logging and are never merged with third-party tracking networks.
                </li>
              </ul>
            </div>

            {/* Section 2: Cookies & Browser Security */}
            <div className="space-y-4 border-b border-kage-border pb-10">
              <div className="flex items-center space-x-2 font-mono text-xs text-kage-text-muted uppercase">
                <span>02 // STORAGE & SESSIONS</span>
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight uppercase">
                2. Cookies & Session Storage
              </h2>
              <p className="text-base leading-relaxed text-kage-text-secondary">
                KAGE uses cookies strictly for essential authentication and cross-site request forgery (CSRF) defense:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 font-mono text-xs">
                <div className="border border-kage-border bg-kage-surface p-4">
                  <div className="font-bold text-white mb-1">kage_session</div>
                  <div className="text-kage-text-muted mb-2">Scope: HttpOnly, SameSite=Lax, Secure</div>
                  <p className="text-neutral-300">
                    Cryptographically random session token identifying your authenticated session. Because it is marked <code className="text-white font-mono">HttpOnly</code>, it cannot be read or stolen by clientside JavaScript or malicious scripts.
                  </p>
                </div>

                <div className="border border-kage-border bg-kage-surface p-4">
                  <div className="font-bold text-white mb-1">kage_csrf</div>
                  <div className="text-kage-text-muted mb-2">Scope: SameSite=Lax, Secure</div>
                  <p className="text-neutral-300">
                    Double-submit CSRF cookie token used to verify that every state-changing API request (POST, PUT, DELETE) originates intentionally from your verified browser tab.
                  </p>
                </div>
              </div>
              <p className="text-sm text-kage-text-muted mt-2">
                We do NOT set marketing cookies, third-party pixel beacons, or tracking identifiers.
              </p>
            </div>

            {/* Section 3: Data Rights, Export & Deletion */}
            <div className="space-y-4 border-b border-kage-border pb-10">
              <div className="flex items-center space-x-2 font-mono text-xs text-kage-text-muted uppercase">
                <span>03 // AUTONOMY & EXPORT</span>
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight uppercase">
                3. Your Data Rights: Export & Erasure
              </h2>
              <p className="text-base leading-relaxed text-kage-text-secondary">
                You retain complete ownership over every record you save into KAGE. We provide immediate self-service tools for data sovereignty:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div className="border border-kage-border bg-kage-surface p-6">
                  <div className="flex items-center space-x-2 text-white font-bold mb-2">
                    <Download className="h-5 w-5" />
                    <span>Instant JSON Export</span>
                  </div>
                  <p className="text-sm text-kage-text-secondary">
                    You can download a complete, unencrypted JSON archive containing every anime entry, episode count, rating, note, and preference record at any time from your account settings.
                  </p>
                </div>

                <div className="border border-kage-border bg-kage-surface p-6">
                  <div className="flex items-center space-x-2 text-red-400 font-bold mb-2">
                    <Trash2 className="h-5 w-5" />
                    <span>Permanent Account Erasure</span>
                  </div>
                  <p className="text-sm text-kage-text-secondary">
                    You can permanently delete your account at any time. Account deletion triggers an immediate cascading SQL delete of your profile, session tokens, password hashes, and all anime library entries.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 4: Metadata Sourcing & Artwork Policy */}
            <div id="sourcing" className="space-y-4 border-b border-kage-border pb-10 scroll-mt-20">
              <div className="flex items-center space-x-2 font-mono text-xs text-kage-text-muted uppercase">
                <span>04 // METADATA & ATTRIBUTION</span>
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight uppercase">
                4. Metadata Sourcing & Artwork Fair Use
              </h2>
              <p className="text-base leading-relaxed text-kage-text-secondary">
                To help users catalog and organize their personal collections accurately, KAGE integrates with community-maintained metadata providers:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-base text-kage-text-secondary">
                <li>
                  <strong className="text-white">Metadata APIs:</strong> Show information (canonical titles, English titles, Japanese titles, episode counts, genres, release years, and studio credits) is queried via open community APIs including the Kitsu API and AniList GraphQL API.
                </li>
                <li>
                  <strong className="text-white">Poster Artwork:</strong> Poster and cover images displayed in the catalogue are hosted on metadata provider CDNs or linked from public fan archives. All artwork and intellectual property belong to their respective animation studios, creators, and distributors.
                </li>
                <li>
                  <strong className="text-white">Fair Use & Non-Commercial Cataloging:</strong> KAGE displays artwork solely for non-profit personal cataloging, reference, identification, and review purposes.
                </li>
                <li>
                  <strong className="text-white">Takedown Requests:</strong> If you are a copyright holder and wish for specific metadata or artwork references to be adjusted or removed, contact our operations team at <code className="text-white font-mono">support@kage-archive.local</code> and requests will be processed promptly.
                </li>
              </ul>
            </div>

            {/* Section 5: Security Architecture */}
            <div className="space-y-4 border-b border-kage-border pb-10">
              <div className="flex items-center space-x-2 font-mono text-xs text-kage-text-muted uppercase">
                <span>05 // INFRASTRUCTURE DEFENSE</span>
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight uppercase">
                5. Security Architecture
              </h2>
              <div className="space-y-3 text-base text-kage-text-secondary">
                <p>
                  KAGE implements industry-standard defenses recommended by the Open Web Application Security Project (OWASP):
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
                  <div className="border border-kage-border bg-kage-surface p-3">
                    <span className="text-white font-bold block mb-1">Argon2id Hashing</span>
                    <span>Memory-hard password derivation with cryptographic salt per user.</span>
                  </div>
                  <div className="border border-kage-border bg-kage-surface p-3">
                    <span className="text-white font-bold block mb-1">Double-Submit CSRF</span>
                    <span>Strict Origin header verification + cookie-to-header token pairing.</span>
                  </div>
                  <div className="border border-kage-border bg-kage-surface p-3">
                    <span className="text-white font-bold block mb-1">Data Isolation</span>
                    <span>Multi-tenant tenant isolation scoped by indexed user_id foreign keys.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 6: Contact */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 font-mono text-xs text-kage-text-muted uppercase">
                <span>06 // INQUIRIES</span>
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight uppercase">
                6. Contact & Support
              </h2>
              <p className="text-base leading-relaxed text-kage-text-secondary">
                If you have questions regarding this privacy notice, wish to exercise your data rights, or need assistance recovering your account, reach out to our team:
              </p>
              <div className="font-mono text-xs bg-kage-surface border border-kage-border p-4 text-neutral-300">
                KAGE Personal Anime Library // Operator Inquiries<br />
                Email: <span className="text-white">privacy@kage-archive.local</span><br />
                Source Code: <a href="https://github.com/Manohar005-PY/anime_watch_list" className="text-white underline" target="_blank" rel="noopener noreferrer">github.com/Manohar005-PY/anime_watch_list</a>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-kage-border py-8 bg-kage-bg font-mono text-xs text-kage-text-muted">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <span>© KAGE // Personal Anime Library</span>
          <Link href="/" className="hover:text-white transition-colors">
            Return Home
          </Link>
        </div>
      </footer>
    </div>
  );
}
