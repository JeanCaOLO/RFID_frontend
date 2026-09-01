# RFID Dashboard — Frontend (React + Vite + Supabase)

Dashboard web en tiempo real para el sistema de control de despacho RFID.
Consume las lecturas directamente de **Supabase** (histórico + Realtime), sin
servidor intermedio. Se despliega como sitio estático en **Render**.

---

## Qué muestra

- **Estado de conexión** en vivo (suscripción Realtime a Supabase).
- **KPIs**: lecturas únicas/total, antena más activa, mejor RSSI, alertas de
  despacho (errores reportados por el WMS).
- **Gráficos** (Recharts): RSSI en el tiempo y distribución por antena.
- **Tabla** agrupada por EPC con estado OK/Error, lector, antena, puerta y
  puerta esperada, ordenamiento, paginación y exportación a Excel.
- **Mapeo de antenas**: módulo para asignar cada antena a una puerta de
  despacho (CRUD sobre la tabla `antennas` de Supabase).

---

## Arquitectura

```
Supabase (Postgres + Realtime)
   ▲  ▲
   │  └── read: histórico (tag_reads), mapeo (antennas, readers)
   │      write: mapeo de antenas
   │  realtime: nuevas lecturas (INSERT en tag_reads)
   │
Frontend React (Vite) — desplegado en Render
```

El backend Python es quien **escribe** las lecturas en Supabase. El frontend
solo **lee** y se **suscribe**.

---

## Estructura relevante

| Ruta | Responsabilidad |
|---|---|
| `src/lib/supabase.ts` | Cliente Supabase (URL + anon key). |
| `src/hooks/useRFIDStream.ts` | Histórico + suscripción Realtime a `tag_reads`. |
| `src/hooks/useAntennaMapping.ts` | CRUD del mapeo antena→puerta. |
| `src/hooks/useExport.ts` | Exportación a Excel. |
| `src/hooks/useTheme.ts` | Tema claro/oscuro. |
| `src/components/mapping/AntennaMapping.tsx` | UI del mapeo de antenas. |
| `src/components/table/DataGrid.tsx` | Tabla de lecturas. |
| `src/components/dashboard/KpiGrid.tsx` | Tarjetas KPI. |
| `src/components/charts/*` | Gráficos RSSI y distribución. |
| `src/types/rfid.types.ts` | Tipos + filas de Supabase. |

---

## Configuración

Crea `.env.local` (ya incluido) a partir de `.env.example`:

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=...     # pública, protegida por RLS
```

> La anon key es pública por diseño. La seguridad la da Row Level Security (RLS)
> configurado en `supabase_schema.sql` del backend.

---

## Desarrollo

```bash
npm install
npm run dev        # http://localhost:5173
```

Para ver datos, corre el backend en modo simulador (ver `RFID_backend`):

```bash
python main.py --mode simulate
```

Las lecturas aparecerán en el dashboard en tiempo real.

---

## Build y despliegue en Render

```bash
npm run build      # genera dist/
```

**Render (Static Site):** el repo incluye `render.yaml`.

1. New → Static Site → conecta el repo (carpeta `RFID_frontend`).
2. Build command: `npm install && npm run build`
3. Publish directory: `dist`
4. Variables de entorno: `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.

El rewrite `/* → /index.html` ya está configurado para el ruteo SPA.
