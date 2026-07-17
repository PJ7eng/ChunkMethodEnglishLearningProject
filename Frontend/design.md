# ChunkLearning Frontend — Design & Development Guide

This document describes the current UI design system, project structure, and coding conventions for the ChunkLearning frontend. It reflects the codebase as it exists today and is intended to help contributors maintain consistency when extending the app.

**Stack:** React 18 · Vite 6 · TypeScript · Tailwind CSS v4  
**Design origin:** [English Learning App UI (Figma)](https://www.figma.com/design/B2xh6Lq3BcHCmQCPyKI9bO/English-Learning-App-UI)

---

## Table of Contents

1. [UI Design](#1-ui-design)
2. [Project Structure](#2-project-structure)
3. [Code Conventions](#3-code-conventions)
4. [Architecture & Data Flow](#4-architecture--data-flow)
5. [Maintenance Notes](#5-maintenance-notes)

---

## 1. UI Design

### 1.1 Design Language

The app uses a **Duolingo-inspired dark theme** with a playful, game-like visual language:

- Dark backgrounds with elevated surfaces
- Bold, rounded typography (Nunito, weight 800–900)
- **3D pressable elements** — buttons and cards use bottom box-shadows that collapse on press
- Emoji icons for navigation and category labels
- Bouncy easing (`cubic-bezier(.34, 1.56, .64, 1)`) for entrances and progress animations

The authenticated app shell is a **mobile-first, single-column layout** with a fixed header, scrollable content area, and bottom tab bar (68px).

### 1.2 Color Scheme

#### Primary design tokens (`C`)

All active UI components reference the `C` object in `src/app/constants/designToken.ts`. **Always use these tokens** instead of hard-coded hex values when building new UI.

| Token | Hex | Usage |
|-------|-----|-------|
| `bg` | `#121212` | Page background |
| `surface` | `#2A2A2E` | Cards, inputs, inactive pills |
| `surface2` | `#1E1E22` | Tab bar, secondary surfaces |
| `surface3` | `#3A3A3E` | Progress track, toggle off, option buttons |
| `green` | `#58CC02` | Primary CTA, success, active indicators |
| `greenDark` | `#3D8F00` | Green button/toggle shadow depth |
| `blue` | `#1CB0F6` | Secondary accent, hints |
| `blueDark` | `#0A7AB0` | Blue button shadow |
| `purple` | `#CE82FF` | Accent, input focus ring |
| `purpleDk` | `#8A40CC` | Purple button shadow |
| `orange` | `#FF9600` | Streak badges, labels |
| `red` | `#FF4B4B` | Errors, wrong answers |
| `white` | `#FFFFFF` | Primary text on dark surfaces |
| `gray` | `#A1A1AA` | Muted text, placeholders, inactive labels |
| `dim` | `#1A1A1E` | Card/button shadow color |

```typescript
import { C } from "../constants/designToken";
```

#### Category colors

Defined in `src/app/constants/categories.ts` for filter pills and chunk labels:

| Category | Text | Background |
|----------|------|------------|
| All | `#A1A1AA` | `#2A2A2E` |
| Workplace | `#1CB0F6` | `#0D2233` |
| Small Talk | `#58CC02` | `#0D2210` |
| Travel | `#CE82FF` | `#22123A` |
| Emotions | `#FF4B4B` | `#2A0D0D` |
| Random | `#FF9600` | `#2A1A00` |

#### Gradients

| Element | Value |
|---------|-------|
| App logo icon | `linear-gradient(135deg, #58CC02, #89E219)` |
| User avatar | `linear-gradient(135deg, #CE82FF, #1CB0F6)` |
| Progress bar fill | `linear-gradient(90deg, {color}, {color}CC)` |

#### CSS variables (Tailwind layer)

`src/styles/theme.css` mirrors the same palette as CSS custom properties for Tailwind utilities (`bg-background`, `text-primary`, etc.). These are configured globally but **most components currently use inline styles with `C` tokens** instead of Tailwind classes.

Key CSS variables:

| Variable | Value |
|----------|-------|
| `--background` | `#121212` |
| `--foreground` | `#ffffff` |
| `--primary` | `#58CC02` |
| `--secondary` | `#1CB0F6` |
| `--accent` | `#CE82FF` |
| `--destructive` | `#FF4B4B` |
| `--muted-foreground` | `#A1A1AA` |
| `--border` | `rgba(255, 255, 255, 0.08)` |
| `--radius` | `1rem` (16px) |

### 1.3 Typography

| Property | Value |
|----------|-------|
| **Font family** | `'Nunito', sans-serif` |
| **Source** | Google Fonts (`src/styles/fonts.css`) |
| **Weights loaded** | 400, 600, 700, 800, 900 |
| **Base size** | 16px (`--font-size` in theme.css) |

#### Type scale (inline styles in use)

| Role | Size | Weight | Notes |
|------|------|--------|-------|
| Page title (h1/h2) | 22px | 900 | Auth screens, section headers |
| Brand name | 20px | 900 | "Chunk" (green) + "Master" (white) |
| Body / button (md) | 15px | 800–900 | Default interactive text |
| Input text | 15px | 600 | Form fields |
| Input label | 13px | 700 | Gray, above inputs |
| Pill label | 13px | 800 | Category filters |
| Section label (uppercase) | 10–11px | 700–900 | `letterSpacing: 0.07–0.12em`, `textTransform: uppercase` |
| Muted body | 12–14px | 600–700 | Secondary info, hints |
| Button sizes | 11 / 13 / 15 / 18 / 21px | 900 | xs / sm / md / lg / xl |

### 1.4 Spacing

The layout uses a consistent **20px horizontal page gutter**.

| Pattern | Value |
|---------|-------|
| Page horizontal padding | `20px` |
| App header | `36px 20px 12px` (top safe-area style inset) |
| Section top/bottom | `14px 20px 10px` or `0 20px 28px` |
| Card internal padding | `20px` (default), `32px 20px` (hero cards) |
| Input padding | `14px` |
| Pill padding | `7px 14px` |
| Button padding (md) | `13px 22px` |
| Flex gaps | 3, 4, 5, 6, 7, 8, 10, 12, 14px (context-dependent) |
| Tab bar height | `68px` |
| Input label gap | `8px` below label |
| Form field spacing | `16px` margin-bottom per Input |

### 1.5 Border Radius

| Element | Radius |
|---------|--------|
| Buttons | 16px |
| Cards | 20px |
| Inputs | 14px |
| Pills | 24px |
| Option buttons (quiz) | 13px |
| Toggle track | 15px |
| Toggle thumb | 50% (circle) |
| Progress bar | 10px |
| Logo icon | 10px |
| Avatar | 50% |

### 1.6 Component Styles

#### Interaction pattern — 3D press (`usePress`)

Interactive buttons use the `usePress` hook for a tactile press effect:

- **Resting:** `boxShadow: 0 5px 0 {shadowColor}`
- **Pressed:** `transform: translateY(5px)`, shadow reduced to `0 0px 0`
- **Transition:** `0.08s ease` (buttons), `0.15–0.35s` (cards/pills)
- **Disabled:** `opacity: 0.45`, `cursor: not-allowed`
- **Tap highlight:** `-webkit-tap-highlight-color: transparent`

#### UI primitives (`src/app/components/ui/`)

| Component | Description | Key styles |
|-----------|-------------|------------|
| **Button** | Primary game-style CTA | Green default, sizes xs–xl, optional icon, 16px radius, 3D shadow |
| **LoginBtn** | Auth screen submit button | Variant of Button for login/register flows |
| **OptionBtn** | Quiz answer choice | Full-width, state colors (default / correct green / wrong red) |
| **StepBtn** | +/- stepper control | Compact square button for numeric settings |
| **Card** | Content container | `C.surface`, 20px radius, `0 6px 0 C.dim` shadow, 20px padding |
| **Input** | Labeled text field | Purple focus border, 14px radius, 3D bottom shadow |
| **Pill** | Category filter chip | Active: category color border + tinted bg; inactive: gray on surface |
| **ProgressBar** | Horizontal progress | 10px height, gradient fill, glow shadow |
| **Toggle** | On/off switch | 56×30px track, green when on, bouncy thumb slide |
| **Label** | Uppercase section tag | 10px, weight 900, colored, wide letter-spacing |
| **XpDots** | XP indicator dots | Small circular progress markers |
| **TabBar** | Bottom navigation | 3 tabs (Home, Library, Settings), green top indicator, emoji icons |

#### Business components (`src/app/components/business/`)

| Component | Description |
|-----------|-------------|
| **ChunkCard** | Full learning card: phrase reveal, quiz options, feedback, next action |
| **EmptyState** | Home screen placeholder before a chunk is drawn |

#### Global layout (authenticated)

```
┌─────────────────────────────┐
│  Header (logo + avatar)     │  36px top padding
├─────────────────────────────┤
│                             │
│  Active screen content      │  flex: 1, overflow-y: auto
│  (Home / Library / Settings)│
│                             │
├─────────────────────────────┤
│  TabBar                     │  68px fixed height
└─────────────────────────────┘
```

- Scrollbars are hidden globally in the authenticated view.
- Auth screens (login/register) are full-page centered layouts without header or tab bar.

---

## 2. Project Structure

```
Frontend/
├── index.html                  # HTML shell; title "English Learning App UI"
├── package.json                # Dependencies and npm scripts (dev, build)
├── package-lock.json           # npm lockfile
├── pnpm-workspace.yaml         # pnpm monorepo workspace config
├── vite.config.ts              # Vite + React + Tailwind; @ alias → src/
├── postcss.config.mjs          # PostCSS config (Tailwind v4 handles most setup)
├── default_shadcn_theme.css    # Reference shadcn theme (not actively used)
├── design.md                   # This document
├── README.md                   # Setup guide and development overview
├── ATTRIBUTIONS.md             # Third-party licenses (shadcn/ui, Unsplash)
├── .gitignore
│
├── guidelines/
│   └── Guidelines.md           # AI/design guidelines template (placeholder)
│
└── src/
    ├── main.tsx                # React entry point; mounts App, imports global CSS
    │
    ├── styles/                 # Global styles and theme
    │   ├── index.css           # Entry: imports fonts, tailwind, theme
    │   ├── fonts.css           # Nunito Google Font import
    │   ├── tailwind.css        # Tailwind v4 entry (@import tailwindcss)
    │   └── theme.css           # CSS variables, @theme inline, base typography
    │
    └── app/
        ├── App.tsx             # Root component: auth gate, tab routing, header, TabBar
        ├── api.ts              # fetch wrapper; auth, chunks, progress API functions
        │
        ├── components/
        │   ├── index.ts        # Re-exports ui + business barrels
        │   │
        │   ├── ui/             # Reusable primitive UI components
        │   │   ├── index.ts    # Barrel export for all UI components + types
        │   │   ├── auth-screen.tsx   # Legacy shadcn auth (unused, broken imports)
        │   │   ├── Button/
        │   │   │   ├── button.tsx      # Primary game button
        │   │   │   ├── loginBtn.tsx    # Auth submit button
        │   │   │   ├── optionBtn.tsx   # Quiz option button
        │   │   │   ├── stepBtn.tsx     # Stepper +/- button
        │   │   │   └── index.ts
        │   │   ├── Card/
        │   │   │   ├── card.tsx
        │   │   │   └── index.ts
        │   │   ├── Input/
        │   │   │   ├── input.tsx
        │   │   │   └── index.ts
        │   │   ├── Label/
        │   │   │   ├── label.tsx
        │   │   │   └── index.ts
        │   │   ├── Pill/
        │   │   │   ├── pill.tsx
        │   │   │   └── index.ts
        │   │   ├── ProgressBar/
        │   │   │   ├── progressBar.tsx
        │   │   │   └── index.ts
        │   │   ├── TabBar/
        │   │   │   ├── tabBar.tsx
        │   │   │   └── index.ts
        │   │   ├── Toggle/
        │   │   │   ├── toggle.tsx
        │   │   │   └── index.ts
        │   │   └── XpDots/
        │   │       ├── xpDots.tsx
        │   │       └── index.ts
        │   │
        │   ├── business/       # Domain-specific composite components
        │   │   ├── index.ts
        │   │   ├── ChunkCard/
        │   │   │   ├── chunkCard.tsx   # Learning card with quiz flow
        │   │   │   └── index.ts
        │   │   └── EmptyState/
        │   │       ├── emptyState.tsx  # Home empty/draw prompt
        │   │       └── index.ts
        │   │
        │   └── figma/
        │       └── ImageWithFallback.tsx  # Figma asset helper with fallback
        │
        ├── pages/              # Screen-level components (one folder per route/tab)
        │   ├── index.ts        # Barrel export for all screens
        │   ├── Auth/
        │   │   ├── loginScreen.tsx
        │   │   ├── registerScreen.tsx
        │   │   └── index.ts
        │   ├── Home/
        │   │   ├── homeScreen.tsx      # Daily progress, category filter, chunk draw
        │   │   └── index.ts
        │   ├── Library/
        │   │   ├── libraryScreen.tsx   # Chunk list, search, filters
        │   │   └── index.ts
        │   └── Settings/
        │       ├── settingsScreen.tsx  # Daily goal, reminders, preferences
        │       └── index.ts
        │
        ├── hooks/
        │   └── usePress.ts     # Mouse/touch press state for 3D button effect
        │
        ├── utils/
        │   ├── array.ts        # shuffled() — randomize quiz options
        │   └── category.ts     # getCategoryMeta() — lookup category by id
        │
        ├── constants/
        │   ├── designToken.ts  # C color token object
        │   ├── categories.ts   # CATEGORIES array + CategoryId type
        │   └── weekData.ts     # WEEK_DATA for settings habit grid
        │
        └── types/
            ├── auth.ts         # AuthScreenProps interface
            └── chunk.ts        # Chunk type extensions
```

### Directory responsibilities

| Directory | Responsibility |
|-----------|----------------|
| `src/styles/` | Global CSS: fonts, Tailwind setup, theme variables |
| `src/app/components/ui/` | Generic, reusable UI primitives with no business logic |
| `src/app/components/business/` | Feature-specific components that compose UI primitives |
| `src/app/components/figma/` | Helpers for Figma-exported assets |
| `src/app/pages/` | Full-screen views; own local state and data fetching |
| `src/app/hooks/` | Shared React hooks |
| `src/app/utils/` | Pure utility functions |
| `src/app/constants/` | Static data and design tokens |
| `src/app/types/` | Shared TypeScript interfaces and type aliases |

---

## 3. Code Conventions

### 3.1 File & Folder Naming

| Kind | Convention | Example |
|------|------------|---------|
| Component folders | PascalCase | `Button/`, `ChunkCard/` |
| Component files | camelCase | `button.tsx`, `homeScreen.tsx` |
| Screen files | `*Screen.tsx` suffix | `loginScreen.tsx`, `libraryScreen.tsx` |
| Barrel exports | `index.ts` in each folder | `Button/index.ts`, `pages/index.ts` |
| Constants | camelCase filename | `designToken.ts`, `weekData.ts` |
| Hooks | `use` prefix | `usePress.ts` |
| Utils | camelCase, verb-based | `array.ts`, `category.ts` |

### 3.2 Component Patterns

**Named function exports** (preferred):

```typescript
export function HomeScreen() { ... }
export function Button({ label, ... }: ButtonProps) { ... }
```

**Props interfaces** are exported alongside components:

```typescript
export interface ButtonProps {
  label: string;
  bg?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  onClick?: () => void;
}
```

Some older components use `export default interface` for props (`LabelProps`, `PillProps`, `XpDotsProps`). New components should use named `export interface`.

**Styling:** Components use inline `style={{ ... }}` objects referencing `C` tokens:

```typescript
import { C } from "../../../constants/designToken";

<div style={{ backgroundColor: C.surface, borderRadius: 20, padding: 20 }}>
```

**Style overrides:** Accept an optional `style?: React.CSSProperties` prop and spread it last:

```typescript
export function Card({ children, style }: CardProps) {
  return (
    <div style={{ backgroundColor: C.surface, borderRadius: 20, ...style }}>
      {children}
    </div>
  );
}
```

**Press interaction:**

```typescript
const { pressed, handlers } = usePress();

<button
  {...handlers}
  style={{
    boxShadow: `0 ${pressed ? 0 : 5}px 0 ${shadow}`,
    transform: `translateY(${pressed ? 5 : 0}px)`,
  }}
/>
```

### 3.3 Import Conventions

- **Relative paths** are used throughout (e.g. `../../components`, `../../../constants/designToken`).
- **`@/` alias** is configured in `vite.config.ts` (`@` → `./src`) but is **not yet used** in source files. Prefer relative paths to match existing code until a migration is done.
- **Barrel imports** from index files:

```typescript
import { Card, ProgressBar, Pill } from "../../components";
import { HomeScreen, LibraryScreen } from "./pages";
```

- **Direct UI imports** within business components:

```typescript
import { Card, Label, OptionBtn, Button } from "../../ui";
```

### 3.4 TypeScript Usage

| Pattern | Example |
|---------|---------|
| File extensions | `.tsx` for components, `.ts` for utils/types/api |
| Props typing | `interface` or `extends React.InputHTMLAttributes<...>` |
| API responses | Dedicated interfaces in `api.ts` (`ChunkResponse`, `AuthResponse`) |
| Static data | `as const` arrays (`CATEGORIES`, `WEEK_DATA`) |
| Union types | `"home" \| "library" \| "settings"`, button sizes |
| Type exports | Re-exported from barrel `index.ts` files |

Avoid `any` where possible. Current exceptions: `user: any` in auth state (`App.tsx`, `types/auth.ts`).

### 3.5 State & Side Effects

- **No React Router** — navigation is `useState<TabId>("home")` tab switching in `App.tsx`.
- **Auth gate** — token and user stored in `localStorage` (`chunk_auth_token`, `chunk_auth_user`).
- **Page-level state** — each screen manages its own `useState` / `useEffect` for data fetching.
- **API calls** — centralized in `src/app/api.ts`; pages import and call these functions directly.

### 3.6 Quote Style

The codebase mixes single and double quotes. Follow the file you are editing:

- Auth pages (`loginScreen.tsx`, `registerScreen.tsx`): single quotes
- Most other files: double quotes

---

## 4. Architecture & Data Flow

### 4.1 App bootstrap

```
index.html → main.tsx → styles/index.css + App.tsx
```

### 4.2 Auth flow

```
App.tsx
  ├─ No token → LoginScreen / RegisterScreen
  │                └─ api.loginUser / api.registerUser (mock)
  └─ Has token → Header + Screen + TabBar
```

### 4.3 Main screens

| Tab | Screen | Primary actions |
|-----|--------|-----------------|
| Home | `HomeScreen` | Draw random chunk, daily progress, category filter |
| Library | `LibraryScreen` | Browse/search chunks, filter by category, review status |
| Settings | `SettingsScreen` | Daily goal, reminders, sound/haptic toggles, weekly grid |

### 4.4 API layer (`api.ts`)

| Function | Endpoint | Notes |
|----------|----------|-------|
| `registerUser` | Mock (800ms delay) | Returns mock JWT + user |
| `loginUser` | Mock (800ms delay) | Test credentials: `test@example.com` / `password123` |
| `getChunks` | `GET /chunks?category=` | Real backend via fetch |
| `getRandomChunk` | `GET /chunks/random?category=` | Real backend via fetch |
| `recordProgressAnswer` | `POST /progress/answer` | Real backend via fetch |

Base URL: `import.meta.env.VITE_API_BASE_URL` (default `http://localhost:3000`).

### 4.5 Styling systems (dual setup)

| System | Location | Status |
|--------|----------|--------|
| Inline styles + `C` tokens | `designToken.ts` | **Active** — all current UI |
| Tailwind v4 + CSS variables | `styles/theme.css`, `styles/tailwind.css` | Configured, rarely used in components |
| shadcn/ui defaults | `default_shadcn_theme.css` | Reference only |

When adding new UI, follow the **inline + `C` token** pattern unless deliberately migrating to Tailwind.

---

## 5. Maintenance Notes

### 5.1 Development commands

```bash
cd Frontend
npm install
npm run dev      # Start dev server
npm run build    # Production build
```

### 5.2 Environment variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `VITE_API_BASE_URL` | `http://localhost:3000` | Backend API base URL |

Create a `.env` file in `Frontend/` to override:

```
VITE_API_BASE_URL=http://localhost:3000
```

### 5.3 Adding a new UI component

1. Create a folder under `src/app/components/ui/ComponentName/`.
2. Add `componentName.tsx` with a named export and props interface.
3. Add `index.ts` barrel export.
4. Re-export from `src/app/components/ui/index.ts`.
5. Use `C` tokens and `usePress` for interactive elements.
6. Match existing border radius, spacing, and typography from this document.

### 5.4 Adding a new screen

1. Create a folder under `src/app/pages/ScreenName/`.
2. Add `screenName.tsx` with `export function ScreenName()`.
3. Add `index.ts` and export from `src/app/pages/index.ts`.
4. Wire into `App.tsx` tab state or auth flow as needed.

### 5.5 Known inconsistencies

| Item | Detail |
|------|--------|
| Dual styling | Tailwind/shadcn infrastructure exists but active UI is 100% inline + `C` tokens |
| `auth-screen.tsx` | Orphan shadcn component with broken imports; not wired into the app |
| `@/` alias | Configured in Vite but unused in source |
| No `tsconfig.json` | Frontend relies on IDE/Vite defaults for TypeScript |
| README outdated | Still references editing everything in `App.tsx`; logic has been split into `pages/` and `components/` |
| Mixed UI language | Traditional Chinese copy (auth) + English labels (tabs, settings) |
| Auth API | Mock implementation; real backend endpoints are commented out in `api.ts` |
| `ui/index.ts` type paths | Some type re-exports use lowercase paths (`./button/button`) while folders are PascalCase — works on Windows but may fail on case-sensitive systems |

### 5.6 Recommended future improvements

1. Replace mock auth with real backend API calls (stubs already exist in `api.ts`).
2. Introduce React Router for deep linking and cleaner navigation.
3. Consolidate styling — either migrate to Tailwind utilities or extract shared style objects from inline styles.
4. Add `tsconfig.json` for stricter TypeScript checking.
5. Type the `user` object properly instead of `any`.
6. Remove or fix dead code (`auth-screen.tsx`, unused shadcn dependencies if not needed).

---

## Quick Reference

```typescript
// Colors
import { C } from "./constants/designToken";

// Press effect
import { usePress } from "./hooks/usePress";

// Categories
import { CATEGORIES, type CategoryId } from "./constants/categories";

// Components
import { Button, Card, Input, Pill, TabBar } from "./components";
import { ChunkCard, EmptyState } from "./components";

// API
import { getRandomChunk, getChunks, loginUser } from "./api";
```
