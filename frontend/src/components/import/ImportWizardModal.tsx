"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ChevronRight,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Search,
  ExternalLink,
  Layers,
  Check,
  Edit2,
  SkipForward,
} from "lucide-react";
import {
  importApi,
  ImportJob,
  ImportJobItem,
  ParsedImportRow,
  AnimeStatus,
  CandidateData,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

interface ImportWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete?: () => void;
}

type WizardStep = "INPUT" | "DISCOVERY" | "REVIEW" | "DUPLICATES" | "SUMMARY";

export function ImportWizardModal({
  isOpen,
  onClose,
  onImportComplete,
}: ImportWizardModalProps) {
  const { reduceMotion } = useAuth();

  // Wizard state
  const [step, setStep] = useState<WizardStep>("INPUT");
  const [inputTab, setInputTab] = useState<"paste" | "upload">("paste");
  const [rawText, setRawText] = useState("");
  const [fileType, setFileType] = useState<"text" | "csv">("text");
  const [fileName, setFileName] = useState<string | null>(null);

  // Parsing & job state
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [previewRows, setPreviewRows] = useState<ParsedImportRow[]>([]);
  const [parseWarnings, setParseWarnings] = useState<string[]>([]);

  // Discovery & Active Job
  const [activeJob, setActiveJob] = useState<ImportJob | null>(null);
  const [jobLoading, setJobLoading] = useState(false);
  const [discoveryProgress, setDiscoveryProgress] = useState(0);

  // Disambiguation / candidate picking
  const [candidatePickerItemId, setCandidatePickerItemId] = useState<string | null>(null);

  // Duplicate resolution actions: item_id -> "skip" | "update_metadata" | "merge_progress"
  const [duplicateActions, setDuplicateActions] = useState<Record<string, "skip" | "update_metadata" | "merge_progress">>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset modal state on open
  useEffect(() => {
    if (isOpen) {
      setStep("INPUT");
      setRawText("");
      setFileName(null);
      setPreviewRows([]);
      setParseWarnings([]);
      setParseError(null);
      setActiveJob(null);
      setCandidatePickerItemId(null);
      setDuplicateActions({});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // ---------------------------------------------------------------------------
  // STEP 1: PARSING
  // ---------------------------------------------------------------------------
  const handleParseContent = async (textToParse: string, type: "text" | "csv") => {
    if (!textToParse.trim()) {
      setParseError("Please provide anime titles to parse.");
      return;
    }
    try {
      setParsing(true);
      setParseError(null);
      setParseWarnings([]);
      const res = await importApi.parse(textToParse, type);
      if (res.total_rows === 0) {
        setParseError("No valid anime titles could be detected.");
      } else {
        setPreviewRows(res.preview_items);
        setParseWarnings(res.errors);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to parse import content.";
      setParseError(msg);
    } finally {
      setParsing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const isCsv = file.name.endsWith(".csv");
    const detectedType = isCsv ? "csv" : "text";
    setFileType(detectedType);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const content = evt.target?.result as string;
      setRawText(content);
      await handleParseContent(content, detectedType);
    };
    reader.readAsText(file);
  };

  // ---------------------------------------------------------------------------
  // STEP 2: METADATA DISCOVERY
  // ---------------------------------------------------------------------------
  const handleStartDiscovery = async () => {
    if (previewRows.length === 0) return;
    try {
      setJobLoading(true);
      setStep("DISCOVERY");
      setDiscoveryProgress(20);

      // Create import job which runs discovery on backend
      const job = await importApi.createJob(
        inputTab === "upload" ? (fileType === "csv" ? "CSV" : "TXT") : "PASTE",
        previewRows
      );
      setDiscoveryProgress(80);
      setActiveJob(job);

      // Auto-initialize duplicate actions default to "update_metadata" or "skip"
      const initialActions: Record<string, "skip" | "update_metadata" | "merge_progress"> = {};
      job.items.forEach((item) => {
        if (item.is_duplicate) {
          initialActions[item.id] = "update_metadata";
        }
      });
      setDuplicateActions(initialActions);

      setDiscoveryProgress(100);
      setTimeout(() => {
        setStep("REVIEW");
        setJobLoading(false);
      }, 500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create import job.";
      setParseError(msg);
      setStep("INPUT");
      setJobLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // STEP 3: REVIEW & CANDIDATE OVERRIDE
  // ---------------------------------------------------------------------------
  const handleSelectAlternateCandidate = async (itemId: string, candidate: CandidateData) => {
    if (!activeJob) return;
    try {
      const updated = await importApi.updateItem(activeJob.id, itemId, {
        selected_provider_id: candidate.provider_id,
      });
      setActiveJob({
        ...activeJob,
        items: activeJob.items.map((it) => (it.id === itemId ? updated : it)),
      });
      setCandidatePickerItemId(null);
    } catch (err: unknown) {
      console.error("Failed to select candidate:", err);
    }
  };

  const handleToggleSkip = async (itemId: string, currentStatus: string) => {
    if (!activeJob) return;
    const willSkip = currentStatus !== "SKIPPED";
    try {
      const updated = await importApi.updateItem(activeJob.id, itemId, {
        skip: willSkip,
      });
      setActiveJob({
        ...activeJob,
        items: activeJob.items.map((it) => (it.id === itemId ? updated : it)),
      });
    } catch (err: unknown) {
      console.error("Failed to toggle skip:", err);
    }
  };

  // ---------------------------------------------------------------------------
  // STEP 4: DUPLICATE RESOLUTIONS
  // ---------------------------------------------------------------------------
  const duplicateItems = activeJob?.items.filter((it) => it.is_duplicate && it.status !== "SKIPPED") || [];

  const handleSetDuplicateAction = (itemId: string, action: "skip" | "update_metadata" | "merge_progress") => {
    setDuplicateActions((prev) => ({
      ...prev,
      [itemId]: action,
    }));
  };

  const handleBatchDuplicateAction = (action: "skip" | "update_metadata" | "merge_progress") => {
    const updated: Record<string, "skip" | "update_metadata" | "merge_progress"> = {};
    duplicateItems.forEach((it) => {
      updated[it.id] = action;
    });
    setDuplicateActions(updated);
  };

  // ---------------------------------------------------------------------------
  // STEP 5: FINAL IMPORT CONFIRMATION
  // ---------------------------------------------------------------------------
  const handleConfirmImport = async () => {
    if (!activeJob) return;
    try {
      setJobLoading(true);
      const completedJob = await importApi.confirmJob(activeJob.id, duplicateActions);
      setActiveJob(completedJob);
      setStep("SUMMARY");
      if (onImportComplete) {
        onImportComplete();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to finalize import.";
      setParseError(msg);
    } finally {
      setJobLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-fade-in">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: reduceMotion ? 0.01 : 0.2 }}
        className="relative flex flex-col w-full max-w-4xl max-h-[90vh] bg-kage-surface border border-kage-border shadow-tactile-lg overflow-hidden text-kage-text-primary"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-kage-border px-6 py-4 bg-kage-bg/70">
          <div className="flex items-center space-x-3">
            <span className="flex h-8 w-8 items-center justify-center border border-white text-xs font-bold text-white bg-black">
              影
            </span>
            <div>
              <div className="flex items-center space-x-2 font-mono text-xs uppercase tracking-wider text-kage-text-muted">
                <span>IMPORT SHOWS</span>
                <span>•</span>
                <span>ANIME LIST</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white uppercase">
                Import Anime List
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-kage-text-muted hover:text-white transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step Indicator Breadcrumbs */}
        <div className="grid grid-cols-5 border-b border-kage-border bg-kage-bg font-mono text-xs tracking-wider uppercase">
          {[
            { id: "INPUT", label: "1. Add Titles" },
            { id: "DISCOVERY", label: "2. Find Details" },
            { id: "REVIEW", label: "3. Review" },
            { id: "DUPLICATES", label: "4. Duplicates" },
            { id: "SUMMARY", label: "5. Done" },
          ].map((s, idx) => {
            const isActive = step === s.id;
            const isPassed =
              (s.id === "INPUT" && step !== "INPUT") ||
              (s.id === "DISCOVERY" && ["REVIEW", "DUPLICATES", "SUMMARY"].includes(step)) ||
              (s.id === "REVIEW" && ["DUPLICATES", "SUMMARY"].includes(step)) ||
              (s.id === "DUPLICATES" && step === "SUMMARY");

            return (
              <div
                key={s.id}
                className={`py-2 px-3 text-center border-r last:border-r-0 border-kage-border transition-colors ${
                  isActive
                    ? "bg-white text-black font-bold"
                    : isPassed
                    ? "text-kage-text-secondary bg-kage-surface-raised/40"
                    : "text-kage-text-muted"
                }`}
              >
                {s.label}
              </div>
            );
          })}
        </div>

        {/* Modal Body Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* ================================================================= */}
          {/* STEP 1: INPUT                                                     */}
          {/* ================================================================= */}
          {step === "INPUT" && (
            <div className="space-y-6">
              {/* Method Tabs */}
              <div className="flex border border-kage-border p-1 bg-kage-bg max-w-sm">
                <button
                  type="button"
                  onClick={() => setInputTab("paste")}
                  className={`flex-1 py-2 text-sm font-semibold tracking-wider transition-colors uppercase ${
                    inputTab === "paste"
                      ? "bg-white text-black"
                      : "text-kage-text-muted hover:text-white"
                  }`}
                >
                  Paste Titles
                </button>
                <button
                  type="button"
                  onClick={() => setInputTab("upload")}
                  className={`flex-1 py-2 text-sm font-semibold tracking-wider transition-colors uppercase ${
                    inputTab === "upload"
                      ? "bg-white text-black"
                      : "text-kage-text-muted hover:text-white"
                  }`}
                >
                  Upload File
                </button>
              </div>

              {inputTab === "paste" ? (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-mono text-xs sm:text-sm text-kage-text-secondary uppercase">
                      Paste anime titles (One title per line)
                    </label>
                    <span className="font-mono text-xs text-kage-text-muted">
                      Max 500 titles
                    </span>
                  </div>
                  <textarea
                    rows={8}
                    value={rawText}
                    onChange={(e) => {
                      setRawText(e.target.value);
                      if (previewRows.length > 0) setPreviewRows([]);
                    }}
                    placeholder={`Naruto\nDeath Note\nSteins;Gate\nFullmetal Alchemist: Brotherhood\nFrieren: Beyond Journey's End\nCowboy Bebop`}
                    className="w-full border border-kage-border bg-kage-bg p-3.5 font-mono text-sm text-white placeholder-kage-text-muted/60 focus:border-white focus:outline-none focus:ring-0 leading-relaxed resize-y"
                  />
                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-xs sm:text-sm text-kage-text-muted">
                      Titles will be defaulted to <strong>Plan to Watch</strong> status with 0 episodes watched.
                    </p>
                    <button
                      type="button"
                      disabled={parsing || !rawText.trim()}
                      onClick={() => handleParseContent(rawText, "text")}
                      className="border border-kage-border bg-kage-surface px-4 py-2 text-sm font-bold text-white uppercase hover:border-white disabled:opacity-40"
                    >
                      {parsing ? "Parsing..." : "Review List"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-kage-border hover:border-white p-8 text-center cursor-pointer transition-colors bg-kage-bg/40"
                  >
                    <UploadCloud className="mx-auto h-8 w-8 text-kage-text-muted mb-3" />
                    <p className="text-sm font-medium text-white uppercase tracking-wider">
                      Click to select or drag and drop file
                    </p>
                    <p className="text-xs font-mono text-kage-text-muted mt-1">
                      Supports .TXT (one title per line) or .CSV (with title, status, episodes, rating)
                    </p>
                    {fileName && (
                      <div className="mt-4 inline-flex items-center space-x-2 border border-kage-border px-3 py-1 font-mono text-xs text-white bg-kage-surface">
                        <FileText className="h-3.5 w-3.5" />
                        <span>{fileName}</span>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt,.csv"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </div>
              )}

              {/* Parsing Warnings / Errors */}
              {parseError && (
                <div className="border border-red-500/40 bg-red-950/20 p-3 flex items-start space-x-2.5 text-sm text-red-300">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{parseError}</span>
                </div>
              )}

              {parseWarnings.length > 0 && (
                <div className="border border-amber-500/40 bg-amber-950/20 p-3 text-sm text-amber-300 space-y-1">
                  {parseWarnings.map((w, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      <span>{w}</span>
                    </div>
                  ))}
                </div>
              )}

              {previewRows.length > 0 && (
                <div className="space-y-3 pt-2 border-t border-kage-border">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs sm:text-sm uppercase tracking-wider text-white">
                      Parsed Preview ({previewRows.length} items found)
                    </span>
                    <span className="font-mono text-xs text-kage-text-muted">
                      Ready to find show details
                    </span>
                  </div>

                  <div className="max-h-52 overflow-y-auto border border-kage-border bg-kage-bg text-xs">
                    <table className="w-full text-left font-mono text-xs">
                      <thead className="border-b border-kage-border bg-kage-surface sticky top-0 text-kage-text-muted uppercase">
                        <tr>
                          <th className="py-2 px-3">#</th>
                          <th className="py-2 px-3">Title</th>
                          <th className="py-2 px-3">Status</th>
                          <th className="py-2 px-3">Progress</th>
                          <th className="py-2 px-3">Score</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-kage-border/40">
                        {previewRows.slice(0, 20).map((row, idx) => (
                          <tr key={idx} className="hover:bg-kage-surface-raised/30">
                            <td className="py-1.5 px-3 text-kage-text-muted">{idx + 1}</td>
                            <td className="py-1.5 px-3 text-white font-sans">{row.raw_title}</td>
                            <td className="py-1.5 px-3 text-kage-text-secondary">{row.status}</td>
                            <td className="py-1.5 px-3 text-kage-text-secondary">
                              {row.watched_episodes} / {row.total_episodes || "?"}
                            </td>
                            <td className="py-1.5 px-3 text-kage-text-secondary">
                              {row.rating ? `${row.rating}/10` : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {previewRows.length > 20 && (
                    <p className="text-xs font-mono text-kage-text-muted text-right">
                      Showing first 20 of {previewRows.length} items...
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ================================================================= */}
          {/* STEP 2: DISCOVERY SCANNING                                        */}
          {/* ================================================================= */}
          {step === "DISCOVERY" && (
            <div className="py-16 text-center space-y-6">
              <div className="relative mx-auto h-20 w-20 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-white/20 animate-ping" />
                <div className="h-14 w-14 rounded-full border-2 border-white border-t-transparent animate-spin" />
                <Sparkles className="h-6 w-6 text-white absolute" />
              </div>

              <div>
                <h3 className="text-xl font-bold uppercase tracking-tight text-white">
                  Looking Up Show Details
                </h3>
                <p className="text-sm text-kage-text-secondary mt-1.5">
                  Finding posters, episode counts, and show information...
                </p>
              </div>

              {/* Progress bar */}
              <div className="max-w-md mx-auto">
                <div className="h-2 w-full bg-kage-bg border border-kage-border overflow-hidden">
                  <div
                    className="h-full bg-white transition-all duration-300"
                    style={{ width: `${discoveryProgress}%` }}
                  />
                </div>
                <div className="mt-2 flex justify-between font-mono text-xs text-kage-text-muted">
                  <span>Finding details</span>
                  <span>{discoveryProgress}%</span>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* STEP 3: REVIEW & MATCHES                                          */}
          {/* ================================================================= */}
          {step === "REVIEW" && activeJob && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-kage-border pb-3">
                <div>
                  <h3 className="text-base font-bold uppercase tracking-wider text-white">
                    Review Matches
                  </h3>
                  <p className="text-xs sm:text-sm text-kage-text-secondary">
                    Check matching shows, change wrong matches, or skip shows you don&apos;t want.
                  </p>
                </div>
                <div className="flex items-center space-x-2 font-mono text-xs">
                  <span className="border border-green-500/40 bg-green-950/20 px-2.5 py-0.5 text-green-300">
                    {activeJob.items.filter((i) => i.status === "MATCHED").length} Matched
                  </span>
                  <span className="border border-amber-500/40 bg-amber-950/20 px-2.5 py-0.5 text-amber-300">
                    {activeJob.items.filter((i) => i.status === "AMBIGUOUS").length} Ambiguous
                  </span>
                  <span className="border border-neutral-700 bg-neutral-900 px-2.5 py-0.5 text-neutral-400">
                    {activeJob.items.filter((i) => i.status === "UNMATCHED").length} Unmatched
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                {activeJob.items.map((item) => {
                  const isSkipped = item.status === "SKIPPED";
                  const isPicking = candidatePickerItemId === item.id;

                  return (
                    <div
                      key={item.id}
                      className={`border p-3.5 transition-colors ${
                        isSkipped
                          ? "border-kage-border/40 bg-kage-bg/40 opacity-50"
                          : item.status === "MATCHED"
                          ? "border-kage-border bg-kage-bg hover:border-kage-border-focus"
                          : item.status === "AMBIGUOUS"
                          ? "border-amber-500/40 bg-amber-950/10"
                          : "border-neutral-700 bg-neutral-950/40"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        {/* Poster artwork */}
                        <div className="h-16 w-12 shrink-0 bg-neutral-900 border border-kage-border overflow-hidden flex items-center justify-center">
                          {item.poster_url ? (
                            <img
                              src={item.poster_url}
                              alt={item.matched_title || item.raw_title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="font-mono text-xs text-kage-text-muted">NO IMG</span>
                          )}
                        </div>

                        {/* Title details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                            <h4 className="text-sm font-bold text-white truncate">
                              {item.matched_title || item.raw_title}
                            </h4>
                            {/* Confidence / Ambiguity Badge */}
                            {item.status === "MATCHED" && (
                              <span className="font-mono text-xs text-green-400 border border-green-500/30 px-2 py-0.5">
                                {(item.match_confidence * 100).toFixed(0)}% MATCH
                              </span>
                            )}
                            {item.status === "AMBIGUOUS" && (
                              <span className="font-mono text-xs text-amber-400 border border-amber-500/30 px-2 py-0.5">
                                AMBIGUOUS ({(item.match_confidence * 100).toFixed(0)}%)
                              </span>
                            )}
                            {item.status === "UNMATCHED" && (
                              <span className="font-mono text-xs text-neutral-400 border border-neutral-700 px-2 py-0.5">
                                NO MATCH
                              </span>
                            )}
                            {item.is_duplicate && (
                              <span className="font-mono text-xs text-sky-400 border border-sky-500/30 px-2 py-0.5">
                                ALREADY IN LIST
                              </span>
                            )}
                          </div>

                          <p className="font-mono text-xs text-kage-text-muted mt-1">
                            Raw query: &quot;{item.raw_title}&quot;
                            {item.total_episodes && ` • ${item.total_episodes} eps`}
                            {item.match_warning && ` • ${item.match_warning}`}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-2 shrink-0">
                          {item.candidates_json && item.candidates_json.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setCandidatePickerItemId(isPicking ? null : item.id)}
                              className="border border-kage-border px-2.5 py-1 text-xs font-mono text-kage-text-secondary hover:border-white hover:text-white"
                            >
                              {isPicking ? "Close" : `Change (${item.candidates_json.length})`}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleToggleSkip(item.id, item.status)}
                            className={`border px-2.5 py-1 text-xs font-mono transition-colors ${
                              isSkipped
                                ? "border-white bg-white text-black font-semibold"
                                : "border-kage-border text-kage-text-muted hover:text-white"
                            }`}
                          >
                            {isSkipped ? "Unskip" : "Skip"}
                          </button>
                        </div>
                      </div>

                      {/* Candidate Picker Drawer */}
                      {isPicking && item.candidates_json && (
                        <div className="mt-3 pt-3 border-t border-kage-border/80 space-y-2 animate-fade-in">
                          <span className="font-mono text-xs uppercase text-kage-text-muted block">
                            Pick the correct show from the results:
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {item.candidates_json.map((cand) => (
                              <div
                                key={cand.provider_id}
                                onClick={() => handleSelectAlternateCandidate(item.id, cand)}
                                className={`flex items-center space-x-2.5 border p-2 cursor-pointer transition-colors ${
                                  item.provider_media_id === cand.provider_id
                                    ? "border-white bg-white/10"
                                    : "border-kage-border bg-kage-surface hover:border-kage-border-focus"
                                }`}
                              >
                                {cand.poster_url ? (
                                  <img
                                    src={cand.poster_url}
                                    alt={cand.title}
                                    className="h-10 w-8 object-cover shrink-0"
                                  />
                                ) : (
                                  <div className="h-10 w-8 bg-neutral-900 border border-kage-border shrink-0" />
                                )}
                                <div className="min-w-0 flex-1">
                                  <div className="text-sm font-semibold text-white truncate">
                                    {cand.canonical_title || cand.title}
                                  </div>
                                  <div className="font-mono text-xs text-kage-text-muted">
                                    {cand.total_episodes ? `${cand.total_episodes} eps` : "Ongoing"} •{" "}
                                    {cand.media_type || "TV"} • {cand.year || "—"}
                                  </div>
                                </div>
                                {item.provider_media_id === cand.provider_id && (
                                  <Check className="h-4 w-4 text-white shrink-0" />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* STEP 4: DUPLICATE RESOLUTION                                      */}
          {/* ================================================================= */}
          {step === "DUPLICATES" && activeJob && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-kage-border pb-3">
                <div>
                  <h3 className="text-base font-bold uppercase tracking-wider text-white">
                    Shows Already in Your List
                  </h3>
                  <p className="text-xs sm:text-sm text-kage-text-secondary">
                    {duplicateItems.length > 0
                      ? `Found ${duplicateItems.length} show${duplicateItems.length > 1 ? "s" : ""} already in your list.`
                      : "Zero duplicates found! All items are unique additions to your list."}
                  </p>
                </div>

                {duplicateItems.length > 0 && (
                  <div className="flex items-center space-x-2 font-mono text-xs">
                    <span className="text-kage-text-muted">Set all to:</span>
                    <button
                      type="button"
                      onClick={() => handleBatchDuplicateAction("update_metadata")}
                      className="border border-kage-border px-2.5 py-1 text-kage-text-secondary hover:text-white hover:border-white"
                    >
                      Add Missing Details
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBatchDuplicateAction("merge_progress")}
                      className="border border-kage-border px-2.5 py-1 text-kage-text-secondary hover:text-white hover:border-white"
                    >
                      Update Everything
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBatchDuplicateAction("skip")}
                      className="border border-kage-border px-2.5 py-1 text-kage-text-secondary hover:text-white hover:border-white"
                    >
                      Skip All
                    </button>
                  </div>
                )}
              </div>

              {duplicateItems.length === 0 ? (
                <div className="py-12 text-center border border-dashed border-kage-border bg-kage-bg/40 space-y-3">
                  <CheckCircle2 className="mx-auto h-10 w-10 text-white" />
                  <h4 className="text-base font-bold uppercase tracking-wider text-white">
                    No Duplicates Found
                  </h4>
                  <p className="text-sm text-kage-text-secondary max-w-md mx-auto">
                    All shows are brand new to your list. Ready to save!
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                  {duplicateItems.map((item) => {
                    const currentAction = duplicateActions[item.id] || "update_metadata";

                    return (
                      <div
                        key={item.id}
                        className="border border-kage-border bg-kage-bg p-4 space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="font-mono text-xs uppercase tracking-wider text-sky-400">
                              Already in Your List
                            </span>
                            <h4 className="text-sm font-bold text-white">
                              {item.matched_title || item.raw_title}
                            </h4>
                          </div>
                          <span className="font-mono text-xs text-kage-text-muted">
                            Imported: {item.parsed_watched_episodes} eps • {item.parsed_status}
                          </span>
                        </div>

                        {/* Action buttons */}
                        <div className="grid grid-cols-3 gap-2 font-mono text-xs">
                          <button
                            type="button"
                            onClick={() => handleSetDuplicateAction(item.id, "update_metadata")}
                            className={`border p-2.5 text-left transition-colors ${
                              currentAction === "update_metadata"
                                ? "border-white bg-white text-black font-bold"
                                : "border-kage-border text-kage-text-muted hover:border-kage-border-focus hover:text-white"
                            }`}
                          >
                            <div className="uppercase font-semibold">Add Missing Details</div>
                            <div className="text-xs opacity-80 font-sans mt-0.5">
                              Only fill in missing poster and total episodes
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSetDuplicateAction(item.id, "merge_progress")}
                            className={`border p-2.5 text-left transition-colors ${
                              currentAction === "merge_progress"
                                ? "border-white bg-white text-black font-bold"
                                : "border-kage-border text-kage-text-muted hover:border-kage-border-focus hover:text-white"
                            }`}
                          >
                            <div className="uppercase font-semibold">Update Everything</div>
                            <div className="text-xs opacity-80 font-sans mt-0.5">
                              Update episodes watched, rating, and notes
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSetDuplicateAction(item.id, "skip")}
                            className={`border p-2.5 text-left transition-colors ${
                              currentAction === "skip"
                                ? "border-white bg-white text-black font-bold"
                                : "border-kage-border text-kage-text-muted hover:border-kage-border-focus hover:text-white"
                            }`}
                          >
                            <div className="uppercase font-semibold">Leave As Is</div>
                            <div className="text-xs opacity-80 font-sans mt-0.5">
                              Keep your existing show details unchanged
                            </div>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ================================================================= */}
          {/* STEP 5: SUMMARY & TELEMETRY                                       */}
          {/* ================================================================= */}
          {step === "SUMMARY" && activeJob && (
            <div className="py-8 space-y-6 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center border-2 border-white bg-black">
                <Check className="h-8 w-8 text-white" />
              </div>

              <div>
                <span className="font-mono text-xs uppercase tracking-widest text-kage-text-muted">
                  IMPORT FINISHED
                </span>
                <h3 className="text-2xl font-bold uppercase tracking-tight text-white mt-1">
                  Your List Has Been Updated!
                </h3>
              </div>

              {/* Stats Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl mx-auto border border-kage-border bg-kage-bg p-4 text-left font-mono">
                <div>
                  <span className="text-xs uppercase text-kage-text-muted">Added / Updated</span>
                  <div className="text-2xl font-bold text-white">{activeJob.imported_items}</div>
                </div>
                <div>
                  <span className="text-xs uppercase text-kage-text-muted">Skipped</span>
                  <div className="text-2xl font-bold text-white">{activeJob.skipped_items}</div>
                </div>
                <div>
                  <span className="text-xs uppercase text-kage-text-muted">Failed</span>
                  <div className="text-2xl font-bold text-white">{activeJob.failed_items}</div>
                </div>
                <div>
                  <span className="text-xs uppercase text-kage-text-muted">Total Shows</span>
                  <div className="text-2xl font-bold text-white">{activeJob.total_items}</div>
                </div>
              </div>

              <p className="text-sm text-kage-text-secondary max-w-md mx-auto">
                Your anime list and stats are now up to date!
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="flex items-center justify-between border-t border-kage-border px-6 py-4 bg-kage-bg/70">
          {step === "INPUT" && (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-mono uppercase tracking-wider text-kage-text-muted hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={previewRows.length === 0 || jobLoading}
                onClick={handleStartDiscovery}
                className="flex items-center space-x-2 border border-white bg-white px-5 py-2.5 text-sm font-bold tracking-wider text-black transition-all hover:bg-neutral-200 active:scale-95 disabled:opacity-30 uppercase"
              >
                <span>Find Show Details</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </>
          )}

          {step === "REVIEW" && (
            <>
              <button
                type="button"
                onClick={() => setStep("INPUT")}
                className="px-4 py-2 text-sm font-mono uppercase tracking-wider text-kage-text-muted hover:text-white"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep("DUPLICATES")}
                className="flex items-center space-x-2 border border-white bg-white px-5 py-2.5 text-sm font-bold tracking-wider text-black transition-all hover:bg-neutral-200 active:scale-95 uppercase"
              >
                <span>Next: Duplicates</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )}

          {step === "DUPLICATES" && (
            <>
              <button
                type="button"
                onClick={() => setStep("REVIEW")}
                className="px-4 py-2 text-sm font-mono uppercase tracking-wider text-kage-text-muted hover:text-white"
              >
                Back
              </button>
              <button
                type="button"
                disabled={jobLoading}
                onClick={handleConfirmImport}
                className="flex items-center space-x-2 border border-white bg-white px-6 py-2.5 text-sm font-bold tracking-wider text-black transition-all hover:bg-neutral-200 active:scale-95 disabled:opacity-30 uppercase"
              >
                {jobLoading ? (
                  <span>Importing...</span>
                ) : (
                  <>
                    <span>Add to My List</span>
                    <CheckCircle2 className="h-4 w-4" />
                  </>
                )}
              </button>
            </>
          )}

          {step === "SUMMARY" && (
            <div className="w-full flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="border border-white bg-white px-6 py-2.5 text-sm font-bold tracking-wider text-black transition-all hover:bg-neutral-200 uppercase"
              >
                Go to My List
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
