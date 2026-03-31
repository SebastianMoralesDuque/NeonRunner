
import { motion, AnimatePresence } from 'motion/react';
import { useGameStore } from '../../store/gameStore';
import { Zap, Shield, Volume2, VolumeX, Sparkles, AlertTriangle, Trophy, Home, RotateCcw } from 'lucide-react';
import { GlitchText, CornerBrackets, Scanlines } from './StartScreen';
import { DecisionLog } from './DecisionLog';

// ── StatusPill ──
const StatusPill = ({ icon, label, value, timeLeft, maxTime, color }: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  timeLeft?: number;
  maxTime?: number;
  color: string;
}) => {
  const pct = timeLeft !== undefined && maxTime ? (timeLeft / maxTime) * 100 : 100;
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="relative flex items-center gap-2 py-2 px-3 rounded-lg overflow-hidden"
      style={{ background: `${color}18`, border: `1px solid ${color}50` }}
    >
      <div className="flex-shrink-0" style={{ color }}>{icon}</div>
      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color }}>{label}</span>
      {value && <span className="text-[10px] font-black ml-auto" style={{ color }}>{value}</span>}
      {timeLeft !== undefined && (
        <>
          <span className="text-sm font-black ml-auto" style={{ color }}>{timeLeft}s</span>
          <div className="absolute bottom-0 left-0 h-0.5 transition-all duration-1000" style={{ width: `${pct}%`, background: color }} />
        </>
      )}
    </motion.div>
  );
};

export const HUD = () => {
  const status = useGameStore((s) => s.status);
  const score = useGameStore((s) => s.score);
  const highScore = useGameStore((s) => s.highScore);
  const themeIndex = useGameStore((s) => s.themeIndex);
  const hasPowerUp = useGameStore((s) => s.hasPowerUp);
  const powerUpTimeRemaining = useGameStore((s) => s.powerUpTimeRemaining);
  const hasShield = useGameStore((s) => s.hasShield);
  const activeModifier = useGameStore((s) => s.activeModifier);
  const activeModifierTimeLeft = useGameStore((s) => s.activeModifierTimeLeft);
  const isPaused = useGameStore((s) => s.isPaused);
  const countdown = useGameStore((s) => s.countdown);
  const modifierApplyCountdown = useGameStore((s) => s.modifierApplyCountdown);
  const volume = useGameStore((s) => s.volume);
  const startGame = useGameStore((s) => s.startGame);
  const resetGame = useGameStore((s) => s.resetGame);
  const togglePause = useGameStore((s) => s.togglePause);
  const setVolumeState = useGameStore((s) => s.setVolumeState);

  const isNewRecord = score > 0 && score >= highScore;

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center font-mono text-white z-[100]">
      <div className="absolute bottom-3 right-4 text-[7px] opacity-15 uppercase tracking-widest">
        SYS_STATUS: {status} | SECTOR_{themeIndex + 1}
      </div>

      {/* ── Gameplay HUD ── */}
      <AnimatePresence>
        {status === 'PLAYING' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-8 left-8 flex flex-col gap-3"
          >
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col"
            >
              <span className="text-[9px] uppercase tracking-[0.4em] text-cyan-500/60">Distance</span>
              <span className="text-5xl font-black italic tracking-tighter leading-none">{score}
                <span className="text-xl text-white/30 ml-1">m</span>
              </span>
              {highScore > 0 && (
                <span className="text-[9px] tracking-widest text-fuchsia-500/40 mt-0.5">
                  BEST <span className="text-fuchsia-500/60">{highScore}m</span>
                </span>
              )}
            </motion.div>

            <motion.div
              key={themeIndex}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="relative flex items-center gap-2 bg-white/5 backdrop-blur-sm border border-white/10 py-1.5 px-3 rounded-lg"
            >
              <CornerBrackets size={8} color="#22d3ee" />
              <Zap size={12} className="text-yellow-400 fill-yellow-400 flex-shrink-0" />
              <div className="flex flex-col">
                <span className="text-[7px] uppercase tracking-widest opacity-40">Sector</span>
                <span className="text-xs font-bold uppercase tracking-widest">{themeIndex + 1}</span>
              </div>
            </motion.div>

            {/* Power-up statuses */}
            <AnimatePresence mode="popLayout">
              {hasPowerUp && (
                <StatusPill
                  key="powerup"
                  icon={<Zap size={14} className="fill-current animate-pulse" />}
                  label="Weapon"
                  timeLeft={powerUpTimeRemaining}
                  maxTime={10}
                  color="#facc15"
                />
              )}
              {hasShield && (
                <StatusPill
                  key="shield"
                  icon={<Shield size={14} className="fill-current animate-pulse" />}
                  label="Shield"
                  color="#22d3ee"
                />
              )}
              {activeModifier && activeModifier.id !== 'nada' && (
                <StatusPill
                  key={activeModifier.id}
                  icon={<Sparkles size={14} className="animate-pulse" />}
                  label={activeModifier.name}
                  value={`×${activeModifier.multiplier}`}
                  timeLeft={activeModifierTimeLeft}
                  maxTime={15}
                  color={activeModifier.color}
                />
              )}
            </AnimatePresence>

            {/* Volume control */}
            <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm border border-white/8 py-1.5 px-3 rounded-lg pointer-events-auto">
              <button onClick={() => setVolumeState(volume > 0 ? 0 : 0.5)}>
                {volume > 0 ? <Volume2 size={12} className="text-cyan-500/80" /> : <VolumeX size={12} className="text-gray-500" />}
              </button>
              <input
                type="range" min="0" max="1" step="0.05" value={volume}
                onChange={(e) => setVolumeState(parseFloat(e.target.value))}
                className="w-16 h-0.5 accent-cyan-600 cursor-pointer"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Pause Screen ── */}
      <AnimatePresence>
        {isPaused && !modifierApplyCountdown && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-auto absolute inset-0 bg-black/75 backdrop-blur-md flex flex-col items-center justify-center gap-6 z-[150]"
          >
            <Scanlines />
            <motion.div
              initial={{ scale: 0.85, y: -10 }}
              animate={{ scale: 1, y: 0 }}
              className="relative flex flex-col items-center gap-6 p-10 rounded-2xl border border-cyan-500/20 bg-black/60 backdrop-blur-xl"
            >
              <CornerBrackets color="#22d3ee" size={14} />
              <div className="text-[9px] uppercase tracking-[0.5em] text-cyan-500/50">System Paused</div>
              <h2 className="text-6xl font-black tracking-tighter italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-fuchsia-600 uppercase">
                Paused
              </h2>
              <p className="text-white/30 text-[10px] tracking-[0.3em] uppercase">Press ESC or P to resume</p>
              <button
                onClick={togglePause}
                className="group relative overflow-hidden bg-cyan-600 hover:bg-cyan-500 text-black font-black py-3 px-10 rounded-xl transition-all uppercase tracking-widest"
              >
                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                Resume
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Countdown ── */}
      <AnimatePresence>
        {status === 'PLAYING' && countdown !== null && (
          <motion.div
            key={countdown}
            initial={{ opacity: 0, scale: 2 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-[120]"
          >
            <span className="text-[10rem] font-black tracking-tighter italic text-transparent bg-clip-text bg-gradient-to-b from-cyan-500 to-fuchsia-600 drop-shadow-[0_0_30px_rgba(6,182,212,0.4)]">
              {countdown}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── GAME OVER SCREEN ── */}
      <AnimatePresence>
        {status === 'GAMEOVER' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-auto absolute inset-0 flex flex-col items-center justify-center"
            style={{ background: 'radial-gradient(ellipse at 50% 40%, rgba(217,70,239,0.07) 0%, transparent 65%)' }}
          >
            <Scanlines />

            <div
              className="relative flex flex-col items-center gap-7 p-10 rounded-2xl max-w-md w-full mx-4"
              style={{
                border: '1px solid rgba(217,70,239,0.25)',
                background: 'rgba(0,0,0,0.75)',
                backdropFilter: 'blur(24px)',
                boxShadow: '0 0 80px rgba(217,70,239,0.12), inset 0 0 60px rgba(0,0,0,0.5)',
              }}
            >
              <CornerBrackets color="#d946ef" size={20} />
              <div className="absolute -top-px left-1/2 -translate-x-1/2 w-4/5 h-px" style={{ background: 'linear-gradient(to right, transparent, #d946ef, transparent)' }} />
              <div className="absolute -bottom-px left-1/2 -translate-x-1/2 w-3/5 h-px" style={{ background: 'linear-gradient(to right, transparent, #f97316, transparent)' }} />

              {/* Header */}
              <div className="flex flex-col items-center gap-2 z-10">
                <motion.div
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.05 }}
                  className="flex items-center gap-2 text-[9px] uppercase tracking-[0.5em] text-fuchsia-500/50"
                >
                  <AlertTriangle size={10} className="text-fuchsia-500/60" />
                  Connection Terminated
                </motion.div>
                <motion.h2
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.12 }}
                  className="text-6xl font-black tracking-tighter italic leading-none uppercase"
                  style={{
                    backgroundImage: 'linear-gradient(135deg, #c026d3 0%, #ea580c 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    filter: 'drop-shadow(0 0 15px rgba(192,38,211,0.4))',
                  }}
                >
                  <GlitchText text="Fatal" />
                  <br />
                  <GlitchText text="Error" />
                </motion.h2>
              </div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.22 }}
                className="grid grid-cols-2 gap-3 w-full z-10"
              >
                <div
                  className="relative flex flex-col items-center p-5 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <CornerBrackets size={8} color="rgba(255,255,255,0.2)" />
                  <span className="text-[8px] uppercase tracking-[0.35em] text-fuchsia-500/50 mb-2">Distance</span>
                  <span className="text-4xl font-black italic">{score}<span className="text-base text-white/30">m</span></span>
                </div>
                <div
                  className="relative flex flex-col items-center p-5 rounded-xl"
                  style={{ background: 'rgba(8,145,178,0.06)', border: '1px solid rgba(8,145,178,0.2)' }}
                >
                  <CornerBrackets size={8} color="rgba(8,145,178,0.3)" />
                  <span className="text-[8px] uppercase tracking-[0.35em] text-cyan-600/60 mb-2">Best</span>
                  <span className="text-4xl font-black italic text-cyan-600">{highScore}<span className="text-base text-cyan-600/40">m</span></span>
                  {isNewRecord && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
                      className="flex items-center gap-1 mt-1"
                    >
                      <Trophy size={10} className="text-yellow-500" />
                      <span className="text-[8px] uppercase tracking-widest text-yellow-500 font-bold">New Record!</span>
                    </motion.div>
                  )}
                </div>
              </motion.div>

              {/* Sector reached */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.32 }}
                className="flex items-center justify-between w-full px-1 z-10"
              >
                <span className="text-[8px] uppercase tracking-widest text-white/20">Sector Reached</span>
                <span className="text-[10px] font-black text-cyan-600/60 uppercase tracking-widest">Sector {themeIndex + 1}</span>
              </motion.div>

              {/* Decision Log */}
              <DecisionLog />

              {/* Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex flex-col gap-3 w-full z-10"
              >
                <button
                  onClick={startGame}
                  className="group relative w-full overflow-hidden font-black py-4 px-8 rounded-xl transition-all duration-300 flex items-center justify-center gap-3"
                  style={{
                    background: 'linear-gradient(90deg, #701a75, #a21caf)',
                    color: '#000',
                    boxShadow: '0 0 25px rgba(162,28,175,0.35)',
                  }}
                >
                  <RotateCcw size={18} />
                  <span className="text-lg uppercase tracking-widest">Reboot System</span>
                  <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                </button>

                <button
                  onClick={resetGame}
                  className="group w-full font-bold py-3 px-8 rounded-xl transition-all duration-300 flex items-center justify-center gap-3"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}
                >
                  <Home size={16} />
                  <span className="uppercase tracking-widest text-sm">Return to Base</span>
                </button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
