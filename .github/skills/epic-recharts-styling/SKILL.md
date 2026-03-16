---
name: epic-recharts-styling
description: 'Guía para crear visualizaciones de datos y métricas. Úsalo SIEMPRE que se requiera generar un gráfico de líneas, barras o radar usando la librería Recharts.'
---

# Recharts Epic Styling

## Objetivo
Crear gráficos en tiempo real que luzcan profesionales, limpios y se integren con un modo oscuro, evitando el diseño por defecto de Recharts.

## Reglas de Implementación:
1. **Limpieza visual:** Ocultar siempre la cuadrícula (`CartesianGrid` con `strokeOpacity={0.1}` o eliminarla) y las líneas de los ejes X e Y (`axisLine={false}` y `tickLine={false}`).
2. **Tooltips Personalizados:** El `<Tooltip />` de Recharts debe tener SIEMPRE un `contentStyle` con fondo oscuro (`#1e293b`), borde (`#334155`) y texto claro, además de bordes redondeados.
3. **Efectos de Gradiente:** Para `<AreaChart />` o `<LineChart />`, definir un `<defs>` con un `<linearGradient>` que vaya del color principal (ej. `#0ea5e9`) a opacidad 0 en la base, creando un resplandor.
4. **Interactividad:** Asegurar que las líneas o barras tengan animaciones suaves habilitando `isAnimationActive={true}`.