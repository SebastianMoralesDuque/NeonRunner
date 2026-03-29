
import { create } from 'zustand';
import { GameState, GameStatus, ObstacleData, GameTheme, ProjectileData, PowerUpData } from '../types';

export const THEMES: GameTheme[] = [
  { primary: '#00ffff', secondary: '#ff00ff', accent: '#ffffff', background: '#050505', nebula: ['#4400ff', '#ff0088', '#00ffff'] }, // Cyan/Magenta
  { primary: '#00ff88', secondary: '#ffcc00', accent: '#ffffff', background: '#020502', nebula: ['#004422', '#886600', '#00ff88'] }, // Emerald/Gold
  { primary: '#ff4400', secondary: '#ffaa00', accent: '#ffffff', background: '#080200', nebula: ['#661100', '#884400', '#ff4400'] }, // Crimson/Orange
  { primary: '#8800ff', secondary: '#4400ff', accent: '#ffffff', background: '#020005', nebula: ['#330066', '#110044', '#8800ff'] }, // Violet/Indigo
  { primary: '#ffbb00', secondary: '#884400', accent: '#ffffff', background: '#050300', nebula: ['#442200', '#221100', '#ffbb00'] }, // Amber/Brown
  { primary: '#aaddff', secondary: '#ffffff', accent: '#ffffff', background: '#000508', nebula: ['#002244', '#224466', '#aaddff'] }, // Ice Blue/White
  { primary: '#00ff00', secondary: '#004400', accent: '#ffffff', background: '#000500', nebula: ['#002200', '#001100', '#00ff00'] }, // Toxic Green
  { primary: '#ffff00', secondary: '#ff0000', accent: '#ffffff', background: '#050500', nebula: ['#444400', '#440000', '#ffff00'] }, // Solar Yellow
  { primary: '#ff00ff', secondary: '#880088', accent: '#ffffff', background: '#050005', nebula: ['#440044', '#220022', '#ff00ff'] }, // Deep Purple
  { primary: '#ffffff', secondary: '#444444', accent: '#ffffff', background: '#050505', nebula: ['#111111', '#222222', '#ffffff'] }, // Monochrome
];

export const useGameStore = create<GameState>((set) => ({
  status: 'START',
  score: 0,
  highScore: 0,
  lane: 0,
  speed: 0.5,
  obstacles: [],
  projectiles: [],
  powerUps: [],
  hasPowerUp: false,
  themeIndex: 0,

  startGame: () => set({ 
    status: 'PLAYING', 
    score: 0, 
    speed: 0.5, 
    lane: 0, 
    obstacles: [], 
    projectiles: [],
    powerUps: [],
    hasPowerUp: false,
    themeIndex: 0 
  }),
  
  resetGame: () => set({ 
    status: 'START', 
    score: 0, 
    speed: 0.5, 
    lane: 0, 
    obstacles: [], 
    projectiles: [],
    powerUps: [],
    hasPowerUp: false,
    themeIndex: 0 
  }),
  
  setGameOver: () => set((state) => ({ 
    status: 'GAMEOVER', 
    highScore: Math.max(state.highScore, state.score),
    hasPowerUp: false,
    projectiles: []
  })),

  moveLeft: () => set((state) => ({ 
    lane: Math.max(state.lane - 1, -1) 
  })),

  moveRight: () => set((state) => ({ 
    lane: Math.min(state.lane + 1, 1) 
  })),

  updateScore: (delta) => set((state) => {
    const newScore = state.score + delta;
    const newThemeIndex = Math.floor(newScore / 100) % THEMES.length;
    return { 
      score: newScore,
      themeIndex: newThemeIndex
    };
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

  collectPowerUp: () => set({ hasPowerUp: true }),
}));