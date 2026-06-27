import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/runtime-client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Check, Zap, Crown, Rocket } from 'lucide-react';

const plans = [
  {
    name: 'FREE',
    price: '$0',
    period: '/mes',
    icon: <Zap className="w-6 h-6" />,
    features: ['1 agente IA', '100 mensajes/mes', 'Integraciones básicas', 'Soporte comunitario'],
    planKey: 'free',
    highlight: false,
  },
  {
    name: 'PRO',
    price: '$29',
    period: '/mes',
    icon: <Crown className="w-6 h-6" />,
    features: ['5 agentes IA', 'Mensajes ilimitados', 'Todas las integraciones', 'Soporte prioritario'],
    planKey: 'pro',
    highlight: true,
  },
  {
    name: 'ENTERPRISE',
    price: 'Custom',
    period: '',
    icon: <Rocket className="w-6 h-6" />,
    features: ['Agentes ilimitados', 'API dedicada', 'SLA garantizado', 'Soporte 24/7'],
    planKey: 'enterprise',
    highlight: false,
  },
];

const Suscripciones = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  const handleSelectPlan = async (planKey: string) => {
    if (planKey !== 'free') {
      toast.info('Próximamente disponible');
      return;
    }

    try {
      setLoading(planKey);

      if (!isAuthenticated || !user) {
        navigate('/auth');
        return;
      }

      const { error: upsertError } = await supabase
        .from('user_planes' as any)
        .upsert({
          user_id: user.id,
          plan: 'free',
          status: 'active',
          start_date: new Date().toISOString(),
          end_date: null,
        } as any, { onConflict: 'user_id' });

      if (upsertError) {
        console.error('Error al guardar el plan:', upsertError);
        toast.error('Error al activar el plan');
        return;
      }

      toast.success('¡Plan FREE activado!');
      navigate('/');
    } catch (error) {
      console.error('Error inesperado:', error);
      toast.error('Error inesperado');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <h1 className="text-3xl font-bold text-foreground mb-2">Elige tu plan</h1>
      <p className="text-muted-foreground mb-10">Selecciona el plan que mejor se adapte a tus necesidades</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full">
        {plans.map((plan) => (
          <div
            key={plan.planKey}
            className={`rounded-2xl border p-6 flex flex-col transition-all ${
              plan.highlight
                ? 'border-primary bg-primary/5 shadow-lg scale-105'
                : 'border-border bg-card'
            }`}
          >
            <div className="flex items-center gap-2 mb-4 text-primary">
              {plan.icon}
              <span className="font-semibold text-lg text-foreground">{plan.name}</span>
            </div>

            <div className="mb-6">
              <span className="text-4xl font-bold text-foreground">{plan.price}</span>
              <span className="text-muted-foreground text-sm">{plan.period}</span>
            </div>

            <ul className="flex-1 space-y-3 mb-6">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSelectPlan(plan.planKey)}
              disabled={loading === plan.planKey}
              className={`w-full py-2.5 rounded-lg font-medium transition-colors ${
                plan.highlight
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              } disabled:opacity-50`}
            >
              {loading === plan.planKey ? 'Activando...' : 'Seleccionar'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Suscripciones;
