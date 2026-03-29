
import { motion, AnimatePresence } from 'motion/react';
import { useGameStore } from '../../store/gameStore';
import { Zap } from 'lucide-react';

export const HUD = () => {
  const status = useGameStore((s) => s.status);
  const score = useGameStore((s) => s.score);
  const highScore = useGameStore((s) => s.highScore);
  const themeIndex = useGameStore((s) => s.themeIndex);
  const hasPowerUp = useGameStore((s) => s.hasPowerUp);
  const startGame = useGameStore((s) => s.startGame);

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center font-mono text-white z-[100]">
      <div className="absolute top-10 right-10 text-[10px] text-fuchsia-500 opacity-50">
        HUD_ACTIVE: TRUE
      </div>
      <div className="absolute bottom-4 right-4 text-[8px] opacity-20 uppercase tracking-widest">
        System Status: Online | Mode: {status}
      </div>
      {status === 'PLAYING' && (
        <div className="absolute top-10 left-10 flex flex-col gap-4">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col"
          >
            <span className="text-[10px] uppercase tracking-[0.3em] text-cyan-400/60">Distance</span>
            <span className="text-5xl font-black italic tracking-tighter">{score}m</span>
          </motion.div>

          {hasPowerUp && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 bg-yellow-500/20 border border-yellow-500/50 py-2 px-4 rounded-lg"
            >
              <Zap size={16} className="text-yellow-400 fill-yellow-400 animate-pulse" />
              <span className="text-sm font-bold uppercase tracking-widest text-yellow-400">Weapon Ready</span>
              <span className="text-[10px] text-yellow-400/60 ml-2">[SPACE]</span>
            </motion.div>
          )}
          
          <motion.div 
            key={themeIndex}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 bg-white/5 backdrop-blur-sm border border-white/10 py-2 px-4 rounded-lg"
          >
            <Zap size={14} className="text-yellow-400 fill-yellow-400" />
            <div className="flex flex-col">
              <span className="text-[8px] uppercase tracking-widest opacity-50">Current Sector</span>
              <span className="text-sm font-bold uppercase tracking-widest">Sector {themeIndex + 1}</span>
            </div>
          </motion.div>
        </div>
      )}

      <AnimatePresence>
        {status === 'START' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="pointer-events-auto bg-black/80 backdrop-blur-md border border-cyan-500/50 p-12 rounded-2xl flex flex-col items-center gap-8 shadow-[0_0_50px_rgba(6,182,212,0.2)]"
          >
            <div className="flex flex-col items-center">
              <h1 className="text-6xl font-black tracking-tighter italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-500 uppercase">
                Neon Runner
              </h1>
              <p className="text-cyan-400/60 text-sm tracking-[0.3em] uppercase mt-2">Endless Cyberpunk Odyssey</p>
            </div>
            
            <div className="flex flex-col gap-4 w-full">
              <button 
                onClick={startGame}
                className="group relative overflow-hidden bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-4 px-8 rounded-lg transition-all flex items-center justify-center gap-3"
              >
                <span className="text-lg uppercase tracking-widest">Initiate Run</span>
                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
              </button>
              
              <div className="flex items-center justify-between px-2 text-xs text-cyan-400/40 uppercase tracking-widest">
                <span>Use Arrows or A/D to move</span>
                <span>Avoid Red Barriers</span>
              </div>
            </div>
          </motion.div>
        )}

        {status === 'GAMEOVER' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="pointer-events-auto bg-black/90 backdrop-blur-xl border border-fuchsia-500/50 p-12 rounded-2xl flex flex-col items-center gap-8 shadow-[0_0_50px_rgba(217,70,239,0.2)]"
          >
            <div className="flex flex-col items-center">
              <h2 className="text-5xl font-black text-fuchsia-500 uppercase italic">System Failure</h2>
              <p className="text-fuchsia-400/60 text-sm tracking-[0.3em] uppercase mt-2">Connection Terminated</p>
            </div>

            <div className="grid grid-cols-2 gap-8 w-full">
              <div className="flex flex-col items-center p-4 bg-white/5 rounded-xl border border-white/10">
                <span className="text-[10px] uppercase tracking-widest text-fuchsia-400/60 mb-1">Final Distance</span>
                <span className="text-3xl font-bold">{score}m</span>
              </div>
              <div className="flex flex-col items-center p-4 bg-white/5 rounded-xl border border-white/10">
                <span className="text-[10px] uppercase tracking-widest text-cyan-400/60 mb-1">Personal Best</span>
                <span className="text-3xl font-bold">{highScore}m</span>
              </div>
            </div>

            <button 
              onClick={startGame}
              className="group relative overflow-hidden bg-fuchsia-500 hover:bg-fuchsia-400 text-black font-bold py-4 px-12 rounded-lg transition-all flex items-center justify-center gap-3 w-full"
            >
              <span className="text-lg uppercase tracking-widest">Reboot System</span>
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
