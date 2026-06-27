import { useMemo } from 'react';
import agentsData from '@/data/agentsData.json';

type SupportedLang = 'es' | 'en' | 'it';

type Agent = typeof agentsData.equity_labs_v1[0];

function detectLang(): SupportedLang {
  const navLang = navigator.language?.slice(0, 2).toLowerCase();
  if (navLang === 'es' || navLang === 'en' || navLang === 'it') return navLang;
  return 'en';
}

export type { Agent };

export function useAgentI18n() {
  const lang = useMemo(detectLang, []);

  const t = (key: string): string => {
    const uiStrings = agentsData.ui as Record<string, Record<string, string>>;
    return uiStrings[lang]?.[key] ?? uiStrings['en']?.[key] ?? key;
  };

  const getAgentName = (agent: Agent): string => {
    return (agent.name as Record<string, string>)[lang] ?? (agent.name as Record<string, string>)['en'];
  };

  const getAgentTasks = (agent: Agent): string[] => {
    return (agent.tasks as Record<string, string[]>)[lang] ?? (agent.tasks as Record<string, string[]>)['en'];
  };

  const getEngine = (agent: Agent, tier: 'free' | 'pro'): string => {
    return agent.engines[tier];
  };

  return { lang, t, getAgentName, getAgentTasks, getEngine, agents: agentsData.equity_labs_v1 };
}
