import { useState, useEffect } from 'react';
import { MapPin, Wifi, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export const ZenFooter = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [latency, setLatency] = useState(12);

  // Update clock every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Simulate latency fluctuation
  useEffect(() => {
    const interval = setInterval(() => {
      setLatency(Math.floor(Math.random() * 8) + 8); // 8-15ms
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 h-10">
      <div className={cn(
        "h-full flex items-center justify-between px-6",
        "bg-black/60 backdrop-blur-xl border-t border-zinc-800/30"
      )}>
        {/* GPS Location */}
        <div className="flex items-center gap-2 text-muted-foreground/60">
          <MapPin className="w-3.5 h-3.5" />
          <span className="text-xs font-mono">Santa Catarina, BR</span>
        </div>

        {/* Latency */}
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-1.5 h-1.5 rounded-full",
            latency < 20 ? "bg-emerald-400" : latency < 50 ? "bg-amber-400" : "bg-red-400"
          )} />
          <Wifi className="w-3.5 h-3.5 text-muted-foreground/60" />
          <span className="text-xs font-mono text-muted-foreground/60">
            {latency}ms
          </span>
        </div>

        {/* Real-time clock */}
        <div className="flex items-center gap-2 text-muted-foreground/60">
          <Clock className="w-3.5 h-3.5" />
          <span className="text-xs font-mono tabular-nums">
            {formatTime(currentTime)}
          </span>
        </div>
      </div>
    </footer>
  );
};
