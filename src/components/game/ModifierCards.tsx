
import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGameStore } from '../../store/gameStore';

export const ModifierCards = () => {
  const showSelection = useGameStore((s) => s.showSelection);
  const selectionOptions = useGameStore((s) => s.selectionOptions);
  const selectionTimer = useGameStore((s) => s.selectionTimer);
  const selectModifier = useGameStore((s) => s.selectModifier);
  const modifierApplyCountdown = useGameStore((s) => s.modifierApplyCountdown);
  const pendingModifier = useGameStore((s) => s.pendingModifier);

  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (showSelection) {
      timerRef.current = window.setInterval(() => {
        const state = useGameStore.getState();
        if (!state.showSelection) {
          if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
          return;
        }
        const newTimer = (state.selectionTimer ?? 10) - 1;
        if (newTimer <= 0) {
          if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
          const randomIndex = Math.floor(Math.random() * state.selectionOptions.length);
          state.selectModifier(randomIndex);
        } else {
          useGameStore.setState({ selectionTimer: newTimer });
        }
      }, 1000);
    }
    return () => {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    };
  }, [showSelection]);

  const countdownColor = pendingModifier?.color ?? '#00ffff';

  return (
    <AnimatePresence>
      {showSelection && selectionOptions.length === 3 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="pointer-events-auto absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center gap-8 z-[160]"
        >
          <div className="flex flex-col items-center gap-2">
            <h2 className="text-4xl font-black tracking-tighter italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-500 uppercase">
              Elige un modificador
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-cyan-400/60 text-sm tracking-widest uppercase">Tiempo restante</span>
              <motion.span
                key={selectionTimer}
                initial={{ scale: 1.3 }}
                animate={{ scale: 1 }}
                className="text-3xl font-black text-cyan-400"
              >
                {selectionTimer ?? 10}s
              </motion.span>
            </div>
          </div>

          <motion.div
            key="card-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex gap-6"
          >
            {selectionOptions.map((mod, index) => (
              <motion.button
                key={mod.id}
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15 + index * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => selectModifier(index)}
                className="group relative flex flex-col items-center gap-4 w-56 p-6 rounded-2xl border-2 bg-black/60 backdrop-blur-sm transition-colors cursor-pointer overflow-hidden"
                style={{
                  borderColor: mod.color + '80',
                  boxShadow: `0 0 40px ${mod.color}25`,
                }}
              >
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: `radial-gradient(circle at center, ${mod.color}15, transparent 70%)` }}
                />

                <div className="relative flex items-center gap-3">
                  <span
                    className="text-5xl font-black"
                    style={{ color: mod.color }}
                  >
                    x{mod.multiplier}
                  </span>
                </div>

                <div className="relative flex flex-col items-center gap-1">
                  <span className="text-white font-bold text-lg">{mod.name}</span>
                  <span className="text-white/40 text-xs text-center leading-relaxed">{mod.description}</span>
                </div>

                <div
                  className="absolute bottom-0 left-0 right-0 h-1 opacity-60"
                  style={{ backgroundColor: mod.color }}
                />
              </motion.button>
            ))}
          </motion.div>
        </motion.div>
      ) : null}

      <AnimatePresence>
        {modifierApplyCountdown ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-4 z-[170]"
          >
            <motion.span
              key={modifierApplyCountdown}
              initial={{ scale: 2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="text-9xl font-black"
              style={{
                color: countdownColor,
                textShadow: `0 0 60px ${countdownColor}80, 0 0 120px ${countdownColor}40`,
              }}
            >
              {modifierApplyCountdown}
            </motion.span>
            <span className="text-white/50 text-lg tracking-widest uppercase">
              Preparando modificador...
            </span>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </AnimatePresence>
  );
};
