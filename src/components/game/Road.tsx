
import { useFrame } from '@react-three/fiber';
import { useRef, useMemo, memo } from 'react';
import * as THREE from 'three';
import { useGameStore, THEMES, LANE_WIDTH, NUM_LANES } from '../../store/gameStore';
import { GameTheme } from '../../types';

const ROAD_WIDTH = 10;
const SEGMENT_LENGTH = 40;
const NUM_SEGMENTS = 25;

function useRoadScroll(groupRef: React.RefObject<THREE.Group | null>) {
  const speedRef = useRef(0);
  const statusRef = useRef('');

  useFrame(() => {
    if (statusRef.current !== 'PLAYING' || !groupRef.current) return;
    const move = speedRef.current * 50 * 0.016;
    for (const child of groupRef.current.children) {
      child.position.z += move;
      if (child.position.z > SEGMENT_LENGTH * 2) {
        child.position.z -= SEGMENT_LENGTH * NUM_SEGMENTS;
      }
    }
  });

  return { speedRef, statusRef };
}

const RoadSegment = memo(({ segmentIndex, theme, themeIndex, noLaneLines, opacity }: {
  segmentIndex: number;
  theme: GameTheme;
  themeIndex: number;
  noLaneLines: boolean;
  opacity: number;
}) => {
  return (
    <group position={[0, 0, -segmentIndex * SEGMENT_LENGTH]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[ROAD_WIDTH, SEGMENT_LENGTH]} />
        <meshStandardMaterial color={theme.background} roughness={0.4} metalness={0.4} transparent opacity={opacity} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
        <planeGeometry args={[ROAD_WIDTH, SEGMENT_LENGTH, 8, 20]} />
        <meshStandardMaterial color={theme.primary} transparent opacity={0.02 * opacity} wireframe />
      </mesh>

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
  );
}, (prev, next) => {
  return prev.themeIndex === next.themeIndex &&
    prev.noLaneLines === next.noLaneLines &&
    prev.opacity === next.opacity;
});

RoadSegment.displayName = 'RoadSegment';

const FlatRoad = ({ opacity }: { opacity: number }) => {
  const groupRef = useRef<THREE.Group>(null);
  const themeIndex = useGameStore((s) => s.themeIndex);
  const theme = THEMES[themeIndex];
  const noLaneLines = useGameStore((s) => s.activeModifier?.id === 'no_lane_lines');

  const { speedRef, statusRef } = useRoadScroll(groupRef);

  const speed = useGameStore((s) => s.speed);
  const status = useGameStore((s) => s.status);
  speedRef.current = speed;
  statusRef.current = status;

  const segments = useMemo(() => {
    return Array.from({ length: NUM_SEGMENTS }, (_, i) => i);
  }, []);

  return (
    <group ref={groupRef}>
      {segments.map((i) => (
        <RoadSegment
          key={i}
          segmentIndex={i}
          theme={theme}
          themeIndex={themeIndex}
          noLaneLines={noLaneLines}
          opacity={opacity}
        />
      ))}
    </group>
  );
};

export const Road = () => {
  return <FlatRoad opacity={1} />;
};
