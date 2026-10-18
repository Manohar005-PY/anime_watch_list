"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { authApi } from "@/lib/api";
import { AppHeader } from "@/components/layout/AppHeader";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialToken = searchParams.get("token") || "";

  const [token, setToken] = useState(initialToken);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token.trim()) {
      setError("Reset token is required.");
      return;
    }

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await authApi.confirmPasswordReset({
        token: token.trim(),
        new_password: newPassword,
      });
      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Password reset failed.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md border border-kage-border bg-kage-surface p-8 shadow-2xl">
      <div className="border-b border-kage-border pb-4 text-center">
        <span className="font-mono text-xs tracking-widest text-kage-text-muted uppercase">
          SECURITY ROTATION
        </span>
        <h1 className="mt-1 text-xl font-bold tracking-tight text-white uppercase">
          Set New Password
        </h1>
      </div>

      {error && (
        <div className="mt-4 flex items-start space-x-2 border border-red-500/30 bg-red-950/20 p-3 text-xs text-red-200">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success ? (
        <div className="mt-6 space-y-3 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center border border-white text-white">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
            Password Reset Complete
          </h2>
          <p className="text-xs text-kage-text-muted">
            All existing sessions have been rotated. Redirecting to login...
          </p>
          <Link
            href="/login"
            className="inline-block mt-2 font-mono text-xs text-white hover:underline"
          >
            Click here to sign in immediately
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="token"
              className="block font-mono text-[11px] uppercase tracking-wider text-kage-text-secondary"
            >
              Reset Token *
            </label>
            <input
              id="token"
              type="text"
              required
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste 32-character token"
              className="mt-1 w-full border border-kage-border bg-kage-bg px-3 py-2 text-xs font-mono text-kage-text-primary placeholder:text-kage-text-muted focus:border-kage-border-focus focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="newPassword"
              className="block font-mono text-[11px] uppercase tracking-wider text-kage-text-secondary"
            >
              New Password (Min 8 Characters) *
            </label>
            <input
              id="newPassword"
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 w-full border border-kage-border bg-kage-bg px-3 py-2 text-xs text-kage-text-primary placeholder:text-kage-text-muted focus:border-kage-border-focus focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block font-mono text-[11px] uppercase tracking-wider text-kage-text-secondary"
            >
              Confirm New Password *
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 w-full border border-kage-border bg-kage-bg px-3 py-2 text-xs text-kage-text-primary placeholder:text-kage-text-muted focus:border-kage-border-focus focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full border border-kage-text-primary bg-kage-text-primary py-2.5 text-xs font-semibold tracking-wider text-kage-bg transition-transform hover:opacity-90 active:scale-95 disabled:opacity-50"
          >
            {loading ? "Updating Password..." : "Update Password & Invalidate Sessions"}
          </button>
        </form>
      )}

      <div className="mt-6 border-t border-kage-border pt-4 text-center">
        <Link href="/login" className="text-xs text-kage-text-muted hover:text-white">
          Cancel and return to Login
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col bg-kage-bg">
      <AppHeader />
      <main className="flex flex-1 items-center justify-center p-4">
        <Suspense fallback={<div className="font-mono text-xs text-kage-text-muted">Loading...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </main>
    </div>
  );
}
