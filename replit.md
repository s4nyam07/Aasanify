# Aasanify

## Overview

Aasanify is a yoga/wellness mobile application built with Expo (React Native) that guides users through Surya Namaskar (Sun Salutation) practice sessions. The app tracks daily sessions, maintains streak data, provides pose guides with images, and includes analytics. It uses Firebase for authentication and data persistence, with an Express backend server for API support.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend (Expo / React Native)

- **Framework**: Expo SDK 54 with React Native 0.81, using the new architecture (`newArchEnabled: true`)
- **Routing**: File-based routing via `expo-router` with typed routes enabled
  - `app/(auth)/` — Login and signup screens, protected by auth state (redirects to tabs if logged in)
  - `app/(tabs)/` — Main app tabs: Home, Calendar, Guides, Analytics, Profile
  - `app/session.tsx` — Full-screen modal for active yoga session practice
- **State Management**: React Context for auth (`lib/auth-context.tsx`), TanStack React Query for server state (`lib/query-client.ts`)
- **UI/Styling**: Dark theme throughout (background `#0D0D0D`, accent `#F7C948` gold), custom color constants in `constants/colors.ts`. Uses Outfit font family, Reanimated for animations, expo-haptics for tactile feedback
- **Pose Data**: 12-step Surya Namaskar sequence defined in `constants/poses.ts` with static image assets in `assets/images/sun-salutation/`
- **Media**: Background audio (sun salutation music) downloaded from Supabase storage and managed via `lib/media-manager.ts` using expo-file-system. Text-to-speech via expo-speech for pose callouts

### Backend (Express)

- **Server**: Express 5 running in `server/index.ts` with CORS configured for Replit domains and localhost
- **Routes**: Defined in `server/routes.ts` — currently minimal, meant to be extended with `/api` prefixed routes
- **Storage**: In-memory storage layer (`server/storage.ts`) with an `IStorage` interface — designed to be swapped for database-backed implementation
- **Static Serving**: In production, serves a landing page from `server/templates/landing-page.html`
- **Build**: Server bundled with esbuild for production (`server:build` script)

### Database Schema

- **ORM**: Drizzle ORM with PostgreSQL dialect configured in `drizzle.config.ts`
- **Schema**: Defined in `shared/schema.ts` — currently has a `users` table with `id`, `username`, `password` fields
- **Validation**: Uses `drizzle-zod` to generate Zod schemas from Drizzle table definitions
- **Note**: The server currently uses in-memory storage (`MemStorage`), not the Drizzle/Postgres schema. The database schema exists but the storage layer hasn't been wired to it yet. When connecting, use `DATABASE_URL` environment variable.

### Authentication & User Data

- **Auth Provider**: Firebase Authentication with email/password, persisted via AsyncStorage (`getReactNativePersistence`)
- **User Profiles**: Stored in Firebase Realtime Database (not Firestore) — includes name, age, email, createdAt
- **Session Data**: Yoga session records (completion status, duration, rounds) stored in Firebase Realtime Database, keyed by date
- **Auth Flow**: `AuthProvider` wraps the app, auth layout redirects authenticated users to tabs and unauthenticated users to login

### Key Design Patterns

- **Shared code**: The `shared/` directory contains schema definitions used by both frontend and backend
- **Path aliases**: `@/*` maps to project root, `@shared/*` maps to `shared/` directory
- **Error handling**: Class-based `ErrorBoundary` component wraps the entire app with a fallback UI
- **Platform adaptability**: Tab layout uses native tabs (with SF Symbols) when available on iOS 26+, falls back to classic tabs. Keyboard handling adapts per platform.

## External Dependencies

### Firebase (Primary Backend)
- **Authentication**: Email/password sign-in and registration
- **Realtime Database**: User profiles and session history storage
- **Config**: Via `EXPO_PUBLIC_FIREBASE_*` environment variables (API key, auth domain, database URL, project ID, storage bucket, messaging sender ID, app ID)

### Supabase (Media Storage)
- Audio file (`sunsalutation.mp3`) hosted in Supabase storage bucket, downloaded on-demand to device

### PostgreSQL (via Drizzle)
- Configured but not actively used in current storage layer
- Connection via `DATABASE_URL` environment variable
- Schema migrations output to `./migrations` directory
- Push schema with `npm run db:push`

### Key NPM Packages
- `expo` ~54.0.27 — Core framework
- `expo-router` ~6.0.17 — File-based navigation
- `firebase` ^12.9.0 — Auth and database
- `@tanstack/react-query` ^5.83.0 — Server state management
- `drizzle-orm` ^0.39.3 + `drizzle-zod` — ORM and validation
- `react-native-reanimated` ~4.1.1 — Animations
- `expo-av` — Audio playback for session music
- `expo-speech` — Text-to-speech for pose names
- `expo-haptics` — Haptic feedback
- `express` ^5.0.1 — Backend server