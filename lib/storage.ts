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
  l2Checkpoint1Unlocked: boolean;
  l2Checkpoint2Unlocked: boolean;
  l1BlessingClaimed: boolean;
  l2BlessingClaimed: boolean;
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

export function getMaxDaysForLevel(level: number): number {
  return level === 2 ? 10 : 7;
}

export function applyCheckInSuccess(user: UserData): UserData {
  const newStreak = user.currentStreak + 1;
  const longestStreak = Math.max(newStreak, user.longestStreak);

  // journeyPosition tracks days within the current level (not total streak)
  const maxDays = getMaxDaysForLevel(user.currentLevel ?? 1);
  const journeyPosition = Math.min((user.journeyPosition ?? 0) + 1, maxDays);

  const currentLevel = user.currentLevel ?? 1;
  const checkpointUnlocked = newStreak >= 3 ? true : user.checkpointUnlocked;

  // Shrine unlocked when level completion day is reached
  const shrineUnlocked =
    journeyPosition >= maxDays ? true : user.shrineUnlocked;

  let freezePoints = user.freezePoints;
  let l2Checkpoint1Unlocked = user.l2Checkpoint1Unlocked ?? false;
  let l2Checkpoint2Unlocked = user.l2Checkpoint2Unlocked ?? false;

  if (currentLevel === 1 && newStreak === 3 && !user.checkpointUnlocked) {
    freezePoints += 1;
  }
  if (currentLevel === 2 && journeyPosition === 5 && !l2Checkpoint1Unlocked) {
    freezePoints += 1;
    l2Checkpoint1Unlocked = true;
  }
  if (currentLevel === 2 && journeyPosition === 7 && !l2Checkpoint2Unlocked) {
    freezePoints += 1;
    l2Checkpoint2Unlocked = true;
  }

  return {
    ...user,
    currentStreak: newStreak,
    longestStreak,
    totalWins: user.totalWins + 1,
    lastCheckInDate: getTodayString(),
    checkpointUnlocked,
    shrineUnlocked,
    freezePoints,
    l2Checkpoint1Unlocked,
    l2Checkpoint2Unlocked,
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
    l2Checkpoint1Unlocked: false,
    l2Checkpoint2Unlocked: false,
    l1BlessingClaimed: false,
    l2BlessingClaimed: false,
  };
}
