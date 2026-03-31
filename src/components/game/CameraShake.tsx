import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore';

export const CameraShake = () => {
  const screenFlash = useGameStore((s) => s.screenFlash);
  const shakeIntensity = useGameStore((s) => s.shakeIntensity);
  const shakeRef = useRef(0);
  const originalPos = useRef<THREE.Vector3 | null>(null);

  useFrame(({ camera }) => {
    if (!originalPos.current) {
      originalPos.current = camera.position.clone();
    }

    if (screenFlash) {
      shakeRef.current = 1;
    }

    if (shakeIntensity > 0) {
      shakeRef.current = Math.max(shakeRef.current, shakeIntensity);
    }

    if (shakeRef.current > 0.01) {
      shakeRef.current *= 0.92;
      const ox = (Math.random() - 0.5) * shakeRef.current * 0.4;
      const oy = (Math.random() - 0.5) * shakeRef.current * 0.3;
      camera.position.x = originalPos.current.x + ox;
      camera.position.y = originalPos.current.y + oy;
    } else if (originalPos.current) {
      camera.position.x = originalPos.current.x;
      camera.position.y = originalPos.current.y;
    }
  });

  return null;
};
