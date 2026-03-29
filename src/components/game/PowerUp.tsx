
import { useRef, useEffect, memo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore, THEMES } from '../../store/gameStore';
import { PowerUpData } from '../../types';

const POWERUP_SPAWN_INTERVAL = 15;
const POWERUP_START_Z = -100;
const POWERUP_END_Z = 20;
const POWERUP_COLLECT_Z = 5;
const POWERUP_COLLECT_X = 1.5;

export const PowerUpSystem = () => {
  const status = useGameStore((s) => s.status);
  const speed = useGameStore((s) => s.speed);
  const powerUps = useGameStore((s) => s.powerUps);
  const addPowerUp = useGameStore((s) => s.addPowerUp);
  const removePowerUp = useGameStore((s) => s.removePowerUp);
  const collectPowerUp = useGameStore((s) => s.collectPowerUp);
  const lastSpawnTime = useRef(0);
  const playerLane = useRef(0);
  const powerUpPositions = useRef(new Map<string, number>());

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

    if (elapsed - lastSpawnTime.current > POWERUP_SPAWN_INTERVAL) {
      const lane = Math.floor(Math.random() * 3) - 1;
      const id = Math.random().toString(36).substr(2, 9);
      addPowerUp({ id, lane, z: POWERUP_START_Z });
      powerUpPositions.current.set(id, POWERUP_START_Z);
      lastSpawnTime.current = elapsed;
    }

    const toRemove: string[] = [];
    const playerX = playerLane.current * 3.33;

    for (let i = 0; i < powerUps.length; i++) {
      const powerUp = powerUps[i];
      const currentZ = powerUpPositions.current.get(powerUp.id) ?? powerUp.z;
      const newZ = currentZ + speed * 80 * safeDelta;
      powerUp.z = newZ;
      powerUpPositions.current.set(powerUp.id, newZ);

      if (newZ > POWERUP_COLLECT_Z - 3 && newZ < POWERUP_COLLECT_Z + 3 &&
          Math.abs(playerX - powerUp.lane * 3.33) < POWERUP_COLLECT_X) {
        collectPowerUp();
        toRemove.push(powerUp.id);
        powerUpPositions.current.delete(powerUp.id);
      } else if (newZ > POWERUP_END_Z) {
        toRemove.push(powerUp.id);
        powerUpPositions.current.delete(powerUp.id);
      }
    }

    if (toRemove.length > 0) {
      toRemove.forEach((id) => removePowerUp(id));
    }
  });

  return (
    <group>
      {powerUps.map((powerUp) => (
        <PowerUp key={powerUp.id} data={powerUp} />
      ))}
    </group>
  );
};

const PowerUp = memo(({ data }: { data: PowerUpData }) => {
  const meshRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const themeIndex = useGameStore((s) => s.themeIndex);
  const theme = THEMES[themeIndex];

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.z = data.z;
      meshRef.current.position.x = data.lane * 3.33;
    }
    if (glowRef.current) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.15;
      glowRef.current.scale.setScalar(scale);
    }
  });

  return (
    <group ref={meshRef} position={[data.lane * 3.33, 0.8, data.z]}>
      <mesh rotation={[Math.PI / 4, 0, 0]}>
        <octahedronGeometry args={[0.6, 0]} />
        <meshStandardMaterial 
          color={theme.accent} 
          emissive={theme.primary} 
          emissiveIntensity={3}
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>

      <mesh ref={glowRef}>
        <sphereGeometry args={[0.9, 16, 16]} />
        <meshBasicMaterial 
          color={theme.primary}
          transparent 
          opacity={0.2}
          side={THREE.BackSide}
        />
      </mesh>

      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.8, 0.05, 8, 32]} />
        <meshStandardMaterial 
          color={theme.primary} 
          emissive={theme.primary} 
          emissiveIntensity={5}
        />
      </mesh>
    </group>
  );
});

PowerUp.displayName = 'PowerUp';
