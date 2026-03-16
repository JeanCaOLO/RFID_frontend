---
name: data-grid-architecture
description: 'Guía para estructurar tablas de datos complejas. Úsalo SIEMPRE que se te pida crear una tabla, un listado de registros o un visor de datos masivo.'
---

# Data Grid Architecture

## Objetivo
Asegurar que las tablas de datos sean manejables, no rompan el layout de la pantalla y tengan una excelente experiencia de usuario.

## Reglas Estructurales:
1. **Contenedor con Scroll:** El `<tbody>` o el contenedor principal de la tabla debe estar siempre envuelto en un `div` con altura máxima (`max-h-[Xpx]`) y `overflow-y-auto`.
2. **Cabeceras Fijas (Sticky):** Los `<th>` deben incluir la clase `sticky top-0` y tener un color de fondo sólido (ej. `bg-slate-800`) para que no se superpongan con los datos al hacer scroll.
3. **Alineación de Columnas:** Las celdas `<th>` y `<td>` correspondientes deben tener el mismo ancho (`w-[Xpx]` o porcentajes) y la misma alineación (`text-left`, `text-center`) para evitar descuadres visuales.
4. **Celdas Vacías:** Si un dato puede ser nulo o indefinido, usar un fallback visual elegante como un guion corto (`-`) con opacidad baja (`text-slate-500`).