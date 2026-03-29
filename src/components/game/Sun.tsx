
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore, THEMES } from '../../store/gameStore';

export const Sun = () => {
  const sunRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const coronaRef = useRef<THREE.Points>(null);
  const themeIndex = useGameStore((s) => s.themeIndex);
  const status = useGameStore((s) => s.status);
  const score = useGameStore((s) => s.score);
  const theme = THEMES[themeIndex];
  const sunDistanceRef = useRef(status === 'START' ? 200 : Math.max(80, 200 - score * 0.02));

  const coronaParticles = useMemo(() => {
    const count = 500;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 1.5 + Math.random() * 3;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = Math.sin(angle) * radius;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
      sizes[i] = Math.random() * 2 + 0.5;
    }
    return { positions, sizes, count };
  }, []);

  const flares = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => ({
      angle: (i / 8) * Math.PI * 2,
      length: 2 + Math.random() * 3,
      speed: 0.5 + Math.random() * 0.5,
      offset: Math.random() * Math.PI * 2,
    }));
  }, []);

  useFrame((state, delta) => {
    const safeDelta = Math.min(delta, 0.1);
    const time = state.clock.elapsedTime;

    const targetDistance = status === 'START' ? 200 : Math.max(80, 200 - score * 0.02);
    sunDistanceRef.current = THREE.MathUtils.lerp(sunDistanceRef.current, targetDistance, safeDelta * 0.5);

    if (sunRef.current) {
      sunRef.current.position.z = -sunDistanceRef.current;
      sunRef.current.rotation.z += safeDelta * 0.1;
    }

    if (glowRef.current) {
      const scale = 1 + Math.sin(time * 2) * 0.05 + Math.sin(time * 3.7) * 0.03;
      glowRef.current.scale.setScalar(scale);
    }

    if (coronaRef.current) {
      const positions = coronaRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < coronaParticles.count; i++) {
        const angle = Math.atan2(positions[i * 3 + 1], positions[i * 3]) + safeDelta * 0.2;
        const radius = Math.sqrt(positions[i * 3] ** 2 + positions[i * 3 + 1] ** 2);
        positions[i * 3] = Math.cos(angle) * radius;
        positions[i * 3 + 1] = Math.sin(angle) * radius;
      }
      coronaRef.current.geometry.attributes.position.needsUpdate = true;
      coronaRef.current.rotation.z -= safeDelta * 0.3;
    }
  });

  return (
    <group ref={sunRef} position={[0, 15, -sunDistanceRef.current]}>
      <mesh>
        <sphereGeometry args={[8, 64, 64]} />
        <meshStandardMaterial
          color="#ffaa33"
          emissive="#ff6600"
          emissiveIntensity={3}
          roughness={0.8}
          metalness={0}
        />
      </mesh>

      <mesh ref={glowRef} scale={[1.3, 1.3, 1.3]}>
        <sphereGeometry args={[8, 32, 32]} />
        <meshBasicMaterial
          color="#ff8833"
          transparent
          opacity={0.4}
          side={THREE.BackSide}
        />
      </mesh>

      <mesh scale={[1.6, 1.6, 1.6]}>
        <sphereGeometry args={[8, 32, 32]} />
        <meshBasicMaterial
          color="#ff4400"
          transparent
          opacity={0.15}
          side={THREE.BackSide}
        />
      </mesh>

      <mesh scale={[2, 2, 2]}>
        <sphereGeometry args={[8, 32, 32]} />
        <meshBasicMaterial
          color="#ff2200"
          transparent
          opacity={0.05}
          side={THREE.BackSide}
        />
      </mesh>

      <points ref={coronaRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={coronaParticles.count}
            array={coronaParticles.positions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-size"
            count={coronaParticles.count}
            array={coronaParticles.sizes}
            itemSize={1}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.15}
          color="#ffaa44"
          transparent
          opacity={0.6}
          blending={THREE.AdditiveBlending}
          sizeAttenuation
        />
      </points>

      {flares.map((flare, i) => (
        <mesh
          key={i}
          position={[
            Math.cos(flare.angle) * (8 + flare.length * 0.5),
            Math.sin(flare.angle) * (8 + flare.length * 0.5),
            0,
          ]}
          rotation={[0, 0, flare.angle]}
        >
          <planeGeometry args={[flare.length, 0.3]} />
          <meshBasicMaterial
            color="#ff8844"
            transparent
            opacity={0.3}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}

      <pointLight color="#ff8844" intensity={50} distance={300} decay={2} />
      <pointLight color="#ffaa66" intensity={30} distance={200} decay={2} />
    </group>
  );
};
