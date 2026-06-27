
## Objetivo
Unificar visualmente todos los modales del dashboard con el estilo del "Centro de Herramientas": fondo zinc-950, bordes cyan neón sutiles, glassmorphism, iconos pequeños (18-20px), tipografía display, acentos cyan/verde/rosa.

## Token visual compartido
Crear una clase utilitaria reutilizable (en `src/index.css`) para no repetir estilos:

```css
.modal-cyber {
  background: rgba(10,10,10,0.92);
  border: 1px solid hsl(var(--primary) / 0.3); /* cyan glow */
  box-shadow: 0 0 40px hsl(var(--primary) / 0.15), inset 0 0 20px rgba(0,0,0,0.6);
  backdrop-filter: blur(24px);
}
.modal-cyber-card {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(34,211,238,0.15);
  backdrop-filter: blur(8px);
}
.modal-cyber-title { /* font-display, text-cyan-300, tracking-wide */ }
```

Acentos:
- Default / Tools → `cyan-400`
- Mascota → `pink-400 / fuchsia-400`
- Éxito / integraciones activas → `emerald-400`

Iconos: forzar `size={18}` (máx 20) en todos los modales unificados.

## Modales a refactorizar

1. **`MascotCreatorModal.tsx`** (rediseño mayor)
   - Reorganizar a layout 2 columnas equilibradas (en `lg:grid-cols-2`).
   - Columna izq: Identidad (Nombre PRIMERO, Especie, Avatar en tarjetas pequeñas 80×80, Personalidad, Backstory).
   - Columna der: Rol (Basic/Advanced), Sliders limpios (Autonomía, Empatía, Humor), Idiomas como chips.
   - Sección inferior full-width: Permisos / Funciones en grid compacto con checkboxes pequeños y badges de integración.
   - Aplicar `modal-cyber` al contenedor; iconos a 18px; acento rosa solo en header y botón "Crear Mascota".
   - Quitar tamaños gigantes; padding reducido (`p-4` / `gap-3`).

2. **`ProjectManagerModal.tsx`**
   - Reemplazar el dorado `#b49664` por la paleta cyan unificada (mantener verde para "Save Session" y rosa solo si aplica).
   - Aplicar `modal-cyber` al contenedor; tabs con underline cyan; iconos a 18px.
   - Mantener funcionalidad de upload, local folder, assets.

3. **`IntegrationCenter.tsx`**
   - Aplicar `modal-cyber`; tarjetas de integración con `modal-cyber-card`.
   - Iconos 18-20px; acento verde para "Conectado", cyan para CTA.

4. **`HistoryModal.tsx`, `ExitModal.tsx`, `BunkerModal.tsx`, `MascotTaskDialog.tsx`, `WallpaperSelector.tsx`**
   - Mismo contenedor `modal-cyber`, mismo header (título font-display cyan, botón X pequeño), mismos paddings.
   - `MascotTaskDialog` mantiene acento rosa (mascota), pero estructura idéntica.
   - `ExitModal` mantiene acento rojo solo en el botón destructivo.

5. **`ToolsMenu.tsx`** (referencia)
   - Sin cambios funcionales; sólo extraer su estilo a `modal-cyber` para que el resto lo herede.

## Tamaños y espaciados estándar
- Modal width: `max-w-3xl` (estándar) / `max-w-5xl` (Mascota, Tools).
- `max-h-[85vh]`, scroll interno con `scrollbar-thin`.
- Header: `p-4 border-b border-cyan-400/15`.
- Body: `p-5 space-y-4`.
- Botones primarios: `bg-cyan-500/15 border border-cyan-400/40 hover:bg-cyan-500/25 hover:shadow-[0_0_20px_rgba(34,211,238,0.35)]`.

## Detalles técnicos
- Todos los colores via tokens HSL (no hex hardcoded salvo el fondo base).
- Reutilizar `Button`, `Slider`, `Checkbox` shadcn ya presentes.
- Sin nuevas dependencias.
- Sin cambios de lógica/estado/back-end: solo presentación.

## Fuera de alcance
- No se tocan edge functions, hooks de datos, ni esquema Supabase.
- No se modifica `ToolsMenu` salvo extracción de clase compartida.
