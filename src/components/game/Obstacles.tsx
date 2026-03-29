
import { useFrame } from '@react-three/fiber';
import { useRef, useEffect, memo } from 'react';
import * as THREE from 'three';
import { useGameStore, THEMES } from '../../store/gameStore';
import { ObstacleData } from '../../types';

const OBSTACLE_SPAWN_INTERVAL = 1.5;
const OBSTACLE_START_Z = -100;
const OBSTACLE_END_Z = 20;
const COLLISION_THRESHOLD_Z = 0.5;
const COLLISION_THRESHOLD_X = 1.0;

export const Obstacles = () => {
  const status = useGameStore((s) => s.status);
  const speed = useGameStore((s) => s.speed);
  const obstacles = useGameStore((s) => s.obstacles);
  const addObstacle = useGameStore((s) => s.addObstacle);
  const removeObstacle = useGameStore((s) => s.removeObstacle);
  const setGameOver = useGameStore((s) => s.setGameOver);
  const updateScore = useGameStore((s) => s.updateScore);
  const setSpeed = useGameStore((s) => s.setSpeed);

  const lastSpawnTime = useRef(0);
  const playerLane = useRef(0);
  const lastSpeedUpdate = useRef(0);
  const lastScoreTick = useRef(0);

  useEffect(() => {
    const unsub = useGameStore.subscribe((state) => {
      playerLane.current = state.lane;
    });
    return unsub;
  }, []);

  useFrame((state, delta) => {
    if (status !== 'PLAYING') return;

    const safeDelta = Math.min(delta, 0.1);
    const elapsed = state.clock.elapsedTime;

    const spawnRate = Math.max(speed, 0.1);
    if (elapsed - lastSpawnTime.current > OBSTACLE_SPAWN_INTERVAL / spawnRate) {
      const lane = Math.floor(Math.random() * 3) - 1;
      addObstacle({
        id: Math.random().toString(36).substr(2, 9),
        lane,
        z: OBSTACLE_START_Z,
      });
      lastSpawnTime.current = elapsed;
    }

    const playerX = playerLane.current * 3.33;
    let gameOver = false;
    let toRemove: string[] = [];
    let scoredCount = 0;

    for (let i = 0; i < obstacles.length; i++) {
      const obstacle = obstacles[i];
      const newZ = obstacle.z + speed * 100 * safeDelta;
      obstacle.z = newZ;
      const obstacleX = obstacle.lane * 3.33;

      if (Math.abs(newZ) < COLLISION_THRESHOLD_Z && Math.abs(playerX - obstacleX) < COLLISION_THRESHOLD_X) {
        gameOver = true;
        break;
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

    if (elapsed - lastSpeedUpdate.current > 0.5) {
      const newSpeed = 0.5 + (elapsed / 60) * 0.5;
      if (newSpeed !== speed && newSpeed <= 2.0) {
        setSpeed(newSpeed);
      }
      lastSpeedUpdate.current = elapsed;
    }

    const currentTick = Math.floor(elapsed * 2);
    if (currentTick !== lastScoreTick.current) {
      updateScore(1);
      lastScoreTick.current = currentTick;
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
  const pulseRef = useRef<THREE.Mesh>(null);
  const themeIndex = useGameStore((s) => s.themeIndex);
  const theme = THEMES[themeIndex];

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.z = data.z;
      meshRef.current.position.x = data.lane * 3.33;
    }
    if (pulseRef.current) {
      pulseRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 10) * 0.1);
    }
  });

  const renderShape = () => {
    switch (themeIndex % 3) {
      case 0:
        return (
          <mesh castShadow>
            <boxGeometry args={[2.5, 0.8, 0.5]} />
            <meshStandardMaterial color={theme.background} metalness={1} roughness={0.1} />
          </mesh>
        );
      case 1:
        return (
          <mesh castShadow rotation={[0, 0, Math.PI / 4]}>
            <boxGeometry args={[1.5, 1.5, 0.5]} />
            <meshStandardMaterial color={theme.background} metalness={1} roughness={0.1} />
          </mesh>
        );
      case 2:
        return (
          <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[1, 1, 0.5, 6]} />
            <meshStandardMaterial color={theme.background} metalness={1} roughness={0.1} />
          </mesh>
        );
      default:
        return null;
    }
  };

  return (
    <group ref={meshRef} position={[data.lane * 3.33, 0.5, data.z]}>
      {renderShape()}
      
      <mesh position={[0, 0, 0.26]}>
        <planeGeometry args={[2.3, 0.1]} />
        <meshStandardMaterial color={theme.secondary} emissive={theme.secondary} emissiveIntensity={10} />
      </mesh>
      
      <mesh ref={pulseRef} position={[0, 0, 0]}>
        <boxGeometry args={[0.4, 0.4, 0.6]} />
        <meshStandardMaterial color={theme.secondary} emissive={theme.secondary} emissiveIntensity={20} />
      </mesh>
      
      <mesh position={[-1.1, 0, 0.1]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color={theme.primary} emissive={theme.primary} emissiveIntensity={5} />
      </mesh>
      <mesh position={[1.1, 0, 0.1]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color={theme.primary} emissive={theme.primary} emissiveIntensity={5} />
      </mesh>
    </group>
  );
}, (prev, next) => prev.data.id === next.data.id && prev.data.z === next.data.z);

Obstacle.displayName = 'Obstacle';
