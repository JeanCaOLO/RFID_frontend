# Guía técnica — RFID Frontend

## Stack
- React 18 + TypeScript + Vite 5
- Tailwind CSS 3
- Recharts (gráficos)
- lucide-react (iconos)
- date-fns (fechas)
- xlsx (exportación a Excel)
- @supabase/supabase-js (datos + Realtime)

## Estructura
- `src/lib/supabase.ts` — cliente Supabase (VITE_SUPABASE_URL + anon key).
- `src/hooks/useRFIDStream.ts` — histórico + suscripción Realtime a `tag_reads`.
- `src/hooks/useAntennaMapping.ts` — CRUD del mapeo (tabla `antennas`).
- `src/hooks/useExport.ts` — exportación a Excel.
- `src/hooks/useTheme.ts` — tema claro/oscuro.
- `src/components/mapping/AntennaMapping.tsx` — UI del mapeo.
- `src/components/table/DataGrid.tsx` — tabla de lecturas (agrupa por EPC).
- `src/components/dashboard/KpiGrid.tsx` — KPIs.
- `src/components/charts/*` — gráficos RSSI y distribución.
- `src/types/rfid.types.ts` — tipos de dominio + filas de Supabase (`TagReadRow`, `AntennaRow`, `ReaderRow`).

## Convenciones
- Config vía env vars con prefijo `VITE_` (`.env.local`, plantilla en `.env.example`).
- La anon key es pública por diseño; la seguridad la da RLS en Supabase.
- Los datos crudos de Supabase (snake_case) se mapean a tipos de dominio
  (camelCase) en los hooks. No usar snake_case en componentes.
- El estado de validez viene del backend en `isValid` (no se recalcula en el front).
- Mantener tema claro/oscuro con clases `dark:` de Tailwind.

## Comandos
```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # dist/ (verificar SIEMPRE tras cambios)
```

## Al hacer cambios
- Si cambia el esquema de Supabase, actualiza los tipos en `rfid.types.ts`.
- Corre `npm run build` para validar TypeScript antes de terminar.
- No reintroducir `server.js`/`simulador.js`: el flujo es 100% Supabase.
