import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";
import {
  UserData,
  getUser,
  saveUser,
  getCurrentUserId,
  setCurrentUserId,
  createNewUser,
  applyMissedDayLogic,
  applyCheckInSuccess,
  applyCheckInRelapse,
  getTodayString,
} from "@/lib/storage";

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
  markWelcomeSeen: () => void;
  canCheckInToday: boolean;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasSeenWelcome, setHasSeenWelcome] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    try {
      const id = await getCurrentUserId();
      if (id) {
        const userData = await getUser(id);
        if (userData) {
          const updated = applyMissedDayLogic(userData);
          if (updated !== userData) {
            await saveUser(updated);
          }
          setUser(updated);
          setHasSeenWelcome(true);
        }
      }
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  }

  async function login(anonymousId: string, password: string) {
    const userData = await getUser(anonymousId);
    if (!userData) {
      return { success: false, error: "No account found with this ID." };
    }
    if (userData.password !== password) {
      return { success: false, error: "Incorrect password." };
    }
    const updated = applyMissedDayLogic(userData);
    if (updated !== userData) {
      await saveUser(updated);
    }
    await setCurrentUserId(anonymousId);
    setUser(updated);
    setHasSeenWelcome(true);
    return { success: true };
  }

  async function signup(anonymousId: string, password: string) {
    const existing = await getUser(anonymousId);
    if (existing) {
      return { success: false, error: "This ID is already taken. Choose another." };
    }
    if (anonymousId.length < 3) {
      return { success: false, error: "ID must be at least 3 characters." };
    }
    if (password.length < 4) {
      return { success: false, error: "Password must be at least 4 characters." };
    }
    const newUser = createNewUser(anonymousId, password);
    await saveUser(newUser);
    await setCurrentUserId(anonymousId);
    setUser(newUser);
    setHasSeenWelcome(false);
    return { success: true };
  }

  async function logout() {
    await setCurrentUserId(null);
    setUser(null);
    setHasSeenWelcome(false);
  }

  async function checkInSuccess() {
    if (!user) return;
    const updated = applyCheckInSuccess(user);
    await saveUser(updated);
    setUser(updated);
  }

  async function checkInRelapse() {
    if (!user) return;
    const updated = applyCheckInRelapse(user);
    await saveUser(updated);
    setUser(updated);
  }

  async function resetJourney() {
    if (!user) return;
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
    await saveUser(reset);
    setUser(reset);
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
