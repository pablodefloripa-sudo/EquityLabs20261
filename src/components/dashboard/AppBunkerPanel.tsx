import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Bot,
  Bug,
  CheckCircle2,
  Globe,
  HardDrive,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Wrench,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/runtime-client';

const ACTIVE_AGENT_STORAGE_KEY = 'eq_active_agent_context';
const SUBSCRIPTION_STORAGE_KEY = 'eq_subscription_context';
const RUNTIME_ERROR_LOG_KEY = 'eq_runtime_error_log';
const RUNTIME_HEALTH_KEY = 'eq_runtime_health_v1';

type AuditLevel = 'ok' | 'warning' | 'critical';

type RuntimeLog = {
  id: string;
  source: string;
  message: string;
  timestamp: string;
};

type IntegrationState = {
  gmail: boolean;
  sheets: boolean;
  calendar: boolean;
  drive: boolean;
};

type ActiveAgentContext = {
  id?: string;
  name?: string;
  engine?: string;
  tasks?: string[];
};

type SubscriptionContext = {
  displayPlan?: string;
  tier?: string;
};

const initialConnections: IntegrationState = {
  gmail: false,
  sheets: false,
  calendar: false,
  drive: false,
};

const statusTone: Record<AuditLevel, string> = {
  ok: 'border-emerald-300/22 bg-emerald-300/10 text-emerald-100',
  warning: 'border-amber-300/24 bg-amber-300/10 text-amber-100',
  critical: 'border-red-300/26 bg-red-300/10 text-red-100',
};

const readJson = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
};

export function AppBunkerPanel({ isOpen }: { isOpen: boolean }) {
  const { user } = useAuth();
  const [connections, setConnections] = useState<IntegrationState>(initialConnections);
  const [logs, setLogs] = useState<RuntimeLog[]>([]);
  const [activeAgent, setActiveAgent] = useState<ActiveAgentContext | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionContext | null>(null);
  const [runtimeHealth, setRuntimeHealth] = useState<Record<string, unknown> | null>(null);
  const [online, setOnline] = useState<boolean>(navigator.onLine);
  const [loadingIntegrations, setLoadingIntegrations] = useState(false);

  const pullLocalSnapshot = useCallback(() => {
    setActiveAgent(readJson<ActiveAgentContext | null>(ACTIVE_AGENT_STORAGE_KEY, null));
    setSubscription(readJson<SubscriptionContext | null>(SUBSCRIPTION_STORAGE_KEY, null));
    setLogs(readJson<RuntimeLog[]>(RUNTIME_ERROR_LOG_KEY, []));
    setRuntimeHealth(readJson<Record<string, unknown> | null>(RUNTIME_HEALTH_KEY, null));
    setOnline(navigator.onLine);
  }, []);

  const loadIntegrations = useCallback(async () => {
    if (!user?.id) {
      setConnections(initialConnections);
      return;
    }

    setLoadingIntegrations(true);
    try {
      const { data, error } = await supabase
        .from('user_integrations')
        .select('provider, is_connected')
        .eq('user_id', user.id);

      if (error) throw error;

      const next = { ...initialConnections };
      for (const row of data || []) {
        if (row.provider in next) {
          next[row.provider as keyof IntegrationState] = Boolean(row.is_connected);
        }
      }

      setConnections(next);
    } catch {
      setConnections(initialConnections);
    } finally {
      setLoadingIntegrations(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!isOpen) return;
    pullLocalSnapshot();
    loadIntegrations();

    const refresh = () => pullLocalSnapshot();
    const onlineHandler = () => setOnline(true);
    const offlineHandler = () => setOnline(false);

    window.addEventListener('storage', refresh);
    window.addEventListener('eq:agent-selected', refresh);
    window.addEventListener('online', onlineHandler);
    window.addEventListener('offline', offlineHandler);

    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('eq:agent-selected', refresh);
      window.removeEventListener('online', onlineHandler);
      window.removeEventListener('offline', offlineHandler);
    };
  }, [isOpen, loadIntegrations, pullLocalSnapshot]);

  const audits = useMemo(() => {
    const runtimeLevel: AuditLevel = logs.length > 0 ? 'warning' : 'ok';
    return [
      {
        title: 'Build de produccion',
        level: 'ok' as AuditLevel,
        detail: 'Ultimo chequeo local: npm run build compilo correctamente el martes 21 de julio de 2026.',
      },
      {
        title: 'Auditoria ESLint',
        level: 'warning' as AuditLevel,
        detail: 'Ultimo barrido local: 27 errores y 12 warnings. La deuda principal vive en ProjectManagerModal, runtime-client, Auth y modales viejos.',
      },
      {
        title: 'Flujo de entrada del agente',
        level: 'ok' as AuditLevel,
        detail: 'La seleccion del agente ya puede vivir en el chat central sin abrir por defecto el panel lateral antiguo.',
      },
      {
        title: 'Runtime AI / Edge Functions',
        level: runtimeLevel,
        detail: logs.length > 0
          ? `Hay ${logs.length} evento(s) runtime registrado(s). El mas reciente queda abajo en el bunker.`
          : 'No hay errores runtime guardados en esta sesion desde el logger de ai-chat.',
      },
      {
        title: 'Peso del bundle',
        level: 'warning' as AuditLevel,
        detail: 'Vite sigue reportando chunks grandes (>500 kB). Conviene separar mejor modales, mapas y herramientas.',
      },
    ];
  }, [logs.length]);

  const connectedCount = Object.values(connections).filter(Boolean).length;
  const latestLog = logs[0];

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-cyan-400/15 px-4 py-3">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-300/65">Bunker Visual</p>
          <h2 className="mt-1 text-lg font-semibold text-cyan-50">Estado y funcionamiento de la app</h2>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            pullLocalSnapshot();
            loadIntegrations();
          }}
          className="rounded-full border border-cyan-300/24 bg-cyan-300/8 px-3 text-xs text-cyan-100 hover:bg-cyan-300/12"
        >
          <RefreshCw className="mr-1 h-3.5 w-3.5" />
          Refrescar
        </Button>
      </div>

      <div className="grid min-h-0 flex-1 gap-4 overflow-hidden p-4 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="space-y-4 overflow-y-auto pr-1">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-cyan-300/16 bg-cyan-300/8 p-4">
              <div className="flex items-center gap-2 text-cyan-200">
                <Bot className="h-4 w-4" />
                <span className="text-[10px] font-mono uppercase tracking-[0.16em]">Agente activo</span>
              </div>
              <p className="mt-3 text-sm font-semibold text-cyan-50">{activeAgent?.name || 'Sin seleccionar'}</p>
              <p className="mt-1 text-xs text-cyan-100/55">{activeAgent?.engine || 'Sin motor activo'}</p>
            </div>

            <div className="rounded-2xl border border-emerald-300/16 bg-emerald-300/8 p-4">
              <div className="flex items-center gap-2 text-emerald-200">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-[10px] font-mono uppercase tracking-[0.16em]">Sesion</span>
              </div>
              <p className="mt-3 text-sm font-semibold text-emerald-50">{user ? 'Activa' : 'Sin login'}</p>
              <p className="mt-1 text-xs text-emerald-100/55">{subscription?.displayPlan || subscription?.tier || 'FREE'}</p>
            </div>

            <div className="rounded-2xl border border-violet-300/16 bg-violet-300/8 p-4">
              <div className="flex items-center gap-2 text-violet-200">
                <Globe className="h-4 w-4" />
                <span className="text-[10px] font-mono uppercase tracking-[0.16em]">Ruta / red</span>
              </div>
              <p className="mt-3 text-sm font-semibold text-violet-50">{window.location.pathname}</p>
              <p className="mt-1 text-xs text-violet-100/55">{online ? 'Online' : 'Offline'}</p>
            </div>

            <div className="rounded-2xl border border-amber-300/16 bg-amber-300/8 p-4">
              <div className="flex items-center gap-2 text-amber-200">
                <Bug className="h-4 w-4" />
                <span className="text-[10px] font-mono uppercase tracking-[0.16em]">Runtime logs</span>
              </div>
              <p className="mt-3 text-sm font-semibold text-amber-50">{logs.length}</p>
              <p className="mt-1 text-xs text-amber-100/55">{latestLog ? latestLog.source : 'Sin errores guardados'}</p>
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-black/30 p-4">
            <div className="mb-3 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-cyan-200" />
              <h3 className="text-sm font-semibold text-cyan-50">Auditoria tecnica</h3>
            </div>
            <div className="space-y-3">
              {audits.map((audit) => (
                <div key={audit.title} className={`rounded-2xl border p-3 ${statusTone[audit.level]}`}>
                  <div className="flex items-center gap-2">
                    {audit.level === 'ok' ? <CheckCircle2 className="h-4 w-4" /> : audit.level === 'warning' ? <AlertTriangle className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
                    <p className="text-sm font-semibold">{audit.title}</p>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-white/75">{audit.detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-black/30 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Wrench className="h-4 w-4 text-cyan-200" />
              <h3 className="text-sm font-semibold text-cyan-50">Integraciones</h3>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { key: 'gmail', label: 'Gmail' },
                { key: 'drive', label: 'Google Drive' },
                { key: 'calendar', label: 'Google Calendar' },
                { key: 'sheets', label: 'Google Sheets' },
              ].map((service) => {
                const enabled = connections[service.key as keyof IntegrationState];
                return (
                  <div key={service.key} className={`rounded-2xl border p-3 ${enabled ? statusTone.ok : statusTone.warning}`}>
                    <p className="text-sm font-semibold">{service.label}</p>
                    <p className="mt-1 text-xs text-white/75">
                      {loadingIntegrations ? 'Consultando estado...' : enabled ? 'Conectado y listo para usarse.' : 'Pendiente de consentimiento.'}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-4 overflow-y-auto pr-1">
          <div className="rounded-[24px] border border-cyan-300/16 bg-cyan-300/8 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-cyan-100" />
              <h3 className="text-sm font-semibold text-cyan-50">Contexto operativo actual</h3>
            </div>
            <div className="space-y-2 text-sm text-white/78">
              <p><span className="text-cyan-100">Agente:</span> {activeAgent?.name || 'Sin seleccionar'}</p>
              <p><span className="text-cyan-100">Motor:</span> {activeAgent?.engine || 'Sin motor activo'}</p>
              <p><span className="text-cyan-100">Suscripcion:</span> {subscription?.displayPlan || subscription?.tier || 'FREE'}</p>
              <p><span className="text-cyan-100">Ruta:</span> {window.location.pathname}</p>
              <p><span className="text-cyan-100">Integraciones activas:</span> {connectedCount}/4</p>
              <p><span className="text-cyan-100">Ultimo heartbeat AI:</span> {typeof runtimeHealth?.updatedAt === 'string' ? runtimeHealth.updatedAt : 'Sin registro todavia'}</p>
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-black/30 p-4">
            <div className="mb-3 flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-cyan-200" />
              <h3 className="text-sm font-semibold text-cyan-50">Logger runtime</h3>
            </div>
            <div className="space-y-2">
              {logs.length === 0 ? (
                <div className="rounded-2xl border border-emerald-300/16 bg-emerald-300/8 px-3 py-4 text-sm text-emerald-100">
                  No hay errores runtime capturados por el logger del chat.
                </div>
              ) : (
                logs.slice(0, 6).map((log) => (
                  <div key={log.id} className="rounded-2xl border border-red-300/14 bg-red-300/8 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-red-100/88">{log.source}</p>
                    <p className="mt-2 text-sm text-white/78">{log.message}</p>
                    <p className="mt-2 text-[11px] text-white/48">{log.timestamp}</p>
                  </div>
                ))
              )}
            </div>
            {logs.length > 0 && (
              <div className="mt-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    localStorage.removeItem(RUNTIME_ERROR_LOG_KEY);
                    setLogs([]);
                  }}
                  className="rounded-full border border-red-300/20 bg-red-300/8 px-3 text-xs text-red-100 hover:bg-red-300/12"
                >
                  Limpiar logger
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
