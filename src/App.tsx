
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import { Suspense, useRef, useMemo, Component, ReactNode, useEffect } from 'react';
import * as THREE from 'three';
import { Player } from './components/game/Player';
import { Road } from './components/game/Road';
import { Obstacles } from './components/game/Obstacles';
import { Effects, Environment } from './components/game/Effects';
import { Sun } from './components/game/Sun';
import { PowerUpSystem } from './components/game/PowerUp';
import { Projectiles } from './components/game/Projectiles';
import { Galaxy } from './components/game/Galaxy';
import { HUD } from './components/game/HUD';
import { StartScreen } from './components/game/StartScreen';
import { ModifierCards } from './components/game/ModifierCards';
import { CameraShake } from './components/game/CameraShake';
import { ExplosionSystem } from './components/game/Explosions';
import { SpeedLines } from './components/game/SpeedLines';
import { useGameStore } from './store/gameStore';
import { useAudio } from './hooks/useAudio';

const AudioManager = () => {
  const { setVolume } = useAudio();
  const volume = useGameStore((s) => s.volume);

  useEffect(() => {
    setVolume(volume);
  }, [volume, setVolume]);

  return null;
};

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("Game Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full bg-black text-red-500 p-10 font-mono">
          <h1 className="text-2xl mb-4 uppercase tracking-widest">Neural Link Severed</h1>
          <p className="text-sm opacity-70 mb-8">An unexpected error has occurred in the simulation.</p>
          <pre className="bg-red-950/30 p-4 rounded border border-red-500/30 text-xs overflow-auto max-w-full">
            {this.state.error?.message}
            {"\n\nStack:\n"}
            {this.state.error?.stack}
          </pre>
          <button 
            onClick={() => window.location.reload()}
            className="mt-8 px-6 py-2 border border-red-500 hover:bg-red-500 hover:text-black transition-colors uppercase text-sm tracking-widest"
          >
            Reconnect
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  console.log("App rendering v1.0.1...");

  useEffect(() => {
    const handlePauseKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        useGameStore.getState().togglePause();
      }
    };
    window.addEventListener('keydown', handlePauseKey);
    return () => window.removeEventListener('keydown', handlePauseKey);
  }, []);

  const screenFlash = useGameStore((s) => s.screenFlash);
  const flashColor = useGameStore((s) => s.flashColor);
  const activeModifierId = useGameStore((s) => s.activeModifier?.id);
  const isScreenFlipped = activeModifierId === 'screen_inverted';

  return (
    <ErrorBoundary>
      <div className="w-full h-screen bg-[#050505] overflow-hidden relative">
        <div style={isScreenFlipped ? { transform: 'rotate(180deg)', width: '100%', height: '100%' } : { width: '100%', height: '100%' }}>
        <Canvas 
          shadows
          dpr={[1, 2]} 
          camera={{ position: [0, 3, 8], fov: 60 }}
          gl={{ antialias: true, powerPreference: 'high-performance' }}
          onCreated={({ gl }) => {
            console.log("Canvas created, WebGL context:", gl.getContextAttributes());
          }}
        >
          <color attach="background" args={['#000']} />
          
          <Suspense fallback={null}>
            <Galaxy />
            <Environment />
            <Effects />
            
            <ambientLight intensity={0.2} />
            <hemisphereLight intensity={0.5} color="#00ffff" groundColor="#ff00ff" />
            <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
            
            <group>
              <Player />
              <Road />
              <Obstacles />
              <PowerUpSystem />
              <Projectiles />
            </group>
            
            <Sun />
          </Suspense>

          <CameraShake />
          <ExplosionSystem />
          <SpeedLines />

          <fog attach="fog" args={['#000', 30, 200]} />
        </Canvas>
        </div>

        <AudioManager />
        <HUD />
        <StartScreen />
        <ModifierCards />

        {screenFlash && (
          <div
            className="absolute inset-0 pointer-events-none z-[200]"
            style={{ backgroundColor: flashColor, opacity: 0.35 }}
          />
        )}

        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] z-50 opacity-10" />
      </div>
    </ErrorBoundary>
  );
}
