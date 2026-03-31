# AGENTS.md - Neon Runner

## Project Overview
Cyberpunk-themed 3D endless runner built with React 19, Three.js, and Zustand.

## Commands
```bash
npm run dev        # Start dev server (port 3000)
npm run build      # Production build to dist/
npm run preview    # Preview production build
npm run clean      # Remove dist/
npm run lint       # Type-check only (tsc --noEmit, no linter configured)
```
**No test framework is configured.** There is no command to run tests.

## Architecture
```
src/
  App.tsx              # Root component, Canvas setup, ErrorBoundary
  main.tsx             # Entry point, global error handler
  types.ts             # Shared TypeScript interfaces/types
  index.css            # Tailwind import + global styles
  store/gameStore.ts   # Zustand store (all game state + actions)
  hooks/useAudio.ts    # Audio hook (Howler + procedural Web Audio API)
  audio/sfx.ts         # Procedural SFX (shoot, hit, powerup, etc.)
  components/game/     # All game components (Player, HUD, Road, etc.)
```

## State Management
- **Zustand** is the sole state manager. Store is `src/store/gameStore.ts`.
- Access state via `useGameStore((s) => s.field)` in components.
- Call actions via `useGameStore.getState().actionName()` outside React (e.g., in `useFrame` or event handlers).
- The store owns ALL game logic — components should be thin renderers.

## Code Style

### Imports
- Group imports: libraries first, then local imports with relative paths.
- No path alias imports (`@/`) used in existing code — prefer relative imports like `../../store/gameStore`.
- Named imports preferred; default exports only for `App` and entry point.

### Naming
- **Components**: `PascalCase` (e.g., `Player`, `HUD`, `ModifierCards`)
- **Hooks**: `camelCase` prefixed with `use` (e.g., `useAudio`)
- **Interfaces/Types**: `PascalCase` (e.g., `GameState`, `ObstacleData`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `NUM_LANES`, `LANE_WIDTH`, `DOUBLE_TAP_WINDOW`)
- **Store actions**: `camelCase` verbs (e.g., `startGame`, `moveLeft`, `updateScore`)
- **Files**: `PascalCase.tsx` for React components, `camelCase.ts` for utilities/hooks

### Types
- Use `interface` for object shapes, `type` for unions (e.g., `GameStatus = 'START' | 'PLAYING' | 'GAMEOVER'`).
- Define all shared types in `src/types.ts`.
- Inline `as const` for material style objects: `{ color: '#0e1014', metalness: 0.96 } as const`.
- Use `useRef<T>()` with explicit Three.js types (e.g., `useRef<THREE.Group>(null)`).

### Three.js / R3F Conventions
- Use `useFrame` for per-frame animation logic.
- Use `useRef` for mutable mesh references; never store refs in state.
- Use `THREE.MathUtils.lerp()` for smooth interpolation.
- Clamp `delta` in `useFrame`: `const dt = Math.min(delta, 0.1)`.
- Use `@react-three/drei` helpers (e.g., `PerspectiveCamera`).
- Materials defined as inline objects spread into JSX: `<meshStandardMaterial {...hullMat} />`.

### React Conventions
- Functional components with `export const Name = () => {}`.
- `useEffect` for side effects (event listeners, subscriptions).
- Subscribe to Zustand store outside React via `useGameStore.subscribe()` in `useEffect`.
- Use `motion` from `motion/react` for UI animations with `AnimatePresence`.
- Tailwind CSS v4 for all UI styling (not Three.js scene styling).

### Error Handling
- `ErrorBoundary` class component wraps `<App>` for React errors.
- `window.onerror` handler in `main.tsx` for global uncaught errors.
- `try/catch` for operations that may fail (e.g., `AudioContext` creation).
- Use `console.warn` for recoverable failures, `console.error` for actual errors.
- Guard clauses: early return on invalid state (e.g., `if (!modifier) return;`).

### Formatting
- Semicolons used consistently.
- Single quotes for strings.
- Arrow functions for callbacks and store actions.
- Compact single-line `set()` calls for simple state updates.
- Section comments with `// ── Name ──` separators in complex components.
