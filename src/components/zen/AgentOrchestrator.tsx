import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { AgentWindow } from './AgentWindow';

interface AgentOrchestratorProps {
  command: string | null;
  onComplete: () => void;
}

type Phase = 'idle' | 'master' | 'transition' | 'specialist' | 'complete';

const masterMessages = [
  'Analizando contexto de tu solicitud...',
  'Refinando el prompt para mayor precisión...',
  'Procesando parámetros semánticos...',
  'Optimizando la ruta de respuesta...',
];

const specialistResponses: Record<string, string> = {
  default: 'He procesado tu solicitud. El análisis muestra resultados positivos con una eficiencia del 98.7%. ¿Necesitas más detalles?',
  metricas: 'Las métricas actuales indican: Velocidad Operativa 2.4x, Carga Cognitiva optimizada al 23%, SLA en 99.8%. Todo dentro de parámetros óptimos.',
  tareas: 'He organizado las tareas pendientes por prioridad. Tienes 3 críticas, 5 medias y 12 bajas. ¿Quieres que procese alguna específica?',
  ayuda: 'Puedo asistirte con métricas, tareas, análisis de datos, configuración del sistema y mucho más. Solo pregunta.',
  estado: 'Todos los sistemas operativos. Latencia: 12ms. Uptime: 99.99%. Capacidad de procesamiento disponible: 78%.',
};

export const AgentOrchestrator = ({ command, onComplete }: AgentOrchestratorProps) => {
  const [phase, setPhase] = useState<Phase>('idle');
  const [masterMessage, setMasterMessage] = useState('');
  const [specialistMessage, setSpecialistMessage] = useState('');
  const [specialistColor, setSpecialistColor] = useState<'pink' | 'green'>('pink');

  const getSpecialistResponse = useCallback((cmd: string): string => {
    const lowerCmd = cmd.toLowerCase();
    if (lowerCmd.includes('métrica') || lowerCmd.includes('metrica')) {
      return specialistResponses.metricas;
    }
    if (lowerCmd.includes('tarea')) {
      return specialistResponses.tareas;
    }
    if (lowerCmd.includes('ayuda') || lowerCmd.includes('help')) {
      return specialistResponses.ayuda;
    }
    if (lowerCmd.includes('estado') || lowerCmd.includes('status')) {
      return specialistResponses.estado;
    }
    return `Procesando: "${cmd}". ${specialistResponses.default}`;
  }, []);

  useEffect(() => {
    if (!command) {
      setPhase('idle');
      return;
    }

    // Start the orchestration
    setPhase('master');
    setMasterMessage(masterMessages[Math.floor(Math.random() * masterMessages.length)]);
    setSpecialistColor(Math.random() > 0.5 ? 'pink' : 'green');

    // Transition to specialist after 2.5s
    const transitionTimer = setTimeout(() => {
      setPhase('transition');
      setSpecialistMessage(getSpecialistResponse(command));
    }, 2500);

    // Show specialist after brief transition
    const specialistTimer = setTimeout(() => {
      setPhase('specialist');
    }, 3000);

    // Auto-complete after 8s
    const completeTimer = setTimeout(() => {
      setPhase('complete');
      onComplete();
    }, 8000);

    return () => {
      clearTimeout(transitionTimer);
      clearTimeout(specialistTimer);
      clearTimeout(completeTimer);
    };
  }, [command, getSpecialistResponse, onComplete]);

  const handleClick = () => {
    if (phase === 'specialist' || phase === 'complete') {
      setPhase('idle');
      onComplete();
    }
  };

  if (phase === 'idle') return null;

  return (
    <div 
      className="perspective-container flex flex-col items-center justify-center gap-6 cursor-pointer"
      onClick={handleClick}
      style={{ perspective: '1500px' }}
    >
      <AnimatePresence mode="sync">
        {/* Master Agent */}
        {(phase === 'master' || phase === 'transition' || phase === 'specialist') && (
          <AgentWindow
            key="master"
            type="master"
            message={masterMessage}
            isVisible={phase === 'master'}
            position={phase === 'transition' || phase === 'specialist' ? 'shifted' : 'center'}
          />
        )}

        {/* Specialist Agent */}
        {(phase === 'transition' || phase === 'specialist') && (
          <AgentWindow
            key="specialist"
            type="specialist"
            message={specialistMessage}
            isVisible={phase === 'specialist'}
            specialistColor={specialistColor}
          />
        )}
      </AnimatePresence>

      {phase === 'specialist' && (
        <p className="text-muted-foreground/40 text-sm animate-pulse">
          Clic para continuar
        </p>
      )}
    </div>
  );
};
