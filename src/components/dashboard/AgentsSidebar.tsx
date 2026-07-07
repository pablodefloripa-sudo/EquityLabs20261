import { useState, useCallback, memo } from 'react';
import { Wrench, Zap, Shield } from 'lucide-react';
import { CollapsibleSidebar } from './CollapsibleSidebar';
import { BunkerModal, getAgentIcon, isProAgent } from './BunkerModal';
import { useAgentI18n, type Agent } from '@/hooks/useAgentI18n';

const AgentCard = memo(({
  agent,
  isSelected,
  onClick,
  name,
}: {
  agent: Agent;
  isSelected: boolean;
  onClick: () => void;
  name: string;
}) => {
  const IconComponent = getAgentIcon(agent.id);
  const isPro = isProAgent(agent.id);

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-xl transition-all duration-200 ${
        isSelected
          ? 'dashboard-neon-card bg-primary/18 border-primary/45 shadow-[0_0_22px_rgba(34,211,238,0.12)]'
          : 'dashboard-neon-card border-cyan-400/15 hover:border-cyan-300/35'
      } border`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
          isSelected ? 'bg-primary/30' : 'bg-primary/10'
        }`}>
          <IconComponent className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <span className={`text-sm font-medium truncate block ${
            isSelected ? 'text-primary' : 'text-foreground/90'
          }`}>
            {name}
          </span>
        </div>
        {isPro && (
          <div
            className="shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-mono font-bold tracking-widest"
            style={{
              background: 'linear-gradient(135deg, hsl(280 100% 60% / 0.2), hsl(320 100% 50% / 0.15))',
              border: '1px solid hsl(280 100% 60% / 0.4)',
              color: 'hsl(280 100% 75%)',
              boxShadow: '0 0 8px hsl(280 100% 60% / 0.3)',
            }}
          >
            <Shield className="w-2.5 h-2.5" />
            PRO
          </div>
        )}
      </div>
    </button>
  );
});
AgentCard.displayName = 'AgentCard';

export const AgentsSidebar = memo(() => {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const { t, getAgentName, getAgentTasks, getEngine, agents } = useAgentI18n();

  const handleClick = useCallback((agent: Agent) => {
    const name = getAgentName(agent);
    const tasks = getAgentTasks(agent);

    setSelectedAgent(agent);
    setModalOpen(true);
    window.dispatchEvent(new CustomEvent('eq:agent-selected', {
      detail: {
        id: agent.id,
        name,
        tasks,
        engine: getEngine(agent, 'free'),
      },
    }));
  }, [getAgentName, getAgentTasks, getEngine]);

  return (
    <>
      <CollapsibleSidebar
        side="right"
        title={t('sidebar.title')}
        icon={<Wrench className="w-4 h-4" />}
        tabPosition="55%"
      >
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
            <Zap className="w-3 h-3 text-success" />
            <span className="font-mono uppercase tracking-wider">{t('sidebar.subtitle')}</span>
          </div>

          <div className="space-y-1.5">
            {agents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                isSelected={selectedAgent?.id === agent.id}
                onClick={() => handleClick(agent)}
                name={getAgentName(agent)}
              />
            ))}
          </div>
        </div>
      </CollapsibleSidebar>

      <BunkerModal
        agent={selectedAgent}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
});
AgentsSidebar.displayName = 'AgentsSidebar';
