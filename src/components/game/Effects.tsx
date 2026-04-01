
import { Bloom, EffectComposer, Noise, Vignette } from '@react-three/postprocessing';
import { Stars, Sparkles } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef, useMemo, useEffect, memo } from 'react';
import * as THREE from 'three';
import { useGameStore, THEMES } from '../../store/gameStore';

export const Effects = () => {
  return (
    <EffectComposer>
      <Bloom 
        intensity={1.0} 
        luminanceThreshold={0.4} 
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
      <Stars radius={300} depth={60} count={8000} factor={4} saturation={0} fade={false} speed={0.5} />
      
      <EnergyParticles primary={theme.primary} accent={theme.accent} secondary={theme.secondary} />
      
      <Sparkles 
        count={400} 
        scale={[80, 80, 80]} 
        size={1.5} 
        speed={0.2} 
        opacity={0.15} 
        color={theme.primary}
      />

      <Stardust color={theme.accent} />
      <WormholePortal color={theme.primary} />
    </>
  );
};

const EnergyParticles = ({ primary, accent, secondary }: { primary: string; accent: string; secondary: string }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 800;
  const spread = 80;
  const depth = 200;
  
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * spread;
      pos[i * 3 + 1] = Math.random() * 40 - 15;
      pos[i * 3 + 2] = Math.random() * -depth;
    }
    return pos;
  }, []);

  const velocities = useMemo(() => {
    const vel = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      vel[i] = 5 + Math.random() * 10;
    }
    return vel;
  }, []);

  const currentColors = useRef(new Float32Array(count * 3));
  const targetColors = useRef(new Float32Array(count * 3));
  const initialized = useRef(false);

  useEffect(() => {
    const colorOptions = [
      new THREE.Color(primary),
      new THREE.Color(accent),
      new THREE.Color(secondary),
    ];
    for (let i = 0; i < count; i++) {
      const color = colorOptions[Math.floor(Math.random() * colorOptions.length)];
      targetColors.current[i * 3] = color.r;
      targetColors.current[i * 3 + 1] = color.g;
      targetColors.current[i * 3 + 2] = color.b;
      if (!initialized.current) {
        currentColors.current[i * 3] = color.r;
        currentColors.current[i * 3 + 1] = color.g;
        currentColors.current[i * 3 + 2] = color.b;
      }
    }
    initialized.current = true;
  }, [primary, accent, secondary]);

  useFrame((state, delta) => {
    const safeDelta = Math.min(delta, 0.1);
    if (pointsRef.current) {
      const posArray = pointsRef.current.geometry.attributes.position.array as Float32Array;
      const colArray = pointsRef.current.geometry.attributes.color.array as Float32Array;
      
      for (let i = 0; i < count; i++) {
        posArray[i * 3 + 2] += velocities[i] * safeDelta;
        if (posArray[i * 3 + 2] > 10) {
          posArray[i * 3 + 2] = -depth;
          posArray[i * 3] = (Math.random() - 0.5) * spread;
          posArray[i * 3 + 1] = Math.random() * 40 - 15;
        }
        
        const i3 = i * 3;
        currentColors.current[i3] += (targetColors.current[i3] - currentColors.current[i3]) * 0.02;
        currentColors.current[i3 + 1] += (targetColors.current[i3 + 1] - currentColors.current[i3 + 1]) * 0.02;
        currentColors.current[i3 + 2] += (targetColors.current[i3 + 2] - currentColors.current[i3 + 2]) * 0.02;
        
        colArray[i3] = currentColors.current[i3];
        colArray[i3 + 1] = currentColors.current[i3 + 1];
        colArray[i3 + 2] = currentColors.current[i3 + 2];
      }
      
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
      pointsRef.current.geometry.attributes.color.needsUpdate = true;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={count} array={currentColors.current} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        vertexColors
        transparent
        opacity={0.5}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
};

const Stardust = ({ color }: { color: string }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 1000;
  const length = 100;
  
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 50;
      pos[i * 3 + 1] = Math.random() * 30 - 5;
      pos[i * 3 + 2] = Math.random() * -length;
    }
    return pos;
  }, []);

  useFrame((state, delta) => {
    const safeDelta = Math.min(delta, 0.1);
    if (pointsRef.current) {
      const posArray = pointsRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < count; i++) {
        posArray[i * 3 + 2] += 12 * safeDelta;
        if (posArray[i * 3 + 2] > 5) {
          posArray[i * 3 + 2] = -length;
        }
      }
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.02} color={color} transparent opacity={0.3} blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  );
};

const WormholePortal = ({ color }: { color: string }) => {
  const groupRef = useRef<THREE.Group>(null);
  const ringCount = 5;
  
  const rings = useMemo(() => {
    return Array.from({ length: ringCount }, (_, i) => ({
      scale: 15 + i * 8,
      speed: 0.2 + i * 0.1,
      offset: i * (Math.PI * 2 / ringCount),
    }));
  }, []);

  useFrame((state) => {
    if (groupRef.current) {
      const time = state.clock.elapsedTime;
      groupRef.current.rotation.z = time * 0.1;
      groupRef.current.children.forEach((child, i) => {
        const ringData = rings[i];
        if (!ringData) return;
        const pulse = Math.sin(time * ringData.speed + ringData.offset) * 0.1 + 1;
        child.scale.set(pulse, pulse, 1);
      });
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, -180]} rotation={[Math.PI / 2, 0, 0]}>
      {rings.map((ring, i) => (
        <mesh key={i} scale={ring.scale}>
          <torusGeometry args={[1, 0.02, 16, 100]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.15 - i * 0.02}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
      <mesh>
        <circleGeometry args={[12, 64]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.02}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
};
