import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";


export const API = process.env.EXPO_PUBLIC_BACKEND_URL || "https://oasis-backend-ia5h.onrender.com/api";

export type SkinUser = {
  user_id: string;
  email: string;
  name: string;
  picture?: string | null;
  has_profile: boolean;
};

type AuthCtx = {
  user: SkinUser | null;
  token: string | null;
  loading: boolean;
  signup: (email: string, password: string, name: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogleSession: (sessionId: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthCtx | null>(null);

const TOKEN_KEY = "skincare_token";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SkinUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async (t: string) => {
    const res = await fetch(`${API}/auth/me`, {
      headers: { Authorization: `Bearer ${t}` },
    });
    if (!res.ok) throw new Error("auth_failed");
    const u = await res.json();
    setUser(u);
    return u;
  }, []);

  useEffect(() => {
    (async () => {
      try {
        // Check URL for Google session_id (web only)
        if (Platform.OS === "web" && typeof window !== "undefined") {
          const hash = window.location.hash || "";
          const m = hash.match(/session_id=([^&]+)/);
          if (m) {
            const sessionId = m[1];
            window.history.replaceState({}, "", window.location.pathname);
            const res = await fetch(`${API}/auth/google/session`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ session_id: sessionId }),
            });
            if (res.ok) {
              const data = await res.json();
              await AsyncStorage.setItem(TOKEN_KEY, data.token);
              setToken(data.token);
              setUser(data.user);
              setLoading(false);
              return;
            }
          }
        }
        const stored = await AsyncStorage.getItem(TOKEN_KEY);
        if (stored) {
          try {
            await fetchMe(stored);
            setToken(stored);
          } catch {
            await AsyncStorage.removeItem(TOKEN_KEY);
          }
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [fetchMe]);

  const signup = async (email: string, password: string, name: string) => {
    const res = await fetch(`${API}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Erreur inscription");
    await AsyncStorage.setItem(TOKEN_KEY, data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const login = async (email: string, password: string) => {
    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Erreur connexion");
    await AsyncStorage.setItem(TOKEN_KEY, data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const loginWithGoogleSession = async (sessionId: string) => {
    const res = await fetch(`${API}/auth/google/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Erreur Google");
    await AsyncStorage.setItem(TOKEN_KEY, data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const logout = async () => {
    if (token) {
      await fetch(`${API}/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    await AsyncStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    if (token) await fetchMe(token);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, signup, login, loginWithGoogleSession, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const apiFetch = async (
  token: string | null,
  path: string,
  options: RequestInit = {}
) => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const res = await fetch(`${API}${path}`, { ...options, headers });

    const text = await res.text();

    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }

    if (!res.ok) {
      let msg = "Une erreur est survenue. Réessayez.";

      if (data && typeof data === "object" && data.detail) {
        msg = data.detail;
      }

      if (res.status >= 500) {
        msg = "Service temporairement indisponible. Réessayez dans quelques instants.";
      }

      if (res.status === 401) {
        msg = "Session expirée. Reconnecte-toi.";
      }

      if (res.status === 429) {
        msg = "Limite atteinte. Réessayez plus tard.";
      }

      throw new Error(msg);
    }

    return data;
  } catch (e: any) {
    if (e?.message) {
      throw e;
    }

    throw new Error("Connexion impossible. Vérifie ta connexion ou réessaie.");
  }
};
