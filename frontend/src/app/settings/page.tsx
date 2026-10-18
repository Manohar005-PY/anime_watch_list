"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sliders,
  Lock,
  Download,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Shield,
  Eye,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { authApi, accountApi } from "@/lib/api";
import { AppHeader } from "@/components/layout/AppHeader";

export default function SettingsPage() {
  const router = useRouter();
  const { user, reduceMotion, updatePreferences, logout } = useAuth();

  // Preferences state
  const [displayMode, setDisplayMode] = useState<"grid" | "list">(
    user?.preferences?.display_mode || "grid"
  );
  const [theme, setTheme] = useState<"obsidian" | "charcoal" | "high-contrast">(
    user?.preferences?.theme || "obsidian"
  );
  const [prefsSuccess, setPrefsSuccess] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdSuccess, setPwdSuccess] = useState(false);
  const [pwdError, setPwdError] = useState<string | null>(null);

  // Export state
  const [exportLoading, setExportLoading] = useState(false);

  // Deletion modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updatePreferences({
        display_mode: displayMode,
        reduce_motion: reduceMotion,
        theme,
      });
      setPrefsSuccess(true);
      setTimeout(() => setPrefsSuccess(false), 3000);
    } catch {
      alert("Failed to update preferences.");
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError(null);
    setPwdSuccess(false);

    if (newPassword.length < 8) {
      setPwdError("New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwdError("New passwords do not match.");
      return;
    }

    setPwdLoading(true);

    try {
      await authApi.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setPwdSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Password update failed.";
      setPwdError(msg);
    } finally {
      setPwdLoading(false);
    }
  };

  const handleExportData = async () => {
    setExportLoading(true);
    try {
      const data = await accountApi.exportData();
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `kage_library_export_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to export data.");
    } finally {
      setExportLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText.toLowerCase() !== "delete my account") {
      setDeleteError("Please type 'DELETE MY ACCOUNT' to confirm.");
      return;
    }

    setDeleteLoading(true);
    try {
      await accountApi.deleteAccount();
      await logout();
      router.push("/");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete account.";
      setDeleteError(msg);
      setDeleteLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-kage-bg">
      <AppHeader />

      <main className="flex-1 pb-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pt-8 space-y-10">
          {/* Header */}
          <div className="border-b border-kage-border pb-6">
            <span className="font-mono text-xs tracking-widest text-kage-text-muted uppercase">
              SETTINGS
            </span>
            <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-white uppercase">
              Settings
            </h1>
            <p className="mt-1 text-sm sm:text-base text-kage-text-secondary">
              Change your layout, animations, password, or download your data.
            </p>
          </div>

          {/* Section 1: Display & Motion Preferences */}
          <section className="border border-kage-border bg-kage-surface p-6 sm:p-7">
            <div className="flex items-center space-x-2.5 border-b border-kage-border pb-3.5">
              <Sliders className="h-5 w-5 text-white" />
              <h2 className="text-base sm:text-lg font-bold tracking-wider text-white uppercase">
                Display & Animations
              </h2>
            </div>

            {prefsSuccess && (
              <div className="mt-4 flex items-center space-x-2 border border-green-500/30 bg-green-950/20 p-3.5 text-xs sm:text-sm text-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-400" />
                <span>Preferences saved successfully.</span>
              </div>
            )}

            <form onSubmit={handleSavePreferences} className="mt-5 space-y-5">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block font-mono text-xs sm:text-sm font-semibold uppercase tracking-wider text-kage-text-secondary">
                    Default View
                  </label>
                  <select
                    value={displayMode}
                    onChange={(e) => setDisplayMode(e.target.value as "grid" | "list")}
                    className="mt-1.5 w-full border border-kage-border bg-kage-bg px-3.5 py-2.5 text-sm text-kage-text-primary focus:border-kage-border-focus focus:outline-none"
                  >
                    <option value="grid">Grid View (Manga Cards)</option>
                    <option value="list">Compact List View</option>
                  </select>
                </div>

                <div>
                  <label className="block font-mono text-xs sm:text-sm font-semibold uppercase tracking-wider text-kage-text-secondary">
                    Theme Color
                  </label>
                  <select
                    value={theme}
                    onChange={(e) =>
                      setTheme(e.target.value as "obsidian" | "charcoal" | "high-contrast")
                    }
                    className="mt-1.5 w-full border border-kage-border bg-kage-bg px-3.5 py-2.5 text-sm text-kage-text-primary focus:border-kage-border-focus focus:outline-none"
                  >
                    <option value="obsidian">Obsidian Deep Black (#080808)</option>
                    <option value="charcoal">Charcoal Neutral (#121212)</option>
                    <option value="high-contrast">High Contrast Monochrome</option>
                  </select>
                </div>
              </div>

              {/* Reduced Motion Toggle */}
              <div className="flex items-start space-x-3.5 border border-kage-border bg-kage-bg p-4 sm:p-5">
                <input
                  type="checkbox"
                  id="reduceMotionPref"
                  checked={reduceMotion}
                  onChange={(e) => updatePreferences({ reduce_motion: e.target.checked })}
                  className="mt-1 h-4 w-4 border-kage-border bg-kage-surface text-white focus:ring-0"
                />
                <div>
                  <label
                    htmlFor="reduceMotionPref"
                    className="font-mono text-xs sm:text-sm font-semibold text-white cursor-pointer select-none"
                  >
                    Reduced Animations
                  </label>
                  <p className="mt-1 text-xs sm:text-sm text-kage-text-muted">
                    Turns off transitions and animations if you prefer a simpler, static feel.
                  </p>
                </div>
              </div>

              <button
                type="submit"
                className="border border-kage-text-primary bg-kage-text-primary px-5 py-2.5 text-xs sm:text-sm font-bold tracking-wider text-kage-bg hover:opacity-90 active:scale-95 transition-transform shadow-tactile"
              >
                Save Preferences
              </button>
            </form>
          </section>

          {/* Section 2: Change Password */}
          <section className="border border-kage-border bg-kage-surface p-6 sm:p-7">
            <div className="flex items-center space-x-2.5 border-b border-kage-border pb-3.5">
              <Lock className="h-5 w-5 text-white" />
              <h2 className="text-base sm:text-lg font-bold tracking-wider text-white uppercase">
                Change Password
              </h2>
            </div>

            {pwdSuccess && (
              <div className="mt-4 flex items-center space-x-2 border border-green-500/30 bg-green-950/20 p-3.5 text-xs sm:text-sm text-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-400" />
                <span>Password changed successfully. Other sessions rotated.</span>
              </div>
            )}

            {pwdError && (
              <div className="mt-4 flex items-center space-x-2 border border-red-500/30 bg-red-950/20 p-3.5 text-xs sm:text-sm text-red-200">
                <AlertTriangle className="h-4 w-4 text-red-400" />
                <span>{pwdError}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="mt-5 space-y-4 max-w-md">
              <div>
                <label className="block font-mono text-xs sm:text-sm font-semibold uppercase tracking-wider text-kage-text-secondary">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="mt-1.5 w-full border border-kage-border bg-kage-bg px-3.5 py-2.5 text-sm text-kage-text-primary focus:border-kage-border-focus focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-mono text-xs sm:text-sm font-semibold uppercase tracking-wider text-kage-text-secondary">
                  New Password (Min 8 Characters)
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1.5 w-full border border-kage-border bg-kage-bg px-3.5 py-2.5 text-sm text-kage-text-primary focus:border-kage-border-focus focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-mono text-xs sm:text-sm font-semibold uppercase tracking-wider text-kage-text-secondary">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1.5 w-full border border-kage-border bg-kage-bg px-3.5 py-2.5 text-sm text-kage-text-primary focus:border-kage-border-focus focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={pwdLoading}
                className="border border-kage-text-primary bg-kage-text-primary px-5 py-2.5 text-xs sm:text-sm font-bold tracking-wider text-kage-bg hover:opacity-90 active:scale-95 disabled:opacity-50 transition-transform shadow-tactile"
              >
                {pwdLoading ? "Updating..." : "Update Password"}
              </button>
            </form>
          </section>

          {/* Section 3: Data Export & Privacy Notice */}
          <section className="border border-kage-border bg-kage-surface p-6 sm:p-7">
            <div className="flex items-center space-x-2.5 border-b border-kage-border pb-3.5">
              <Download className="h-5 w-5 text-white" />
              <h2 className="text-base sm:text-lg font-bold tracking-wider text-white uppercase">
                Download Your Data & Privacy
              </h2>
            </div>

            <div className="mt-4 space-y-4">
              <p className="text-sm sm:text-base text-kage-text-secondary leading-relaxed">
                Your data is yours. Download a backup copy of your entire anime list, notes, ratings, and progress anytime.
              </p>

              <div className="flex items-center space-x-4">
                <button
                  onClick={handleExportData}
                  disabled={exportLoading}
                  className="flex items-center space-x-2 border border-kage-border bg-kage-bg px-4 py-2.5 text-xs sm:text-sm font-semibold tracking-wider text-white hover:border-kage-border-focus active:scale-95 transition-transform disabled:opacity-50"
                >
                  <Download className="h-4 w-4" />
                  <span>{exportLoading ? "Generating Export..." : "Download Data (JSON)"}</span>
                </button>
              </div>

              {/* Privacy Notice Box */}
              <div className="border-t border-kage-border/80 pt-5 mt-6">
                <div className="flex items-center space-x-2 text-sm font-semibold text-white mb-2.5">
                  <Shield className="h-4 w-4" />
                  <span>How we protect your privacy</span>
                </div>
                <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-kage-text-muted leading-relaxed">
                  <li>
                    <strong>What&apos;s saved:</strong> Your login details (safely hashed), anime list,
                    episode progress, ratings, and notes.
                  </li>
                  <li>
                    <strong>No tracking or ads:</strong> We don&apos;t use tracking cookies, ads, or
                    analytics trackers.
                  </li>
                  <li>
                    <strong>Secure login:</strong> Your session is protected by secure, encrypted cookies.
                  </li>
                  <li>
                    <strong>Private list:</strong> Only you can view or edit your personal collection.
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 4: Danger Zone (Account Deletion) */}
          <section className="border border-red-500/30 bg-red-950/10 p-6 sm:p-7">
            <div className="flex items-center space-x-2.5 border-b border-red-500/20 pb-3.5">
              <Trash2 className="h-5 w-5 text-red-400" />
              <h2 className="text-base sm:text-lg font-bold tracking-wider text-red-200 uppercase">
                Delete Account
              </h2>
            </div>

            <div className="mt-4 space-y-3.5">
              <p className="text-sm text-red-300 leading-relaxed">
                Deleting your account will permanently delete all your registered anime titles,
                watched progress, ratings, personal notes, and sessions. This operation cannot be undone.
              </p>

              <button
                onClick={() => setShowDeleteModal(true)}
                className="border border-red-500/50 bg-red-950/40 px-4 py-2 text-xs sm:text-sm font-semibold tracking-wider text-red-200 hover:bg-red-900/60 transition-colors"
              >
                Delete My Account
              </button>
            </div>
          </section>
        </div>
      </main>

      {/* Account Deletion Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/85 backdrop-blur-md"
            onClick={() => setShowDeleteModal(false)}
          />
          <div className="relative z-10 w-full max-w-md border border-red-500/50 bg-kage-surface p-6 shadow-2xl">
            <div className="flex items-center space-x-2 text-red-400 border-b border-kage-border pb-3">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="text-sm font-bold tracking-wider uppercase">Confirm Account Deletion</h3>
            </div>

            {deleteError && (
              <div className="mt-3 text-xs text-red-400 border border-red-500/20 bg-red-950/20 p-2">
                {deleteError}
              </div>
            )}

            <div className="mt-4 space-y-3 text-xs text-kage-text-secondary leading-relaxed">
              <p>
                This action cannot be undone. To verify, please type:
              </p>
              <div className="font-mono font-bold text-white select-all bg-kage-bg p-2 border border-kage-border">
                DELETE MY ACCOUNT
              </div>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type confirmation phrase"
                className="w-full border border-kage-border bg-kage-bg px-3 py-2 text-xs text-white focus:border-red-500 focus:outline-none"
              />
            </div>

            <div className="mt-6 flex justify-end space-x-3 border-t border-kage-border pt-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-3 py-1.5 text-xs text-kage-text-muted hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteLoading || deleteConfirmText.toLowerCase() !== "delete my account"}
                className="border border-red-500 bg-red-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-40"
              >
                {deleteLoading ? "Deleting..." : "Permanently Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
