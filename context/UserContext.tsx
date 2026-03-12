import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  UserData,
  getCurrentUserId,
  setCurrentUserId,
  applyCheckInSuccess,
  applyCheckInRelapse,
  getTodayString,
} from "@/lib/storage";
import { getApiUrl } from "@/lib/query-client";

async function clearBlessingKeys(username: string) {
  await AsyncStorage.multiRemove([
    `reclaim_l1_blessing_${username}`,
    `reclaim_l2_blessing_${username}`,
  ]);
}

interface UserContextValue {
  user: UserData | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  hasSeenWelcome: boolean;
  login: (anonymousId: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (anonymousId: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  checkInSuccess: () => Promise<void>;
  checkInRelapse: () => Promise<void>;
  resetJourney: () => Promise<void>;
  moveToLevel2: () => Promise<void>;
  markWelcomeSeen: () => void;
  canCheckInToday: boolean;
}

const UserContext = createContext<UserContextValue | null>(null);

async function apiCall(path: string, method = "GET", body?: unknown) {
  const base = getApiUrl();
  const url = new URL(path, base);
  const res = await fetch(url.toString(), {
    method,
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

async function saveUserToApi(user: UserData): Promise<void> {
  await apiCall(`/api/user/${user.username}`, "PUT", user);
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasSeenWelcome, setHasSeenWelcome] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    try {
      const username = await getCurrentUserId();
      if (username) {
        const data = await apiCall(`/api/user/${username}`);
        setUser(data.user);
        setHasSeenWelcome(true);
      }
    } catch {
      await setCurrentUserId(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(anonymousId: string, password: string) {
    try {
      const data = await apiCall("/api/login", "POST", { username: anonymousId, password });
      await setCurrentUserId(anonymousId);
      setUser(data.user);
      setHasSeenWelcome(true);
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Login failed.";
      return { success: false, error: msg };
    }
  }

  async function signup(anonymousId: string, password: string) {
    try {
      const data = await apiCall("/api/register", "POST", { username: anonymousId, password });
      await setCurrentUserId(anonymousId);
      setUser(data.user);
      setHasSeenWelcome(false);
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Registration failed.";
      return { success: false, error: msg };
    }
  }

  async function logout() {
    await setCurrentUserId(null);
    setUser(null);
    setHasSeenWelcome(false);
  }

  async function checkInSuccess() {
    if (!user) return;
    const updated = applyCheckInSuccess(user);
    await saveUserToApi(updated);
    setUser(updated);
  }

  async function checkInRelapse() {
    if (!user) return;
    const updated = applyCheckInRelapse(user);
    await clearBlessingKeys(user.username);
    await saveUserToApi(updated);
    setUser(updated);
  }

  async function resetJourney() {
    if (!user) return;
    await clearBlessingKeys(user.username);
    const reset: UserData = {
      ...user,
      currentStreak: 0,
      longestStreak: 0,
      freezePoints: 0,
      totalWins: 0,
      totalRelapses: 0,
      lastCheckInDate: null,
      shrineUnlocked: false,
      checkpointUnlocked: false,
      currentLevel: 1,
      journeyPosition: 0,
      lastAppOpenDate: getTodayString(),
    };
    await saveUserToApi(reset);
    setUser(reset);
  }

  async function moveToLevel2() {
    if (!user) return;
    const updated: UserData = {
      ...user,
      currentLevel: 2,
      journeyPosition: 0,
    };
    await saveUserToApi(updated);
    setUser(updated);
  }

  function markWelcomeSeen() {
    setHasSeenWelcome(true);
  }

  const canCheckInToday = useMemo(() => {
    if (!user) return false;
    const today = getTodayString();
    return user.lastCheckInDate !== today;
  }, [user]);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isLoggedIn: !!user,
      hasSeenWelcome,
      login,
      signup,
      logout,
      checkInSuccess,
      checkInRelapse,
      resetJourney,
      moveToLevel2,
      markWelcomeSeen,
      canCheckInToday,
    }),
    [user, isLoading, hasSeenWelcome, canCheckInToday]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
}
