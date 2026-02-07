# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LinkToLawyers is a React Native/Expo universal app (iOS, Android, Web) using Expo SDK 54, React 19, and Expo Router v6 for file-based routing.

## Commands

```bash
npm start              # Start Expo dev server (interactive menu)
npm run ios            # Start on iOS simulator
npm run android        # Start on Android emulator
npm run web            # Start on web
npm run lint           # Run ESLint
npm run reset-project  # Move current app/ to app-example/ and create blank app
```

EAS builds:
```bash
eas build --profile development --platform ios
eas build --profile preview --platform ios
eas build --profile production --platform ios
```

## Architecture

**Routing**: File-based routing via Expo Router. Routes live in `app/`. The root layout (`app/_layout.tsx`) wraps the app in a ThemeProvider with a Stack navigator. The `(tabs)` group is the default entry point with a bottom tab navigator (Home and Explore tabs). Modal screens are presented from the root stack.

**Theming**: Centralized in `constants/theme.ts` with light/dark color definitions. Components use `useThemeColor()` hook and themed wrappers (`ThemedText`, `ThemedView`). Platform-specific hooks exist (e.g., `use-color-scheme.web.ts`).

**Platform-specific files**: Uses `.ios.tsx` and `.web.ts` suffixes for platform variants (e.g., `icon-symbol.ios.tsx` uses SF Symbols, the default uses MaterialIcons).

**Path aliases**: `@/*` maps to the project root (configured in `tsconfig.json`).

**Backend**: Supabase for auth, database, and storage. Client configured in `lib/supabase.ts` with SQLite-backed `localStorage` for session persistence on native. Environment variables in `.env.local` (gitignored); see `.env.example` for template.

**State Management**:
- Server state: TanStack React Query (`QueryClientProvider` in root layout)
- Client state: Zustand (stores in `stores/`)
- Form state: react-hook-form + Zod validation schemas (`lib/validators.ts`)

**Database**: Supabase Postgres with a `profiles` table (id, updated_at, username, full_name, avatar_url, website, role). The `role` column uses a `user_role` enum (`'client' | 'attorney'`).

### Key Files

| File | Purpose |
|------|---------|
| `lib/supabase.ts` | Supabase client singleton |
| `lib/validators.ts` | Zod schemas for forms |
| `types/index.ts` | Shared TypeScript types & Database type |
| `app/_layout.tsx` | Root layout with QueryClientProvider + ThemeProvider |

## Key Conventions

- TypeScript strict mode is enabled
- React 19 compiler and New Architecture are enabled
- Typed routes experiment is enabled (`typedRoutes: true` in app.json)
- iOS bundle ID: `com.jimmuell.linktolawyers`
- EAS project ID: `e5e360be-4b42-4bfd-9c73-983ace899aa7`
- App version source is `remote` (managed by EAS)
- VS Code auto-fixes, organizes imports, and sorts members on save

## SQL Migrations

### Add role column to profiles (run in Supabase SQL Editor)

```sql
CREATE TYPE user_role AS ENUM ('client', 'attorney');
ALTER TABLE public.profiles ADD COLUMN role user_role;
CREATE INDEX idx_profiles_role ON public.profiles (role);
```
