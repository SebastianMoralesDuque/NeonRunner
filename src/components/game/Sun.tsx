
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore, THEMES } from '../../store/gameStore';

export const Sun = () => {
  const sunRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const coronaRef = useRef<THREE.Points>(null);
  const plasmaRef = useRef<THREE.Group>(null);
  const themeIndex = useGameStore((s) => s.themeIndex);
  const status = useGameStore((s) => s.status);
  const score = useGameStore((s) => s.score);
  const theme = THEMES[themeIndex];
  const sunDistanceRef = useRef(status === 'START' ? 200 : Math.max(80, 200 - score * 0.02));

  const coronaParticles = useMemo(() => {
    const count = 800;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const angles = new Float32Array(count);
    const radii = new Float32Array(count);
    const speeds = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 1.8 + Math.random() * 5;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = Math.sin(angle) * radius;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 1.5;
      sizes[i] = Math.random() * 3 + 1;
      angles[i] = angle;
      radii[i] = radius;
      speeds[i] = 0.1 + Math.random() * 0.3;
    }
    return { positions, sizes, angles, radii, speeds, count };
  }, []);

  const plasmaBursts = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      angle: (i / 12) * Math.PI * 2,
      length: 4 + Math.random() * 6,
      speed: 0.8 + Math.random() * 0.5,
      phase: Math.random() * Math.PI * 2,
      width: 0.5 + Math.random() * 0.5,
    }));
  }, []);

  const surfaceNoise = useMemo(() => {
    return Array.from({ length: 60 }, (_, i) => ({
      theta: Math.random() * Math.PI * 2,
      phi: Math.random() * Math.PI,
      scale: 0.3 + Math.random() * 0.7,
      speed: 0.2 + Math.random() * 0.3,
      phase: Math.random() * Math.PI * 2,
    }));
  }, []);

  useFrame((state, delta) => {
    const safeDelta = Math.min(delta, 0.1);
    const time = state.clock.elapsedTime;

    const targetDistance = status === 'START' ? 200 : Math.max(80, 200 - score * 0.02);
    sunDistanceRef.current = THREE.MathUtils.lerp(sunDistanceRef.current, targetDistance, safeDelta * 0.5);

    if (sunRef.current) {
      sunRef.current.position.z = -sunDistanceRef.current;
      sunRef.current.rotation.z += safeDelta * 0.05;
    }

    if (glowRef.current) {
      const pulse1 = Math.sin(time * 1.5) * 0.08;
      const pulse2 = Math.sin(time * 2.7) * 0.04;
      const pulse3 = Math.sin(time * 4.1) * 0.02;
      const scale = 1.3 + pulse1 + pulse2 + pulse3;
      glowRef.current.scale.setScalar(scale);
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity = 0.3 + pulse1 * 0.5;
    }

    if (coronaRef.current && coronaRef.current.geometry && coronaRef.current.geometry.attributes.position) {
      const positions = coronaRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < coronaParticles.count; i++) {
        const angle = coronaParticles.angles[i] + time * coronaParticles.speeds[i];
        const radius = coronaParticles.radii[i] + Math.sin(time * 2 + i) * 0.5;
        positions[i * 3] = Math.cos(angle) * radius;
        positions[i * 3 + 1] = Math.sin(angle) * radius;
      }
      coronaRef.current.geometry.attributes.position.needsUpdate = true;
      coronaRef.current.rotation.z -= safeDelta * 0.15;
      (coronaRef.current.material as THREE.PointsMaterial).opacity = 0.5 + Math.sin(time * 3) * 0.2;
    }

    if (plasmaRef.current) {
      plasmaRef.current.rotation.z = time * 0.08;
      const scale = 1 + Math.sin(time * 2.5) * 0.1;
      plasmaRef.current.scale.setScalar(scale);
    }
  });

  return (
    <group ref={sunRef} position={[0, 15, -sunDistanceRef.current]}>
      <mesh>
        <sphereGeometry args={[8, 64, 64]} />
        <meshStandardMaterial
          color="#ffaa33"
          emissive="#ff6600"
          emissiveIntensity={2.5}
          roughness={0.7}
          metalness={0}
        />
      </mesh>

      {surfaceNoise.map((spot, i) => (
        <mesh
          key={i}
          position={[
            Math.sin(spot.theta) * Math.cos(spot.phi) * 8,
            Math.sin(spot.phi) * 8,
            Math.cos(spot.theta) * Math.cos(spot.phi) * 8,
          ]}
          scale={spot.scale}
        >
          <sphereGeometry args={[1.2, 16, 16]} />
          <meshBasicMaterial
            color="#ff4400"
            transparent
            opacity={0.15}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}

      <mesh ref={glowRef} scale={[1.3, 1.3, 1.3]}>
        <sphereGeometry args={[8, 32, 32]} />
        <meshBasicMaterial
          color="#ff9944"
          transparent
          opacity={0.4}
          side={THREE.BackSide}
        />
      </mesh>

      <mesh scale={[1.5, 1.5, 1.5]}>
        <sphereGeometry args={[8, 32, 32]} />
        <meshBasicMaterial
          color="#ff6600"
          transparent
          opacity={0.12}
          side={THREE.BackSide}
        />
      </mesh>

      <mesh scale={[1.8, 1.8, 1.8]}>
        <sphereGeometry args={[8, 32, 32]} />
        <meshBasicMaterial
          color="#ff3300"
          transparent
          opacity={0.06}
          side={THREE.BackSide}
        />
      </mesh>

      <mesh scale={[2.3, 2.3, 2.3]}>
        <sphereGeometry args={[8, 32, 32]} />
        <meshBasicMaterial
          color="#ff1100"
          transparent
          opacity={0.03}
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
          size={0.2}
          color="#ffcc66"
          transparent
          opacity={0.5}
          blending={THREE.AdditiveBlending}
          sizeAttenuation
          depthWrite={false}
        />
      </points>

      <group ref={plasmaRef}>
        {plasmaBursts.map((burst, i) => (
          <mesh
            key={i}
            position={[0, 0, 0]}
            rotation={[0, 0, burst.angle]}
          >
            <cylinderGeometry args={[0.1 * burst.width, 0.4 * burst.width, burst.length, 8, 1, true]} />
            <meshBasicMaterial
              color={i % 2 === 0 ? '#ff8844' : '#ffaa66'}
              transparent
              opacity={0.25}
              blending={THREE.AdditiveBlending}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>

      <pointLight color="#ff8844" intensity={60} distance={350} decay={2} />
      <pointLight color="#ffaa66" intensity={35} distance={250} decay={2} />
      <pointLight color="#ffcc88" intensity={20} distance={150} decay={2} position={[0, 0, 0]} />
    </group>
  );
};
