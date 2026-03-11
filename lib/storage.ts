import AsyncStorage from "@react-native-async-storage/async-storage";

export interface UserData {
  anonymousId: string;
  password: string;
  joinDate: string;
  currentStreak: number;
  longestStreak: number;
  freezePoints: number;
  totalWins: number;
  totalRelapses: number;
  lastCheckInDate: string | null;
  shrineUnlocked: boolean;
  checkpointUnlocked: boolean;
  currentLevel: number;
  journeyPosition: number;
  lastAppOpenDate: string | null;
}

const USERS_KEY = "reclaim_users";
const CURRENT_USER_KEY = "reclaim_current_user";

export function getTodayString(): string {
  return new Date().toISOString().split("T")[0];
}

export function getYesterdayString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

export function daysBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA);
  const b = new Date(dateB);
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor(Math.abs(b.getTime() - a.getTime()) / msPerDay);
}

export async function getAllUsers(): Promise<Record<string, UserData>> {
  try {
    const raw = await AsyncStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export async function saveUser(user: UserData): Promise<void> {
  const users = await getAllUsers();
  users[user.anonymousId] = user;
  await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export async function getUser(anonymousId: string): Promise<UserData | null> {
  const users = await getAllUsers();
  return users[anonymousId] || null;
}

export async function getCurrentUserId(): Promise<string | null> {
  return AsyncStorage.getItem(CURRENT_USER_KEY);
}

export async function setCurrentUserId(id: string | null): Promise<void> {
  if (id === null) {
    await AsyncStorage.removeItem(CURRENT_USER_KEY);
  } else {
    await AsyncStorage.setItem(CURRENT_USER_KEY, id);
  }
}

export function createNewUser(anonymousId: string, password: string): UserData {
  return {
    anonymousId,
    password,
    joinDate: getTodayString(),
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
    lastAppOpenDate: null,
  };
}

/**
 * STREAK & FREEZE LOGIC
 *
 * Called when the app opens or user state is loaded.
 * If the user missed yesterday (lastCheckInDate is 2+ days ago),
 * we automatically consume a freeze point to protect the streak.
 * If no freeze points remain, the streak is broken.
 *
 * NOTE: This only handles MISSED DAYS (user forgot to check in).
 * Active "No, I stumbled" resets streak regardless of freeze points.
 */
export function applyMissedDayLogic(user: UserData): UserData {
  const today = getTodayString();

  if (user.lastAppOpenDate === today) {
    return user;
  }

  const updated = { ...user, lastAppOpenDate: today };

  if (!user.lastCheckInDate) {
    return updated;
  }

  const daysSinceCheckIn = daysBetween(user.lastCheckInDate, today);

  if (daysSinceCheckIn >= 2) {
    if (user.freezePoints > 0) {
      return {
        ...updated,
        freezePoints: updated.freezePoints - 1,
      };
    } else {
      return {
        ...updated,
        currentStreak: 0,
        currentLevel: 1,
        journeyPosition: 0,
      };
    }
  }

  return updated;
}

/**
 * Called when user taps "Yes, I stayed strong."
 * Increments streak, updates journey position, unlocks milestones.
 */
export function applyCheckInSuccess(user: UserData): UserData {
  const newStreak = user.currentStreak + 1;
  const longestStreak = Math.max(newStreak, user.longestStreak);
  const journeyPosition = Math.min(newStreak, 7);

  const checkpointUnlocked = newStreak >= 3 ? true : user.checkpointUnlocked;
  const shrineUnlocked = newStreak >= 7 ? true : user.shrineUnlocked;

  let freezePoints = user.freezePoints;
  if (newStreak === 3 && !user.checkpointUnlocked) {
    freezePoints += 1;
  }

  const currentLevel = newStreak <= 3 ? 1 : 2;

  return {
    ...user,
    currentStreak: newStreak,
    longestStreak,
    totalWins: user.totalWins + 1,
    lastCheckInDate: getTodayString(),
    checkpointUnlocked,
    shrineUnlocked,
    freezePoints,
    currentLevel,
    journeyPosition,
    lastAppOpenDate: getTodayString(),
  };
}

/**
 * Called when user taps "No, I stumbled."
 * Resets streak unconditionally — freeze points do NOT save them here.
 */
export function applyCheckInRelapse(user: UserData): UserData {
  return {
    ...user,
    currentStreak: 0,
    currentLevel: 1,
    journeyPosition: 0,
    totalRelapses: user.totalRelapses + 1,
    lastCheckInDate: getTodayString(),
    lastAppOpenDate: getTodayString(),
  };
}
