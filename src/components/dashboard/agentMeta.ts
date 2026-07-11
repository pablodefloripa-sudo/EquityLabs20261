import { icons, type LucideIcon } from 'lucide-react';

const agentIconMap: Record<string, string> = {
  ag_01: 'Building2',
  ag_02: 'Map',
  ag_03: 'TreePine',
  ag_04: 'BadgeDollarSign',
  ag_05: 'Construction',
  ag_06: 'TrendingUp',
  ag_07: 'Receipt',
  ag_08: 'Landmark',
  ag_09: 'ShieldCheck',
  ag_10: 'Handshake',
  ag_11: 'Target',
  ag_12: 'ClipboardList',
  ag_13: 'UserCog',
  ag_14: 'Gauge',
  ag_15: 'Cpu',
  ag_16: 'DoorOpen',
  ag_17: 'Scale',
  ag_18: 'MapPinned',
  ag_19: 'Binoculars',
  ag_20: 'Crown',
};

const proAgentIds = new Set([
  'ag_03',
  'ag_04',
  'ag_06',
  'ag_07',
  'ag_08',
  'ag_09',
  'ag_10',
  'ag_13',
  'ag_14',
  'ag_15',
  'ag_16',
  'ag_17',
  'ag_20',
]);

export const getAgentIcon = (id: string) => {
  const iconName = agentIconMap[id] || 'Bot';
  return (icons as Record<string, LucideIcon>)[iconName] ?? icons.Bot;
};

export const isProAgent = (id: string) => proAgentIds.has(id);
