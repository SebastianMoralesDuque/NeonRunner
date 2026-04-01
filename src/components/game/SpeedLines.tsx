import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore, THEMES } from '../../store/gameStore';

const MAX_LINES = 40;
const SPAWN_Z = -80;
const DESPAWN_Z = 15;

interface LineData {
  mesh: THREE.Mesh;
  speed: number;
  baseX: number;
  baseY: number;
  baseLen: number;
}

function getSpeedTier(score: number) {
  if (score >= 5000) return { activeLines: MAX_LINES, opacityBase: 0.6, speedMult: 2.8, lenRange: [6, 16] as [number, number] };
  if (score >= 3000) return { activeLines: 25, opacityBase: 0.35, speedMult: 1.8, lenRange: [4, 10] as [number, number] };
  if (score >= 1500) return { activeLines: 10, opacityBase: 0.12, speedMult: 1.0, lenRange: [3, 7] as [number, number] };
  return { activeLines: 0, opacityBase: 0, speedMult: 0, lenRange: [0, 0] as [number, number] };
}

export const SpeedLines = () => {
  const groupRef = useRef<THREE.Group>(null);
  const linesRef = useRef<LineData[]>([]);
  const themeColorRef = useRef(new THREE.Color());
  const score = useGameStore((s) => s.score);
  const status = useGameStore((s) => s.status);
  const isPaused = useGameStore((s) => s.isPaused);
  const themeIndex = useGameStore((s) => s.themeIndex);
  const theme = THEMES[themeIndex];

  useEffect(() => {
    themeColorRef.current.set(theme.primary);
    if (linesRef.current.length > 0) {
      for (const line of linesRef.current) {
        (line.mesh.material as THREE.MeshBasicMaterial).color.copy(themeColorRef.current);
      }
    }
  }, [themeIndex]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const dt = Math.min(delta, 0.1);

    // Lazy init all lines (hidden initially)
    if (linesRef.current.length === 0) {
      for (let i = 0; i < MAX_LINES; i++) {
        const len = 2 + Math.random() * 6;
        const geo = new THREE.BoxGeometry(0.015, 0.015, len);
        const mat = new THREE.MeshBasicMaterial({
          color: themeColorRef.current.clone(),
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        const mesh = new THREE.Mesh(geo, mat);
        const baseX = (Math.random() - 0.5) * 18;
        const baseY = 0.5 + Math.random() * 4;
        mesh.position.set(baseX, baseY, SPAWN_Z + Math.random() * (DESPAWN_Z - SPAWN_Z));
        groupRef.current.add(mesh);
        linesRef.current.push({
          mesh,
          speed: 40 + Math.random() * 30,
          baseX,
          baseY,
          baseLen: len,
        });
      }
    }

    const tier = getSpeedTier(score);
    const active = status === 'PLAYING' && !isPaused && tier.activeLines > 0;

    for (let i = 0; i < linesRef.current.length; i++) {
      const line = linesRef.current[i];
      const mat = line.mesh.material as THREE.MeshBasicMaterial;

      if (active && i < tier.activeLines) {
        line.mesh.position.z += line.speed * tier.speedMult * dt;
        const flicker = 0.3 + Math.random() * 0.4;
        mat.opacity = tier.opacityBase * flicker;

        if (line.mesh.position.z > DESPAWN_Z) {
          line.mesh.position.z = SPAWN_Z;
          line.mesh.position.x = (Math.random() - 0.5) * 18;
          line.mesh.position.y = 0.5 + Math.random() * 4;
        }
      } else {
        mat.opacity *= 0.92;
        if (mat.opacity < 0.005) mat.opacity = 0;
      }
    }
  });

  return <group ref={groupRef} />;
};
