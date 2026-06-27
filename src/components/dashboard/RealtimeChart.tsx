import { motion } from 'framer-motion';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, LineChart, Line
} from 'recharts';

interface ChartData {
  name: string;
  value: number;
  value2?: number;
}

interface RealtimeChartProps {
  data: ChartData[];
  type: 'area' | 'bar' | 'line';
  title: string;
  color?: 'primary' | 'secondary' | 'success' | 'accent';
  height?: number;
}

const colorMap = {
  primary: 'hsl(180, 100%, 50%)',
  secondary: 'hsl(210, 100%, 50%)',
  success: 'hsl(145, 100%, 45%)',
  accent: 'hsl(280, 100%, 60%)',
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card p-3 border border-primary/30">
        <p className="text-xs text-muted-foreground font-mono">{label}</p>
        <p className="text-sm font-mono text-primary font-bold">
          {payload[0].value}
        </p>
      </div>
    );
  }
  return null;
};

export const RealtimeChart = ({
  data,
  type,
  title,
  color = 'primary',
  height = 200,
}: RealtimeChartProps) => {
  const strokeColor = colorMap[color];

  const renderChart = () => {
    switch (type) {
      case 'area':
        return (
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={strokeColor} stopOpacity={0.4} />
                <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="hsl(222, 30%, 20%)" 
              vertical={false}
            />
            <XAxis 
              dataKey="name" 
              stroke="hsl(215, 20%, 45%)" 
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="hsl(215, 20%, 45%)" 
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke={strokeColor}
              strokeWidth={2}
              fill={`url(#gradient-${color})`}
            />
          </AreaChart>
        );
      
      case 'bar':
        return (
          <BarChart data={data}>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="hsl(222, 30%, 20%)" 
              vertical={false}
            />
            <XAxis 
              dataKey="name" 
              stroke="hsl(215, 20%, 45%)" 
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="hsl(215, 20%, 45%)" 
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="value" 
              fill={strokeColor} 
              radius={[4, 4, 0, 0]}
              opacity={0.8}
            />
          </BarChart>
        );
      
      case 'line':
        return (
          <LineChart data={data}>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="hsl(222, 30%, 20%)" 
              vertical={false}
            />
            <XAxis 
              dataKey="name" 
              stroke="hsl(215, 20%, 45%)" 
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="hsl(215, 20%, 45%)" 
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="value"
              stroke={strokeColor}
              strokeWidth={2}
              dot={{ fill: strokeColor, strokeWidth: 0, r: 3 }}
              activeDot={{ r: 5, fill: strokeColor }}
            />
          </LineChart>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-4 rounded-xl border border-border/30"
    >
      <h3 className="text-xs font-display text-muted-foreground uppercase tracking-wider mb-4">
        {title}
      </h3>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};
