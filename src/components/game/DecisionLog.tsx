import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { callAI } from '../../utils/ai';
import { CornerBrackets } from './StartScreen';
import { Brain, AlertCircle, Sparkles, Loader2 } from 'lucide-react';

function sanitizeAIResponse(raw: string): string {
  let text = raw.trim();

  // Strip markdown code blocks (```json ... ``` or ``` ... ```)
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    text = codeBlockMatch[1].trim();
  }

  // Try JSON parse
  try {
    const parsed = JSON.parse(text);
    if (parsed.message && typeof parsed.message === 'string') {
      return parsed.message.trim();
    }
    // Try other common fields
    if (parsed.response && typeof parsed.response === 'string') {
      return parsed.response.trim();
    }
    if (parsed.text && typeof parsed.text === 'string') {
      return parsed.text.trim();
    }
    // If it's a JSON object but no known field, return empty
    if (typeof parsed === 'object' && parsed !== null) {
      const values = Object.values(parsed).filter(v => typeof v === 'string' && v.length > 10);
      if (values.length > 0) return (values[0] as string).trim();
    }
  } catch {
    // Not JSON at all
  }

  // Strip any remaining JSON-like fragments or prompt leakage
  // Remove lines that look like system prompts or API artifacts
  const lines = text.split('\n').filter(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith('"role"') || trimmed.startsWith('"system"') || trimmed.startsWith('"content"')) return false;
    if (trimmed.startsWith('```') || trimmed.startsWith('---')) return false;
    if (/^(system|user|assistant)\s*:/i.test(trimmed)) return false;
    return trimmed.length > 0;
  });

  const cleaned = lines.join('\n').trim();

  // If nothing useful left, return a generic fallback
  if (!cleaned || cleaned.length < 5) {
    return 'El piloto tiene un estilo... interesante. La IA se quedó sin palabras.';
  }

  return cleaned;
}

export const DecisionLog = () => {
  const modifierChoices = useGameStore((s) => s.modifierChoices);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (modifierChoices.length === 0) return;

    const getAnalysis = async () => {
      setLoading(true);
      setError(null);
      try {
        const choicesSummary = modifierChoices.map(c => 
          `A los ${c.score}m: Elegido "${c.chosen.name}" sobre [${c.options.filter(o => o.id !== c.chosen.id).map(o => o.name).join(', ')}]`
        ).join('\n');

        const systemPrompt = `Eres un supervisor de IA cínico y cyberpunk. 
        Analiza el perfil de riesgo del jugador basándote en sus elecciones de modificadores en un juego de neon-runner. 
        ¿Eligió el camino fácil ("Nada") o buscó la adrenalina con desafíos difíciles? 
        Sé profundo, filosófico, pero también burlón y breve. 
        Céntrate en su estrategia de juego y su valor como piloto, no en su vida personal real.
        Responde SIEMPRE en español.
        Devuelve ÚNICAMENTE un objeto JSON con un campo "message" que contenga tu análisis.`;

        const userMessage = `El usuario tomó las siguientes decisiones durante su carrera:\n${choicesSummary}\n\nProporciona el análisis filosófico/burlón.`;

        // Use 'ollama' as apiKey if needed, here we pass null as baseUrl handles it
        const response = await callAI(null, systemPrompt, userMessage, true);
        
        // Robust parsing: handle JSON in code blocks, raw JSON, or extract message field
        let extracted = sanitizeAIResponse(response);
        setAnalysis(extracted);
      } catch (err) {
        console.error('AI Analysis Error:', err);
        setError('Failed to sync with neural link.');
      } finally {
        setLoading(false);
      }
    };

    getAnalysis();
  }, [modifierChoices]);

  // Case: No choices made
  if (modifierChoices.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
        className="relative w-full p-6 rounded-xl border border-red-500/20 bg-red-500/5 mt-4"
      >
        <CornerBrackets color="#ef4444" size={12} />
        <div className="flex items-center gap-3 mb-2 text-red-400">
          <AlertCircle size={16} />
          <span className="text-[10px] font-black uppercase tracking-[0.3em]">System Report</span>
        </div>
        <p className="text-[11px] font-mono leading-relaxed text-red-200/70 italic">
          "No se han capturado datos. Tus señales neuronales son tan planas como tu rendimiento. Vuelve y aprende a jugar antes de desperdiciar mis ciclos de procesamiento de nuevo."
        </p>
      </motion.div>
    );
  }

  return (
    <div className="relative w-full mt-4 flex flex-col gap-2 min-h-32">
      <div className="flex items-center gap-2 mb-1">
        <Brain size={12} className="text-fuchsia-500/70" />
        <span className="text-[9px] font-black uppercase tracking-[0.4em] text-fuchsia-500/50">Análisis Neuronal</span>
      </div>

      <div 
        className="relative w-full p-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden"
      >
        <CornerBrackets color={loading ? "#0891b2" : "#9333ea"} size={10} />
        
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-4 gap-3"
            >
              <div className="flex items-center gap-2 text-cyan-600/70">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-[10px] font-mono animate-pulse uppercase tracking-widest text-center">Pensando porque fallaste...</span>
              </div>
            </motion.div>
          ) : error ? (
            <motion.div 
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 text-red-500/80 py-2"
            >
              <AlertCircle size={14} />
              <span className="text-[10px] font-mono uppercase tracking-widest">{error}</span>
            </motion.div>
          ) : (
            <motion.div 
              key="content"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative"
            >
              <Sparkles size={12} className="absolute -top-1 -right-1 text-fuchsia-500/30" />
              <p className="text-[11px] font-mono leading-relaxed text-white/70 italic">
                "{analysis}"
              </p>
              <div className="mt-3 pt-2 border-t border-white/5 flex justify-end">
                <span className="text-[7px] text-white/20 uppercase tracking-[0.3em]">AI_ANALYSIS_COMPLETE</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
