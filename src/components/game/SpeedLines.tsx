import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore, THEMES } from '../../store/gameStore';

const LINE_COUNT = 30;
const SPAWN_Z = -80;
const DESPAWN_Z = 15;
const SPEED_THRESHOLD = 0.7;

interface LineData {
  mesh: THREE.Mesh;
  speed: number;
  baseX: number;
  baseY: number;
}

export const SpeedLines = () => {
  const groupRef = useRef<THREE.Group>(null);
  const linesRef = useRef<LineData[]>([]);
  const themeIndex = useGameStore((s) => s.themeIndex);
  const speed = useGameStore((s) => s.speed);
  const status = useGameStore((s) => s.status);
  const isPaused = useGameStore((s) => s.isPaused);
  const theme = THEMES[themeIndex];

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const dt = Math.min(delta, 0.1);

    // Lazy init lines
    if (linesRef.current.length === 0) {
      for (let i = 0; i < LINE_COUNT; i++) {
        const len = 2 + Math.random() * 6;
        const geo = new THREE.BoxGeometry(0.015, 0.015, len);
        const mat = new THREE.MeshBasicMaterial({
          color: theme.primary,
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
        });
      }
    }

    // Update color on theme change
    for (const line of linesRef.current) {
      (line.mesh.material as THREE.MeshBasicMaterial).color.set(theme.primary);
    }

    const active = status === 'PLAYING' && !isPaused && speed > SPEED_THRESHOLD;
    const intensity = active ? Math.min((speed - SPEED_THRESHOLD) / 0.8, 1) : 0;

    for (const line of linesRef.current) {
      const mat = line.mesh.material as THREE.MeshBasicMaterial;

      if (active) {
        line.mesh.position.z += line.speed * dt;
        mat.opacity = intensity * (0.3 + Math.random() * 0.4);

        if (line.mesh.position.z > DESPAWN_Z) {
          line.mesh.position.z = SPAWN_Z;
          line.mesh.position.x = (Math.random() - 0.5) * 18;
          line.mesh.position.y = 0.5 + Math.random() * 4;
        }
      } else {
        mat.opacity *= 0.9;
      }
    }
  });

  return <group ref={groupRef} />;
};
