
import { useRef, useEffect, memo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore, THEMES, laneX, NUM_LANES } from '../../store/gameStore';
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
  const collectShield = useGameStore((s) => s.collectShield);
  const decrementPowerUpTime = useGameStore((s) => s.decrementPowerUpTime);
  const hasPowerUp = useGameStore((s) => s.hasPowerUp);
  const isPaused = useGameStore((s) => s.isPaused);
  const lastSpawnTime = useRef(0);
  const playerLane = useRef(0);
  const powerUpPositions = useRef(new Map<string, number>());
  const lastTimerUpdate = useRef(0);

  useEffect(() => {
    const unsub = useGameStore.subscribe((state) => {
      playerLane.current = state.lane;
    });
    return unsub;
  }, []);

  useFrame((state, delta) => {
    if (status !== 'PLAYING' || isPaused) return;

    const safeDelta = Math.min(delta, 0.1);
    const elapsed = state.clock.elapsedTime;

    if (elapsed - lastTimerUpdate.current > 1) {
      if (hasPowerUp) decrementPowerUpTime();
      lastTimerUpdate.current = elapsed;
    }

    if (elapsed - lastSpawnTime.current > POWERUP_SPAWN_INTERVAL) {
      const lane = Math.floor(Math.random() * NUM_LANES);
      const id = Math.random().toString(36).substr(2, 9);
      const type = Math.random() > 0.5 ? 'weapon' : 'shield';
      addPowerUp({ id, lane, z: POWERUP_START_Z, type });
      powerUpPositions.current.set(id, POWERUP_START_Z);
      lastSpawnTime.current = elapsed;
    }

    const toRemove: string[] = [];
    const playerX = laneX(playerLane.current);

    for (let i = 0; i < powerUps.length; i++) {
      const powerUp = powerUps[i];
      const currentZ = powerUpPositions.current.get(powerUp.id) ?? powerUp.z;
      const newZ = currentZ + speed * 80 * safeDelta;
      powerUp.z = newZ;
      powerUpPositions.current.set(powerUp.id, newZ);

      if (newZ > POWERUP_COLLECT_Z - 3 && newZ < POWERUP_COLLECT_Z + 3 &&
          Math.abs(playerX - laneX(powerUp.lane)) < POWERUP_COLLECT_X) {
        if (powerUp.type === 'weapon') {
          collectPowerUp();
        } else {
          collectShield();
        }
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
  const coreRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const shieldRef = useRef<THREE.Mesh>(null);
  const themeIndex = useGameStore((s) => s.themeIndex);
  const theme = THEMES[themeIndex];

  useFrame((state, delta) => {
    const safeDelta = Math.min(delta, 0.1);
    if (meshRef.current) {
      meshRef.current.position.z = data.z;
      meshRef.current.position.x = laneX(data.lane);
      meshRef.current.rotation.y += safeDelta * 2;
    }
    if (data.type === 'weapon') {
      if (coreRef.current) {
        coreRef.current.rotation.x += safeDelta * 3;
        coreRef.current.rotation.z += safeDelta * 2;
      }
      if (ringRef.current) {
        ringRef.current.rotation.z -= safeDelta * 4;
      }
    } else if (data.type === 'shield' && shieldRef.current) {
      shieldRef.current.rotation.y += safeDelta * 1.5;
      shieldRef.current.rotation.x += safeDelta * 0.5;
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.1;
      shieldRef.current.scale.setScalar(pulse);
    }
  });

  if (data.type === 'weapon') {
    const weaponColor = theme.primary;
    const coreColor = theme.secondary;

    return (
      <group ref={meshRef} position={[laneX(data.lane), 1.2, data.z]}>
        <mesh castShadow>
          <boxGeometry args={[0.3, 1.2, 0.3]} />
          <meshStandardMaterial color="#2a2a3a" metalness={0.9} roughness={0.2} />
        </mesh>

        <mesh position={[0, 0.7, 0]} castShadow>
          <cylinderGeometry args={[0.15, 0.25, 0.4, 8]} />
          <meshStandardMaterial color="#3a3a4a" metalness={0.8} roughness={0.3} />
        </mesh>

        <mesh position={[0, 0.7, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.18, 0.03, 8, 16]} />
          <meshStandardMaterial color={coreColor} emissive={coreColor} emissiveIntensity={8} />
        </mesh>

        <group position={[0, 0.7, 0]}>
          <mesh ref={coreRef}>
            <octahedronGeometry args={[0.25, 0]} />
            <meshStandardMaterial color={weaponColor} emissive={weaponColor} emissiveIntensity={5} metalness={0.5} roughness={0.1} />
          </mesh>

          <mesh ref={ringRef}>
            <torusGeometry args={[0.4, 0.02, 8, 32]} />
            <meshBasicMaterial color={weaponColor} transparent opacity={0.6} blending={THREE.AdditiveBlending} />
          </mesh>
        </group>

        <mesh position={[0, -0.5, 0.12]}>
          <boxGeometry args={[0.08, 0.3, 0.08]} />
          <meshStandardMaterial color={coreColor} emissive={coreColor} emissiveIntensity={3} />
        </mesh>

        <pointLight color={weaponColor} intensity={5} distance={10} decay={2} />
      </group>
    );
  }

  const shieldColor = theme.primary;
  const shieldEdge = theme.secondary;

  return (
    <group ref={meshRef} position={[laneX(data.lane), 1.2, data.z]}>
      {/* Shield face — flat disc */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.7, 0.7, 0.08, 6]} />
        <meshStandardMaterial
          color="#0a0a1a"
          metalness={0.95}
          roughness={0.15}
          emissive={shieldColor}
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Raised center boss */}
      <mesh position={[0, 0, 0.06]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.22, 0.22, 0.12, 16]} />
        <meshStandardMaterial
          color={shieldColor}
          emissive={shieldColor}
          emissiveIntensity={6}
          metalness={0.6}
          roughness={0.1}
        />
      </mesh>

      {/* Inner boss ring */}
      <mesh position={[0, 0, 0.07]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.22, 0.02, 8, 24]} />
        <meshStandardMaterial color={shieldEdge} emissive={shieldEdge} emissiveIntensity={8} />
      </mesh>

      {/* Outer edge ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.7, 0.035, 8, 6]} />
        <meshStandardMaterial color={shieldColor} emissive={shieldColor} emissiveIntensity={5} />
      </mesh>

      {/* Chevron / V detail — left bar */}
      <mesh position={[-0.14, 0.28, 0.05]} rotation={[0, 0, 0.45]}>
        <boxGeometry args={[0.04, 0.35, 0.03]} />
        <meshStandardMaterial color={shieldEdge} emissive={shieldEdge} emissiveIntensity={10} />
      </mesh>

      {/* Chevron / V detail — right bar */}
      <mesh position={[0.14, 0.28, 0.05]} rotation={[0, 0, -0.45]}>
        <boxGeometry args={[0.04, 0.35, 0.03]} />
        <meshStandardMaterial color={shieldEdge} emissive={shieldEdge} emissiveIntensity={10} />
      </mesh>

      {/* Chevron tip dot */}
      <mesh position={[0, 0.44, 0.05]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color={shieldColor} emissive={shieldColor} emissiveIntensity={12} />
      </mesh>

      {/* Ambient glow sphere */}
      <mesh ref={shieldRef}>
        <sphereGeometry args={[1.0, 16, 16]} />
        <meshBasicMaterial
          color={shieldColor}
          transparent
          opacity={0.08}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      <pointLight color={shieldColor} intensity={6} distance={10} decay={2} />
    </group>
  );
});

PowerUp.displayName = 'PowerUp';
