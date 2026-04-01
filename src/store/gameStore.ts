
import { create } from 'zustand';
import { GameState, GameStatus, ObstacleData, GameTheme, ProjectileData, PowerUpData, Modifier, ModifierChoice } from '../types';
import { playPowerUp, playShield, playGameOver } from '../audio/sfx';

const STORAGE_KEY = 'neon_runner_save';

function loadSave() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { highScore: 0, lastRunChoices: [] };
}

function saveHighScore(score: number) {
  try {
    const data = loadSave();
    data.highScore = Math.max(data.highScore, score);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
}

function saveRunChoices(choices: ModifierChoice[]) {
  try {
    const data = loadSave();
    data.lastRunChoices = choices;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
}

const saved = loadSave();

let countdownTimer: number | null = null;
let modifierTimerInterval: number | null = null;
let selectionTimerInterval: number | null = null;
let applyCountdownTimer: number | null = null;

export const MODIFIERS: Modifier[] = [
  { id: 'nada', name: 'Nada', description: 'Sin efecto', multiplier: 1, color: '#888888', duration: 5, difficulty: 0 },
  { id: 'invisible', name: 'Nave invisible', description: 'Tu nave no se ve, la hitbox sigue igual', multiplier: 3, color: '#7700e6', duration: 13, difficulty: 9 },
  { id: 'blinking', name: 'Obstáculos parpadeantes', description: 'Obstáculos alternan visibilidad cada 1s', multiplier: 3, color: '#00cc66', duration: 13, difficulty: 8 },
  { id: 'controls_inverted', name: 'Controles invertidos', description: 'Izquierda y derecha intercambiados', multiplier: 2, color: '#cc5200', duration: 15, difficulty: 7 },
  { id: 'screen_inverted', name: 'Pantalla invertida', description: 'Pantalla girada 180 grados', multiplier: 2, color: '#d936d9', duration: 15, difficulty: 7 },
  { id: 'double_tap', name: 'Doble tap', description: 'Pulsa la dirección 2 veces para moverte', multiplier: 2, color: '#ccaa00', duration: 15, difficulty: 6 },
  { id: 'delay_input', name: 'Controles con delay', description: 'Inputs ejecutados 400ms después', multiplier: 2, color: '#0099cc', duration: 15, difficulty: 6 },
  { id: 'speed_boost', name: 'Velocidad aumentada', description: 'Obstáculos al doble de velocidad', multiplier: 2, color: '#cc0000', duration: 15, difficulty: 5 },
  { id: 'no_lane_lines', name: 'Sin carriles', description: 'Las líneas de carril desaparecen, x2 puntos', multiplier: 2, color: '#00ccaa', duration: 17, difficulty: 3 },
];

let recentModifierIds: string[] = [];
let seenModifierIds: Set<string> = new Set();

function pickModifiersForScore(_score: number): Modifier[] {
  const nada = MODIFIERS[0];
  const allOthers = MODIFIERS.slice(1);

  const unseen = allOthers.filter((m) => !seenModifierIds.has(m.id));
  const notRecent = allOthers.filter((m) => !recentModifierIds.includes(m.id));

  let picks: Modifier[];
  if (unseen.length >= 2) {
    const shuffled = [...unseen].sort(() => Math.random() - 0.5);
    picks = [shuffled[0], shuffled[1]];
  } else if (unseen.length === 1) {
    const shuffled = [...notRecent].sort(() => Math.random() - 0.5);
    picks = [unseen[0], shuffled[0]];
  } else {
    const shuffled = [...notRecent].sort(() => Math.random() - 0.5);
    if (shuffled.length >= 2) {
      picks = [shuffled[0], shuffled[1]];
    } else {
      picks = [...allOthers].sort(() => Math.random() - 0.5).slice(0, 2);
    }
  }

  for (const p of picks) {
    seenModifierIds.add(p.id);
    recentModifierIds.push(p.id);
    if (recentModifierIds.length > 4) {
      recentModifierIds.shift();
    }
  }

  return [picks[0], picks[1], nada];
}

export const NUM_LANES = 4;
export const LANE_WIDTH = 2.5;
export const laneX = (lane: number) => (lane - (NUM_LANES - 1) / 2) * LANE_WIDTH;

export const THEMES: GameTheme[] = [
  { primary: '#00d9d9', secondary: '#d900d9', accent: '#cccccc', background: '#050505', nebula: ['#3a00cc', '#cc006d', '#00cccc'] }, // Cyan/Magenta
  { primary: '#00cc66', secondary: '#cca300', accent: '#cccccc', background: '#020502', nebula: ['#00331a', '#664d00', '#00b359'] }, // Emerald/Gold
  { primary: '#cc3600', secondary: '#cc8800', accent: '#cccccc', background: '#080200', nebula: ['#4d0d00', '#663300', '#b33000'] }, // Crimson/Orange
  { primary: '#7700cc', secondary: '#3a00cc', accent: '#cccccc', background: '#020005', nebula: ['#26004d', '#0d0033', '#6600b3'] }, // Violet/Indigo
  { primary: '#cc9600', secondary: '#663300', accent: '#cccccc', background: '#050300', nebula: ['#331a00', '#1a0d00', '#b38400'] }, // Amber/Brown
  { primary: '#99ccff', secondary: '#cccccc', accent: '#cccccc', background: '#000508', nebula: ['#001a33', '#1a334d', '#80b3ff'] }, // Ice Blue/White
  { primary: '#00cc00', secondary: '#003300', accent: '#cccccc', background: '#000500', nebula: ['#001a00', '#000d00', '#00b300'] }, // Toxic Green
  { primary: '#cccc00', secondary: '#cc0000', accent: '#cccccc', background: '#050500', nebula: ['#333300', '#330000', '#b3b300'] }, // Solar Yellow
  { primary: '#cc00cc', secondary: '#660066', accent: '#cccccc', background: '#050005', nebula: ['#330033', '#1a001a', '#b300b3'] }, // Deep Purple
  { primary: '#cccccc', secondary: '#333333', accent: '#cccccc', background: '#050505', nebula: ['#0d0d0d', '#1a1a1a', '#b3b3b3'] }, // Monochrome
];

export const useGameStore = create<GameState>((set) => ({
  status: 'START',
  score: 0,
  highScore: saved.highScore ?? 0,
  lane: 0,
  speed: 0.5,
  obstacles: [],
  projectiles: [],
  powerUps: [],
  hasPowerUp: false,
  powerUpTimeRemaining: 0,
  hasShield: false,
  shieldTimeRemaining: 0,
  themeIndex: 0,
  isPaused: false,
  volume: 0.5,
  screenFlash: false,
  flashColor: '#00ffff',
  shakeIntensity: 0,
  countdown: null,
  showSelection: false,
  selectionOptions: [],
  selectionTimer: null,
  activeModifier: null,
  activeModifierTimeLeft: 0,
  lastModifierMilestone: 0,
  modifierApplyCountdown: null,
  pendingModifier: null,
  modifierChoices: [],

  startGame: () => {
    if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }
    if (applyCountdownTimer) { clearInterval(applyCountdownTimer); applyCountdownTimer = null; }
    set({
      status: 'PLAYING',
      score: 0,
      speed: 0,
      lane: 0,
      obstacles: [],
      projectiles: [],
      powerUps: [],
      hasPowerUp: false,
      powerUpTimeRemaining: 0,
      hasShield: false,
      shieldTimeRemaining: 0,
      themeIndex: 0,
      isPaused: false,
      countdown: '3',
      showSelection: false,
      selectionOptions: [],
      activeModifier: null,
      activeModifierTimeLeft: 0,
      lastModifierMilestone: 0,
      modifierApplyCountdown: null,
      pendingModifier: null,
      modifierChoices: [],
    });

    let step = 0;
    const sequence = ['2', '1', 'GO!', null];
    countdownTimer = window.setInterval(() => {
      step++;
      if (step < sequence.length) {
        set({ countdown: sequence[step] });
      } else {
        if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }
        set({ speed: 0.5, countdown: null });
      }
    }, 700);
  },

  resetGame: () => {
    if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }
    if (applyCountdownTimer) { clearInterval(applyCountdownTimer); applyCountdownTimer = null; }
    if (modifierTimerInterval) { clearInterval(modifierTimerInterval); modifierTimerInterval = null; }
    if (selectionTimerInterval) { clearInterval(selectionTimerInterval); selectionTimerInterval = null; }
    recentModifierIds = [];
    seenModifierIds = new Set();
    set({
      status: 'START',
      score: 0,
      speed: 0.5,
      lane: 0,
      obstacles: [],
      projectiles: [],
      powerUps: [],
      hasPowerUp: false,
      powerUpTimeRemaining: 0,
      hasShield: false,
      shieldTimeRemaining: 0,
      themeIndex: 0,
      isPaused: false,
      countdown: null,
      showSelection: false,
      selectionOptions: [],
      activeModifier: null,
      activeModifierTimeLeft: 0,
      lastModifierMilestone: 0,
      modifierApplyCountdown: null,
      pendingModifier: null,
      modifierChoices: [],
    });
  },

  setGameOver: () => {
    playGameOver();
    if (applyCountdownTimer) { clearInterval(applyCountdownTimer); applyCountdownTimer = null; }
    set((state) => {
      const newHighScore = Math.max(state.highScore, state.score);
      saveHighScore(newHighScore);
      saveRunChoices(state.modifierChoices);
      return {
        status: 'GAMEOVER',
        highScore: newHighScore,
        hasPowerUp: false,
        powerUpTimeRemaining: 0,
        hasShield: false,
        shieldTimeRemaining: 0,
        projectiles: [],
        isPaused: false,
        screenFlash: true,
        flashColor: '#ff0000',
        shakeIntensity: 3,
        showSelection: false,
        selectionOptions: [],
        activeModifier: null,
        activeModifierTimeLeft: 0,
        modifierApplyCountdown: null,
        pendingModifier: null,
      };
    });
    setTimeout(() => set({ screenFlash: false }), 200);
    setTimeout(() => set({ shakeIntensity: 0 }), 800);
  },

  moveLeft: () => set((state) => ({ 
    lane: Math.max(state.lane - 1, 0) 
  })),

  moveRight: () => set((state) => ({ 
    lane: Math.min(state.lane + 1, NUM_LANES - 1) 
  })),

  updateScore: (delta) => set((state) => {
    const multiplier = state.activeModifier ? state.activeModifier.multiplier : 1;
    const newScore = state.score + delta * multiplier;
    const newThemeIndex = Math.floor(newScore / 600) % THEMES.length;

    let updates: Partial<GameState> = {
      score: newScore,
      themeIndex: newThemeIndex,
    };

    const modifierMilestone = Math.floor(newScore / 500);
    if (modifierMilestone > state.lastModifierMilestone && !state.showSelection && !state.activeModifier) {
      updates.lastModifierMilestone = modifierMilestone;
      const options = pickModifiersForScore(newScore);
      updates.showSelection = true;
      updates.selectionOptions = options;
      updates.isPaused = true;
      updates.selectionTimer = 10;
    }

    return updates;
  }),

  addObstacle: (obstacle) => set((state) => ({ 
    obstacles: [...state.obstacles, obstacle] 
  })),

  removeObstacle: (id) => set((state) => ({ 
    obstacles: state.obstacles.filter((o) => o.id !== id) 
  })),

  moveObstacles: (obstacles) => set({ obstacles }),

  setSpeed: (speed) => set({ speed }),

  shoot: () => set((state) => {
    if (!state.hasPowerUp) return state;
    const newProjectile: ProjectileData = {
      id: Math.random().toString(36).substr(2, 9),
      lane: state.lane,
      z: -5,
    };
    return { projectiles: [...state.projectiles, newProjectile] };
  }),

  addProjectile: (projectile) => set((state) => ({ 
    projectiles: [...state.projectiles, projectile] 
  })),

  removeProjectile: (id) => set((state) => ({ 
    projectiles: state.projectiles.filter((p) => p.id !== id) 
  })),

  moveProjectiles: (projectiles) => set({ projectiles }),

  addPowerUp: (powerUp) => set((state) => ({ 
    powerUps: [...state.powerUps, powerUp] 
  })),

  removePowerUp: (id) => set((state) => ({ 
    powerUps: state.powerUps.filter((p) => p.id !== id) 
  })),

  movePowerUps: (powerUps) => set({ powerUps }),

  collectPowerUp: () => {
    playPowerUp();
    set({ hasPowerUp: true, powerUpTimeRemaining: 7 });
  },

  decrementPowerUpTime: () => set((state) => {
    if (state.powerUpTimeRemaining <= 0) {
      return { hasPowerUp: false, powerUpTimeRemaining: 0 };
    }
    return { powerUpTimeRemaining: state.powerUpTimeRemaining - 1 };
  }),

  collectShield: () => {
    playShield();
    set({ hasShield: true, shieldTimeRemaining: 10 });
  },

  decrementShieldTime: () => set((state) => {
    if (state.shieldTimeRemaining <= 0) {
      return { hasShield: false, shieldTimeRemaining: 0 };
    }
    return { shieldTimeRemaining: state.shieldTimeRemaining - 1 };
  }),

  consumeShield: () => set({ hasShield: false, shieldTimeRemaining: 0 }),

  togglePause: () => set((state) => {
    if (state.status !== 'PLAYING') return state;
    return { isPaused: !state.isPaused };
  }),

  setVolumeState: (vol) => set({ volume: vol }),

  triggerScreenFlash: (color?: string) => {
    set({ screenFlash: true, flashColor: color ?? '#00ffff' });
    setTimeout(() => set({ screenFlash: false }), 150);
  },

  showModifierSelection: () => set((state) => {
    if (state.showSelection || state.activeModifier) return state;
    const options = pickModifiersForScore(state.score);
    return {
      showSelection: true,
      selectionOptions: options,
      isPaused: true,
      selectionTimer: 10,
    };
  }),

  selectModifier: (index) => {
    const state = useGameStore.getState();
    const modifier = state.selectionOptions[index];
    if (!modifier) return;
    if (selectionTimerInterval) { clearInterval(selectionTimerInterval); selectionTimerInterval = null; }
    const choice: ModifierChoice = {
      options: state.selectionOptions.map((o) => ({ id: o.id, name: o.name })),
      chosen: { id: modifier.id, name: modifier.name },
      score: state.score,
    };
    set({
      showSelection: false,
      selectionOptions: [],
      selectionTimer: null,
      pendingModifier: modifier,
      modifierApplyCountdown: '3',
      modifierChoices: [...state.modifierChoices, choice],
    });
    if (applyCountdownTimer) { clearInterval(applyCountdownTimer); }
    let count = 3;
    applyCountdownTimer = window.setInterval(() => {
      count--;
      if (count <= 0) {
        if (applyCountdownTimer) { clearInterval(applyCountdownTimer); applyCountdownTimer = null; }
        const pending = useGameStore.getState().pendingModifier;
        if (pending) {
          useGameStore.getState().activateModifier(pending);
        }
      } else {
        set({ modifierApplyCountdown: String(count) });
      }
    }, 1000);
  },

  startModifierApplyCountdown: (modifier) => {
    set({
      pendingModifier: modifier,
      modifierApplyCountdown: '3',
    });
    if (applyCountdownTimer) { clearInterval(applyCountdownTimer); }
    let count = 3;
    applyCountdownTimer = window.setInterval(() => {
      count--;
      if (count <= 0) {
        if (applyCountdownTimer) { clearInterval(applyCountdownTimer); applyCountdownTimer = null; }
        const pending = useGameStore.getState().pendingModifier;
        if (pending) {
          useGameStore.getState().activateModifier(pending);
        }
      } else {
        set({ modifierApplyCountdown: String(count) });
      }
    }, 1000);
  },

  activateModifier: (modifier) => {
    if (selectionTimerInterval) { clearInterval(selectionTimerInterval); selectionTimerInterval = null; }
    set({
      showSelection: false,
      selectionOptions: [],
      selectionTimer: null,
      activeModifier: modifier,
      activeModifierTimeLeft: modifier.duration,
      isPaused: false,
      pendingModifier: null,
      modifierApplyCountdown: null,
    });
    if (modifierTimerInterval) { clearInterval(modifierTimerInterval); modifierTimerInterval = null; }
    modifierTimerInterval = window.setInterval(() => {
      useGameStore.getState().tickModifierTimer();
    }, 1000);
  },

  deactivateModifier: () => {
    if (modifierTimerInterval) { clearInterval(modifierTimerInterval); modifierTimerInterval = null; }
    set({
      activeModifier: null,
      activeModifierTimeLeft: 0,
    });
  },

  tickSelectionTimer: () => {
    // Handled by ModifierCards component interval
  },

  tickModifierTimer: () => set((state) => {
    if (!state.activeModifier) return {};
    const newTime = state.activeModifierTimeLeft - 1;
    if (newTime <= 0) {
      if (modifierTimerInterval) { clearInterval(modifierTimerInterval); modifierTimerInterval = null; }
      return { activeModifier: null, activeModifierTimeLeft: 0 };
    }
    return { activeModifierTimeLeft: newTime };
  }),
}));