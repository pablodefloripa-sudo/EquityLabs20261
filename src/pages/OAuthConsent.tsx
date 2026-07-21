import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, ExternalLink, Lock, KeyRound } from "lucide-react";

const OAuthConsent = () => {
  const [searchParams] = useSearchParams();

  const appName = searchParams.get("client_name") || searchParams.get("app_name") || "Aplicación externa";
  const redirectUri = searchParams.get("redirect_uri") || "";
  const scope = searchParams.get("scope") || "";
  const scopes = useMemo(
    () => scope.split(" ").map((item) => item.trim()).filter(Boolean),
    [scope],
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <div className="absolute inset-0 circuit-bg opacity-40 pointer-events-none" />
      <Card className="relative w-full max-w-2xl border-cyan-400/20 bg-card/90 backdrop-blur-xl shadow-2xl">
        <CardHeader className="space-y-4 border-b border-cyan-400/10">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-500/10">
              <ShieldCheck className="h-5 w-5 text-cyan-300" />
            </div>
            <div>
              <CardTitle className="font-display text-2xl text-cyan-200">
                Consentimiento OAuth
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Estás autorizando a <span className="text-foreground">{appName}</span> a acceder a tu cuenta.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 p-6">
          <div className="rounded-xl border border-border/60 bg-background/40 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <KeyRound className="h-4 w-4 text-primary" />
              Permisos solicitados
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {scopes.length > 0 ? (
                scopes.map((item) => (
                  <Badge key={item} variant="secondary" className="rounded-full border border-cyan-400/20 bg-cyan-500/10 text-cyan-100">
                    {item}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">No se recibieron scopes en la URL.</span>
              )}
            </div>
          </div>

          <div className="grid gap-3 rounded-xl border border-border/60 bg-background/30 p-4 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
              <p>Supabase solo debería mostrar esta pantalla cuando el flujo OAuth esté correctamente configurado en el proyecto.</p>
            </div>
            <div className="flex items-start gap-3">
              <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
              <p>
                Redirect URI esperado:
                <span className="ml-1 font-mono text-xs text-foreground">
                  {redirectUri || "no provisto"}
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button variant="outline" className="border-border/70">
              Cancelar
            </Button>
            <Button className="bg-cyan-500 text-cyan-950 hover:bg-cyan-400">
              Autorizar acceso
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OAuthConsent;
