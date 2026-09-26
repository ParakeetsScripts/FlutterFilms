"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type AuthUser = {
  id: string;
  email: string | null;
  displayName: string | null;
  username: string | null;
  avatarUrl: string | null;
  emailVerified: boolean;
  profileVisibility: "private" | "friends" | "public";
};

type AuthContext = {
  ready: boolean;
  user: AuthUser | null;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const Context = createContext<AuthContext | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);

  const refresh = useCallback(async () => {
    const response = await fetch("/api/auth/me");
    const data = await response.json();
    setUser(data.authenticated ? data.user : null);
    setReady(true);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  }, []);

  const value = useMemo(() => ({ ready, user, refresh, logout }), [ready, user, refresh, logout]);

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useAuth() {
  const ctx = useContext(Context);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
