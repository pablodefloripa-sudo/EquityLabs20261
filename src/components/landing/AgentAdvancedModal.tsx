import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
  open: boolean;
  onClose: () => void;
  agentName: string;
  proModels: string[];
}

const CAPABILITIES = [
  {
    title: 'Innovación Avanzada',
    desc: 'Genera soluciones únicas fusionando enfoques globales según tus recursos, preferencias y restricciones.',
  },
  {
    title: 'Optimización Económica y Sostenible',
    desc: 'Analiza datos en tiempo real para minimizar desperdicio y maximizar margen y resultados.',
  },
  {
    title: 'Planes Personalizados Inteligentes',
    desc: 'Crea planes completos por persona o negocio con cálculo automático de costos y métricas clave.',
  },
  {
    title: 'Asesoría Estratégica',
    desc: 'Estrategias de pricing, posicionamiento, propuestas estacionales y diferenciación competitiva.',
  },
  {
    title: 'Experiencias Premium',
    desc: 'Diseño para eventos, contenido de redes y experiencias de alto impacto con storytelling.',
  },
  {
    title: 'Asistente 24/7',
    desc: 'Te acompaña en tiempo real (voz o chat) con ajustes instantáneos según el contexto.',
  },
];

const BENEFITS = [
  'Ahorro promedio de 12-18 horas por mes en planificación',
  'Reducción de desperdicio hasta 40%',
  'Aumento de creatividad y diferenciación de marca',
];

export const AgentAdvancedModal = ({ open, onClose, agentName, proModels }: Props) => {
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 30 }}
            transition={{ type: 'spring', damping: 22 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-cyan-400/30 bg-black/90"
            style={{ boxShadow: '0 0 60px rgba(34,211,238,0.25), inset 0 0 40px rgba(34,211,238,0.05)' }}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:border-cyan-400/50 transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="p-8 md:p-10">
              {/* Header */}
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-400/40 bg-cyan-400/5 mb-4">
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  <span className="text-[10px] font-bold tracking-widest text-cyan-400">EQUITYLABS ADVANCED</span>
                </div>
                <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-2">
                  {agentName} <span className="text-cyan-400">— Advanced</span>
                </h2>
                <p className="text-base text-cyan-100/90 mb-3">
                  Tu IA multimodelo que transforma tu negocio y experiencia 24/7.
                </p>
                <p className="text-sm text-white/60 leading-relaxed">
                  EquityLabs Advanced activa la versión completa del agente con orquestación de múltiples
                  modelos premium trabajando en conjunto. No es solo una IA… es un equipo de especialistas
                  impulsado por IA.
                </p>
              </div>

              {/* Models */}
              <div className="mb-6 rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-4">
                <div className="text-[10px] font-bold tracking-widest text-cyan-400 mb-2">
                  MODELOS UTILIZADOS EN ADVANCED
                </div>
                <div className="flex flex-wrap gap-2">
                  {proModels.map((m) => (
                    <span
                      key={m}
                      className="px-2.5 py-1 rounded-md bg-black/50 border border-cyan-400/30 text-cyan-200 text-xs font-mono"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>

              {/* Capabilities */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <Star className="w-4 h-4 text-cyan-400" />
                  <h3 className="font-display text-lg font-bold text-white">6 Poderosas Capacidades</h3>
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  {CAPABILITIES.map((c, i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-white/10 bg-white/[0.02] p-3 hover:border-cyan-400/30 transition-colors"
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-cyan-400 font-bold text-sm shrink-0">0{i + 1}</span>
                        <div>
                          <div className="text-sm font-bold text-white mb-1">{c.title}</div>
                          <div className="text-xs text-white/60 leading-relaxed">{c.desc}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Benefits */}
              <div className="mb-8 rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-4">
                <div className="text-[10px] font-bold tracking-widest text-emerald-400 mb-3">
                  BENEFICIOS CUANTIFICABLES
                </div>
                <ul className="space-y-2">
                  {BENEFITS.map((b, i) => (
                    <li key={i} className="flex gap-2 text-sm text-white/80">
                      <span className="text-emerald-400">✓</span>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => navigate('/auth')}
                  className="flex-1 py-3.5 rounded-lg text-sm font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 hover:bg-emerald-500/30 transition-all"
                >
                  Activar 30 Días Trial Gratis
                </button>
                <button
                  onClick={() => navigate('/suscripciones')}
                  className="flex-1 py-3.5 rounded-lg text-sm font-bold uppercase tracking-wider bg-black border border-cyan-400/60 text-cyan-300 hover:border-cyan-300 hover:text-cyan-200 transition-all"
                  style={{ boxShadow: '0 0 20px rgba(34,211,238,0.3)' }}
                >
                  Ver Todos los Planes
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
