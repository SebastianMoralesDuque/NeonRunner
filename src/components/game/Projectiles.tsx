
import { useRef, useEffect, memo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore, THEMES, laneX } from '../../store/gameStore';
import { ProjectileData } from '../../types';
import { playShoot, playPowerUp } from '../../audio/sfx';
import { triggerExplosionAt } from './Explosions';

const PROJECTILE_SPEED = 80;
const PROJECTILE_END_Z = -120;
const COLLISION_THRESHOLD_Z = 1.5;
const COLLISION_THRESHOLD_X = 0.4;

export const Projectiles = () => {
  const status = useGameStore((s) => s.status);
  const projectiles = useGameStore((s) => s.projectiles);
  const obstacles = useGameStore((s) => s.obstacles);
  const addProjectile = useGameStore((s) => s.addProjectile);
  const removeProjectile = useGameStore((s) => s.removeProjectile);
  const removeObstacle = useGameStore((s) => s.removeObstacle);
  const updateScore = useGameStore((s) => s.updateScore);
  const hasPowerUp = useGameStore((s) => s.hasPowerUp);
  const isPaused = useGameStore((s) => s.isPaused);
  const themeIndex = useGameStore((s) => s.themeIndex);
  
  const playerLaneRef = useRef(0);
  const theme = THEMES[themeIndex];

  useEffect(() => {
    const unsub = useGameStore.subscribe((state) => {
      playerLaneRef.current = state.lane;
    });
    return unsub;
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && status === 'PLAYING' && hasPowerUp && !useGameStore.getState().isPaused && useGameStore.getState().countdown === null) {
        e.preventDefault();
        addProjectile({
          id: Math.random().toString(36).substr(2, 9),
          lane: playerLaneRef.current,
          z: -5,
        });
        playShoot();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status, hasPowerUp, addProjectile]);

  useFrame((_, delta) => {
    if (status !== 'PLAYING' || isPaused) return;

    const safeDelta = Math.min(delta, 0.1);
    const toRemove = new Set<string>();
    const obstaclesToRemove: string[] = [];
    const explosionPositions: { x: number; y: number; z: number }[] = [];
    let bonusScore = 0;

    for (const projectile of projectiles) {
      const newZ = projectile.z - PROJECTILE_SPEED * safeDelta;
      projectile.z = newZ;

      for (const obstacle of obstacles) {
        if (Math.abs(newZ - obstacle.z) < COLLISION_THRESHOLD_Z &&
            Math.abs(projectile.lane - obstacle.lane) < COLLISION_THRESHOLD_X) {
          obstaclesToRemove.push(obstacle.id);
          explosionPositions.push({ x: laneX(obstacle.lane), y: 1.4, z: obstacle.z });
          bonusScore += 25;
          toRemove.add(projectile.id);
          break;
        }
      }

      if (newZ < PROJECTILE_END_Z) {
        toRemove.add(projectile.id);
      }
    }

    if (obstaclesToRemove.length > 0) {
      obstaclesToRemove.forEach((id) => removeObstacle(id));
      explosionPositions.forEach((pos) => triggerExplosionAt(pos.x, pos.y, pos.z, theme.primary));
      playPowerUp();
      updateScore(bonusScore);
    }

    if (toRemove.size > 0) {
      toRemove.forEach((id) => removeProjectile(id));
    }
  });

  return (
    <group>
      {projectiles.map((projectile) => (
        <ProjectileMesh key={projectile.id} data={projectile} />
      ))}
    </group>
  );
};

const ProjectileMesh = memo(({ data }: { data: ProjectileData }) => {
  const meshRef = useRef<THREE.Group>(null);
  const themeIndex = useGameStore((s) => s.themeIndex);
  const theme = THEMES[themeIndex];

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.z = data.z;
      meshRef.current.position.x = laneX(data.lane);
    }
  });

  return (
    <group ref={meshRef} position={[laneX(data.lane), 0.6, data.z]}>
      <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 3, 8]} />
        <meshStandardMaterial color={theme.primary} emissive={theme.primary} emissiveIntensity={10} />
      </mesh>
      <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 3.2, 8]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0, 0, 1.5]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.15, 1, 8]} />
        <meshBasicMaterial color={theme.primary} transparent opacity={0.5} />
      </mesh>
    </group>
  );
});

ProjectileMesh.displayName = 'ProjectileMesh';
