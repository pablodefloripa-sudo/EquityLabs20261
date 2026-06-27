import { useState, useEffect, useCallback } from 'react';

interface Metrics {
  operativeSpeed: number;
  cognitiveLoad: number;
  slaSync: number;
  activeProjects: number;
  systemLatency: number;
}

interface ChartData {
  name: string;
  value: number;
}

export const useDashboardMetrics = () => {
  const [metrics, setMetrics] = useState<Metrics>({
    operativeSpeed: 87,
    cognitiveLoad: 45,
    slaSync: 99.8,
    activeProjects: 12,
    systemLatency: 24,
  });

  const [latencyData, setLatencyData] = useState<ChartData[]>([
    { name: '00:00', value: 20 },
    { name: '00:05', value: 25 },
    { name: '00:10', value: 22 },
    { name: '00:15', value: 28 },
    { name: '00:20', value: 24 },
    { name: '00:25', value: 26 },
    { name: '00:30', value: 23 },
  ]);

  const [projectsData, setProjectsData] = useState<ChartData[]>([
    { name: 'Activo', value: 8 },
    { name: 'Pausado', value: 2 },
    { name: 'Completado', value: 5 },
    { name: 'Pendiente', value: 3 },
  ]);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        operativeSpeed: Math.min(100, Math.max(70, prev.operativeSpeed + (Math.random() - 0.5) * 4)),
        cognitiveLoad: Math.min(100, Math.max(20, prev.cognitiveLoad + (Math.random() - 0.5) * 6)),
        slaSync: Math.min(100, Math.max(98, prev.slaSync + (Math.random() - 0.5) * 0.3)),
        activeProjects: prev.activeProjects,
        systemLatency: Math.min(50, Math.max(10, prev.systemLatency + (Math.random() - 0.5) * 8)),
      }));

      // Update latency chart
      setLatencyData(prev => {
        const newData = [...prev.slice(1)];
        const lastTime = prev[prev.length - 1].name;
        const [hours, mins] = lastTime.split(':').map(Number);
        const newMins = (mins + 5) % 60;
        const newHours = newMins === 0 ? (hours + 1) % 24 : hours;
        const newTime = `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
        
        newData.push({
          name: newTime,
          value: Math.floor(15 + Math.random() * 25),
        });
        return newData;
      });

      // Occasionally update projects
      if (Math.random() > 0.8) {
        setProjectsData(prev => prev.map(item => ({
          ...item,
          value: Math.max(1, item.value + Math.floor((Math.random() - 0.5) * 2)),
        })));
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const refreshMetrics = useCallback(() => {
    setMetrics({
      operativeSpeed: 85 + Math.random() * 10,
      cognitiveLoad: 40 + Math.random() * 20,
      slaSync: 99 + Math.random() * 0.9,
      activeProjects: 10 + Math.floor(Math.random() * 5),
      systemLatency: 20 + Math.random() * 15,
    });
  }, []);

  return {
    metrics: {
      operativeSpeed: Math.round(metrics.operativeSpeed),
      cognitiveLoad: Math.round(metrics.cognitiveLoad),
      slaSync: parseFloat(metrics.slaSync.toFixed(1)),
      activeProjects: metrics.activeProjects,
      systemLatency: Math.round(metrics.systemLatency),
    },
    latencyData,
    projectsData,
    refreshMetrics,
  };
};
