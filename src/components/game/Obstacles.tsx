
import { useFrame } from '@react-three/fiber';
import { useRef, useEffect, memo } from 'react';
import * as THREE from 'three';
import { useGameStore, THEMES, laneX, NUM_LANES } from '../../store/gameStore';
import { ObstacleData } from '../../types';
import { playHit } from '../../audio/sfx';
import { triggerExplosionAt } from './Explosions';

const OBSTACLE_SPAWN_INTERVAL = 1.25;
const OBSTACLE_START_Z = -100;
const OBSTACLE_END_Z = 20;
const COLLISION_THRESHOLD_Z = 0.5;
const COLLISION_THRESHOLD_X = 1.0;
const SPAWN_SPAWN_PROTECT_Z = 15;

export const Obstacles = () => {
  const status = useGameStore((s) => s.status);
  const speed = useGameStore((s) => s.speed);
  const obstacles = useGameStore((s) => s.obstacles);
  const addObstacle = useGameStore((s) => s.addObstacle);
  const removeObstacle = useGameStore((s) => s.removeObstacle);
  const setGameOver = useGameStore((s) => s.setGameOver);
  const updateScore = useGameStore((s) => s.updateScore);
  const setSpeed = useGameStore((s) => s.setSpeed);
  const score = useGameStore((s) => s.score);
  const hasShield = useGameStore((s) => s.hasShield);
  const consumeShield = useGameStore((s) => s.consumeShield);
  const isPaused = useGameStore((s) => s.isPaused);
  const showSelection = useGameStore((s) => s.showSelection);
  const triggerScreenFlash = useGameStore((s) => s.triggerScreenFlash);
  const activeModifierId = useGameStore((s) => s.activeModifier?.id);

  const lastSpawnTime = useRef(0);
  const playerLane = useRef(0);
  const lastSpeedUpdate = useRef(0);
  const lastScoreTick = useRef(0);
  const lastSpeedMilestone = useRef(0);

  useEffect(() => {
    const unsub = useGameStore.subscribe((state) => {
      playerLane.current = state.lane;
    });
    return unsub;
  }, []);

  useFrame((state, delta) => {
    if (status !== 'PLAYING' || isPaused || showSelection) return;

    const safeDelta = Math.min(delta, 0.1);
    const elapsed = state.clock.elapsedTime;
    const isSpeedBoost = activeModifierId === 'speed_boost';
    const moveSpeed = speed * 100 * safeDelta * (isSpeedBoost ? 2 : 1);

    const spawnRate = Math.max(speed, 0.1);
    if (elapsed - lastSpawnTime.current > OBSTACLE_SPAWN_INTERVAL / spawnRate) {
      const occupiedLanes = new Set(
        obstacles
          .filter((o) => o.z > OBSTACLE_START_Z - SPAWN_SPAWN_PROTECT_Z)
          .map((o) => o.lane)
      );
      const freeLanes = Array.from({ length: NUM_LANES }, (_, i) => i).filter(
        (l) => !occupiedLanes.has(l)
      );
      if (freeLanes.length > 0) {
        const lane = freeLanes[Math.floor(Math.random() * freeLanes.length)];
        addObstacle({
          id: Math.random().toString(36).substr(2, 9),
          lane,
          z: OBSTACLE_START_Z,
        });
      }
      lastSpawnTime.current = elapsed;
    }

    const playerX = laneX(playerLane.current);
    let gameOver = false;
    let toRemove: string[] = [];
    let scoredCount = 0;

    for (let i = 0; i < obstacles.length; i++) {
      const obstacle = obstacles[i];
      const newZ = obstacle.z + moveSpeed;
      obstacle.z = newZ;
      const obstacleX = laneX(obstacle.lane);

      if (Math.abs(newZ) < COLLISION_THRESHOLD_Z && Math.abs(playerX - obstacleX) < COLLISION_THRESHOLD_X) {
        if (hasShield) {
          toRemove.push(obstacle.id);
          scoredCount++;
          consumeShield();
          playHit();
          triggerScreenFlash('#00ffff');
          triggerExplosionAt(laneX(obstacle.lane), 1.4, newZ, '#00ffff');
        } else {
          gameOver = true;
          break;
        }
      }

      if (newZ > OBSTACLE_END_Z) {
        toRemove.push(obstacle.id);
        scoredCount++;
      }
    }

    if (gameOver) {
      setGameOver();
      return;
    }

    if (toRemove.length > 0) {
      toRemove.forEach((id) => removeObstacle(id));
      if (scoredCount > 0) updateScore(scoredCount * 10);
    }

    const currentTick = Math.floor(elapsed * 2);
    if (currentTick !== lastScoreTick.current) {
      updateScore(1);
      lastScoreTick.current = currentTick;
    }

    const currentMilestone = Math.floor(score / 500);
    if (currentMilestone > lastSpeedMilestone.current) {
      lastSpeedMilestone.current = currentMilestone;
      setSpeed(speed + 0.1);
    }
  });

  return (
    <group>
      {obstacles.map((obstacle) => (
        <Obstacle key={obstacle.id} data={obstacle} />
      ))}
    </group>
  );
};

const Obstacle = memo(({ data }: { data: ObstacleData }) => {
  const meshRef = useRef<THREE.Group>(null);
  const rockRef = useRef<THREE.Mesh>(null);
  const themeIndex = useGameStore((s) => s.themeIndex);
  const activeModifierId = useGameStore((s) => s.activeModifier?.id);
  const theme = THEMES[themeIndex];
  const isBlinking = activeModifierId === 'blinking';

  useFrame((state, delta) => {
    const safeDelta = Math.min(delta, 0.1);
    if (meshRef.current) {
      meshRef.current.position.z = data.z;
      meshRef.current.position.x = laneX(data.lane);
      meshRef.current.rotation.z += safeDelta * 0.5;
      meshRef.current.rotation.x += safeDelta * 0.3;
      if (isBlinking) {
        meshRef.current.visible = Math.floor(state.clock.elapsedTime * 2) % 2 === 0;
      } else {
        meshRef.current.visible = true;
      }
    }
    if (rockRef.current) {
      rockRef.current.rotation.y += safeDelta * 0.8;
    }
  });

  const rockColor = themeIndex % 2 === 0 ? '#5a5a6a' : '#4a4a5a';

  return (
    <group ref={meshRef} position={[laneX(data.lane), 1.4, data.z]}>
      <mesh ref={rockRef} castShadow>
        <dodecahedronGeometry args={[1.2, 1]} />
        <meshStandardMaterial 
          color={rockColor} 
          roughness={0.9} 
          metalness={0.3}
          flatShading
        />
      </mesh>
      
      <mesh position={[0.5, 0.3, 0.4]} castShadow>
        <dodecahedronGeometry args={[0.35, 0]} />
        <meshStandardMaterial color="#4a4a5a" roughness={0.95} metalness={0.2} flatShading />
      </mesh>
      
      <mesh position={[-0.4, -0.2, -0.3]} castShadow>
        <dodecahedronGeometry args={[0.25, 0]} />
        <meshStandardMaterial color="#5a5a6a" roughness={0.9} metalness={0.25} flatShading />
      </mesh>
      
      <mesh position={[0.1, 0.5, -0.4]} castShadow>
        <dodecahedronGeometry args={[0.2, 0]} />
        <meshStandardMaterial color="#4a4a5a" roughness={0.95} metalness={0.2} flatShading />
      </mesh>
    </group>
  );
}, (prev, next) => prev.data.id === next.data.id && prev.data.z === next.data.z);

Obstacle.displayName = 'Obstacle';
