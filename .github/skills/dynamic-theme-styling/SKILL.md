---
name: dynamic-theme-styling
description: Sistema de diseño dual. Úsalo SIEMPRE que modifiques o crees elementos visuales, estilos, layouts o componentes de UI con Tailwind CSS.
---

# Dynamic Theme Styling (Light / Dark)

## Reglas de Tailwind CSS
1. **Soporte Dual Obligatorio:** Todo color aplicado debe tener su contraparte para el modo oscuro usando la variante `dark:`.
2. **Fondos Estructurales:**
   - Modo Claro: `bg-slate-100` (Main), `bg-white` (Tarjetas/Paneles).
   - Modo Oscuro: `dark:bg-slate-900` (Main), `dark:bg-slate-800` (Tarjetas/Paneles).
3. **Textos:**
   - Textos Principales: `text-slate-900 dark:text-slate-50`.
   - Textos Secundarios: `text-slate-500 dark:text-slate-400`.
4. **Acentos "Cyber-Industrial" (Se mantienen en ambos modos):**
   - Primario / Información: `sky-500`.
   - Éxito / Validación OK: `emerald-500`.
   - Error / Desvío: `red-500`.
   - Warning: `amber-500`.
5. **Transiciones:** TODO contenedor, botón o texto que cambie de color debe tener `transition-colors duration-300` para que el cambio de tema entre claro y oscuro sea suave y profesional.