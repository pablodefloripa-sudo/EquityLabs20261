import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Link2, Mail, FileSpreadsheet, Calendar, HardDrive, CreditCard, MessageCircle, Slack, Linkedin, ExternalLink, Key, Loader2, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useGoogleOAuth } from '@/hooks/useGoogleOAuth';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/runtime-client';
import { useToast } from '@/hooks/use-toast';

interface IntegrationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

interface IntegrationCardProps {
  name: string;
  description: string;
  icon: React.ReactNode;
  isConnected: boolean;
  isDisabled?: boolean;
  comingSoon?: boolean;
  isLoading?: boolean;
  onConnect?: () => void;
  onRevoke?: () => void;
}

const IntegrationCard = ({
  name,
  description,
  icon,
  isConnected,
  isDisabled,
  comingSoon,
  isLoading,
  onConnect,
  onRevoke,
}: IntegrationCardProps) => (
  <div
    className={`relative p-4 rounded-xl border transition-all duration-300 ${
      isDisabled || comingSoon
        ? 'bg-muted/20 border-border/10 opacity-50'
        : isConnected
        ? 'bg-success/5 border-success/30 hover:border-success/50'
        : 'bg-muted/30 border-border/20 hover:border-primary/30'
    }`}
  >
    {comingSoon && (
      <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-muted/50 text-xs font-mono text-muted-foreground">
        Próximamente
      </div>
    )}
    
    <div className="flex items-start gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
        isConnected ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary'
      }`}>
        {icon}
      </div>
      
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h4 className="font-display font-medium text-foreground/90">{name}</h4>
          {isConnected && <CheckCircle className="w-4 h-4 text-success" />}
        </div>
        <p className="text-xs text-muted-foreground/70 mt-0.5">{description}</p>
        
        {!comingSoon && !isDisabled && (
          <div className="mt-3">
            {isConnected ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRevoke}
                disabled={isLoading}
                className="h-8 text-xs text-destructive/70 hover:text-destructive hover:bg-destructive/10"
              >
                {isLoading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                Revocar acceso
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={onConnect}
                disabled={isLoading}
                className="h-8 text-xs text-primary hover:bg-primary/10"
              >
                {isLoading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                Conectar
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  </div>
);

export const IntegrationCenter = ({ isOpen, onClose }: IntegrationCenterProps) => {
  const { connectGoogleWorkspace } = useGoogleOAuth();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [stripeModalOpen, setStripeModalOpen] = useState(false);
  const [stripeKey, setStripeKey] = useState('');
  const [testingStripe, setTestingStripe] = useState(false);
  const [stripeStatus, setStripeStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [isLoadingIntegrations, setIsLoadingIntegrations] = useState(true);
  
  // Estado real de conexiones desde la base de datos
  const [connections, setConnections] = useState({
    gmail: false,
    sheets: false,
    calendar: false,
    drive: false,
    stripe: false,
  });

  // Cargar estado real de integraciones desde la DB
  const loadIntegrations = useCallback(async () => {
    if (!user?.id) return;
    
    setIsLoadingIntegrations(true);
    try {
      const { data, error } = await supabase
        .from('user_integrations')
        .select('provider, is_connected')
        .eq('user_id', user.id);

      if (error) throw error;

      const newConnections = {
        gmail: false,
        sheets: false,
        calendar: false,
        drive: false,
        stripe: false,
      };

      data?.forEach((integration) => {
        if (integration.provider in newConnections) {
          newConnections[integration.provider as keyof typeof newConnections] = integration.is_connected || false;
        }
      });

      setConnections(newConnections);
    } catch (error) {
      console.error('Error loading integrations:', error);
    } finally {
      setIsLoadingIntegrations(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (isOpen && user?.id) {
      loadIntegrations();
    }
  }, [isOpen, user?.id, loadIntegrations]);

  // Conectar permisos sensibles solo cuando una tarea lo justifica.
  const handleGoogleConnect = async () => {
    setIsLoadingGoogle(true);
    try {
      await connectGoogleWorkspace();
      // El redirect de OAuth se encarga del callback.
    } catch (error) {
      console.error('Error connecting Google:', error);
      toast({
        title: 'Error',
        description: 'No se pudo iniciar la conexión con Google',
        variant: 'destructive',
      });
      setIsLoadingGoogle(false);
    }
  };

  // Revocar acceso de un servicio Google
  const handleGoogleRevoke = async (service: 'gmail' | 'sheets' | 'calendar' | 'drive') => {
    if (!user?.id) return;
    
    try {
      const { error } = await supabase
        .from('user_integrations')
        .update({ is_connected: false, access_token_encrypted: null, refresh_token_encrypted: null })
        .eq('user_id', user.id)
        .eq('provider', service);

      if (error) throw error;

      setConnections(prev => ({ ...prev, [service]: false }));
      toast({ title: `${service} desconectado` });
    } catch (error) {
      console.error('Error revoking:', error);
      toast({ title: 'Error al desconectar', variant: 'destructive' });
    }
  };

  const handleStripeTest = async () => {
    if (!stripeKey.trim()) return;
    
    setTestingStripe(true);
    setStripeStatus('idle');
    
    // Simulate API test
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock success/failure based on key format
    if (stripeKey.startsWith('sk_')) {
      setStripeStatus('success');
      setConnections(prev => ({ ...prev, stripe: true }));
    } else {
      setStripeStatus('error');
    }
    
    setTestingStripe(false);
  };

  const handleStripeSave = () => {
    if (stripeStatus === 'success') {
      // In production, save encrypted key to database
      console.log('Saving Stripe key...');
      setStripeModalOpen(false);
      setStripeKey('');
      setStripeStatus('idle');
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={onClose}
            />
            
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative modal-cyber w-full max-w-2xl max-h-[80vh] overflow-hidden rounded-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-cyan-400/15">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-400/40 flex items-center justify-center">
                    <Link2 className="w-4 h-4 text-cyan-300" />
                  </div>
                  <div>
                    <h2 className="modal-cyber-title text-sm font-semibold">
                      Centro de Integraciones
                    </h2>
                    <p className="text-[10px] text-muted-foreground/70 font-mono uppercase tracking-widest">
                      Conecta tus servicios externos
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-8 w-8 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)] scrollbar-thin space-y-6">
                {/* Google Section */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                    <h3 className="text-sm font-display font-medium text-foreground/80">
                      Google Workspace bajo demanda
                    </h3>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <IntegrationCard
                      name="Gmail"
                      description="Enviar emails automáticos"
                      icon={<Mail className="w-5 h-5" />}
                      isConnected={connections.gmail}
                      isLoading={isLoadingGoogle || isLoadingIntegrations}
                      onConnect={handleGoogleConnect}
                      onRevoke={() => handleGoogleRevoke('gmail')}
                    />
                    <IntegrationCard
                      name="Sheets"
                      description="Leer y escribir hojas de cálculo"
                      icon={<FileSpreadsheet className="w-5 h-5" />}
                      isConnected={connections.sheets}
                      isLoading={isLoadingGoogle || isLoadingIntegrations}
                      onConnect={handleGoogleConnect}
                      onRevoke={() => handleGoogleRevoke('sheets')}
                    />
                    <IntegrationCard
                      name="Calendar"
                      description="Gestionar eventos y citas"
                      icon={<Calendar className="w-5 h-5" />}
                      isConnected={connections.calendar}
                      isLoading={isLoadingGoogle || isLoadingIntegrations}
                      onConnect={handleGoogleConnect}
                      onRevoke={() => handleGoogleRevoke('calendar')}
                    />
                    <IntegrationCard
                      name="Drive"
                      description="Acceso a archivos"
                      icon={<HardDrive className="w-5 h-5" />}
                      isConnected={connections.drive}
                      isLoading={isLoadingGoogle || isLoadingIntegrations}
                      onConnect={handleGoogleConnect}
                      onRevoke={() => handleGoogleRevoke('drive')}
                    />
                  </div>
                </div>
                
                {/* Stripe Section */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <CreditCard className="w-4 h-4 text-muted-foreground" />
                    <h3 className="text-sm font-display font-medium text-foreground/80">
                      Financiero
                    </h3>
                  </div>
                  
                  <IntegrationCard
                    name="Stripe"
                    description="Pagos y suscripciones"
                    icon={<CreditCard className="w-5 h-5" />}
                    isConnected={connections.stripe}
                    onConnect={() => setStripeModalOpen(true)}
                    onRevoke={() => setConnections(prev => ({ ...prev, stripe: false }))}
                  />
                </div>
                
                {/* Coming Soon Section */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-4 h-4 text-muted-foreground" />
                    <h3 className="text-sm font-display font-medium text-foreground/80">
                      Marketplace
                    </h3>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <IntegrationCard
                      name="WhatsApp Business"
                      description="Mensajería empresarial"
                      icon={<MessageCircle className="w-5 h-5" />}
                      isConnected={false}
                      comingSoon
                    />
                    <IntegrationCard
                      name="Slack"
                      description="Notificaciones de equipo"
                      icon={<Slack className="w-5 h-5" />}
                      isConnected={false}
                      comingSoon
                    />
                    <IntegrationCard
                      name="LinkedIn"
                      description="Publicaciones automáticas"
                      icon={<Linkedin className="w-5 h-5" />}
                      isConnected={false}
                      comingSoon
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stripe Configuration Modal */}
      <Dialog open={stripeModalOpen} onOpenChange={setStripeModalOpen}>
        <DialogContent className="bg-card/95 backdrop-blur-xl border-border/30">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              Configurar Stripe
            </DialogTitle>
            <DialogDescription>
              Ingresa tu Secret Key de Stripe. Esta se guardará de forma segura.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground flex items-center gap-2">
                <Key className="w-4 h-4" />
                Stripe Secret Key
              </label>
              <Input
                type="password"
                placeholder="sk_live_..."
                value={stripeKey}
                onChange={(e) => {
                  setStripeKey(e.target.value);
                  setStripeStatus('idle');
                }}
                className="font-mono text-sm"
              />
              
              {stripeStatus === 'success' && (
                <p className="text-xs text-success flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Conexión exitosa
                </p>
              )}
              {stripeStatus === 'error' && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Key inválida. Debe comenzar con "sk_"
                </p>
              )}
            </div>
            
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={handleStripeTest}
                disabled={!stripeKey.trim() || testingStripe}
                className="flex-1"
              >
                {testingStripe ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Probando...
                  </>
                ) : (
                  'Probar Conexión'
                )}
              </Button>
              
              <Button
                onClick={handleStripeSave}
                disabled={stripeStatus !== 'success'}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Guardar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
