import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleMapsBackground } from '@/components/GoogleMapsBackground';
import { CustomBackground } from './CustomBackground';
import { TaskOperator } from './TaskOperator';
import { DashboardHeader } from './DashboardHeader';
import { DashboardSidebar } from './DashboardSidebar';
import { MetricsSidebar } from './MetricsSidebar';
import { AgentsSidebar } from './AgentsSidebar';
import { CommunicationArea } from './CommunicationArea';
import { IntegrationCenter } from './IntegrationCenter';
import { WallpaperSelector } from './WallpaperSelector';
import { FocusMissionMode } from './FocusMissionMode';
import { HistoryModal } from './HistoryModal';
import { ExitModal } from './ExitModal';
import { ProjectManagerModal } from './ProjectManagerModal';

import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';

export const ProjectDashboard = () => {
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isIntegrationsOpen, setIsIntegrationsOpen] = useState(false);
  const [isWallpaperOpen, setIsWallpaperOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isExitOpen, setIsExitOpen] = useState(false);
  const [isProjectManagerOpen, setIsProjectManagerOpen] = useState(false);
  const { toast } = useToast();
  const { signOut } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleOpenDocs = useCallback(() => {
    setIsProjectManagerOpen(true);
  }, []);

  const handleSettings = useCallback(() => {
    setIsWallpaperOpen(true);
    toast({ title: t('nav.settings'), description: t('toast.settings') });
  }, [toast, t]);

  const handleHistory = useCallback(() => {
    setIsHistoryOpen(true);
  }, []);

  const handleExit = useCallback(() => {
    setIsExitOpen(true);
  }, []);

  const handleConfirmExit = useCallback(() => {
    navigate('/landing');
  }, [navigate]);

  const handleOpenIntegrations = useCallback(() => setIsIntegrationsOpen(true), []);

  return (
    <div className="min-h-screen w-full overflow-hidden relative">
      <GoogleMapsBackground />
      <CustomBackground />

      <motion.div
        animate={{ 
          opacity: isFocusMode ? 0 : 1,
          y: isFocusMode ? -20 : 0,
          pointerEvents: isFocusMode ? 'none' : 'auto'
        }}
        transition={{ duration: 0.3 }}
      >
        <DashboardHeader
          onOpenDocs={handleOpenDocs}
          onSettings={handleSettings}
          onHistory={handleHistory}
          onExit={handleExit}
          onOpenIntegrations={handleOpenIntegrations}
        />
      </motion.div>

      <motion.div
        animate={{ 
          opacity: isFocusMode ? 0 : 1,
          pointerEvents: isFocusMode ? 'none' : 'auto'
        }}
      >
        <MetricsSidebar />
        <DashboardSidebar />
        <AgentsSidebar />
      </motion.div>

      <motion.main 
        className="relative z-10 pt-12 h-screen flex flex-col"
        animate={{
          opacity: isFocusMode ? 0.3 : 1,
        }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex flex-1 gap-4 px-4 overflow-hidden min-h-0">
          <div className="flex-1 min-w-0 flex flex-col justify-end">
            <CommunicationArea onEnterFocusMode={() => setIsFocusMode(true)} />
          </div>
        </div>
        <TaskOperator />
      </motion.main>

      <FocusMissionMode 
        isActive={isFocusMode}
        onExit={() => setIsFocusMode(false)}
        onSettings={handleSettings}
      />

      <IntegrationCenter 
        isOpen={isIntegrationsOpen} 
        onClose={() => setIsIntegrationsOpen(false)} 
      />
      <WallpaperSelector 
        isOpen={isWallpaperOpen} 
        onClose={() => setIsWallpaperOpen(false)} 
      />
      <HistoryModal 
        isOpen={isHistoryOpen} 
        onClose={() => setIsHistoryOpen(false)} 
      />
      <ExitModal 
        isOpen={isExitOpen} 
        onClose={() => setIsExitOpen(false)} 
        onConfirmExit={handleConfirmExit}
      />
      <ProjectManagerModal 
        isOpen={isProjectManagerOpen} 
        onClose={() => setIsProjectManagerOpen(false)} 
      />

      
    </div>
  );
};
