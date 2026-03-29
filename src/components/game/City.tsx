
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore';

const Building = ({ position, index }: { position: [number, number, number], index: number }) => {
  const { h, w, d, color, emissiveIntensity, pulseSpeed } = useMemo(() => ({
    h: 15 + Math.random() * 40,
    w: 6 + Math.random() * 8,
    d: 6 + Math.random() * 8,
    color: Math.random() > 0.5 ? "#00ffff" : "#ff00ff",
    emissiveIntensity: 0.2 + Math.random() * 0.8,
    pulseSpeed: 0.5 + Math.random() * 2
  }), []);
  
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.emissiveIntensity = emissiveIntensity * (0.8 + Math.sin(state.clock.elapsedTime * pulseSpeed) * 0.2);
    }
  });

  return (
    <group position={[position[0], h / 2, position[2]]}>
      {/* Main Structure */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial 
          color="#020202" 
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>
      
      {/* Neon Strips / Windows */}
      {Array.from({ length: 4 }).map((_, i) => (
        <mesh key={i} position={[0, (i - 1.5) * (h / 4), d / 2 + 0.05]}>
          <planeGeometry args={[w * 0.9, 0.2]} />
          <meshStandardMaterial 
            ref={materialRef}
            color={color} 
            emissive={color} 
            emissiveIntensity={emissiveIntensity * 2} 
          />
        </mesh>
      ))}

      {/* Vertical Neon on corners */}
      <mesh position={[w / 2, 0, d / 2]}>
        <boxGeometry args={[0.1, h, 0.1]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={emissiveIntensity} />
      </mesh>
      <mesh position={[-w / 2, 0, d / 2]}>
        <boxGeometry args={[0.1, h, 0.1]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={emissiveIntensity} />
      </mesh>
    </group>
  );
};

export const City = () => {
  const groupRef = useRef<THREE.Group>(null);
  const { speed, status } = useGameStore();

  const buildings = useMemo(() => {
    const left = Array.from({ length: 20 }).map((_, i) => ({
      pos: [-(Math.random() * 40 + 15), 0, -(i * 15)] as [number, number, number],
      id: `l-${i}`
    }));
    const right = Array.from({ length: 20 }).map((_, i) => ({
      pos: [(Math.random() * 40 + 15), 0, -(i * 15)] as [number, number, number],
      id: `r-${i}`
    }));
    return [...left, ...right];
  }, []);

  useFrame((state, delta) => {
    if (status !== 'PLAYING') return;
    const safeDelta = Math.min(delta, 0.1);
    if (groupRef.current) {
      // Move the whole city group to simulate movement
      groupRef.current.position.z += speed * 40 * safeDelta;
      
      // Reset position for seamless loop
      if (groupRef.current.position.z > 150) {
        groupRef.current.position.z = 0;
      }
    }
  });

  return (
    <group ref={groupRef}>
      {buildings.map((b, i) => (
        <Building key={b.id} position={b.pos} index={i} />
      ))}
      
      {/* Distant Cityscape (Static) */}
      <group position={[0, 0, -300]}>
        {Array.from({ length: 50 }).map((_, i) => (
          <mesh key={i} position={[(Math.random() - 0.5) * 500, 50, -Math.random() * 200]}>
            <boxGeometry args={[10 + Math.random() * 20, 100 + Math.random() * 200, 10 + Math.random() * 20]} />
            <meshStandardMaterial color="#010101" emissive="#111" emissiveIntensity={0.1} />
          </mesh>
        ))}
      </group>
    </group>
  );
};
