"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { User, UserPreferences, authApi, accountApi } from "./api";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  reduceMotion: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updatePreferences: (prefs: UserPreferences) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [systemReducedMotion, setSystemReducedMotion] = useState<boolean>(false);

  // Detect system prefers-reduced-motion media query
  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia) {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      setSystemReducedMotion(mediaQuery.matches);
      const listener = (e: MediaQueryListEvent) => setSystemReducedMotion(e.matches);
      mediaQuery.addEventListener("change", listener);
      return () => mediaQuery.removeEventListener("change", listener);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await authApi.getMe();
      setUser(currentUser);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    await authApi.login({ email, password });
    await refreshUser();
  };

  const register = async (email: string, password: string, displayName?: string) => {
    await authApi.register({ email, password, display_name: displayName });
    await login(email, password);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
    }
  };

  const updatePreferences = async (prefs: UserPreferences) => {
    const updated = await accountApi.updatePreferences(prefs);
    setUser(updated);
  };

  const reduceMotion = Boolean(user?.preferences?.reduce_motion || systemReducedMotion);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        reduceMotion,
        login,
        register,
        logout,
        refreshUser,
        updatePreferences,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
