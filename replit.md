# Reclaim Yourself

A mobile-first app to help users quit porn addiction and regain self-control through a peaceful spiritual journey experience.

## Architecture

- **Frontend**: Expo (React Native) with Expo Router for file-based routing
- **Backend**: Express.js (TypeScript) on port 5000 — serves API and landing page
- **Frontend Port**: 8081 (Expo dev server)
- **Storage**: AsyncStorage (local device storage, no backend database needed)
- **State**: React Context (UserContext) for auth and journey data

## File Structure

### Core Logic
- `lib/storage.ts` — All streak/freeze/user logic. **Key functions:**
  - `applyMissedDayLogic()` — Runs on app open, consumes freeze on missed day or breaks streak
  - `applyCheckInSuccess()` — Increments streak, awards freeze at Day 3, unlocks shrine at Day 7
  - `applyCheckInRelapse()` — Resets streak unconditionally (freeze does NOT protect active relapses)
- `context/UserContext.tsx` — Global user state. Provides `login`, `signup`, `logout`, `checkInSuccess`, `checkInRelapse`, `resetJourney`

### Screens
- `app/(auth)/login.tsx` — Anonymous login (username + password)
- `app/(auth)/register.tsx` — Anonymous account creation
- `app/welcome.tsx` — Animated welcome screen with "Begin My Journey" CTA
- `app/(tabs)/index.tsx` — **Journey tab**: streak display, path progression, daily check-in card
- `app/(tabs)/progress.tsx` — **Progress tab**: stats grid, 7-day chart, milestone badges
- `app/(tabs)/shrine.tsx` — **Shrine tab**: animated shrine scene, character evolution display
- `app/(tabs)/profile.tsx` — **Profile tab**: user info, privacy notice, reset/logout

### Navigation
- `app/_layout.tsx` — Root layout with `AuthGate` component that handles routing based on auth state
- `app/(tabs)/_layout.tsx` — 4-tab layout with NativeTabs (iOS 26+ liquid glass) + classic fallback

## Data Model (UserData)
```typescript
{
  anonymousId: string       // username chosen by user
  password: string          // stored in AsyncStorage
  joinDate: string          // YYYY-MM-DD
  currentStreak: number
  longestStreak: number
  freezePoints: number      // earned at Day 3 checkpoint
  totalWins: number         // successful check-ins
  totalRelapses: number
  lastCheckInDate: string | null  // YYYY-MM-DD
  shrineUnlocked: boolean   // true when streak >= 7
  checkpointUnlocked: boolean // true when streak >= 3
  currentLevel: number      // 1 (days 0-3) or 2 (days 4-7)
  journeyPosition: number   // 0-7
  lastAppOpenDate: string | null // for missed-day detection
}
```

## Freeze Point Logic
- Awarded automatically at Day 3 (checkpoint)
- **Consumed automatically** when app detects user missed a day (lastCheckInDate is 2+ days ago)
- **Does NOT protect** against active "No, I stumbled" taps — that always resets streak
- Configurable in `applyCheckInRelapse()` if future feature toggle needed

## Gamification Structure
- **Level 1**: Days 0–3, ends at checkpoint
- **Level 2**: Days 4–7, ends at shrine
- Path: 8 nodes (Start, Day 1-2, Checkpoint, Day 4-6, Shrine)
- Character evolves visually: Exhausted (Day 0) → Awakening (Day 3) → Reclaimed (Day 7)

## Design System
- Colors: `constants/colors.ts` — warm cream, sage green, muted gold, sunrise amber
- Font: Inter (400, 500, 600, 700) via `@expo-google-fonts/inter`
- Animations: react-native-reanimated

## Dependencies
- `expo-linear-gradient` — gradient backgrounds and buttons
- `expo-haptics` — haptic feedback on interactions
- `expo-blur` — tab bar blur (iOS)
- `@react-native-async-storage/async-storage` — local data persistence
- `expo-glass-effect` — liquid glass tab bar detection
