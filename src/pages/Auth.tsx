import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, Loader2, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useGoogleOAuth } from '@/hooks/useGoogleOAuth';

const Auth = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: isAuthBootstrapping, signIn, signUp } = useAuth();
  const { connectGoogle } = useGoogleOAuth();
  const { toast } = useToast();

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthBootstrapping && isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthBootstrapping, isAuthenticated, navigate]);

  const handleGoogleLogin = async () => {
    await connectGoogle();
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      toast({ title: 'Ingresá tu email', description: 'Necesito tu email para enviarte el enlace.', variant: 'destructive' });
      return;
    }
    try {
      const { supabase } = await import('@/integrations/supabase/runtime-client');
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast({ title: 'Revisá tu email', description: 'Te enviamos un enlace para restablecer tu contraseña.' });
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
        navigate('/', { replace: true });
      } else {
        await signUp(email.trim(), password);
        toast({
          title: 'Cuenta creada',
          description: 'Revisá tu email para confirmar tu cuenta.',
        });
      }
    } catch (error: any) {
      const msg = error.message || 'Error de autenticación';
      toast({
        title: mode === 'login' ? 'Error al iniciar sesión' : 'Error al registrarse',
        description: msg.includes('Invalid login') ? 'Email o contraseña incorrectos.' : msg,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthBootstrapping) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
              {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
            </p>
          </div>

          {/* Google OAuth */}
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

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-border/30" />
            <span className="text-xs text-muted-foreground/60 font-mono">o</span>
            <div className="flex-1 h-px bg-border/30" />
          </div>

          {/* Email/Password Form */}
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
                <Lock className="w-3.5 h-3.5" /> Contraseña
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
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
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
            </Button>

            {mode === 'login' && (
              <button
                type="button"
                onClick={handleForgotPassword}
                className="w-full text-center text-xs text-muted-foreground/70 hover:text-primary transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </button>
            )}
          </form>

          {/* Toggle mode */}
          <p className="text-center text-xs text-muted-foreground/60 mt-5">
            {mode === 'login' ? '¿No tenés cuenta?' : '¿Ya tenés cuenta?'}{' '}
            <button
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              className="text-primary hover:underline font-medium"
            >
              {mode === 'login' ? 'Registrate' : 'Iniciá sesión'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
