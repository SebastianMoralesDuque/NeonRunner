import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useAudio } from '../../hooks/useAudio';
import { Zap, Play, ChevronRight, Trophy, Volume2, VolumeX, ArrowLeftRight, MousePointer2, Shield } from 'lucide-react';

// ── Glitch Text Component ──
export const GlitchText = ({ text, className }: { text: string; className?: string }) => {
  const [glitch, setGlitch] = useState(false);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const schedule = () => {
      const delay = 2000 + Math.random() * 4000;
      setTimeout(() => {
        setGlitch(true);
        setOffset((Math.random() - 0.5) * 4);
        setTimeout(() => {
          setGlitch(false);
          setOffset(0);
          schedule();
        }, 1180);
      }, delay);
    };
    schedule();
  }, []);

  return (
    <span
      className={className}
      style={{
        position: 'relative',
        display: 'inline-block',
        animation: glitch ? 'none' : undefined,
        textShadow: glitch
          ? '3px 0 #ff00de, -3px 0 #00fff9, 0 0 20px rgba(6,182,212,0.8)'
          : '1px 0 rgba(255,0,222,0.3), -1px 0 rgba(0,255,249,0.3)',
        transform: glitch
          ? `translate(${(Math.random() - 0.5) * 6}px, 0)`
          : `translate(${offset}px, 0)`,
        filter: glitch ? 'none' : 'blur(0.3px)',
      }}
    >
      {text}
    </span>
  );
};

// ── Corner Bracket Decoration ──
export const CornerBrackets = ({ color = '#22d3ee', size = 16 }: { color?: string; size?: number }) => (
  <>
    <div style={{ position: 'absolute', top: 0, left: 0, width: size, height: size, borderTop: `2px solid ${color}`, borderLeft: `2px solid ${color}`, opacity: 0.7 }} />
    <div style={{ position: 'absolute', top: 0, right: 0, width: size, height: size, borderTop: `2px solid ${color}`, borderRight: `2px solid ${color}`, opacity: 0.7 }} />
    <div style={{ position: 'absolute', bottom: 0, left: 0, width: size, height: size, borderBottom: `2px solid ${color}`, borderLeft: `2px solid ${color}`, opacity: 0.7 }} />
    <div style={{ position: 'absolute', bottom: 0, right: 0, width: size, height: size, borderBottom: `2px solid ${color}`, borderRight: `2px solid ${color}`, opacity: 0.7 }} />
  </>
);

// ── Scanlines ──
export const Scanlines = () => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0px, transparent 3px, rgba(0,0,0,0.18) 3px, rgba(0,0,0,0.18) 4px)',
      pointerEvents: 'none',
      borderRadius: 'inherit',
      zIndex: 1,
    }}
  />
);

// ── BootLines ──
const bootMessages = [
  'NEURAL_LINK....OK',
  'GRID_SYNC......OK',
  'HAZARD_MAP.....LOADED',
  'FLUX_DRIVE.....ONLINE',
  'READY TO RUN',
];

const BootLines = () => {
  const [lines, setLines] = useState<string[]>([]);

  useEffect(() => {
    let i = 0;
    const tick = setInterval(() => {
      if (i < bootMessages.length) {
        setLines((prev) => [...prev, bootMessages[i]]);
        i++;
      } else {
        clearInterval(tick);
      }
    }, 200);
    return () => clearInterval(tick);
  }, []);

  return (
    <div className="flex flex-col gap-0.5 font-mono text-left w-full">
      {lines.map((l, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.15 }}
          className="text-[11px] tracking-widest"
          style={{ color: idx === bootMessages.length - 1 ? '#22d3ee' : 'rgba(255,255,255,0.35)' }}
        >
          <span className="text-cyan-500/50 mr-2">&gt;</span>
          {l}
        </motion.div>
      ))}
    </div>
  );
};

export const StartScreen = () => {
  const startGame = useGameStore((s) => s.startGame);
  const status = useGameStore((s) => s.status);
  const highScore = useGameStore((s) => s.highScore);
  const volume = useGameStore((s) => s.volume);
  const setVolumeState = useGameStore((s) => s.setVolumeState);
  const { play } = useAudio();

  const [gameStartIntro, setGameStartIntro] = useState(false);

  const handleStartGame = () => {
    play();
    setGameStartIntro(true);
    setTimeout(() => {
      setGameStartIntro(false);
      startGame();
    }, 1500);
  };

  if (status !== 'START') return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black overflow-hidden font-mono text-white pointer-events-auto">
      {/* Background */}
      <div className="absolute inset-0 opacity-40">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-950/30 rounded-full blur-[140px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-fuchsia-950/20 rounded-full blur-[120px]" />
      </div>

      <Scanlines />

      {/* Main container - fills almost entire screen */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.02, filter: 'blur(20px)' }}
        transition={{ duration: 0.8, ease: 'easeInOut' }}
        className="relative rounded-2xl w-[calc(100vw-100px)] h-[calc(100vh-100px)] shadow-[0_0_60px_rgba(6,182,212,0.08)]"
        style={{
          border: '1px solid rgba(6,182,212,0.2)',
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(24px)',
        }}
      >
        <CornerBrackets color="#22d3ee" size={20} />

        <div className="flex flex-col md:flex-row h-full">
          {/* ── Left Column: Logo + Boot + Play ── */}
          <div className="flex-1 flex flex-col items-center justify-center gap-6 p-6 sm:p-8 z-10">
            {/* Logo */}
            <div className="flex flex-col items-center gap-1">
              <motion.div
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-[11px] uppercase tracking-[0.5em] text-cyan-600/40"
              >
                Terminal Connection Established
              </motion.div>
              <motion.h1
                initial={{ y: -8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-7xl sm:text-8xl md:text-9xl font-black tracking-tighter italic leading-none uppercase text-center"
                style={{
                  backgroundImage: 'linear-gradient(135deg, #0891b2 0%, #4f46e5 50%, #9333ea 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  filter: 'drop-shadow(0 0 20px rgba(8,145,178,0.5))',
                }}
              >
                <GlitchText text="Neon" />
                <br />
                <GlitchText text="Runner" />
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-white/20 text-[10px] tracking-[0.5em] uppercase"
              >
                Endless Cyberpunk Odyssey
              </motion.p>
            </div>

            {/* Boot lines */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="w-full px-3 py-2 rounded-lg"
              style={{ background: 'rgba(0,255,240,0.03)', border: '1px solid rgba(6,182,212,0.1)' }}
            >
              <BootLines />
            </motion.div>

            {/* Play button */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="flex flex-col items-center gap-2 w-full"
            >
              <button
                onClick={handleStartGame}
                disabled={gameStartIntro}
                className="group relative w-full overflow-hidden font-black py-4 px-8 rounded-xl transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: 'linear-gradient(90deg, #0891b2, #0e7490)',
                  color: '#000',
                  boxShadow: '0 0 25px rgba(8,145,178,0.3)',
                }}
              >
                <Play size={22} className="fill-black flex-shrink-0" />
                <span className="text-xl uppercase tracking-[0.2em]">Initiate Run</span>
                <ChevronRight size={18} className="ml-auto opacity-60" />
                <div className="absolute inset-0 bg-white/30 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              </button>

              {highScore > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="flex items-center gap-3 text-[14px] tracking-[0.3em] uppercase"
                  style={{ color: 'rgba(217,70,239,0.7)' }}
                >
                  <Trophy size={18} />
                  <span>Record: <span style={{ color: '#d946ef', fontSize: '1.3em' }}>{highScore}m</span></span>
                </motion.div>
              )}
            </motion.div>
          </div>

          {/* ── Right Column: How to Play + Volume ── */}
          <div className="flex-1 flex flex-col justify-center p-6 sm:p-8 z-10" style={{ borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
            {/* How to Play */}
            <motion.div
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Zap size={20} className="text-cyan-600/80" />
                <h2 className="text-base font-black uppercase tracking-[0.3em] text-cyan-600/70">Como Jugar</h2>
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex items-start gap-3 p-4 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                  <div className="flex-shrink-0 p-2.5 rounded bg-cyan-500/10 mt-0.5">
                    <ArrowLeftRight size={20} className="text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-base font-bold text-white/80">Moverse</p>
                    <p className="text-sm text-white/40 leading-snug"><span className="text-cyan-400/60">← →</span> o <span className="text-cyan-400/60">A / D</span> — Cambia de carril y esquiva obstáculos</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                  <div className="flex-shrink-0 p-2.5 rounded bg-yellow-500/10 mt-0.5">
                    <MousePointer2 size={20} className="text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-base font-bold text-white/80">Disparar</p>
                    <p className="text-sm text-white/40 leading-snug"><span className="text-yellow-400/60">Space</span> — Dispara con power-up de arma activo</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                  <div className="flex-shrink-0 p-2.5 rounded bg-fuchsia-500/10 mt-0.5">
                    <Zap size={20} className="text-fuchsia-400" />
                  </div>
                  <div>
                    <p className="text-base font-bold text-white/80">Power-Ups</p>
                    <p className="text-sm text-white/40 leading-snug">Recoge <span className="text-fuchsia-400/60">armas</span> y <span className="text-cyan-400/60">escudos</span> que aparecen en la pista</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                  <div className="flex-shrink-0 p-2.5 rounded bg-green-500/10 mt-0.5">
                    <Shield size={20} className="text-green-400" />
                  </div>
                  <div>
                    <p className="text-base font-bold text-white/80">Modificadores</p>
                    <p className="text-sm text-white/40 leading-snug">Elige un modificador — Multiplica puntos con desafíos extra</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Volume + Controls */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55 }}
              className="flex flex-col gap-3 pt-4"
              style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setVolumeState(volume > 0 ? 0 : 0.5)}
                  className="flex-shrink-0 p-2.5 rounded-lg transition-colors bg-white/5 hover:bg-white/10"
                >
                  {volume > 0 ? <Volume2 size={16} className="text-cyan-400" /> : <VolumeX size={16} className="text-gray-500" />}
                </button>
                <div className="flex-1 flex flex-col gap-1.5">
                  <div className="flex justify-between">
                    <span className="text-[9px] uppercase tracking-[0.3em] text-white/30">Volume</span>
                    <span className="text-[9px] font-bold text-cyan-400/60">{Math.round(volume * 100)}%</span>
                  </div>
                  <input
                    type="range" min="0" max="1" step="0.01" value={volume}
                    onChange={(e) => setVolumeState(parseFloat(e.target.value))}
                    className="w-full h-1.5 accent-cyan-400 cursor-pointer rounded-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3">
                {[
                  { key: '← →', desc: 'Nav' },
                  { key: 'A D', desc: 'Nav' },
                  { key: 'Space', desc: 'Fire' },
                  { key: 'ESC', desc: 'Pause' },
                ].map(({ key, desc }) => (
                  <div key={key} className="flex flex-col items-center gap-1 py-3 px-1 rounded-lg bg-white/5 border border-white/[0.08]">
                    <span className="text-base font-black text-white/80">{key}</span>
                    <span className="text-[9px] uppercase tracking-wider text-cyan-400/40">{desc}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* GAME START OVERLAY */}
      <AnimatePresence>
        {gameStartIntro && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center bg-black/95 backdrop-blur-md z-[2000]"
          >
            <div className="relative flex items-center justify-center">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '100vw' }}
                transition={{ duration: 1.2, ease: 'circIn' }}
                className="absolute h-px bg-cyan-400/80 -mt-20"
              />
              <motion.h2
                initial={{ opacity: 0, letterSpacing: '0.2em', scale: 1.2 }}
                animate={{ opacity: 1, letterSpacing: '0.6em', scale: 1 }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="text-2xl sm:text-3xl md:text-4xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-500 uppercase z-10 text-center px-4"
              >
                Syncing Neural Link...
              </motion.h2>
              <motion.div
                initial={{ width: 0, right: 0 }}
                animate={{ width: '100vw' }}
                transition={{ duration: 1.2, ease: 'circIn' }}
                className="absolute h-px bg-fuchsia-400/80 mt-20"
              />
              <div className="absolute inset-x-0 h-40 bg-gradient-to-b from-transparent via-cyan-500/10 to-transparent animate-pulse" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
