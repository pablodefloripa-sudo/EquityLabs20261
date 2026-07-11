import { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/runtime-client';

type AnswerMap = Record<string, string>;

const preguntas = [
  { id: 1, texto: '¿Cuál es el nombre o identidad de tu proyecto/empresa?', clave: 'identidad' },
  { id: 2, texto: '¿Cuál es el objetivo principal que quieres lograr en los próximos 90 días?', clave: 'objetivo90' },
  { id: 3, texto: '¿A quién va dirigido tu producto o servicio? (describe tu audiencia objetivo)', clave: 'audiencia' },
  { id: 4, texto: '¿Qué problema específico resuelves y por qué es importante?', clave: 'problema' },
  { id: 5, texto: '¿Con qué recursos cuentas actualmente? (humanos, técnicos, financieros)', clave: 'recursos' },
  { id: 6, texto: '¿Cuál es el mayor obstáculo que enfrentas ahora?', clave: 'obstaculo' },
  { id: 7, texto: '¿Qué métricas o indicadores consideras clave para medir el éxito de tu proyecto?', clave: 'metricas' },
  { id: 8, texto: '¿Tienes competencia directa? ¿Cómo te diferencias de ellos?', clave: 'competencia' },
  { id: 9, texto: '¿Cuál es tu presupuesto estimado para los próximos 3 meses?', clave: 'presupuesto' },
  { id: 10, texto: '¿Tienes una fecha límite o hitos definidos? (ej: lanzamiento en 30 días, meta de usuarios en 3 meses)', clave: 'plazo' },
] as const;

const buildFallbackResult = (respuestas: AnswerMap) => {
  const texto = Object.values(respuestas).join(' ').toLowerCase();
  const tienePresupuesto = Boolean(respuestas.presupuesto?.trim());
  const tienePlazo = Boolean(respuestas.plazo?.trim());

  return {
    norteEstrategico: `Enfocarte en validar el producto y llegar al lanzamiento en 48 horas con una propuesta simple, medible y vendible.`,
    diagnostico: {
      fortalezas: [
        respuestas.identidad ? `El proyecto ya tiene identidad definida: ${respuestas.identidad}` : 'Ya completaste el diagnóstico con suficiente contexto para decidir.',
        tienePlazo ? `Existe una urgencia clara: ${respuestas.plazo}` : 'Tienes foco temporal para priorizar.',
      ],
      riesgos: [
        tienePresupuesto ? 'El presupuesto está definido para planificar ejecución.' : 'Conviene definir presupuesto antes de escalar.',
        texto.includes('complic') || texto.includes('obstac') ? 'Hay fricción operativa que conviene resolver primero.' : 'Hay que validar el principal obstáculo con más detalle.',
      ],
      oportunidades: [
        'Construir un MVP mínimo y lanzar rápido.',
        'Medir respuesta real del mercado antes de invertir más.',
      ],
    },
    plan: [
      '1. Definir una oferta única y simple.',
      '2. Preparar landing o mensaje de venta.',
      '3. Lanzar una versión mínima.',
      '4. Medir interés y ajustar.',
    ],
  };
};

export default function Diagnostico() {
  const [paso, setPaso] = useState(0);
  const [respuestas, setRespuestas] = useState<AnswerMap>({});
  const [respuestaActual, setRespuestaActual] = useState('');
  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState<any>(null);
  const [error, setError] = useState('');

  const guardarRespuesta = () => {
    if (!respuestaActual.trim()) {
      setError('Por favor, escribe una respuesta antes de continuar.');
      return;
    }

    const pregunta = preguntas[paso - 1];
    setError('');
    setRespuestas((prev) => ({ ...prev, [pregunta.clave]: respuestaActual.trim() }));
    setRespuestaActual('');

    if (paso < preguntas.length) {
      setPaso((prev) => prev + 1);
    } else {
      void enviarDiagnostico({ ...respuestas, [pregunta.clave]: respuestaActual.trim() });
    }
  };

  const enviarDiagnostico = async (payload: AnswerMap) => {
    setCargando(true);
    setError('');

    try {
      const { data, error: fnError } = await supabase.functions.invoke('diagnostico', {
        body: { respuestas: payload },
      });

      if (fnError) {
        throw fnError;
      }

      if (!data) {
        throw new Error('La función no devolvió datos.');
      }

      setResultado(data);
      setPaso(11);
    } catch (err: any) {
      setResultado(buildFallbackResult(payload));
      setPaso(11);
      setError(`No se pudo enviar a la Edge Function. Usé un fallback local: ${err?.message || 'error desconocido'}`);
    } finally {
      setCargando(false);
    }
  };

  if (paso === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black/90 p-4">
        <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-xl">
          <h1 className="text-4xl font-bold text-cyan-200">Diagnóstico Estratégico</h1>
          <p className="mt-4 text-white/70">
            Responde 10 preguntas clave y obtén un plan de acción personalizado en menos de 3 minutos.
          </p>
          <button
            onClick={() => setPaso(1)}
            className="mt-8 rounded-xl border border-cyan-400/50 bg-cyan-400/20 px-8 py-3 text-white transition hover:bg-cyan-400/30"
          >
            Comenzar diagnóstico
          </button>
        </div>
      </div>
    );
  }

  if (paso === 11) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black/90 p-4">
        <div className="w-full max-w-4xl rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
          <h2 className="text-3xl font-bold text-cyan-200">¡Diagnóstico completo!</h2>
          {error && <p className="mt-4 text-sm text-yellow-300">{error}</p>}
          {resultado && (
            <div className="prose prose-invert mt-6 max-w-none space-y-4 text-white/90">
              <p>
                <strong>🎯 Norte Estratégico:</strong> {resultado.norteEstrategico}
              </p>
              <div>
                <p>
                  <strong>📊 FODA:</strong>
                </p>
                <p className="mb-2"><strong>Fortalezas</strong></p>
                <ul>
                  {resultado.diagnostico.fortalezas.map((item: string) => (
                    <li key={item}>✅ {item}</li>
                  ))}
                </ul>
                <p className="mb-2"><strong>Riesgos</strong></p>
                <ul>
                  {resultado.diagnostico.riesgos.map((item: string) => (
                    <li key={item}>⚠️ {item}</li>
                  ))}
                </ul>
                <p className="mb-2"><strong>Oportunidades</strong></p>
                <ul>
                  {resultado.diagnostico.oportunidades.map((item: string) => (
                    <li key={item}>🚀 {item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p>
                  <strong>Plan sugerido</strong>
                </p>
                <ul>
                  {resultado.plan.map((item: string) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          <button
            onClick={() => window.location.reload()}
            className="mt-8 rounded-xl border border-cyan-400/50 bg-cyan-400/20 px-6 py-2 text-white hover:bg-cyan-400/30"
          >
            Reiniciar
          </button>
        </div>
      </div>
    );
  }

  const pregunta = preguntas[paso - 1];

  return (
    <div className="flex min-h-screen items-center justify-center bg-black/90 p-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl"
      >
        <div className="mb-4 flex justify-between text-sm text-white/50">
          <span>Pregunta {paso} de 10</span>
          <span>{Math.round((paso / 10) * 100)}% completado</span>
        </div>
        <div className="mb-6 h-1.5 w-full rounded-full bg-white/10">
          <div className="h-1.5 rounded-full bg-cyan-400 transition-all duration-300" style={{ width: `${(paso / 10) * 100}%` }} />
        </div>
        <h3 className="text-xl font-semibold text-white">{pregunta.texto}</h3>
        <textarea
          value={respuestaActual}
          onChange={(e) => setRespuestaActual(e.target.value)}
          className="mt-4 w-full resize-none rounded-xl border border-white/10 bg-black/40 p-4 text-white focus:border-cyan-400 focus:outline-none"
          rows={4}
          placeholder="Escribe tu respuesta aquí..."
        />
        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
        <div className="mt-6 flex justify-end">
          <button
            onClick={guardarRespuesta}
            disabled={cargando}
            className="rounded-xl border border-cyan-400/50 bg-cyan-400/20 px-8 py-2 text-white hover:bg-cyan-400/30 disabled:opacity-50"
          >
            {cargando ? 'Procesando...' : paso < 10 ? 'Siguiente →' : 'Generar plan →'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
