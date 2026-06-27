import { motion } from 'framer-motion';
import { Activity, Brain, Shield, Folder, Zap } from 'lucide-react';
import { MetricCard3D } from './MetricCard3D';
import { RealtimeChart } from './RealtimeChart';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';

export const MetricsPanel = () => {
  const { metrics, latencyData, projectsData } = useDashboardMetrics();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="w-full max-w-6xl mx-auto px-4"
    >
      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <MetricCard3D
          title="Velocidad Operativa"
          value={metrics.operativeSpeed}
          unit="%"
          icon={Activity}
          trend="up"
          trendValue="+5.2%"
          color="primary"
        />
        <MetricCard3D
          title="Carga Cognitiva"
          value={metrics.cognitiveLoad}
          unit="%"
          icon={Brain}
          trend="stable"
          trendValue="0%"
          color="accent"
        />
        <MetricCard3D
          title="Sincronía SLA"
          value={metrics.slaSync}
          unit="%"
          icon={Shield}
          trend="up"
          trendValue="+0.1%"
          color="success"
        />
        <MetricCard3D
          title="Proyectos Activos"
          value={metrics.activeProjects}
          icon={Folder}
          trend="stable"
          trendValue="sin cambios"
          color="secondary"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <RealtimeChart
          data={latencyData}
          type="area"
          title="Latencia del Sistema (ms)"
          color="primary"
          height={180}
        />
        <RealtimeChart
          data={projectsData}
          type="bar"
          title="Proyectos por Estado"
          color="secondary"
          height={180}
        />
      </div>

      {/* Status indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-4 flex items-center justify-center gap-2"
      >
        <Zap className="w-3 h-3 text-success animate-pulse" />
        <span className="text-xs font-mono text-muted-foreground">
          Sistema en tiempo real • Actualización cada 2s
        </span>
      </motion.div>
    </motion.div>
  );
};
