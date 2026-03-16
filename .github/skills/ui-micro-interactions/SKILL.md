---
name: ui-micro-interactions
description: 'Guía de comportamiento interactivo. Úsalo al detallar botones, inputs de formularios, badges de estado o elementos clickeables.'
---

# UI Micro-interactions

## Reglas Obligatorias:
1. **Focus Rings:** Todos los `<input>`, `<select>` y `<button>` deben tener estados de focus claros usando `focus:outline-none focus:ring-2 focus:ring-sky-500/50`.
2. **Badges de Estado:** Los estados (Activo, Inactivo, Error) deben representarse con "Pills" (bordes muy redondeados `rounded-full`, padding pequeño `px-2 py-1`, texto en tamaño `text-xs`).
3. **Animaciones de Alerta:** Si un elemento requiere atención urgente, usar la clase `animate-pulse` de Tailwind sutilmente.
4. **Transiciones:** Aplicar `transition-all duration-300` a elementos que cambien de tamaño, color o sombra al interactuar.