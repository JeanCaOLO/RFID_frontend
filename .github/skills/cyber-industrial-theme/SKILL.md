---
name: cyber-industrial-theme
description: 'Guía de estilos para componentes UI. Úsalo SIEMPRE que se te pida crear o estilizar un componente visual, botón, tarjeta o layout en el frontend.'
---

# Cyber-Industrial Design System

## Objetivo
Garantizar que todos los nuevos componentes React mantengan la estética oscura y de alto contraste del proyecto.

## Reglas de Tailwind CSS obligatorias:
1. **Fondos:** Usar SIEMPRE `bg-slate-900` para fondos principales y `bg-slate-800` para tarjetas o paneles secundarios. Nunca usar blanco o gris claro puro.
2. **Textos:** Usar `text-slate-50` para texto principal y `text-slate-400` para texto secundario o de soporte.
3. **Acentos (Neón):** - Primario (Información/Bordes): `sky-500`.
   - Éxito/Activo: `emerald-500`.
   - Alerta/Error: `red-500` o `amber-500`.
4. **Bordes y Sombras:** Las tarjetas deben tener `border border-slate-700`. Para elementos destacados, usar un efecto glow leve con `shadow-[0_0_15px_rgba(14,165,233,0.2)]` (o el color correspondiente).
5. **Estado Hover:** Todos los botones interactivos deben tener `transition-colors` y cambiar su fondo o borde (ej. `hover:border-sky-400 hover:text-sky-400`).