# AGENTS.md

## Project Overview

**Neon Runner** — a cyberpunk endless runner game built with React 19, Three.js (via React Three Fiber), Zustand, Tailwind CSS v4, and Vite. The player navigates a ship through neon-lit lanes avoiding obstacles while speed increases over time.

## Prerequisites

- **Node.js >= 20** — required by `@tailwindcss/oxide` (used by `@tailwindcss/vite`). Node 18 will fail to load native bindings.
- Install/switch via nvm: `nvm install 20 && nvm use 20`

## Commands

```bash
npm run dev       # Start Vite dev server at http://localhost:3000 (HMR enabled)
npm run build     # Production build (output: dist/)
npm run preview   # Preview production build
npm run clean     # Remove dist/
npm run lint      # TypeScript type-check only (tsc --noEmit) — NO ESLint configured
```

**No test framework is configured.** There are no test files or test scripts. Do not assume Jest/Vitest/etc. If adding tests, suggest a framework to the user first.

## Architecture

```
src/
├── main.tsx              # Entry point, global error handler
├── App.tsx               # Canvas setup, ErrorBoundary, scene composition
├── index.css             # Tailwind v4 import + global styles
├── types.ts              # Shared TypeScript interfaces (GameState, ObstacleData, GameTheme)
├── store/
│   └── gameStore.ts      # Zustand store — all game state + actions
└── components/game/
    ├── Player.tsx         # Ship mesh, keyboard input, lane switching
    ├── Road.tsx           # Infinite scrolling road + lane markings
    ├── Obstacles.tsx      # Spawning, collision detection, scoring
    ├── Effects.tsx        # Post-processing (bloom, noise, vignette) + environment
    ├── HUD.tsx            # UI overlay (start screen, score, game over)
    └── City.tsx           # Procedural cityscape (currently unused in App.tsx)
```

**Path alias:** `@/*` maps to project root (configured in `tsconfig.json` and `vite.config.ts`). Use `@/src/...` or relative imports — codebase currently uses relative imports.

**State flow:** Zustand store (`useGameStore`) is the single source of truth. Components subscribe via `useGameStore()` hook. Game loop runs inside `useFrame` callbacks from React Three Fiber.

## Code Style

### TypeScript
- Target: ES2022, strict mode not enabled, `noEmit: true`
- Use explicit types for component props: `({ data }: { data: ObstacleData })`
- Use `interface` for object shapes, `type` for unions/aliases (see `types.ts`)
- `useRef<THREE.Group>(null)` pattern for Three.js object refs

### Imports
- External libraries first, then internal modules
- Three.js imported as `import * as THREE from 'three'`
- React hooks imported individually: `import { useRef, useMemo, useEffect } from 'react'`
- Zustand store imported as named: `import { useGameStore, THEMES } from '../../store/gameStore'`

### Components
- Functional components with arrow syntax: `export const ComponentName = () => { ... }`
- Default export only for root `App` component
- Named exports for all other components
- No prop destructuring in signature for complex props — destructure inside body

### Naming
- Components/Types: `PascalCase` (`Player`, `GameState`, `ObstacleData`)
- Constants: `UPPER_SNAKE_CASE` (`OBSTACLE_SPAWN_INTERVAL`, `COLLISION_THRESHOLD_Z`)
- Functions/hooks: `camelCase` (`moveLeft`, `updateScore`)
- Zustand actions: verb phrases (`startGame`, `setGameOver`, `removeObstacle`)

### Formatting
- No formatter config present (no .prettierrc, .eslintrc)
- Use 2-space indentation (consistent throughout)
- Single quotes in TS, double quotes in JSX
- Blank line between imports and component body
- No semicolons in imports but semicolons used in code (mixed — follow surrounding file)

### Three.js / React Three Fiber
- Always clamp delta: `const safeDelta = Math.min(delta, 0.1)` to prevent jumps after tab backgrounding
- Use `useFrame` for game loop logic, not `requestAnimationFrame`
- Prefer `useMemo` for expensive computations (geometry, positions)
- Mesh materials: use `meshStandardMaterial` with `metalness`/`roughness` for PBR
- Emissive materials for neon effects: `emissive={color} emissiveIntensity={value}`

### Tailwind CSS
- Tailwind v4 with `@tailwindcss/vite` plugin (NOT PostCSS-based)
- Use arbitrary values for precise control: `className="z-[100]"`, `className="bg-[#050505]"`
- Fonts: `font-mono` (JetBrains Mono) for HUD/debug, default for body

### Error Handling
- `ErrorBoundary` class component wraps the entire app in `App.tsx`
- Global `window.onerror` handler in `main.tsx` renders error overlay
- Console logging for debugging: `console.log("App rendering v1.0.1...")`

## Environment Variables

- `GEMINI_API_KEY` — injected via Vite `define` as `process.env.GEMINI_API_KEY`
- `DISABLE_HMR` — set to `'true'` to disable HMR (used in AI Studio)
- Copy `.env.example` to `.env` for local development

## Key Dependencies

| Package | Purpose |
|---------|---------|
| `@react-three/fiber` | React renderer for Three.js |
| `@react-three/drei` | R3F helpers (Stars, Cloud, Sparkles, PerspectiveCamera) |
| `@react-three/postprocessing` | Post-processing effects (Bloom, Noise, Vignette) |
| `zustand` | Lightweight state management |
| `motion` | Animation library (Framer Motion successor) |
| `lucide-react` | Icon components |
| `three` | 3D rendering engine |
| `@google/genai` | Gemini AI API client |
