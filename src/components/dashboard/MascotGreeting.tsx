import { motion } from 'framer-motion';
import { useLanguage } from '@/hooks/useLanguage';

interface MascotGreetingProps {
  onPickTask?: (task: string) => void;
}

const JackRussell = () => (
  // Stylized SVG of a Jack Russell Terrier (white & tan), with gentle tail wag
  <svg viewBox="0 0 220 180" className="w-32 h-28">
    <defs>
      <radialGradient id="bodyG" cx="50%" cy="40%" r="60%">
        <stop offset="0%" stopColor="#fafafa" />
        <stop offset="100%" stopColor="#d8d4cc" />
      </radialGradient>
    </defs>
    {/* tail (wagging) */}
    <motion.g
      style={{ originX: '170px', originY: '95px' }}
      animate={{ rotate: [-15, 25, -15] }}
      transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut' }}
    >
      <path d="M165 95 q20 -25 28 -8 q-12 8 -22 18 z" fill="url(#bodyG)" stroke="#a89b85" strokeWidth="1" />
    </motion.g>
    {/* body */}
    <ellipse cx="110" cy="115" rx="55" ry="32" fill="url(#bodyG)" stroke="#a89b85" strokeWidth="1.2" />
    {/* tan patch on back */}
    <path d="M85 95 q25 -18 55 5 q-10 12 -30 12 q-18 0 -25 -17z" fill="#c89567" opacity="0.85" />
    {/* legs */}
    <rect x="78" y="138" width="10" height="22" rx="4" fill="url(#bodyG)" stroke="#a89b85" strokeWidth="0.8" />
    <rect x="132" y="138" width="10" height="22" rx="4" fill="url(#bodyG)" stroke="#a89b85" strokeWidth="0.8" />
    {/* head */}
    <ellipse cx="60" cy="80" rx="34" ry="30" fill="url(#bodyG)" stroke="#a89b85" strokeWidth="1.2" />
    {/* tan ears + face mask */}
    <path d="M40 55 q-8 18 4 32 q8 -6 8 -22 z" fill="#c89567" />
    <path d="M82 55 q10 16 0 34 q-10 -8 -10 -22 z" fill="#c89567" />
    <path d="M45 78 q15 -14 32 0 q-4 18 -16 18 q-12 0 -16 -18z" fill="#c89567" opacity="0.7" />
    {/* snout */}
    <ellipse cx="38" cy="92" rx="14" ry="10" fill="#fafafa" stroke="#a89b85" strokeWidth="0.8" />
    {/* nose */}
    <ellipse cx="27" cy="89" rx="4" ry="3" fill="#1a1a1a" />
    {/* eyes */}
    <motion.circle cx="55" cy="78" r="2.6" fill="#1a1a1a"
      animate={{ scaleY: [1, 0.1, 1] }} transition={{ duration: 0.25, repeat: Infinity, repeatDelay: 3 }} />
    <motion.circle cx="72" cy="78" r="2.6" fill="#1a1a1a"
      animate={{ scaleY: [1, 0.1, 1] }} transition={{ duration: 0.25, repeat: Infinity, repeatDelay: 3 }} />
    {/* mouth */}
    <path d="M30 96 q6 6 14 4" stroke="#1a1a1a" strokeWidth="1.2" fill="none" strokeLinecap="round" />
    <path d="M27 92 q-3 6 2 9" stroke="#1a1a1a" strokeWidth="1" fill="none" strokeLinecap="round" />
  </svg>
);

export const MascotGreeting = ({ onPickTask }: MascotGreetingProps) => {
  const { language } = useLanguage();

  type Lang = 'es' | 'en' | 'pt' | 'fr' | 'de' | 'it' | 'zh' | 'ja';
  const lang = (['es','en','pt','fr','de','it','zh','ja'].includes(language) ? language : 'es') as Lang;

  const copy: Record<Lang, { hello: string; intro: string; tasks: string[] }> = {
    es: {
      hello: '¡Hola! Soy Pip, tu Jack Russell.',
      intro: 'Te propongo tres tareas para hoy:',
      tasks: [
        'Revisar las métricas del proyecto',
        'Generar un reporte ejecutivo',
        'Iniciar una misión de Foco (20 min)',
      ],
    },
    en: { hello: 'Hi! I\'m Pip, your Jack Russell.', intro: 'Here are three tasks for today:',
      tasks: ['Review project metrics', 'Generate an executive report', 'Start a Focus mission (20 min)'] },
    pt: { hello: 'Olá! Sou o Pip, seu Jack Russell.', intro: 'Proponho três tarefas para hoje:',
      tasks: ['Revisar as métricas do projeto', 'Gerar um relatório executivo', 'Iniciar uma missão de Foco (20 min)'] },
    fr: { hello: 'Salut ! Je suis Pip, ton Jack Russell.', intro: 'Voici trois tâches pour aujourd\'hui :',
      tasks: ['Revoir les métriques du projet', 'Générer un rapport exécutif', 'Lancer une mission Focus (20 min)'] },
    de: { hello: 'Hallo! Ich bin Pip, dein Jack Russell.', intro: 'Drei Aufgaben für heute:',
      tasks: ['Projektmetriken überprüfen', 'Executive-Report erstellen', 'Focus-Mission starten (20 Min)'] },
    it: { hello: 'Ciao! Sono Pip, il tuo Jack Russell.', intro: 'Tre attività per oggi:',
      tasks: ['Rivedere le metriche del progetto', 'Generare un report esecutivo', 'Avviare una missione Focus (20 min)'] },
    zh: { hello: '你好！我是 Pip，你的杰克罗素犬。', intro: '为你准备了三项任务：',
      tasks: ['查看项目指标', '生成执行报告', '开始专注任务（20 分钟）'] },
    ja: { hello: 'こんにちは！ジャックラッセルのPipです。', intro: '今日のおすすめ3タスク：',
      tasks: ['プロジェクトの指標を確認', 'エグゼクティブレポートを生成', '集中ミッション開始（20分）'] },
  };

  const c = copy[lang];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="w-full rounded-2xl border border-cyan-400/30 bg-black/70 backdrop-blur-xl p-4 flex gap-4 items-start"
    >
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        className="shrink-0"
      >
        <JackRussell />
      </motion.div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-cyan-200 font-semibold tracking-wide">{c.hello}</p>
        <p className="text-xs text-foreground/70 mt-1">{c.intro}</p>
        <ul className="mt-2 space-y-1.5">
          {c.tasks.map((t, i) => (
            <li key={i}>
              <button
                onClick={() => onPickTask?.(t)}
                className="w-full text-left text-[13px] text-foreground/85 px-3 py-2 rounded-lg bg-white/5 hover:bg-cyan-400/10 border border-white/10 hover:border-cyan-400/40 transition-all"
              >
                <span className="text-cyan-300/80 font-mono mr-2">{i + 1}.</span>{t}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
};
