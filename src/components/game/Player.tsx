import { useFrame } from '@react-three/fiber';
import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useGameStore, THEMES } from '../../store/gameStore';

export const Player = () => {
  const meshRef = useRef<THREE.Group>(null);

  // Engine nozzles — each with its own ref for independent pulse frequency
  const nozzleLRef = useRef<THREE.Mesh>(null);
  const nozzleRRef = useRef<THREE.Mesh>(null);
  const nozzleCRef = useRef<THREE.Mesh>(null);

  // Exhaust cones — stretch with speed along Z
  const exhaustLRef = useRef<THREE.Mesh>(null);
  const exhaustRRef = useRef<THREE.Mesh>(null);
  const exhaustCRef = useRef<THREE.Mesh>(null);

  // Engine point lights — intensity driven by speed + pulse
  const engLightLRef = useRef<THREE.PointLight>(null);
  const engLightRRef = useRef<THREE.PointLight>(null);

  // Canopy glass — emissive flicker simulates HUD scan
  const canopyRef = useRef<THREE.Mesh>(null);

  // Belly repulsor rings — scale pulsed in opposite phase
  const repulsorORef = useRef<THREE.Mesh>(null);
  const repulsorIRef = useRef<THREE.Mesh>(null);

  const lane = useGameStore((s) => s.lane);
  const status = useGameStore((s) => s.status);
  const speed = useGameStore((s) => s.speed);
  const themeIndex = useGameStore((s) => s.themeIndex);
  const theme = THEMES[themeIndex];

  const targetX = lane * 3.33;

  // ── Animation loop ─────────────────────────────────────────────
  useFrame(({ clock }, delta) => {
    const dt = Math.min(delta, 0.1);
    const t = clock.elapsedTime;

    if (meshRef.current) {
      const mesh = meshRef.current;

      // Smooth lateral movement
      mesh.position.x = THREE.MathUtils.lerp(mesh.position.x, targetX, dt * 10);

      // Banking roll — proportional to how far we still need to travel
      const bankAmount = (targetX - mesh.position.x) * 0.38;
      mesh.rotation.z = THREE.MathUtils.lerp(mesh.rotation.z, bankAmount, dt * 7);

      // Speed pitch — nose tips down at high speed (looks aggressive)
      mesh.rotation.x = THREE.MathUtils.lerp(mesh.rotation.x, -speed * 0.07, dt * 2.5);

      // Organic compound hover: two sine waves to avoid robotic feel
      if (status === 'PLAYING') {
        const hover = Math.sin(t * 3.2) * 0.11 + Math.sin(t * 1.6 + 1.0) * 0.04;
        mesh.position.y = THREE.MathUtils.lerp(mesh.position.y, 0.6 + hover, dt * 9);
      }
    }

    // ── Engine nozzle pulse — different freqs for organic texture ──
    const enginePow = 0.85 + speed * 0.35;

    if (nozzleLRef.current) {
      const s = enginePow + Math.sin(t * 22 + 0.3) * 0.22;
      nozzleLRef.current.scale.set(s, s, 1 + Math.sin(t * 18 + 0.1) * 0.45);
    }
    if (nozzleRRef.current) {
      const s = enginePow + Math.sin(t * 19 + 1.4) * 0.22;
      nozzleRRef.current.scale.set(s, s, 1 + Math.sin(t * 21 + 0.8) * 0.45);
    }
    if (nozzleCRef.current) {
      const s = enginePow * 0.65 + Math.sin(t * 15 + 2.1) * 0.18;
      nozzleCRef.current.scale.set(s, s, 1 + Math.sin(t * 13) * 0.55);
    }

    // ── Exhaust cone — length grows with speed ──────────────────────
    const exhaustLen = 1 + speed * 0.6;
    if (exhaustLRef.current) {
      const l = exhaustLen * (0.88 + Math.sin(t * 24) * 0.12);
      exhaustLRef.current.scale.set(1, 1, l);
    }
    if (exhaustRRef.current) {
      const l = exhaustLen * (0.88 + Math.sin(t * 20 + 1.0) * 0.12);
      exhaustRRef.current.scale.set(1, 1, l);
    }
    if (exhaustCRef.current) {
      const l = exhaustLen * 0.65 * (0.9 + Math.sin(t * 16 + 0.5) * 0.1);
      exhaustCRef.current.scale.set(1, 1, l);
    }

    // ── Engine light intensity — fast flicker over slow base ────────
    const baseIntensity = 4 + speed * 3;
    if (engLightLRef.current)
      engLightLRef.current.intensity = baseIntensity + Math.sin(t * 30 + 0.2) * 1.8;
    if (engLightRRef.current)
      engLightRRef.current.intensity = baseIntensity + Math.sin(t * 27 + 1.5) * 1.8;

    // ── Canopy HUD scan-line flicker ────────────────────────────────
    if (canopyRef.current) {
      const mat = canopyRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.12 + Math.abs(Math.sin(t * 1.8)) * 0.18
        + (Math.random() < 0.02 ? 0.4 : 0); // rare glitch spike
    }

    // ── Repulsor rings — counter-pulse for hover field effect ───────
    if (repulsorORef.current) {
      const s = 1 + Math.sin(t * 5.0) * 0.08;
      repulsorORef.current.scale.set(s, 1, s);
    }
    if (repulsorIRef.current) {
      const s = 1 + Math.sin(t * 5.0 + Math.PI) * 0.1; // opposite phase
      repulsorIRef.current.scale.set(s, 1, s);
    }
  });

  // ── Input handling ─────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (status !== 'PLAYING') return;
      if (e.key === 'ArrowLeft' || e.key === 'a') useGameStore.getState().moveLeft();
      if (e.key === 'ArrowRight' || e.key === 'd') useGameStore.getState().moveRight();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status]);

  // Shared materials (keeps JSX clean)
  const hullMat = { color: '#0e1014', metalness: 0.96, roughness: 0.28 } as const;
  const plateMat = { color: '#090b0f', metalness: 1.0, roughness: 0.15 } as const;

  return (
    <group ref={meshRef} position={[0, 0.6, 0]}>

      {/* ═══════════════════════════════════════════
          MAIN HULL BODY
      ═══════════════════════════════════════════ */}
      {/* Core fuselage */}
      <mesh castShadow>
        <boxGeometry args={[0.62, 0.26, 1.75]} />
        <meshStandardMaterial {...hullMat} />
      </mesh>

      {/* Raised dorsal spine — adds height and visual mass */}
      <mesh position={[0, 0.19, -0.08]} castShadow>
        <boxGeometry args={[0.2, 0.14, 1.15]} />
        <meshStandardMaterial {...plateMat} />
      </mesh>

      {/* Belly keel — structural anchor look */}
      <mesh position={[0, -0.17, 0.1]}>
        <boxGeometry args={[0.36, 0.06, 1.3]} />
        <meshStandardMaterial {...plateMat} />
      </mesh>

      {/* Forward sensor housing */}
      <mesh position={[0, 0.01, 1.08]} castShadow>
        <boxGeometry args={[0.38, 0.18, 0.38]} />
        <meshStandardMaterial {...plateMat} />
      </mesh>

      {/* Aft engine mount block */}
      <mesh position={[0, 0.02, -0.85]} castShadow>
        <boxGeometry args={[0.7, 0.3, 0.28]} />
        <meshStandardMaterial {...plateMat} />
      </mesh>

      {/* ═══════════════════════════════════════════
          HULL ACCENT LINES (glowing panel edges)
      ═══════════════════════════════════════════ */}
      {/* Port side stripe */}
      <mesh position={[-0.32, 0.06, 0.05]}>
        <boxGeometry args={[0.012, 0.012, 1.55]} />
        <meshStandardMaterial color={theme.primary} emissive={theme.primary} emissiveIntensity={4} />
      </mesh>
      {/* Starboard side stripe */}
      <mesh position={[0.32, 0.06, 0.05]}>
        <boxGeometry args={[0.012, 0.012, 1.55]} />
        <meshStandardMaterial color={theme.secondary} emissive={theme.secondary} emissiveIntensity={4} />
      </mesh>
      {/* Top centerline */}
      <mesh position={[0, 0.14, 0.1]}>
        <boxGeometry args={[0.018, 0.008, 1.5]} />
        <meshStandardMaterial color={theme.primary} emissive={theme.primary} emissiveIntensity={6} />
      </mesh>
      {/* Aft cross-brace line */}
      <mesh position={[0, 0.0, -0.72]}>
        <boxGeometry args={[0.65, 0.008, 0.01]} />
        <meshStandardMaterial color={theme.secondary} emissive={theme.secondary} emissiveIntensity={5} />
      </mesh>

      {/* ═══════════════════════════════════════════
          COCKPIT CANOPY
      ═══════════════════════════════════════════ */}
      {/* Glass body */}
      <mesh ref={canopyRef} position={[0, 0.27, 0.32]}>
        <boxGeometry args={[0.36, 0.21, 0.62]} />
        <meshStandardMaterial
          color="#001520" transparent opacity={0.78}
          metalness={0.88} roughness={0.04}
          emissive={theme.primary} emissiveIntensity={0.14}
        />
      </mesh>
      {/* Port frame strut */}
      <mesh position={[-0.185, 0.27, 0.32]}>
        <boxGeometry args={[0.014, 0.22, 0.62]} />
        <meshStandardMaterial color={theme.primary} emissive={theme.primary} emissiveIntensity={3.5} />
      </mesh>
      {/* Starboard frame strut */}
      <mesh position={[0.185, 0.27, 0.32]}>
        <boxGeometry args={[0.014, 0.22, 0.62]} />
        <meshStandardMaterial color={theme.primary} emissive={theme.primary} emissiveIntensity={3.5} />
      </mesh>
      {/* Canopy top rim */}
      <mesh position={[0, 0.38, 0.32]}>
        <boxGeometry args={[0.38, 0.014, 0.64]} />
        <meshStandardMaterial color={theme.secondary} emissive={theme.secondary} emissiveIntensity={3} />
      </mesh>

      {/* ═══════════════════════════════════════════
          WINGS
      ═══════════════════════════════════════════ */}

      {/* ── Left wing ── */}
      <group position={[-0.88, -0.05, -0.18]} rotation={[0, 0.06, -0.14]}>
        {/* Main wing slab */}
        <mesh castShadow>
          <boxGeometry args={[1.15, 0.09, 1.05]} />
          <meshStandardMaterial {...hullMat} />
        </mesh>
        {/* Upper panel */}
        <mesh position={[0.1, 0.05, -0.05]}>
          <boxGeometry args={[0.85, 0.018, 0.75]} />
          <meshStandardMaterial color="#0a0c10" metalness={1} roughness={0.1} />
        </mesh>
        {/* Leading edge neon strip */}
        <mesh position={[0, 0.05, 0.52]}>
          <boxGeometry args={[1.05, 0.012, 0.015]} />
          <meshStandardMaterial color={theme.primary} emissive={theme.primary} emissiveIntensity={6} />
        </mesh>
        {/* Panel glow face */}
        <mesh position={[0.08, 0.05, 0.05]}>
          <boxGeometry args={[0.8, 0.008, 0.7]} />
          <meshStandardMaterial color={theme.primary} emissive={theme.primary} emissiveIntensity={1.5} transparent opacity={0.5} />
        </mesh>
        {/* Winglet */}
        <group position={[-0.6, 0.0, -0.2]} rotation={[0, 0.25, -0.22]}>
          <mesh castShadow>
            <boxGeometry args={[0.07, 0.24, 0.48]} />
            <meshStandardMaterial {...plateMat} />
          </mesh>
          <mesh position={[0, 0.13, 0]}>
            <boxGeometry args={[0.015, 0.24, 0.015]} />
            <meshStandardMaterial color={theme.secondary} emissive={theme.secondary} emissiveIntensity={10} />
          </mesh>
        </group>
      </group>

      {/* ── Right wing ── */}
      <group position={[0.88, -0.05, -0.18]} rotation={[0, -0.06, 0.14]}>
        {/* Main wing slab */}
        <mesh castShadow>
          <boxGeometry args={[1.15, 0.09, 1.05]} />
          <meshStandardMaterial {...hullMat} />
        </mesh>
        {/* Upper panel */}
        <mesh position={[-0.1, 0.05, -0.05]}>
          <boxGeometry args={[0.85, 0.018, 0.75]} />
          <meshStandardMaterial color="#0a0c10" metalness={1} roughness={0.1} />
        </mesh>
        {/* Leading edge neon strip */}
        <mesh position={[0, 0.05, 0.52]}>
          <boxGeometry args={[1.05, 0.012, 0.015]} />
          <meshStandardMaterial color={theme.secondary} emissive={theme.secondary} emissiveIntensity={6} />
        </mesh>
        {/* Panel glow face */}
        <mesh position={[-0.08, 0.05, 0.05]}>
          <boxGeometry args={[0.8, 0.008, 0.7]} />
          <meshStandardMaterial color={theme.secondary} emissive={theme.secondary} emissiveIntensity={1.5} transparent opacity={0.5} />
        </mesh>
        {/* Winglet */}
        <group position={[0.6, 0.0, -0.2]} rotation={[0, -0.25, 0.22]}>
          <mesh castShadow>
            <boxGeometry args={[0.07, 0.24, 0.48]} />
            <meshStandardMaterial {...plateMat} />
          </mesh>
          <mesh position={[0, 0.13, 0]}>
            <boxGeometry args={[0.015, 0.24, 0.015]} />
            <meshStandardMaterial color={theme.primary} emissive={theme.primary} emissiveIntensity={10} />
          </mesh>
        </group>
      </group>

      {/* ═══════════════════════════════════════════
          ENGINE NACELLES (on wings)
      ═══════════════════════════════════════════ */}

      {/* ── Left nacelle ── */}
      <group position={[-0.76, -0.06, -0.68]}>
        {/* Housing cylinder */}
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.17, 0.21, 0.72, 14]} />
          <meshStandardMaterial color="#07090d" metalness={1} roughness={0.18} />
        </mesh>
        {/* Intake ring — glows at the front */}
        <mesh position={[0, 0, 0.34]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.19, 0.022, 8, 28]} />
          <meshStandardMaterial color={theme.primary} emissive={theme.primary} emissiveIntensity={3.5} />
        </mesh>
        {/* Mid band detail */}
        <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.215, 0.015, 8, 28]} />
          <meshStandardMaterial color={theme.secondary} emissive={theme.secondary} emissiveIntensity={2} />
        </mesh>
        {/* Glowing nozzle face */}
        <mesh ref={nozzleLRef} position={[0, 0, -0.38]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.11, 0.155, 0.07, 14]} />
          <meshStandardMaterial color={theme.secondary} emissive={theme.secondary} emissiveIntensity={20} />
        </mesh>
        {/* Exhaust cone */}
        <mesh ref={exhaustLRef} position={[0, 0, -0.62]} rotation={[-Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.11, 0.55, 14, 1, true]} />
          <meshStandardMaterial color={theme.secondary} emissive={theme.secondary} emissiveIntensity={9}
            transparent opacity={0.38} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
        <pointLight ref={engLightLRef} color={theme.secondary} intensity={5} distance={5} position={[0, 0, -0.55]} />
      </group>

      {/* ── Right nacelle ── */}
      <group position={[0.76, -0.06, -0.68]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.17, 0.21, 0.72, 14]} />
          <meshStandardMaterial color="#07090d" metalness={1} roughness={0.18} />
        </mesh>
        <mesh position={[0, 0, 0.34]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.19, 0.022, 8, 28]} />
          <meshStandardMaterial color={theme.secondary} emissive={theme.secondary} emissiveIntensity={3.5} />
        </mesh>
        <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.215, 0.015, 8, 28]} />
          <meshStandardMaterial color={theme.primary} emissive={theme.primary} emissiveIntensity={2} />
        </mesh>
        <mesh ref={nozzleRRef} position={[0, 0, -0.38]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.11, 0.155, 0.07, 14]} />
          <meshStandardMaterial color={theme.secondary} emissive={theme.secondary} emissiveIntensity={20} />
        </mesh>
        <mesh ref={exhaustRRef} position={[0, 0, -0.62]} rotation={[-Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.11, 0.55, 14, 1, true]} />
          <meshStandardMaterial color={theme.secondary} emissive={theme.secondary} emissiveIntensity={9}
            transparent opacity={0.38} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
        <pointLight ref={engLightRRef} color={theme.secondary} intensity={5} distance={5} position={[0, 0, -0.55]} />
      </group>

      {/* ═══════════════════════════════════════════
          CENTRAL SPINE THRUSTER
      ═══════════════════════════════════════════ */}
      <group position={[0, 0.08, -0.94]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.12, 0.16, 0.45, 12]} />
          <meshStandardMaterial color="#05070b" metalness={1} roughness={0.12} />
        </mesh>
        <mesh position={[0, 0, 0.21]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.14, 0.018, 6, 20]} />
          <meshStandardMaterial color={theme.primary} emissive={theme.primary} emissiveIntensity={4} />
        </mesh>
        <mesh ref={nozzleCRef} position={[0, 0, -0.24]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.07, 0.1, 0.07, 12]} />
          <meshStandardMaterial color={theme.primary} emissive={theme.primary} emissiveIntensity={22} />
        </mesh>
        <mesh ref={exhaustCRef} position={[0, 0, -0.42]} rotation={[-Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.08, 0.45, 12, 1, true]} />
          <meshStandardMaterial color={theme.primary} emissive={theme.primary} emissiveIntensity={6}
            transparent opacity={0.3} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      </group>

      {/* ═══════════════════════════════════════════
          FORWARD SENSOR ARRAY
      ═══════════════════════════════════════════ */}
      {/* Twin running lights */}
      <mesh position={[-0.14, -0.04, 1.25]}>
        <sphereGeometry args={[0.038, 8, 8]} />
        <meshStandardMaterial color={theme.primary} emissive={theme.primary} emissiveIntensity={18} />
      </mesh>
      <mesh position={[0.14, -0.04, 1.25]}>
        <sphereGeometry args={[0.038, 8, 8]} />
        <meshStandardMaterial color={theme.primary} emissive={theme.primary} emissiveIntensity={18} />
      </mesh>
      {/* Nose sensor ring */}
      <mesh position={[0, 0.01, 1.28]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.06, 0.011, 6, 18]} />
        <meshStandardMaterial color={theme.secondary} emissive={theme.secondary} emissiveIntensity={7} />
      </mesh>
      {/* Targeting reticle — thin box cross */}
      <mesh position={[0, 0.01, 1.27]}>
        <boxGeometry args={[0.16, 0.006, 0.006]} />
        <meshStandardMaterial color={theme.secondary} emissive={theme.secondary} emissiveIntensity={5} />
      </mesh>
      <mesh position={[0, 0.01, 1.27]}>
        <boxGeometry args={[0.006, 0.16, 0.006]} />
        <meshStandardMaterial color={theme.secondary} emissive={theme.secondary} emissiveIntensity={5} />
      </mesh>

      {/* ═══════════════════════════════════════════
          BELLY REPULSOR ARRAY
      ═══════════════════════════════════════════ */}
      <mesh ref={repulsorORef} position={[0, -0.145, 0.12]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.3, 0.022, 8, 36]} />
        <meshStandardMaterial color={theme.primary} emissive={theme.primary} emissiveIntensity={4}
          transparent opacity={0.75} />
      </mesh>
      <mesh ref={repulsorIRef} position={[0, -0.145, 0.12]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.17, 0.016, 8, 28]} />
        <meshStandardMaterial color={theme.secondary} emissive={theme.secondary} emissiveIntensity={3.5}
          transparent opacity={0.6} />
      </mesh>
      {/* Center repulsor dot */}
      <mesh position={[0, -0.148, 0.12]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.06, 16]} />
        <meshStandardMaterial color={theme.primary} emissive={theme.primary} emissiveIntensity={5}
          transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>

      {/* ═══════════════════════════════════════════
          SCENE LIGHTING
      ═══════════════════════════════════════════ */}
      {/* Cockpit ambient — warm fill on canopy underside */}
      <pointLight color={theme.primary} intensity={2.5} distance={4} position={[0, 0.4, 0.35]} />
      {/* Belly fill — repulsor glow */}
      <pointLight color={theme.primary} intensity={1.5} distance={3} position={[0, -0.5, 0.1]} />
    </group>
  );
};