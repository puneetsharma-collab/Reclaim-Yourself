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
- `server/backup.ts` — DB backup/restore on startup (writes to `data/db-backup.json`)
- `shared/schema.ts` — Drizzle schema for the `users` table (all game data included)

### Frontend Core
- `lib/storage.ts` — Game logic: `applyCheckInSuccess()`, `applyCheckInRelapse()`, local user ID cache
- `lib/query-client.ts` — API fetch helper using `EXPO_PUBLIC_DOMAIN` env var
- `context/UserContext.tsx` — Global auth + game state. All reads/writes go through the backend API.

### Screens
- `app/(auth)/login.tsx` — Anonymous login
- `app/(auth)/register.tsx` — Account creation
- `app/welcome.tsx` — Animated welcome screen (shown once after signup)
- `app/(tabs)/index.tsx` — **Journey tab**: full-screen video/image scene, daily check-in, day progress tracker, preview mode (tap title 5×)
- `app/(tabs)/progress.tsx` — **Progress tab**: stats grid, 7-day chart, milestone badges
- `app/(tabs)/shrine.tsx` — **Shrine tab**: shrine scene (unlocked at Day 7)
- `app/(tabs)/profile.tsx` — **Profile tab**: user info, reset, logout

### Assets
- `assets/videos/` — Level 1 video backgrounds (`.mov` files, one per day 0–7 + blessing video)
- `assets/images/l2-day0.jpg` through `l2-day10.jpg` — Level 2 static images (one per day)
- `assets/images/l2-final.jpg` — Level 2 completion image
- `assets/images/l1-day7.jpg` — Used in Shrine tab (unlocked state background)
- `assets/images/path-bg.jpg` — Used in Shrine tab (locked state background)

## Video / Image Mapping

**Level 1** uses video files (`assets/videos/`):
- Day 0–7 → `L1day0.mov` … `L1day7.mov`
- After blessing claimed → `L1_blessing.mov`

**Level 2** uses static images (`assets/images/`):
- Day 0–10 → `l2-day0.jpg` … `l2-day10.jpg`
- After blessing claimed → `l2-final.jpg`

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
| `shrine_unlocked` | boolean | true when journey_position >= 7 (level 1) |
| `checkpoint_unlocked` | boolean | true when streak >= 3 |
| `l2_checkpoint1_unlocked` | boolean | Level 2 day 5 checkpoint |
| `l2_checkpoint2_unlocked` | boolean | Level 2 day 7 checkpoint |
| `l1_blessing_claimed` | boolean | Blessing video plays when true |
| `l2_blessing_claimed` | boolean | Level 2 final image shows when true |
| `current_level` | integer | 1 or 2 |
| `journey_position` | integer | 0–7 (L1) or 0–10 (L2) |
| `last_app_open_date` | text | Used for missed-day detection |

## Key Game Logic

### Freeze Points
- Awarded at Day 3 (checkpoint milestone)
- Auto-consumed when user missed a day (2+ days since last check-in)
- Do NOT protect against active "No, I stumbled" — that always resets streak

### Preview Mode (Dev Tool)
- Tap the "Reclaim Yourself" title 5 times to enter preview mode
- Navigate through all days and levels without making real API calls
- Blessing/level-up buttons in preview mode are safely no-ops (no data changes)

### Backup System
- `data/db-backup.json` is written on every PUT and after register
- On server startup, if DB is empty, the backup is restored automatically

## Design System
- Colors: `constants/colors.ts` — warm cream, sage green, muted gold, sunrise amber
- Font: Inter (400, 500, 600, 700) via `@expo-google-fonts/inter`
- Animations: react-native-reanimated (fade transitions between videos/images)

## Environment Variables
- `DATABASE_URL` — PostgreSQL connection string (set by Replit automatically)
- `PORT` — Backend port (set to 8000 in workflow)
- `EXPO_PUBLIC_DOMAIN` — Backend URL used by the frontend for API calls (set to `$REPLIT_DEV_DOMAIN:8000` in workflow)
