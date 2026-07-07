import { Activity, Brain, Shield, Folder, Zap, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { CollapsibleSidebar } from './CollapsibleSidebar';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { RealtimeChart } from './RealtimeChart';
import { useLanguage } from '@/hooks/useLanguage';

const MetricItem = ({
  title,
  value,
  unit,
  icon: Icon,
  trend,
  trendValue,
}: {
  title: string;
  value: number;
  unit?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend: 'up' | 'down' | 'stable';
  trendValue: string;
}) => {
  const trendColors = {
    up: 'text-success',
    down: 'text-destructive',
    stable: 'text-muted-foreground',
  };
  const trendIcons = { up: '↑', down: '↓', stable: '→' };

  return (
    <div className="dashboard-neon-card p-3 rounded-xl border border-cyan-400/15 hover:border-cyan-300/35 transition-colors">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-primary" />
        <span className="text-xs text-muted-foreground font-display">{title}</span>
      </div>
      <div className="flex items-end justify-between">
        <span className="text-2xl font-mono font-bold text-foreground">
          {value}{unit}
        </span>
        <span className={`text-xs ${trendColors[trend]}`}>
          {trendIcons[trend]} {trendValue}
        </span>
      </div>
    </div>
  );
};

export const MetricsSidebar = () => {
  const { metrics, latencyData, projectsData } = useDashboardMetrics();
  const { t } = useLanguage();

  return (
    <CollapsibleSidebar
      side="left"
      title={t('side.metrics')}
      icon={<BarChart3 className="w-4 h-4" />}
      tabPosition="30%"
    >
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
          <Zap className="w-3 h-3 text-success" />
          <span className="font-mono uppercase tracking-wider">{t('side.realtime')}</span>
        </div>

        <div className="space-y-3">
          <MetricItem title={t('metric.operative_speed')} value={metrics.operativeSpeed} unit="%" icon={Activity} trend="up" trendValue="+5.2%" />
          <MetricItem title={t('metric.cognitive_load')} value={metrics.cognitiveLoad} unit="%" icon={Brain} trend="stable" trendValue="0%" />
          <MetricItem title={t('metric.sla_sync')} value={metrics.slaSync} unit="%" icon={Shield} trend="up" trendValue="+0.1%" />
          <MetricItem title={t('metric.active_projects')} value={metrics.activeProjects} icon={Folder} trend="stable" trendValue={t('metric.no_change')} />
        </div>

        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-mono uppercase text-muted-foreground/60 tracking-wider">{t('side.charts')}</h4>
          <div className="dashboard-neon-card rounded-xl overflow-hidden border border-cyan-400/15">
            <RealtimeChart data={latencyData} type="area" title={t('chart.latency')} color="primary" height={120} />
          </div>
          <div className="dashboard-neon-card rounded-xl overflow-hidden border border-cyan-400/15">
            <RealtimeChart data={projectsData} type="bar" title={t('chart.projects')} color="secondary" height={120} />
          </div>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 pt-2">
          <Zap className="w-3 h-3 text-success animate-pulse" />
          <span className="text-xs font-mono text-muted-foreground">{t('side.update')}</span>
        </motion.div>
      </div>
    </CollapsibleSidebar>
  );
};
