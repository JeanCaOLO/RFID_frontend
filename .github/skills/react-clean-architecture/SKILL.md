---
name: react-clean-architecture
description: Guía de arquitectura para React. Úsalo SIEMPRE al crear nuevos componentes o al modificar componentes que superen las 200 líneas de código.
---

# React Clean Architecture & Anti-God Components

## Principios Obligatorios
1. **Single Responsibility (SRP):** Un componente debe hacer una sola cosa. Si un componente maneja la UI compleja, llamadas a API, websockets y lógica matemática compleja, DIVÍDELO INMEDIATAMENTE.
2. **Separación de Lógica (Custom Hooks):** Toda lógica de negocio compleja, cálculos de estado pesados, o suscripciones (WebSockets, Fetch) debe aislarse en un Custom Hook (ej. `useRFIDStream`, `useDataFilter`). El componente UI solo debe consumir datos y renderizar.
3. **Sub-componentes:** Si el método `return (...)` de un componente es demasiado extenso, extrae partes lógicas en sub-componentes dentro del mismo directorio (ej. Si `DataGrid` es muy grande, extraer `DataGridPagination` y `DataGridHeader`).
4. **Memoización Estratégica:** Usa `useMemo` para listas filtradas o datos procesados, y `useCallback` para funciones que se pasan a componentes hijos, evitando re-renders innecesarios.