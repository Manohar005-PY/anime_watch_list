"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Film,
  Compass,
  BarChart3,
  Settings as SettingsIcon,
  Plus,
  LogOut,
  Menu,
  X,
  Eye,
  Sliders,
  UploadCloud,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface AppHeaderProps {
  onOpenAddModal?: () => void;
  onOpenImportModal?: () => void;
}

export function AppHeader({ onOpenAddModal, onOpenImportModal }: AppHeaderProps) {
  const pathname = usePathname();
  const { user, logout, reduceMotion, updatePreferences } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: Compass },
    { name: "Collection", href: "/collection", icon: Film },
    { name: "Import", href: "/import", icon: UploadCloud },
    { name: "Stats", href: "/stats", icon: BarChart3 },
    { name: "Settings", href: "/settings", icon: SettingsIcon },
  ];

  const handleToggleReducedMotion = () => {
    if (user) {
      updatePreferences({ reduce_motion: !reduceMotion });
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-kage-border bg-kage-bg/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <div className="flex items-center space-x-6">
          <Link
            href={user ? "/dashboard" : "/"}
            className="group flex items-center space-x-2 font-mono tracking-widest text-kage-text-primary focus:outline-none"
          >
            <span className="flex h-7 w-7 items-center justify-center border border-kage-text-primary text-xs font-bold transition-transform group-hover:scale-105">
              影
            </span>
            <span className="text-sm font-semibold tracking-widest">KAGE</span>
          </Link>

          {/* Desktop Navigation */}
          {user && (
            <nav className="hidden md:flex md:space-x-1" aria-label="Main Navigation">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`relative flex items-center space-x-2 px-3.5 py-2 text-sm sm:text-kage-nav font-medium tracking-wider transition-colors ${
                      isActive
                        ? "text-kage-text-primary font-semibold"
                        : "text-kage-text-muted hover:text-kage-text-secondary"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                    {isActive && (
                      <motion.div
                        layoutId="activeNavIndicator"
                        className="absolute bottom-0 left-0 right-0 h-[2px] bg-kage-text-primary"
                        transition={{
                          duration: reduceMotion ? 0.01 : 0.2,
                          ease: [0.16, 1, 0.3, 1],
                        }}
                      />
                    )}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-3">
          {user ? (
            <>
              {/* Reduced Motion Quick Toggle Pill */}
              <button
                onClick={handleToggleReducedMotion}
                title={reduceMotion ? "Reduced Motion: Enabled" : "Reduced Motion: Disabled"}
                className={`hidden lg:flex items-center space-x-1.5 border px-3 py-1.5 text-xs font-mono tracking-tight transition-colors ${
                  reduceMotion
                    ? "border-kage-text-primary bg-kage-surface-raised text-kage-text-primary"
                    : "border-kage-border text-kage-text-muted hover:border-kage-border-focus hover:text-kage-text-secondary"
                }`}
                aria-label="Toggle reduced motion preference"
              >
                <Sliders className="h-3.5 w-3.5" />
                <span>{reduceMotion ? "Motion: Off" : "Motion: On"}</span>
              </button>

              {/* Import Anime Quick Action */}
              {onOpenImportModal && (
                <button
                  onClick={onOpenImportModal}
                  className="hidden sm:flex items-center space-x-1.5 border border-kage-border bg-kage-surface px-3.5 py-1.5 text-xs sm:text-sm font-semibold tracking-wider text-kage-text-primary transition-colors hover:border-white active:scale-95"
                >
                  <UploadCloud className="h-4 w-4" />
                  <span>Import</span>
                </button>
              )}

              {/* Add Anime Quick Action */}
              {onOpenAddModal && (
                <button
                  onClick={onOpenAddModal}
                  className="flex items-center space-x-1.5 border border-kage-text-primary bg-kage-text-primary px-3.5 py-1.5 text-xs sm:text-sm font-semibold tracking-wider text-kage-bg transition-transform hover:opacity-90 active:scale-95 shadow-tactile"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Add Anime</span>
                </button>
              )}

              {/* User Email & Sign Out */}
              <div className="hidden items-center space-x-2 md:flex">
                <span className="max-w-[150px] truncate font-mono text-xs text-kage-text-muted">
                  {user.display_name || user.email.split("@")[0]}
                </span>
                <button
                  onClick={logout}
                  title="Sign out"
                  className="p-1.5 text-kage-text-muted transition-colors hover:text-kage-text-primary"
                  aria-label="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>

              {/* Mobile Menu Toggle Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-1.5 text-kage-text-secondary hover:text-kage-text-primary md:hidden"
                aria-label="Toggle mobile menu"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </>
          ) : (
            <div className="flex items-center space-x-3">
              <Link
                href="/login"
                className="px-3.5 py-1.5 text-sm font-semibold tracking-wider text-kage-text-secondary transition-colors hover:text-kage-text-primary"
              >
                Log In
              </Link>
              <Link
                href="/register"
                className="border border-kage-text-primary bg-kage-text-primary px-4 py-1.5 text-sm font-bold tracking-wider text-kage-bg transition-transform hover:opacity-90 active:scale-95 shadow-tactile"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && user && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: reduceMotion ? 0.01 : 0.2 }}
            className="border-b border-kage-border bg-kage-surface px-4 py-3 md:hidden"
          >
            <nav className="flex flex-col space-y-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-3 py-2 text-xs font-medium tracking-wider ${
                      isActive
                        ? "bg-kage-surface-raised text-kage-text-primary"
                        : "text-kage-text-muted hover:text-kage-text-primary"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
              <div className="border-t border-kage-border pt-2">
                <button
                  onClick={() => {
                    handleToggleReducedMotion();
                    setMobileMenuOpen(false);
                  }}
                  className="flex w-full items-center justify-between px-3 py-2 text-xs text-kage-text-muted"
                >
                  <span>Reduced Motion</span>
                  <span className="font-mono">{reduceMotion ? "ON" : "OFF"}</span>
                </button>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="flex w-full items-center space-x-3 px-3 py-2 text-xs text-kage-text-muted hover:text-red-400"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign out ({user.email})</span>
                </button>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
