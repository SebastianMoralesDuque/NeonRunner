
export type GameStatus = 'START' | 'PLAYING' | 'GAMEOVER';

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
}

export interface GameTheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  nebula: string[];
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
  themeIndex: number;
  
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
}