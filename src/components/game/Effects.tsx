
import { Bloom, EffectComposer, Noise, Vignette } from '@react-three/postprocessing';
import { Stars, Cloud, Sparkles } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useGameStore, THEMES } from '../../store/gameStore';

export const Effects = () => {
  const themeIndex = useGameStore((s) => s.themeIndex);
  const theme = THEMES[themeIndex];

  return (
    <EffectComposer>
      <Bloom 
        intensity={1.5} 
        luminanceThreshold={0.2} 
        luminanceSmoothing={0.3} 
      />
      <Noise opacity={0.02} />
      <Vignette eskil={false} offset={0.1} darkness={1.0} />
    </EffectComposer>
  );
};

export const Environment = () => {
  const themeIndex = useGameStore((s) => s.themeIndex);
  const theme = THEMES[themeIndex];

  return (
    <>
      <Stars radius={300} depth={60} count={10000} factor={4} saturation={0} fade={false} speed={0.5} />
      
      <group rotation={[0.3, 0.2, 0]}>
        <Stars radius={150} depth={50} count={3000} factor={3} saturation={0.5} fade={false} speed={0.3} />
      </group>

      <Cloud
        opacity={0.05}
        speed={0.05}
        position={[-50, 20, -200]}
        color={theme.nebula[0]}
        scale={[20, 20, 20]}
      />
      <Cloud
        opacity={0.05}
        speed={0.05}
        position={[50, -10, -250]}
        color={theme.nebula[1]}
        scale={[25, 25, 25]}
      />
      <Cloud
        opacity={0.03}
        speed={0.02}
        position={[0, -30, -300]}
        color={theme.nebula[2]}
        scale={[30, 30, 30]}
      />
      
      <Sparkles 
        count={500} 
        scale={[60, 60, 60]} 
        size={1} 
        speed={0.3} 
        opacity={0.1} 
        color={theme.primary}
      />

      <Stardust color={theme.accent} />
    </>
  );
};

const Stardust = ({ color }: { color: string }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 1500;
  const length = 100;
  
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 40;
      pos[i * 3 + 1] = Math.random() * 30 - 5;
      pos[i * 3 + 2] = Math.random() * -length;
    }
    return pos;
  }, []);

  useFrame((state, delta) => {
    const safeDelta = Math.min(delta, 0.1);
    if (pointsRef.current) {
      const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < count; i++) {
        positions[i * 3 + 2] += 10 * safeDelta;
        if (positions[i * 3 + 2] > 5) {
          positions[i * 3 + 2] = -length;
        }
      }
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.015} color={color} transparent opacity={0.25} blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  );
};
