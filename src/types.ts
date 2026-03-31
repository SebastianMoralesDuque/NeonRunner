
export type GameStatus = 'START' | 'PLAYING' | 'GAMEOVER';

export interface Modifier {
  id: string;
  name: string;
  description: string;
  multiplier: number;
  color: string;
  duration: number;
  difficulty: number;
}

export interface ObstacleData {
  id: string;
  lane: number;
  z: number;
}

export interface ProjectileData {
  id: string;
  lane: number;
  z: number;
}

export interface PowerUpData {
  id: string;
  lane: number;
  z: number;
  type: 'weapon' | 'shield';
}

export interface GameTheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  nebula: string[];
}

export interface ModifierChoice {
  options: { id: string; name: string }[];
  chosen: { id: string; name: string };
  score: number;
}

export interface GameState {
  status: GameStatus;
  score: number;
  highScore: number;
  lane: number;
  speed: number;
  obstacles: ObstacleData[];
  projectiles: ProjectileData[];
  powerUps: PowerUpData[];
  hasPowerUp: boolean;
  powerUpTimeRemaining: number;
  hasShield: boolean;
  shieldTimeRemaining: number;
  themeIndex: number;
  isPaused: boolean;
  volume: number;
  screenFlash: boolean;
  flashColor: string;
  shakeIntensity: number;
  countdown: string | null;
  showSelection: boolean;
  selectionOptions: Modifier[];
  selectionTimer: number | null;
  activeModifier: Modifier | null;
  activeModifierTimeLeft: number;
  lastModifierMilestone: number;
  modifierApplyCountdown: string | null;
  pendingModifier: Modifier | null;
  modifierChoices: ModifierChoice[];

  startGame: () => void;
  resetGame: () => void;
  setGameOver: () => void;
  moveLeft: () => void;
  moveRight: () => void;
  updateScore: (delta: number) => void;
  addObstacle: (obstacle: ObstacleData) => void;
  removeObstacle: (id: string) => void;
  moveObstacles: (obstacles: ObstacleData[]) => void;
  setSpeed: (speed: number) => void;
  shoot: () => void;
  addProjectile: (projectile: ProjectileData) => void;
  removeProjectile: (id: string) => void;
  moveProjectiles: (projectiles: ProjectileData[]) => void;
  addPowerUp: (powerUp: PowerUpData) => void;
  removePowerUp: (id: string) => void;
  movePowerUps: (powerUps: PowerUpData[]) => void;
  collectPowerUp: () => void;
  decrementPowerUpTime: () => void;
  collectShield: () => void;
  decrementShieldTime: () => void;
  consumeShield: () => void;
  togglePause: () => void;
  setVolumeState: (vol: number) => void;
  triggerScreenFlash: (color?: string) => void;
  showModifierSelection: () => void;
  selectModifier: (index: number) => void;
  startModifierApplyCountdown: (modifier: Modifier) => void;
  activateModifier: (modifier: Modifier) => void;
  deactivateModifier: () => void;
  tickSelectionTimer: () => void;
  tickModifierTimer: () => void;
}