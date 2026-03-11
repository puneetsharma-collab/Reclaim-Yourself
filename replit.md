# Reclaim Yourself

A mobile-first app to help users build discipline and overcome addiction through a gamified spiritual journey.

## Architecture

- **Frontend**: Expo (React Native) with Expo Router for file-based routing, running as a **web app** on port 5000
- **Backend**: Express.js (TypeScript) on port 8000 — serves REST API
- **Database**: PostgreSQL (Replit built-in) via Drizzle ORM — stores all user accounts and progress
- **Auth**: Username + hashed password (bcryptjs), session tracked via AsyncStorage (client-side user ID cache)

## Running the Project

Two workflows must both be running:

| Workflow | Command | Port |
|---|---|---|
| **Start Backend** | `npm install && PORT=8000 npm run server:dev` | 8000 |
| **Start Frontend Web** | `npm install && EXPO_PUBLIC_DOMAIN=$REPLIT_DEV_DOMAIN:8000 node_modules/.bin/expo start --web --port 5000` | 5000 (preview) |

The **Run button** starts both automatically. On a fresh GitHub import, `npm install` runs automatically inside each workflow before the server starts — no manual setup needed.

## File Structure

### Backend
- `server/index.ts` — Express server entry point (CORS, logging, static serving)
- `server/routes.ts` — API routes: `/api/register`, `/api/login`, `/api/user/:username` (GET/PUT)
- `shared/schema.ts` — Drizzle schema for the `users` table (all game data included)

### Frontend Core
- `lib/storage.ts` — Game logic: `applyCheckInSuccess()`, `applyCheckInRelapse()`, local user ID cache
- `lib/query-client.ts` — API fetch helper using `EXPO_PUBLIC_DOMAIN` env var
- `context/UserContext.tsx` — Global auth + game state. All reads/writes go through the backend API.

### Screens
- `app/(auth)/login.tsx` — Anonymous login
- `app/(auth)/register.tsx` — Account creation
- `app/welcome.tsx` — Animated welcome screen
- `app/(tabs)/index.tsx` — **Journey tab**: full-screen character scene, daily check-in, day progress tracker
- `app/(tabs)/progress.tsx` — **Progress tab**: stats grid, 7-day chart, milestone badges
- `app/(tabs)/shrine.tsx` — **Shrine tab**: shrine scene (unlocked at Day 7)
- `app/(tabs)/profile.tsx` — **Profile tab**: user info, reset, logout

### Assets
- `assets/images/l1-day0.png` through `l1-day7.jpg` — Level 1 character images (one per streak day 0–7)
- Future levels follow the same pattern: `l2-day0.jpg` … `l2-day7.jpg`, etc.
- `assets/images/shrine-scene.jpg` — Shrine scene (used in Shrine tab)

## Data Model (PostgreSQL `users` table)

| Column | Type | Description |
|---|---|---|
| `id` | varchar (UUID) | Primary key |
| `username` | text | Anonymous ID chosen by user |
| `password` | text | bcrypt hashed |
| `join_date` | text | YYYY-MM-DD |
| `current_streak` | integer | Active streak count |
| `longest_streak` | integer | All-time best |
| `freeze_points` | integer | Earned at Day 3, auto-consumed on missed day |
| `total_wins` | integer | Total successful check-ins |
| `total_relapses` | integer | Total stumbles |
| `last_check_in_date` | text | YYYY-MM-DD or null |
| `shrine_unlocked` | boolean | true when streak >= 7 |
| `checkpoint_unlocked` | boolean | true when streak >= 3 |
| `current_level` | integer | 1 (days 0-3) or 2 (days 4-7) |
| `journey_position` | integer | 0–7 |
| `last_app_open_date` | text | Used for missed-day detection |

## Key Game Logic

### Freeze Points
- Awarded at Day 3 (checkpoint milestone)
- Auto-consumed when user missed a day (2+ days since last check-in)
- Do NOT protect against active "No, I stumbled" — that always resets streak

### Day → Image Mapping (Journey Screen)
Images are looked up via `LEVEL_IMAGES[level][day]` in `app/(tabs)/index.tsx`.

**Level 1** (`l1-dayN`):
- Day 0 → `l1-day0.png` (exhausted, at start)
- Day 1 → `l1-day1.png`
- Day 2 → `l1-day2.jpg`
- Day 3 → `l1-day3.jpg`
- Day 4 → `l1-day4.jpg`
- Day 5 → `l1-day5.jpg`
- Day 6 → `l1-day6.jpg`
- Day 7 → `l1-day7.jpg` (reclaimed)

**Level 2+**: Add images as `l2-day0.jpg` … `l2-day7.jpg` and add a new block to `LEVEL_IMAGES` in `index.tsx`.

## Design System
- Colors: `constants/colors.ts` — warm cream, sage green, muted gold, sunrise amber
- Font: Inter (400, 500, 600, 700) via `@expo-google-fonts/inter`
- Animations: react-native-reanimated

## Environment Variables
- `DATABASE_URL` — PostgreSQL connection string (set by Replit automatically)
- `PORT` — Backend port (set to 8000 in workflow)
- `EXPO_PUBLIC_DOMAIN` — Backend URL used by the frontend for API calls (set to `$REPLIT_DEV_DOMAIN:8000` in workflow)
