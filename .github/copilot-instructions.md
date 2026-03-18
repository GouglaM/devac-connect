---
name: devac-connect-workspace
description: "DEVAC Connect workspace instructions: React app with Firebase, Gemini AI, admin panel, evangelism units management. Use for: component development, Firebase operations, admin features, AI integrations, data export. Includes build commands, architecture patterns, and project conventions."
---

# DEVAC Connect Workspace Instructions

## Principles
- **View-Based Navigation**: Use string-based view state in App.tsx (HOME, UNITS, etc.) instead of React Router for main navigation.
- **Firebase-First**: All data operations go through firebaseService.ts with real-time subscriptions.
- **Anonymous Auth**: App uses anonymous Firebase authentication with retry logic.
- **TypeScript Strict**: Full type safety with custom types in types.ts.
- **Tailwind Styling**: Dark slate/indigo theme with rounded corners and animations.
- **Admin Gating**: Admin features controlled by `isAdmin` boolean prop, authenticated via single password.

## Conventions
- **File Naming**: PascalCase for components (.tsx), camelCase for services (.ts).
- **Function Prefixes**: `subscribe*`, `save*`, `delete*`, `update*` for Firebase operations.
- **Constants**: SCREAMING_SNAKE_CASE in constants.ts.
- **State Management**: Centralized in App.tsx, passed via props (no global state library).
- **ID Generation**: Use `generateId()` from constants.ts for unique identifiers.
- **Error Handling**: Console logging with detailed messages, retry logic for network operations.

## Build & Test
- **Dev Server**: `npm run dev` (Vite with hot reload)
- **Build**: `npm run build` (TypeScript check + production bundle)
- **Type Check**: `npx tsc --noEmit`
- **Deploy**: `npm run deploy` (GitHub Pages)
- **No Tests**: Manual testing via browser dev server

## Architecture
- **Components**: Hierarchical structure under src/components/, admin components in src/admin/
- **Services**: firebaseService.ts (CRUD + subscriptions), geminiService.ts (AI), exportUtils.ts (multi-format export)
- **Data Flow**: Firestore collections → subscriptions → React state → components
- **Collections**: announcements, units, committees, attendance, documents, messages, campaigns
- **Types**: Defined in types.ts (Member, EvangelismUnit, Announcement, etc.)

## Common Pitfalls
- **Environment Variables**: Ensure .env file with all VITE_FIREBASE_* and VITE_GEMINI_API_KEY
- **Firebase Rules**: Firestore rules must allow anonymous reads/writes
- **HTTPS for Voice**: Speech API requires HTTPS (except localhost)
- **Offline Data**: Cached data may be stale; no explicit offline indicators
- **Admin Persistence**: Admin login doesn't persist across page refreshes

## Key Files
- [src/App.tsx](src/App.tsx): Main app with view state and subscriptions
- [src/services/firebaseService.ts](src/services/firebaseService.ts): All Firebase operations
- [src/admin/AdminPanel.tsx](src/admin/AdminPanel.tsx): Admin interface (announcements, studio, maintenance)
- [src/components/units/UnitDetails.tsx](src/components/units/UnitDetails.tsx): Complex unit management component
- [types.ts](src/types.ts): Type definitions
- [constants.ts](src/constants.ts): App constants and utilities

## Admin Features
- **Authentication**: Password-based (DEVAC2025), no persistence
- **Logo Management**: Upload to localStorage, displayed in Header
- **Member Import**: CSV format "Nom;Unité;Type;Téléphone;Quartier;Profession"
- **Database Seeding**: Restore default units/committees
- **Announcements**: Create with voice input, images, priorities
- **Studio**: Graphical content creation for announcements

## AI Integration
- **Gemini Service**: Retry logic for API calls, exponential backoff
- **Voice Input**: French Speech Recognition API
- **Content Generation**: AI-powered features in various components

## Deployment
- **GitHub Pages**: Base path /devac-connect/
- **Netlify**: SPA redirects in netlify.toml
- **Environment**: Production builds require valid API keys