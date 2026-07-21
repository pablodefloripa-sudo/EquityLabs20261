import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  Bot,
  ChevronRight,
  Clock3,
  History,
  LayoutPanelTop,
  MessageSquareText,
  Plus,
  Sparkles,
  Square,
  Target,
  TrendingUp,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/runtime-client';
import { useAuth } from '@/hooks/useAuth';
import data from '@/data/lifestyleAgents.json';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type BuilderAgent = {
  id: string;
  name: Record<string, string>;
  mission?: Record<string, string>;
  freeModels?: string[];
  proModels?: string[];
  freeTasks?: Record<string, string[]>;
  proTasks?: Record<string, string[]>;
  engines?: Record<string, string>;
  proStack?: string;
  badge?: string;
};

type ProjectMetric = {
  id: string;
  projectName: string;
  executionTime: string;
  date: string;
  hoursWorked: string;
  deepFocus: string;
  notes: string;
};

const businessAgent = (data.agents as BuilderAgent[]).find((agent) => agent.id === 'ls_08');

const quickTasks = [
  {
    title: 'Definir oferta y cliente ideal',
    detail: 'Aterriza problema, promesa, nicho y precio base en una sola linea de negocio.',
  },
  {
    title: 'Disenar estructura de ingresos',
    detail: 'Arma el modelo comercial, canales y la primera ruta de monetizacion.',
  },
  {
    title: 'Validar traccion inicial',
    detail: 'Lista senales, metricas y proximos experimentos para saber si hay fit.',
  },
  {
    title: 'Preparar playbook operativo',
    detail: 'Ordena tareas, prioridades y responsables para trabajar sin friccion.',
  },
  {
    title: 'Armar checklist de inversion',
    detail: 'Deja listo lo minimo que un potencial inversor necesita ver.',
  },
  {
    title: 'Cerrar el roadmap de 30 dias',
    detail: 'Define foco semanal, entregables y criterio de avance.',
  },
];

const recentConversations = [
  {
    title: 'Modelo financiero inicial',
    text: 'Estimacion de costos, ingresos y punto de equilibrio.',
    time: 'Hace 2 h',
  },
  {
    title: 'Oferta y posicionamiento',
    text: 'Propuesta de valor, diferenciacion y mensaje comercial.',
    time: 'Ayer',
  },
  {
    title: 'Plan de adquisicion',
    text: 'Canales, embudo, metricas y primeras acciones.',
    time: 'Hace 3 dias',
  },
];

const metrics = [
  { label: 'Conversaciones', value: '12', note: 'activa hoy' },
  { label: 'Tiempo trabajado', value: '4h 18m', note: 'esta semana' },
  { label: 'Conformidad', value: '91%', note: 'feedback positivo' },
  { label: 'Prompts utiles', value: '27', note: 'capturados' },
];

const SummaryText = () => (
  <p className="text-sm leading-relaxed text-emerald-100/78">
    NVIDIA Nemotron 3 Ultra es un modelo abierto de razonamiento y orquestacion con 55B activos de 550B totales.
    Esta pensado para flujos largos, planificacion multi-paso, agentes y tareas empresariales complejas.
  </p>
);

export default function BusinessBuilderWelcome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState<string>('');
  const [projects, setProjects] = useState<ProjectMetric[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    projectName: '',
    executionTime: '',
    date: '',
    hoursWorked: '',
    deepFocus: '',
    notes: '',
  });

  const firstName = useMemo(() => {
    const fallback =
      user?.user_metadata?.display_name ||
      user?.user_metadata?.full_name ||
      user?.user_metadata?.name ||
      user?.email?.split('@')[0] ||
      'Admin';

    const candidate = displayName || fallback;
    return candidate.split(' ')[0] || 'Admin';
  }, [displayName, user]);

  useEffect(() => {
    let active = true;

    const loadName = async () => {
      if (!user) return;

      const { data } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!active) return;
      if (data?.display_name) {
        setDisplayName(data.display_name);
      }
    };

    loadName();

    return () => {
      active = false;
    };
  }, [user]);

  const agentName = businessAgent?.name?.es || 'Business Builder';
  const freeModels = businessAgent?.freeModels || [];
  const proModels = businessAgent?.proModels || [];
  const freeTasks = businessAgent?.freeTasks?.es || [];
  const proTasks = businessAgent?.proTasks?.es || [];
  const engineFree = businessAgent?.engines?.free || 'Modelos free';
  const enginePro = businessAgent?.engines?.pro || 'Modelo pro';

  const handleFormChange = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleCreateProject = () => {
    if (!form.projectName.trim()) return;

    setProjects((current) => [
      {
        id: `${Date.now()}`,
        projectName: form.projectName.trim(),
        executionTime: form.executionTime.trim() || '-',
        date: form.date || '-',
        hoursWorked: form.hoursWorked.trim() || '-',
        deepFocus: form.deepFocus.trim() || '-',
        notes: form.notes.trim(),
      },
      ...current,
    ]);

    setForm({
      projectName: '',
      executionTime: '',
      date: '',
      hoursWorked: '',
      deepFocus: '',
      notes: '',
    });
    setDialogOpen(false);
  };

  const headerTabs = [
    { label: 'Tareas', icon: MessageSquareText },
    { label: 'Metricas', icon: BarChart3 },
    { label: 'Historial', icon: History },
    { label: 'Mascota', icon: Bot },
  ];

  return (
    <div className="min-h-screen bg-[#020403] text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.13),transparent_42%),radial-gradient(circle_at_80%_30%,rgba(34,197,94,0.09),transparent_36%),linear-gradient(180deg,rgba(0,0,0,0.92),rgba(3,8,5,1))]" />
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-400/70 to-transparent" />
      <div className="absolute inset-x-0 top-3 h-[1px] bg-gradient-to-r from-transparent via-emerald-300/25 to-transparent" />

      <main className="relative z-10 mx-auto max-w-7xl px-4 py-6 md:py-8">
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="rounded-[28px] border border-emerald-400/20 bg-black/55 backdrop-blur-2xl shadow-[0_0_50px_rgba(16,185,129,0.07)] overflow-hidden"
        >
          <div className="h-[2px] bg-gradient-to-r from-transparent via-emerald-300/90 to-transparent" />

          <div className="p-5 md:p-7">
            <div className="flex flex-col gap-4 border border-emerald-400/12 bg-[#020806]/55 rounded-2xl p-4 md:p-5">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-[0.28em] text-emerald-300/70">Business Builder</p>
                    <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-emerald-100">
                      Hola, {firstName}
                    </h1>
                  </div>
                </div>

                <button
                  onClick={() => setDialogOpen(true)}
                  className="inline-flex items-center gap-2 rounded-full border border-emerald-400/22 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-100 hover:bg-emerald-400/15 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Nuevo proyecto
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {headerTabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.label}
                      className="inline-flex items-center gap-2 rounded-full border border-emerald-400/15 bg-black/30 px-3 py-1.5 text-xs font-medium text-emerald-100/80 hover:border-emerald-300/35 hover:text-emerald-50 transition-colors"
                    >
                      <Icon className="h-3.5 w-3.5 text-emerald-300/80" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              <p className="text-sm md:text-base text-emerald-100/65 max-w-3xl">
                Tu agente <span className="text-emerald-300">{agentName}</span> ya esta listo para trabajar con vos.
                Vamos a construir estructura, claridad y avance real desde el primer minuto.
              </p>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-[1.25fr_0.9fr]">
              <div className="space-y-4">
                <div className="rounded-2xl border border-emerald-400/18 bg-[#02100a]/70 p-4 md:p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-mono uppercase tracking-[0.26em] text-emerald-300/70">
                        Tareas del agente
                      </p>
                      <h2 className="mt-1 text-lg font-semibold text-emerald-50">Lo que podes hacer ahora</h2>
                    </div>
                    <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.2em] text-emerald-200/70">
                      1 · 2 · 3
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {quickTasks.map((task, index) => (
                      <motion.div
                        key={task.title}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.04 }}
                        className="rounded-xl border border-emerald-400/12 bg-black/40 p-3"
                      >
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-400/10 text-[10px] font-bold text-emerald-200">
                            {index + 1}
                          </span>
                          <h3 className="text-sm font-medium text-emerald-50/95">{task.title}</h3>
                        </div>
                        <p className="mt-2 text-xs leading-relaxed text-emerald-100/60">{task.detail}</p>
                      </motion.div>
                    ))}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {freeTasks.concat(proTasks).slice(0, 6).map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-emerald-400/12 bg-emerald-400/5 px-3 py-1 text-[11px] text-emerald-100/70"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-emerald-400/18 bg-[#02100a]/70 p-4 md:p-5">
                  <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.26em] text-emerald-300/70">
                    <Clock3 className="w-3.5 h-3.5" />
                    Proyectos recientes
                  </div>

                  <div className="mt-4 space-y-2.5">
                    {projects.length > 0 ? (
                      projects.map((project) => (
                        <div key={project.id} className="rounded-xl border border-emerald-400/12 bg-black/35 p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm text-emerald-50/90">{project.projectName}</p>
                              <p className="mt-1 text-xs text-emerald-100/55">
                                Fecha {project.date} · Tiempo {project.executionTime} · Horas {project.hoursWorked}
                              </p>
                              <p className="mt-1 text-xs text-emerald-100/45">
                                Foco profundo: {project.deepFocus}
                              </p>
                              {project.notes ? (
                                <p className="mt-1 text-xs text-emerald-100/35">{project.notes}</p>
                              ) : null}
                            </div>
                            <span className="shrink-0 text-[10px] font-mono text-emerald-300/45">Nuevo</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-xl border border-emerald-400/12 bg-black/35 p-3 text-sm text-emerald-100/55">
                        Aun no cargaste proyectos. Tocá <span className="text-emerald-200">Nuevo proyecto</span> para
                        registrar tiempo y foco.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-emerald-400/18 bg-[#02100a]/70 p-4 md:p-5">
                  <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.26em] text-emerald-300/70">
                    <BarChart3 className="w-3.5 h-3.5" />
                    Metricas
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {metrics.map((metric) => (
                      <div key={metric.label} className="rounded-xl border border-emerald-400/12 bg-black/40 p-3">
                        <p className="text-[10px] uppercase tracking-[0.22em] text-emerald-300/55 font-mono">
                          {metric.label}
                        </p>
                        <p className="mt-2 text-2xl font-semibold text-emerald-50">{metric.value}</p>
                        <p className="mt-1 text-[11px] text-emerald-100/55">{metric.note}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-emerald-400/18 bg-[#02100a]/70 p-4 md:p-5">
                  <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.26em] text-emerald-300/70">
                    <History className="w-3.5 h-3.5" />
                    Conversaciones pasadas
                  </div>
                  <div className="mt-4 space-y-2.5">
                    {recentConversations.map((item) => (
                      <div key={item.title} className="rounded-xl border border-emerald-400/12 bg-black/35 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm text-emerald-50/90">{item.title}</p>
                            <p className="mt-1 text-xs text-emerald-100/55">{item.text}</p>
                          </div>
                          <span className="shrink-0 text-[10px] font-mono text-emerald-300/45">{item.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => navigate('/')}
                    className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-emerald-300 hover:text-emerald-200 transition-colors"
                  >
                    Abrir historial completo
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="rounded-2xl border border-emerald-400/18 bg-[#02100a]/70 p-4 md:p-5">
                  <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.26em] text-emerald-300/70">
                    <Bot className="w-3.5 h-3.5" />
                    Mascota
                  </div>
                  <div className="mt-3 rounded-xl border border-emerald-400/12 bg-black/40 p-3">
                    <p className="text-sm text-emerald-50/90">
                      Mascota lista para acompanarte, guiar y resumir el trabajo.
                    </p>
                    <p className="mt-1 text-xs text-emerald-100/55">
                      Podes usarla para recordatorios, foco o apoyo conversacional.
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-emerald-400/18 bg-[#02100a]/70 p-4 md:p-5">
                  <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.26em] text-emerald-300/70">
                    <LayoutPanelTop className="w-3.5 h-3.5" />
                    Imagen reemplazable
                  </div>
                  <div className="mt-3 aspect-square w-full rounded-2xl border border-emerald-400/18 bg-black relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Square className="w-10 h-10 text-emerald-400/20" />
                    </div>
                    <div className="absolute inset-x-0 bottom-0 bg-black/55 px-3 py-2">
                      <p className="text-[11px] text-emerald-100/60">Placeholder 1:1 para reemplazar por tu imagen.</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-emerald-400/18 bg-[#02100a]/70 p-4 md:p-5">
                  <p className="text-[10px] font-mono uppercase tracking-[0.26em] text-emerald-300/70">Modelo</p>
                  <SummaryText />
                  <div className="mt-3 flex items-center gap-2 text-[11px] text-emerald-100/50">
                    <Target className="w-3.5 h-3.5 text-emerald-300/70" />
                    Orquestacion, razonamiento multi-paso y trabajo empresarial largo.
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-[11px] text-emerald-100/50">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-300/70" />
                    {freeModels.join(' · ') || engineFree}
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-[11px] text-emerald-100/50">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-300/70" />
                    {proModels.join(' · ') || enginePro}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-emerald-400/12 pt-4">
              <p className="text-xs text-emerald-100/50">
                {businessAgent?.proStack || 'Business Builder operativo con stack avanzado listo para escalar.'}
              </p>
              <button
                onClick={() => navigate('/')}
                className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-medium text-emerald-100 hover:bg-emerald-400/15 transition-colors"
              >
                Entrar al workspace
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </motion.section>
      </main>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="border-emerald-400/20 bg-[#03100a] text-emerald-50 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-emerald-50">Nuevo proyecto</DialogTitle>
            <DialogDescription className="text-emerald-100/55">
              Cargá los datos del proyecto para medir tiempo, foco y avance.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3">
            <Input
              value={form.projectName}
              onChange={(event) => handleFormChange('projectName', event.target.value)}
              placeholder="Nombre del proyecto"
              className="border-emerald-400/20 bg-black/40 text-emerald-50 placeholder:text-emerald-100/35"
            />
            <Input
              value={form.executionTime}
              onChange={(event) => handleFormChange('executionTime', event.target.value)}
              placeholder="Tiempo de ejecucion"
              className="border-emerald-400/20 bg-black/40 text-emerald-50 placeholder:text-emerald-100/35"
            />
            <Input
              type="date"
              value={form.date}
              onChange={(event) => handleFormChange('date', event.target.value)}
              className="border-emerald-400/20 bg-black/40 text-emerald-50"
            />
            <Input
              value={form.hoursWorked}
              onChange={(event) => handleFormChange('hoursWorked', event.target.value)}
              placeholder="Horas de trabajo aplicadas"
              className="border-emerald-400/20 bg-black/40 text-emerald-50 placeholder:text-emerald-100/35"
            />
            <Input
              value={form.deepFocus}
              onChange={(event) => handleFormChange('deepFocus', event.target.value)}
              placeholder="Focus profundo"
              className="border-emerald-400/20 bg-black/40 text-emerald-50 placeholder:text-emerald-100/35"
            />
            <Textarea
              value={form.notes}
              onChange={(event) => handleFormChange('notes', event.target.value)}
              placeholder="Notas opcionales"
              className="min-h-[96px] border-emerald-400/20 bg-black/40 text-emerald-50 placeholder:text-emerald-100/35"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={() => setDialogOpen(false)}
              className="rounded-full border border-emerald-400/15 px-4 py-2 text-sm text-emerald-100/70 hover:text-emerald-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleCreateProject}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-400/22 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-100 hover:bg-emerald-400/15"
            >
              Guardar proyecto
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
