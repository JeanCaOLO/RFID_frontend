# Contexto del proyecto — RFID Frontend

## Qué es
Dashboard web en tiempo real (React + Vite + TypeScript) para el sistema de
control de despacho RFID. Muestra las lecturas de tags, KPIs, gráficos, una
tabla con estado OK/Error y un módulo para mapear antenas a puertas de despacho.

## Rol dentro del sistema
- SOLO LEE de Supabase (histórico + Realtime) usando la anon key.
- El único componente que escribe lecturas es el backend Python (`RFID_backend`).
- El frontend SÍ escribe en la tabla `antennas` (módulo de mapeo).
- Se despliega como sitio estático en Render.

## Concepto de negocio
Cada antena está asociada a una puerta de despacho. El backend pregunta al WMS
si un tag debe salir por esa puerta. El campo `isValid` (de `tag_reads`) indica
si la lectura fue correcta. Los errores se muestran en rojo y en las alertas.

## Documentación de referencia
- `README.md`: uso, configuración, despliegue en Render.
- El modelo de datos y la arquitectura completa están en
  `RFID_backend/docs/ARCHITECTURE.md` y `RFID_backend/supabase_schema.sql`.
