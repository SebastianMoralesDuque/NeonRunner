
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { useGameStore, THEMES, LANE_WIDTH, NUM_LANES } from '../../store/gameStore';

const ROAD_WIDTH = 10;
const SEGMENT_LENGTH = 40;
const NUM_SEGMENTS = 25;

// ─── Shared scroll logic ──────────────────────────────────────
function useRoadScroll(groupRef: React.RefObject<THREE.Group | null>, status: string, speed: number) {
  useFrame((_, delta) => {
    if (status !== 'PLAYING' || !groupRef.current) return;
    const dt = Math.min(delta, 0.1);
    const move = speed * 50 * dt;
    for (const child of groupRef.current.children) {
      child.position.z += move;
      if (child.position.z > SEGMENT_LENGTH * 2) {
        child.position.z -= SEGMENT_LENGTH * NUM_SEGMENTS;
      }
    }
  });
}

// ─── Flat road ────────────────────────────────────────────────
const FlatRoad = ({ opacity }: { opacity: number }) => {
  const groupRef = useRef<THREE.Group>(null);
  const speed = useGameStore((s) => s.speed);
  const status = useGameStore((s) => s.status);
  const themeIndex = useGameStore((s) => s.themeIndex);
  const theme = THEMES[themeIndex];
  const noLaneLines = useGameStore((s) => s.activeModifier?.id === 'no_lane_lines');

  useRoadScroll(groupRef, status, speed);

  return (
    <group ref={groupRef}>
      {Array.from({ length: NUM_SEGMENTS }).map((_, i) => (
        <group key={i} position={[0, 0, -i * SEGMENT_LENGTH]}>
          {/* Floor */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
            <planeGeometry args={[ROAD_WIDTH, SEGMENT_LENGTH]} />
            <meshStandardMaterial color={theme.background} roughness={0.4} metalness={0.4} transparent opacity={opacity} />
          </mesh>

          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
            <planeGeometry args={[ROAD_WIDTH, SEGMENT_LENGTH, 8, 20]} />
            <meshStandardMaterial color={theme.primary} transparent opacity={0.02 * opacity} wireframe />
          </mesh>

          {/* Edge walls */}
          {[-5.05, 5.05].map((x, ei) => (
            <mesh key={`ew-${ei}`} position={[x, 0.02, 0]}>
              <boxGeometry args={[0.08, 0.02, SEGMENT_LENGTH]} />
              <meshStandardMaterial
                color={ei === 0 ? theme.primary : theme.secondary}
                emissive={ei === 0 ? theme.primary : theme.secondary}
                emissiveIntensity={4}
                transparent opacity={opacity}
              />
            </mesh>
          ))}

          {/* Lane lines */}
          {Array.from({ length: NUM_LANES - 1 }).map((_, i) => {
            const x = (i - (NUM_LANES - 2) / 2) * LANE_WIDTH;
            return (
              <mesh key={`ll-${i}`} position={[x, 0.015, 0]}>
                <boxGeometry args={[0.015, 0.005, SEGMENT_LENGTH]} />
                <meshStandardMaterial
                  color={i % 2 === 0 ? theme.primary : theme.secondary}
                  emissive={i % 2 === 0 ? theme.primary : theme.secondary}
                  emissiveIntensity={0.5}
                  transparent opacity={noLaneLines ? 0 : 0.25 * opacity}
                />
              </mesh>
            );
          })}

          {/* Raised walls */}
          {[-5, 5].map((x, wi) => (
            <mesh key={`rw-${wi}`} position={[x, 0.06, 0]}>
              <boxGeometry args={[0.08, 0.06, SEGMENT_LENGTH]} />
              <meshStandardMaterial
                color={wi === 0 ? theme.primary : theme.secondary}
                emissive={wi === 0 ? theme.primary : theme.secondary}
                emissiveIntensity={1.5}
                transparent opacity={opacity}
              />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
};

// ─── Main Road ────────────────────────────────────────────────
export const Road = () => {
  return <FlatRoad opacity={1} />;
};
