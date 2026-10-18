"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, CheckCircle2 } from "lucide-react";
import { authApi } from "@/lib/api";
import { AppHeader } from "@/components/layout/AppHeader";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [devToken, setDevToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await authApi.requestPasswordReset(email);
      setSuccess(true);
      if (res.detail && res.detail.includes("Dev reset token: ")) {
        const token = res.detail.replace("Dev reset token: ", "").trim();
        setDevToken(token);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Password reset request failed.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-kage-bg">
      <AppHeader />

      <main className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-md border border-kage-border bg-kage-surface p-8 shadow-2xl">
          <div className="border-b border-kage-border pb-4 text-center">
            <span className="font-mono text-xs tracking-widest text-kage-text-muted uppercase">
              ACCOUNT RECOVERY
            </span>
            <h1 className="mt-1 text-xl font-bold tracking-tight text-white uppercase">
              Reset Password
            </h1>
          </div>

          {error && (
            <div className="mt-4 flex items-start space-x-2 border border-red-500/30 bg-red-950/20 p-3 text-xs text-red-200">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success ? (
            <div className="mt-6 space-y-4">
              <div className="flex items-start space-x-2 border border-kage-border bg-kage-bg p-4 text-xs text-kage-text-secondary">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-white mt-0.5" />
                <span>
                  If an account exists with that email address, password reset instructions have been
                  generated. Check your messages or proceed to the reset screen.
                </span>
              </div>

              {devToken && (
                <div className="border border-kage-border-focus bg-kage-bg p-3 font-mono text-xs">
                  <span className="text-kage-text-muted block text-[10px] uppercase">
                    Development Reset Token:
                  </span>
                  <span className="text-white break-all select-all">{devToken}</span>
                </div>
              )}

              <Link
                href={`/reset-password${devToken ? `?token=${encodeURIComponent(devToken)}` : ""}`}
                className="block w-full border border-kage-text-primary bg-kage-text-primary py-2.5 text-center text-xs font-semibold tracking-wider text-kage-bg hover:opacity-90 transition-opacity"
              >
                Proceed to Enter New Password
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <p className="text-xs text-kage-text-muted leading-relaxed">
                Enter your registered email address. We will create a single-use, 30-minute secure
                reset token.
              </p>

              <div>
                <label
                  htmlFor="email"
                  className="block font-mono text-[11px] uppercase tracking-wider text-kage-text-secondary"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="mt-1 w-full border border-kage-border bg-kage-bg px-3 py-2 text-xs text-kage-text-primary placeholder:text-kage-text-muted focus:border-kage-border-focus focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full border border-kage-text-primary bg-kage-text-primary py-2.5 text-xs font-semibold tracking-wider text-kage-bg transition-transform hover:opacity-90 active:scale-95 disabled:opacity-50"
              >
                {loading ? "Sending Request..." : "Request Reset Instructions"}
              </button>
            </form>
          )}

          <div className="mt-6 border-t border-kage-border pt-4 text-center">
            <Link
              href="/login"
              className="inline-flex items-center space-x-1.5 text-xs text-kage-text-muted hover:text-white"
            >
              <ArrowLeft className="h-3 w-3" />
              <span>Back to Login</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
