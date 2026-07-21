import { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/runtime-client';

type AnswerMap = Record<string, string>;

type DiagnosticResult = {
  norteEstrategico: string;
  diagnostico: {
    fortalezas: string[];
    riesgos: string[];
    oportunidades: string[];
  };
  plan: string[];
  meta?: {
    source: 'ai' | 'rules' | 'local';
    note?: string;
  };
};

const questions = [
  { id: 1, text: 'Cual es el nombre o identidad de tu proyecto o empresa?', key: 'identidad' },
  { id: 2, text: 'Cual es el objetivo principal que quieres lograr en los proximos 90 dias?', key: 'objetivo90' },
  { id: 3, text: 'A quien va dirigido tu producto o servicio?', key: 'audiencia' },
  { id: 4, text: 'Que problema especifico resuelves y por que es importante?', key: 'problema' },
  { id: 5, text: 'Con que recursos cuentas hoy? Piensa en equipo, tecnologia y presupuesto.', key: 'recursos' },
  { id: 6, text: 'Cual es el mayor obstaculo que enfrentas ahora?', key: 'obstaculo' },
  { id: 7, text: 'Que metricas o indicadores usarias para medir exito?', key: 'metricas' },
  { id: 8, text: 'Tienes competencia directa? Como te diferencias?', key: 'competencia' },
  { id: 9, text: 'Cual es tu presupuesto estimado para los proximos 3 meses?', key: 'presupuesto' },
  { id: 10, text: 'Tienes una fecha limite o hitos definidos?', key: 'plazo' },
] as const;

const buildFallbackResult = (answers: AnswerMap, note?: string): DiagnosticResult => {
  const combinedText = Object.values(answers).join(' ').toLowerCase();
  const hasBudget = Boolean(answers.presupuesto?.trim());
  const hasDeadline = Boolean(answers.plazo?.trim());

  return {
    norteEstrategico:
      'Enfocarte en validar una oferta concreta, convertir el objetivo en una meta de 90 dias y llegar a una primera senal comercial medible.',
    diagnostico: {
      fortalezas: [
        answers.identidad
          ? `El proyecto ya tiene una identidad reconocible: ${answers.identidad}.`
          : 'Ya existe contexto suficiente para tomar una decision inicial.',
        hasDeadline
          ? `Hay urgencia y marco temporal para priorizar: ${answers.plazo}.`
          : 'Todavia hay margen para ordenar prioridades antes de escalar.',
      ],
      riesgos: [
        hasBudget
          ? 'El presupuesto ya esta explicitado y permite planificar ejecucion.'
          : 'Conviene definir presupuesto y margen de prueba antes de acelerar.',
        combinedText.includes('obstac') || combinedText.includes('complic')
          ? 'Hay friccion operativa y conviene resolver el cuello de botella principal primero.'
          : 'Todavia falta validar con mas precision el mayor riesgo de ejecucion.',
      ],
      oportunidades: [
        'Convertir el problema principal en una propuesta simple y vendible.',
        'Lanzar una version minima, medir respuesta real y ajustar con evidencia.',
      ],
    },
    plan: [
      '1. Definir una promesa central y una oferta facil de explicar.',
      '2. Traducir el objetivo de 90 dias a una metrica lider con fecha.',
      '3. Lanzar un experimento pequeno con usuarios reales.',
      '4. Medir aprendizaje, corregir foco y decidir la siguiente inversion.',
    ],
    meta: {
      source: 'local',
      note,
    },
  };
};

const isDiagnosticResult = (value: unknown): value is DiagnosticResult => {
  if (!value || typeof value !== 'object') return false;

  const candidate = value as DiagnosticResult;
  return (
    typeof candidate.norteEstrategico === 'string' &&
    Array.isArray(candidate.plan) &&
    Array.isArray(candidate.diagnostico?.fortalezas) &&
    Array.isArray(candidate.diagnostico?.riesgos) &&
    Array.isArray(candidate.diagnostico?.oportunidades)
  );
};

export default function Diagnostico() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const saveAnswer = () => {
    if (!currentAnswer.trim()) {
      setError('Por favor, escribe una respuesta antes de continuar.');
      return;
    }

    const question = questions[step - 1];
    const nextAnswers = { ...answers, [question.key]: currentAnswer.trim() };

    setError('');
    setAnswers(nextAnswers);
    setCurrentAnswer('');

    if (step < questions.length) {
      setStep((currentStep) => currentStep + 1);
      return;
    }

    void submitDiagnostic(nextAnswers);
  };

  const submitDiagnostic = async (payload: AnswerMap) => {
    setIsLoading(true);
    setError('');
    setNotice('');

    try {
      const { data, error: functionError } = await supabase.functions.invoke<DiagnosticResult>('diagnostico', {
        body: { respuestas: payload },
      });

      if (functionError) {
        throw functionError;
      }

      if (!isDiagnosticResult(data)) {
        throw new Error('La Edge Function devolvio un formato invalido.');
      }

      setResult(data);
      setStep(11);

      if (data.meta?.source && data.meta.source !== 'ai') {
        setNotice(data.meta.note || 'El diagnostico se genero con el motor estrategico base.');
      }
    } catch (submissionError: unknown) {
      const message = submissionError instanceof Error ? submissionError.message : 'error desconocido';
      const fallback = buildFallbackResult(
        payload,
        'No se pudo completar el analisis remoto. Se mostro un diagnostico local para no cortar el flujo.',
      );

      setResult(fallback);
      setStep(11);
      setNotice(`No se pudo usar la Edge Function. Detalle: ${message}.`);
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black/90 p-4">
        <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-xl">
          <h1 className="text-4xl font-bold text-cyan-200">Diagnostico Estrategico</h1>
          <p className="mt-4 text-white/70">
            Responde 10 preguntas clave y recibe un plan de accion claro en pocos minutos.
          </p>
          <button
            onClick={() => setStep(1)}
            className="mt-8 rounded-xl border border-cyan-400/50 bg-cyan-400/20 px-8 py-3 text-white transition hover:bg-cyan-400/30"
          >
            Comenzar diagnostico
          </button>
        </div>
      </div>
    );
  }

  if (step === 11) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black/90 p-4">
        <div className="w-full max-w-4xl rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
          <h2 className="text-3xl font-bold text-cyan-200">Diagnostico completo</h2>
          {notice && <p className="mt-4 text-sm text-yellow-300">{notice}</p>}
          {result && (
            <div className="prose prose-invert mt-6 max-w-none space-y-4 text-white/90">
              <p>
                <strong>Norte estrategico:</strong> {result.norteEstrategico}
              </p>
              <div>
                <p>
                  <strong>Lectura del negocio</strong>
                </p>
                <p className="mb-2">
                  <strong>Fortalezas</strong>
                </p>
                <ul>
                  {result.diagnostico.fortalezas.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <p className="mb-2">
                  <strong>Riesgos</strong>
                </p>
                <ul>
                  {result.diagnostico.riesgos.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <p className="mb-2">
                  <strong>Oportunidades</strong>
                </p>
                <ul>
                  {result.diagnostico.oportunidades.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p>
                  <strong>Plan sugerido</strong>
                </p>
                <ul>
                  {result.plan.map((item) => (
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

  const question = questions[step - 1];

  return (
    <div className="flex min-h-screen items-center justify-center bg-black/90 p-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl"
      >
        <div className="mb-4 flex justify-between text-sm text-white/50">
          <span>Pregunta {step} de 10</span>
          <span>{Math.round((step / 10) * 100)}% completado</span>
        </div>
        <div className="mb-6 h-1.5 w-full rounded-full bg-white/10">
          <div
            className="h-1.5 rounded-full bg-cyan-400 transition-all duration-300"
            style={{ width: `${(step / 10) * 100}%` }}
          />
        </div>
        <h3 className="text-xl font-semibold text-white">{question.text}</h3>
        <textarea
          value={currentAnswer}
          onChange={(event) => setCurrentAnswer(event.target.value)}
          className="mt-4 w-full resize-none rounded-xl border border-white/10 bg-black/40 p-4 text-white focus:border-cyan-400 focus:outline-none"
          rows={4}
          placeholder="Escribe tu respuesta aqui..."
        />
        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
        <div className="mt-6 flex justify-end">
          <button
            onClick={saveAnswer}
            disabled={isLoading}
            className="rounded-xl border border-cyan-400/50 bg-cyan-400/20 px-8 py-2 text-white hover:bg-cyan-400/30 disabled:opacity-50"
          >
            {isLoading ? 'Procesando...' : step < 10 ? 'Siguiente ->' : 'Generar plan ->'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
