/**
 * eQuityLabs v1.1 - Sistema Purificado
 * Se eliminó la dependencia de mapas para priorizar estabilidad y seguridad.
 */
export function GoogleMapsBackground() {
  return (
    <div className="fixed inset-0 -z-50 bg-[#0B0E14]">
      {/* Fondo sólido. Sin APIs. Sin errores. Foco total. */}
      <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_top_right,_rgba(34,197,94,0.15),transparent)]" />
    </div>
  );
}
