
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { useGameStore, THEMES } from '../../store/gameStore';

const ROAD_WIDTH = 10;
const SEGMENT_LENGTH = 60;
const NUM_SEGMENTS = 5;

export const Road = () => {
  const groupRef = useRef<THREE.Group>(null);
  const speed = useGameStore((s) => s.speed);
  const status = useGameStore((s) => s.status);
  const themeIndex = useGameStore((s) => s.themeIndex);
  const theme = THEMES[themeIndex];

  useFrame((_, delta) => {
    if (status !== 'PLAYING') return;
    
    const safeDelta = Math.min(delta, 0.1);
    
    if (!groupRef.current) return;
    
    const moveAmount = speed * 50 * safeDelta;
    
    for (const child of groupRef.current.children) {
      child.position.z += moveAmount;
      if (child.position.z > SEGMENT_LENGTH * 2) {
        child.position.z -= SEGMENT_LENGTH * NUM_SEGMENTS;
      }
    }
  });

  return (
    <group ref={groupRef}>
      {Array.from({ length: NUM_SEGMENTS }).map((_, i) => (
        <group key={i} position={[0, 0, -i * SEGMENT_LENGTH - SEGMENT_LENGTH]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
            <planeGeometry args={[ROAD_WIDTH, SEGMENT_LENGTH]} />
            <meshStandardMaterial color={theme.background} roughness={0.1} metalness={0.8} />
          </mesh>

          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
            <planeGeometry args={[ROAD_WIDTH, SEGMENT_LENGTH, 8, 20]} />
            <meshStandardMaterial color={theme.primary} transparent opacity={0.02} wireframe />
          </mesh>

          <mesh position={[-5.05, 0.02, 0]}>
            <boxGeometry args={[0.08, 0.02, SEGMENT_LENGTH]} />
            <meshStandardMaterial color={theme.primary} emissive={theme.primary} emissiveIntensity={4} />
          </mesh>
          <mesh position={[5.05, 0.02, 0]}>
            <boxGeometry args={[0.08, 0.02, SEGMENT_LENGTH]} />
            <meshStandardMaterial color={theme.secondary} emissive={theme.secondary} emissiveIntensity={4} />
          </mesh>

          <mesh position={[-1.66, 0.015, 0]}>
            <boxGeometry args={[0.015, 0.005, SEGMENT_LENGTH]} />
            <meshStandardMaterial color={theme.primary} emissive={theme.primary} emissiveIntensity={0.5} opacity={0.25} transparent />
          </mesh>
          <mesh position={[1.66, 0.015, 0]}>
            <boxGeometry args={[0.015, 0.005, SEGMENT_LENGTH]} />
            <meshStandardMaterial color={theme.secondary} emissive={theme.secondary} emissiveIntensity={0.5} opacity={0.25} transparent />
          </mesh>

          <mesh position={[-5, 0.06, 0]}>
            <boxGeometry args={[0.08, 0.06, SEGMENT_LENGTH]} />
            <meshStandardMaterial color={theme.primary} emissive={theme.primary} emissiveIntensity={1.5} />
          </mesh>
          <mesh position={[5, 0.06, 0]}>
            <boxGeometry args={[0.08, 0.06, SEGMENT_LENGTH]} />
            <meshStandardMaterial color={theme.secondary} emissive={theme.secondary} emissiveIntensity={1.5} />
          </mesh>
        </group>
      ))}
    </group>
  );
};
