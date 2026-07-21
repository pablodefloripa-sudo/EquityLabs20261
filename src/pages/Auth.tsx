import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, Loader2, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useGoogleOAuth } from '@/hooks/useGoogleOAuth';
import { buildAppUrl, buildAuthRedirectUrl } from '@/lib/auth-redirect';
import { hasPendingGoogleOAuth } from '@/lib/oauth-state';

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading: isAuthBootstrapping, signIn, signUp } = useAuth();
  const { connectGoogle, handleOAuthCallback } = useGoogleOAuth();
  const { toast } = useToast();

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOAuthResolving, setIsOAuthResolving] = useState(false);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<string | null>(null);

  useEffect(() => {
    const hasOAuthPayload = location.search.includes('code=') || location.hash.includes('access_token=');
    const shouldResolveGoogleOAuth = hasOAuthPayload && hasPendingGoogleOAuth();

    if (!shouldResolveGoogleOAuth) return;

    let active = true;

    const finalizeOAuth = async () => {
      setIsOAuthResolving(true);
      const ok = await handleOAuthCallback();

      if (!active) return;

      if (ok) {
        window.location.replace(buildAppUrl('/dashboard'));
        return;
      }

      setIsOAuthResolving(false);
      toast({
        title: 'No se pudo completar Google',
        description: 'Google regreso bien, pero la sesion no termino de iniciarse.',
        variant: 'destructive',
      });
    };

    finalizeOAuth();

    return () => {
      active = false;
    };
  }, [handleOAuthCallback, location.hash, location.search, navigate, toast]);

  useEffect(() => {
    if (!isAuthBootstrapping && !isOAuthResolving && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthBootstrapping, isOAuthResolving, isAuthenticated, navigate]);

  const handleGoogleLogin = async () => {
    await connectGoogle();
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      toast({ title: 'Ingresa tu email', description: 'Necesito tu email para enviarte el enlace.', variant: 'destructive' });
      return;
    }

    try {
      const { supabase } = await import('@/integrations/supabase/runtime-client');
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: buildAuthRedirectUrl('/reset-password'),
      });

      if (error) throw error;

      toast({ title: 'Revisa tu email', description: 'Te enviamos un enlace para restablecer tu contrasena.' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'No se pudo enviar el email.', variant: 'destructive' });
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setIsSubmitting(true);
    try {
      if (mode === 'login') {
        await signIn(email.trim(), password);
        navigate('/dashboard', { replace: true });
      } else {
        const authResult = await signUp(email.trim(), password);

        if (authResult.session) {
          navigate('/dashboard', { replace: true });
          return;
        }

        setPendingVerificationEmail(email.trim());
        setPassword('');
        setMode('login');
        toast({
          title: 'Cuenta creada',
          description: 'Te enviamos un email para confirmar tu cuenta. Despues volve a iniciar sesion.',
        });
      }
    } catch (error: any) {
      const msg = error.message || 'Error de autenticacion';
      toast({
        title: mode === 'login' ? 'Error al iniciar sesion' : 'Error al registrarse',
        description: msg.includes('Invalid login') ? 'Email o contrasena incorrectos.' : msg,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthBootstrapping || isOAuthResolving) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            {isOAuthResolving ? 'Conectando tu cuenta de Google...' : 'Cargando acceso...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
      <div className="absolute inset-0 circuit-bg opacity-20" />

      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => navigate('/landing')}
        className="absolute top-6 left-6 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors z-20"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back</span>
      </motion.button>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative z-10 w-full max-w-md mx-6"
      >
        <div className="glass-card p-8 border border-border/30">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-display font-bold">
              <span className="text-primary">EQuity</span>
              <span className="text-foreground/80">Labs</span>
            </h1>
            <p className="text-muted-foreground mt-2">
              {mode === 'login' ? 'Iniciar sesion' : 'Crear cuenta'}
            </p>
          </div>

          {pendingVerificationEmail && mode === 'login' && (
            <div className="mb-5 rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-left">
              <p className="text-sm font-semibold text-emerald-200">Cuenta creada correctamente</p>
              <p className="mt-1 text-xs leading-relaxed text-emerald-50/80">
                Revisa <span className="font-mono text-emerald-100">{pendingVerificationEmail}</span>, confirma tu email y luego entra desde esta pantalla.
              </p>
            </div>
          )}

          <Button
            onClick={handleGoogleLogin}
            className="w-full h-12 rounded-xl font-display font-semibold text-sm tracking-wide flex items-center justify-center gap-3 bg-foreground/90 hover:bg-foreground text-background transition-all duration-300"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuar con Google
          </Button>
          <p className="mt-3 text-center text-xs text-muted-foreground/70">
            Si tu cuenta fue creada con Google, vuelve a entrar con ese boton.
          </p>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-border/30" />
            <span className="text-xs text-muted-foreground/60 font-mono">o</span>
            <div className="flex-1 h-px bg-border/30" />
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-muted-foreground text-xs flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" /> Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 rounded-xl bg-muted/20 border-border/30 font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-muted-foreground text-xs flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" /> Contrasena
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="h-11 rounded-xl bg-muted/20 border-border/30 font-mono text-sm pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 rounded-xl font-display font-semibold text-sm bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {mode === 'login' ? 'Iniciar sesion' : 'Crear cuenta'}
            </Button>

            {mode === 'login' && (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="w-full text-center text-xs text-muted-foreground/70 hover:text-primary transition-colors"
                >
                  Olvidaste tu contrasena?
                </button>
                <p className="text-center text-[11px] text-muted-foreground/55">
                  Si te registraste con Google, no hace falta resetear clave: usa "Continuar con Google".
                </p>
              </div>
            )}
          </form>

          <p className="text-center text-xs text-muted-foreground/60 mt-5">
            {mode === 'login' ? 'No tenes cuenta?' : 'Ya tenes cuenta?'}{' '}
            <button
              onClick={() => {
                setPendingVerificationEmail(null);
                setMode(mode === 'login' ? 'signup' : 'login');
              }}
              className="text-primary hover:underline font-medium"
            >
              {mode === 'login' ? 'Registrate' : 'Inicia sesion'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
