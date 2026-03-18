# GEMINI.md — Devac Connect Coding Guide

## Project Overview

**Devac Connect** is a React 19 + TypeScript Single-Page Application (SPA) for managing evangelism units, committees, attendance, campaigns, documents, and community chat for the DEVAC department. It uses Firebase Firestore for real-time data persistence and Vite as the build tool.

**Tech Stack:**
- **Framework:** React 19 with functional components and hooks only
- **Language:** TypeScript 5 (strict mode)
- **Styling:** Tailwind CSS v4 (via PostCSS)
- **Build tool:** Vite 7
- **Backend:** Firebase Firestore + Firebase Auth (anonymous)
- **AI:** Google Gemini API (`@google/genai`)
- **Icons:** `lucide-react`
- **Deployment:** GitHub Pages (`gh-pages`) + Netlify

---

## Build / Dev / Deploy Commands

```bash
# Start dev server (hot reload, LAN accessible)
npm run dev

# Type-check + build production bundle
npm run build

# Deploy to GitHub Pages
npm run deploy

# Type-check without building (fast)
npx tsc --noEmit
```

**Testing:** There is **no test runner** configured in this project. Verify behavior by running the dev server and testing in the browser. For component testing, manually test in the UI.

**Linting:** No linter configured. Use TypeScript strict mode for type checking.

---

## Project Structure

```
devac-connect/
├── 📁 src/
│   ├── 📁 components/
│   │   ├── 📁 campaign/          # Campaign management
│   │   │   └── CampaignDashboard.tsx
│   │   ├── 📁 units/             # Units & attendance
│   │   │   ├── UnitDashboard.tsx
│   │   │   ├── UnitDetails.tsx
│   │   │   └── AttendanceManager.tsx
│   │   ├── 📁 community/         # Chat & announcements
│   │   │   ├── CommunityChat.tsx
│   │   │   ├── AnnouncementBoard.tsx
│   │   │   └── NewsFeed.tsx
│   │   ├── 📁 documents/         # Document library
│   │   │   └── DocumentLibrary.tsx
│   │   ├── 📁 members/           # Member management
│   │   │   ├── MemberFormModal.tsx
│   │   │   ├── MemberImportButton.tsx
│   │   │   └── SoulFollowUp.tsx
│   │   ├── 📁 ai/                # AI tools
│   │   │   ├── BibleAssistant.tsx
│   │   │   ├── CreativeStudio.tsx
│   │   │   └── VoicePlayer.tsx
│   │   ├── 📁 import/            # Import buttons
│   │   │   ├── GlobalProgramImportButton.tsx
│   │   │   └── ProgramImportButton.tsx
│   │   └── 📁 ui/                # Reusable UI components
│   │       ├── Header.tsx           # ⭐ Professional header with responsive nav
│   │       ├── Clock.tsx
│   │       ├── VerseTicker.tsx
│   │       ├── PrayerFocus.tsx
│   │       ├── RichTextEditor.tsx
│   │       ├── InstallPWA.tsx
│   │       └── SyncDebug.tsx
│   ├── 📁 services/              # Business logic & API calls
│   │   ├── firebaseService.ts    # Firestore CRUD & subscriptions
│   │   ├── dataService.ts        # Data service wrapper
│   │   ├── geminiService.ts      # Google Gemini AI integration
│   │   ├── exportUtils.ts        # Export helpers (Excel/DOCX/PPTX)
│   │   └── storageService.ts     # Local storage helpers
│   ├── 📁 admin/                 # Admin panel
│   │   └── AdminPanel.tsx
│   ├── App.tsx                   # Root component: routing, global state
│   ├── types.ts                  # All TypeScript interfaces (single source)
│   ├── constants.ts              # Static data & configuration
│   ├── main.tsx                  # React DOM entry point
│   ├── App.css                   # Global styles
│   ├── index.css                 # Tailwind imports
│   └── vite-env.d.ts             # Vite environment types
│
├── 📁 scripts/                   # Utility scripts (moved from src/)
│   ├── 📁 debug/                 # Diagnostic & test scripts
│   ├── 📁 migration/             # Data migration scripts
│   └── 📁 members/               # Member management scripts
│
├── 📁 logs/                      # Diagnostic output files
│   ├── *.txt                     # Test results & diagnostics
│   └── *.log                     # TypeScript errors
│
├── 📁 public/                    # Static assets
├── index.html                    # Main HTML template
├── package.json                  # Dependencies & scripts
├── tsconfig.json                 # TypeScript configuration
├── vite.config.ts                # Vite build configuration
├── firestore.rules               # Firebase security rules
├── netlify.toml                  # Netlify deployment config
└── GEMINI.md                     # This file
```

---

## Code Style Guidelines

### TypeScript

- **Strict mode is ON**: Always provide explicit types. No implicit `any`.
- All shared data models live in `src/types.ts` as `interface` declarations. **Add new types there**, never inline them in components.
- Use `type` aliases only for union types (e.g., view names, status enums).
- Always type function parameters and return values for exported functions.
- Prefer `interface` over `type` for object shapes.
- Use `as const` for fixed string literal arrays.
- Never use `any` unless wrapping a third-party SDK (e.g., Firebase casting).
- Use `unknown` for truly unknown values, then type-guard.
- Avoid type assertions (`as`) unless necessary; prefer proper typing.

### React Components

- All components are **functional components** typed as `React.FC<Props>` or with explicit props types.
- Use `useState`, `useEffect`, `useCallback`, `useMemo` — no class components.
- Props interfaces are defined inline above the component or in `types.ts` if shared.
- Event handlers are named `handle<Action>` (e.g., `handleSave`, `handleDelete`).
- Render helper functions inside a component are named `render<Section>` (e.g., `renderContent`).
- Use early returns for conditional rendering.
- Keep components small; extract sub-components when >100 lines.

```tsx
// ✅ Good
interface MyComponentProps {
  label: string;
  onChange: (value: string) => void;
}

const MyComponent: React.FC<MyComponentProps> = ({ label, onChange }) => {
  const [value, setValue] = useState('');

  const handleChange = (val: string) => {
    setValue(val);
    onChange(val);
  };

  return (
    <div>
      <label>{label}</label>
      <input value={value} onChange={(e) => handleChange(e.target.value)} />
    </div>
  );
};
```

### Imports

- React is always imported first: `import React, { useState, useEffect } from 'react';`
- Group imports by category with blank lines:
  1. React imports
  2. Third-party libraries (alphabetical)
  3. Local types from `'../../types'`
  4. Local constants from `'../../constants'`
  5. Services from `'../../services/serviceName'`
  6. Components from relative paths
  7. Icons from `'lucide-react'`
- Use absolute imports for services/types/constants from src root.
- No wildcard imports (`import *`).
- Sort imports alphabetically within groups.

### Formatting & Style

- Use 2 spaces for indentation (Prettier default).
- Max line length: 100 characters.
- Use single quotes for strings, double for JSX attributes.
- Trailing commas in multi-line objects/arrays.
- Semicolons required.
- Empty line between logical blocks.
- Use `clsx` or `tailwind-merge` for conditional classes.

### Naming Conventions

| Construct | Convention | Example |
|---|---|---|
| Components | PascalCase | `CampaignDashboard` |
| Files | PascalCase for components | `UnitDetails.tsx` |
| Service files | camelCase | `firebaseService.ts` |
| Interfaces | PascalCase | `EvangelismUnit` |
| Type aliases | PascalCase | `ViewMode` |
| Variables / functions | camelCase | `handleSave`, `unitData` |
| Constants | UPPER_SNAKE_CASE | `INITIAL_UNITS` |
| Firestore collections | snake_case | `campaign_registrations` |
| CSS classes | kebab-case | `unit-card` |
| IDs | generated with `Date.now().toString() + Math.random().toString(36).substr(2, 9)` |

### Styling (Tailwind CSS v4)

- Use **Tailwind utility classes** directly in JSX.
- No separate CSS files for components (only `index.css` and `App.css` for globals).
- The design system uses:
  - Dark navy header: `bg-[#0f172a]`
  - Indigo primary: `bg-indigo-600`, `#4f46e5`
  - Emerald for committees
  - Slate for neutral backgrounds
- Cards: `rounded-[2.5rem]` with `shadow-sm` and `border border-slate-100`
- Interactive buttons: always include `transition-all` and hover states
- Animations: Tailwind's `animate-in fade-in`, `slide-in-from-bottom-4` etc.
- Use `tailwind-merge` for combining classes: `cn("base-class", conditionalClass)`

---

## Header Component (Professional)

The main navigation header is now in `src/components/ui/Header.tsx` — a dedicated, reusable component designed for professional presentation and responsive behavior.

### Key Features

- **Responsive**: Desktop navigation bar + mobile hamburger menu
- **Aligned**: 3-section layout (logo left | spacer | controls right), navigation bar below
- **Professional**: Orange border accent (4px), smooth transitions, clean styling
- **Type-safe**: Props interface + ViewId type union

### Usage in App.tsx

```tsx
<Header
  currentView={currentView}
  onViewChange={(view) => {
    setCurrentView(view);
    setSelectedGroup(null);
  }}
  onRefresh={handleRefreshData}
  isRefreshing={isRefreshing}
  currentLogo={currentLogo}
/>
```

### When Modifying Header

- Navigation items: Edit `NAVIGATION_ITEMS` array in Header.tsx
- Styling: Adjust Tailwind classes (spacing, colors, responsive breakpoints)
- Mobile behavior: Toggle `isMobileMenuOpen` state
- New controls: Add buttons to right section (alongside Clock & Refresh)

**See [HEADER_IMPROVEMENTS.md](HEADER_IMPROVEMENTS.md) for full refactoring details and future enhancements.**

---

## Firebase & Data Patterns

### Real-time Subscriptions

All Firestore reads use `onSnapshot` for real-time updates. Subscribe in `useEffect` and return the unsubscribe function:

```ts
// In firebaseService.ts
export const subscribeToMyCollection = (cb: (data: MyType[]) => void) =>
  onSnapshot(
    collection(db, "my_collection"),
    (snapshot) => {
      const data = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as MyType));
      cb(data);
    },
    (error) => {
      console.error("[Firestore] Error:", error);
    }
  );
```

### Writes (CRUD)

- **Create/Update document:** `setDoc(doc(db, "collection", id), data)`
- **Partial update:** `updateDoc(doc(db, "collection", id), partialData)`
- **Array atomic append:** `updateDoc(..., { field: arrayUnion(item) })`
- **Delete:** `deleteDoc(doc(db, "collection", id))`
- All write functions are `async`, wrap in `try/catch`, and `throw e` on error so callers can handle it.

### Authentication

- The app uses **Firebase Anonymous Auth** automatically on startup.
- Never require a logged-in user for basic operations; rely on Firestore security rules.

### Environment Variables

Firebase config keys are stored in `.env` and accessed via `import.meta.env.VITE_*`. Never hardcode Firebase keys.

---

## Error Handling

- In service functions: always log with `console.error("[ServiceName] Error:", error)` and re-throw exceptions.
- In components: wrap critical async calls in `try/catch/finally` to reset loading state.
- Use descriptive error messages in French for UI (since app is French).
- Handle Firebase errors gracefully with user-friendly messages.

```ts
// ✅ Standard pattern
const handleSave = async () => {
  setLoading(true);
  setError(null);
  try {
    await saveItemToDB(item);
    // Success feedback
  } catch (e) {
    console.error('[Component] Error saving item:', e);
    setError('Erreur lors de la sauvegarde');
  } finally {
    setLoading(false);
  }
};
```

---

## Key Conventions

- **No React Router**: Navigation is managed by a `currentView` state enum in `App.tsx` with an explicit `switch` / `renderContent()` pattern.
- **No Redux / Zustand**: State is prop-drilled from `App.tsx`. For new global state, add to `App.tsx` and pass as props.
- **IDs**: Always generate with `Date.now().toString() + Math.random().toString(36).substr(2, 9)`.
- **Dates**: Always stored as ISO 8601 strings (`new Date().toISOString().split('T')[0]`).
- **French UI**: All visible text is in French. Code comments may be in French or English.
- **Comments**: Use `// eslint-disable-line react-hooks/exhaustive-deps` when intentionally omitting deps from a `useEffect`.
- **Async operations**: Always handle loading states and errors in UI.
- **Performance**: Use `useCallback` for event handlers passed to child components.
- **Accessibility**: Include proper ARIA labels and keyboard navigation where applicable.

---

## Development Workflow

1. **Start development**: `npm run dev`
2. **Make changes**: Edit components in their respective folders
3. **Type check**: `npx tsc --noEmit` frequently
4. **Test manually**: Use the dev server to test features
5. **Build**: `npm run build` before committing
6. **Deploy**: `npm run deploy` for production

---

## Agent Rules

*No specific agent rules found in .agent/rules/, .cursor/rules/, .cursorrules, or .github/copilot-instructions.md. This GEMINI.md serves as the primary coding guide.*
