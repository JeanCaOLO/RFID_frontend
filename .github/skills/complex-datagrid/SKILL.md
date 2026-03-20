---
name: complex-datagrid
description: Estándares para listas de datos y tablas. Úsalo cuando interactúes con componentes que renderizan arrays masivos de datos (ej. DataGrid).
---

# Complex DataGrid Management

## Reglas de Interfaz y UX
1. **Alineación Estricta:** Las cabeceras (`<th>`) y las celdas de datos (`<td>`) deben tener el MISMO ancho (`w-[X]`) y la MISMA alineación de texto (`text-left`, `text-center`) para que el eje X sea visualmente perfecto.
2. **Estados Condicionales Visuales:** Si un registro tiene un estado de "Error" (ej. `isValid: false`), la fila completa debe reaccionar visualmente (ej. `bg-red-500/10` en modo oscuro, o un equivalente en modo claro).
3. **Paginación Inteligente:** Nunca renderizar todos los números de página a la vez. Implementar siempre truncamiento con puntos suspensivos (`...`) si hay más de 7 páginas.
4. **Auto-Scroll Controlado:** Si una tabla recibe datos en tiempo real, el auto-scroll debe pausarse automáticamente si el usuario decide hacer scroll hacia arriba para investigar un registro antiguo.