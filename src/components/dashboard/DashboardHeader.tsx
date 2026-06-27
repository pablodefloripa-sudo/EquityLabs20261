import { useState } from "react";
import { motion } from "framer-motion";
import { Link2, LogOut, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";
import { VoidModal } from "./VoidModal";

interface DashboardHeaderProps {
  onOpenDocs?: () => void;
  onSettings?: () => void;
  onHistory?: () => void;
  onExit?: () => void;
  onOpenIntegrations?: () => void;
}

export const DashboardHeader = ({ onOpenDocs, onSettings, onHistory, onExit, onOpenIntegrations }: DashboardHeaderProps = {}) => {
  const { t } = useLanguage();
  const [voidOpen, setVoidOpen] = useState(false);

  return (
    <>
    <VoidModal open={voidOpen} onOpenChange={setVoidOpen} />
    <motion.header
      className="fixed top-0 left-0 right-0 z-50 h-14 bg-black/90 backdrop-blur-xl border-b border-cyan-400/10 flex items-center px-6"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
    >
      <div className="flex items-center justify-between w-full max-w-screen-2xl mx-auto">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <span className="text-2xl font-display font-bold tracking-tighter bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            eQuityLabs
          </span>
        </div>

        {/* Acciones centrales */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-sm" onClick={onOpenDocs}>
            Mis Documentos
          </Button>
          <Button variant="ghost" size="sm" className="text-sm" onClick={onSettings}>
            Ajustes
          </Button>
          <Button variant="ghost" size="sm" className="text-sm" onClick={onHistory}>
            Historial
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setVoidOpen(true)}
            className="text-sm gap-1.5 border border-cyan-400/50 text-cyan-200 hover:bg-cyan-500/10 hover:shadow-[0_0_18px_rgba(34,211,238,0.45)] hover:text-cyan-100"
          >
            <Brain className="w-4 h-4" />
            VOID
          </Button>
        </div>

        {/* Derecha */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onOpenIntegrations}>
            <Link2 className="w-5 h-5" />
          </Button>

          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onExit} title="Salir">
            <LogOut className="w-5 h-5" />
          </Button>

          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-xs font-bold">
            P
          </div>
        </div>
      </div>
    </motion.header>
    </>
  );
};
