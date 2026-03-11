import AsyncStorage from "@react-native-async-storage/async-storage";

export interface UserData {
  id: string;
  username: string;
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
