import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Fingerprint,
  Loader2,
  Percent,
  RefreshCw
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { useReports, type DateRangePreset } from "../../hooks/useReports";
import { useExport } from "../../hooks/useExport";
import { formatTime } from "../../utils/formatters";

const RANGES: { value: DateRangePreset; label: string }[] = [
  { value: "24h", label: "Últimas 24h" },
  { value: "7d", label: "7 días" },
  { value: "30d", label: "30 días" },
  { value: "all", label: "Todo" }
];

const KpiCard = ({
  icon,
  label,
  value,
  sub,
  danger
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  danger?: boolean;
}) => (
  <div
    className={`rounded-xl border p-5 shadow-sm transition ${
      danger
        ? "border-red-500/50 bg-red-100/60 dark:bg-red-950/30"
        : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800"
    }`}
  >
    <div className="flex items-start gap-4">
      {icon}
      <div>
        <p className="text-xs uppercase text-slate-500 dark:text-slate-400">
          {label}
        </p>
        <p
          className={`mt-2 text-2xl font-bold ${
            danger ? "text-red-500" : "text-slate-900 dark:text-slate-50"
          }`}
        >
          {value}
        </p>
        {sub && (
          <p className="text-xs text-slate-500 dark:text-slate-400">{sub}</p>
        )}
      </div>
    </div>
  </div>
);

export const ReportsView = ({ timeZone }: { timeZone: string }) => {
  const [range, setRange] = useState<DateRangePreset>("7d");
  const {
    loading,
    error,
    summary,
    doorErrors,
    readerPerformance,
    trend,
    errorDetails,
    reload
  } = useReports(range);
  const { exportErrorReport } = useExport();

  return (
    <div className="flex flex-col gap-6">
      {/* Controles */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition ${
                range === r.value
                  ? "bg-sky-500 text-white shadow-glow"
                  : "border border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={reload}
            className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            <RefreshCw className="h-3 w-3" />
            Actualizar
          </button>
          <button
            onClick={() => exportErrorReport(errorDetails, doorErrors)}
            className="flex items-center gap-2 rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-white shadow-glow transition hover:bg-sky-400"
          >
            <Download className="h-3 w-3" />
            Exportar reporte
          </button>
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500">
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex items-center gap-2 py-12 text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          Generando reportes...
        </div>
      ) : (
        <>
          {/* KPIs */}
          <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              icon={<CheckCircle2 className="h-6 w-6 text-emerald-500" />}
              label="Lecturas válidas"
              value={String(summary.validReads)}
              sub={`de ${summary.totalReads} lecturas`}
            />
            <KpiCard
              icon={<Fingerprint className="h-6 w-6 text-sky-500" />}
              label="Tags únicos"
              value={String(summary.uniqueTags)}
            />
            <KpiCard
              icon={<AlertTriangle className="h-6 w-6 text-red-500" />}
              label="Puerta incorrecta"
              value={String(summary.errorReads)}
              sub="tags mal despachados"
              danger
            />
            <KpiCard
              icon={<Percent className="h-6 w-6 text-amber-500" />}
              label="Tasa de error"
              value={`${summary.errorRate.toFixed(1)}%`}
              sub="del total de lecturas"
              danger={summary.errorRate > 20}
            />
          </section>

          {/* Tendencia + Errores por puerta */}
          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-slate-900 dark:text-sky-300">
                Tendencia (OK vs Error)
              </h3>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#33415555" />
                    <XAxis dataKey="label" fontSize={10} stroke="currentColor" />
                    <YAxis fontSize={10} stroke="currentColor" allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        background: "#0f172a",
                        border: "1px solid rgba(148,163,184,0.2)",
                        borderRadius: 12
                      }}
                      labelStyle={{ color: "#f8fafc" }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line
                      type="monotone"
                      dataKey="ok"
                      name="OK"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="error"
                      name="Error"
                      stroke="#ef4444"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-slate-900 dark:text-sky-300">
                Errores por puerta de despacho
              </h3>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={doorErrors} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#33415555" />
                    <XAxis type="number" fontSize={10} stroke="currentColor" allowDecimals={false} />
                    <YAxis
                      type="category"
                      dataKey="door"
                      fontSize={10}
                      width={110}
                      stroke="currentColor"
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#0f172a",
                        border: "1px solid rgba(148,163,184,0.2)",
                        borderRadius: 12
                      }}
                      labelStyle={{ color: "#f8fafc" }}
                    />
                    <Bar dataKey="errors" name="Errores" radius={[0, 6, 6, 0]}>
                      {doorErrors.map((d) => (
                        <Cell
                          key={d.door}
                          fill={d.errors > 0 ? "#ef4444" : "#10b981"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          {/* Rendimiento por punto de control */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-slate-900 dark:text-sky-300">
              Rendimiento por punto de control
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="px-3 py-2">Lector</th>
                    <th className="px-3 py-2">Antena</th>
                    <th className="px-3 py-2">Total</th>
                    <th className="px-3 py-2">Errores</th>
                    <th className="px-3 py-2">Tasa de error</th>
                  </tr>
                </thead>
                <tbody>
                  {readerPerformance.map((r) => (
                    <tr
                      key={r.key}
                      className="border-t border-slate-200/70 dark:border-slate-700/60"
                    >
                      <td className="px-3 py-3 font-semibold text-slate-700 dark:text-slate-200">
                        {r.readerName}
                      </td>
                      <td className="px-3 py-3 text-slate-600 dark:text-slate-300">
                        Antena {r.antenna}
                      </td>
                      <td className="px-3 py-3 text-slate-600 dark:text-slate-300">
                        {r.total}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={
                            r.errors > 0 ? "text-red-500 font-semibold" : "text-slate-500"
                          }
                        >
                          {r.errors}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-24 rounded-full bg-slate-200 dark:bg-slate-900/60">
                            <div
                              className={`h-2 rounded-full ${
                                r.errorRate > 20 ? "bg-red-500" : "bg-emerald-500"
                              }`}
                              style={{ width: `${Math.min(r.errorRate, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-600 dark:text-slate-300">
                            {r.errorRate.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {readerPerformance.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-3 py-6 text-center text-slate-500">
                        Sin datos en el rango seleccionado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Detalle de tags con puerta incorrecta */}
          <section className="rounded-2xl border border-red-500/40 bg-white p-6 shadow-sm dark:border-red-500/30 dark:bg-slate-800">
            <div className="mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <h3 className="text-xs font-semibold uppercase tracking-[0.25em] text-red-500">
                Detalle de tags en puerta incorrecta ({errorDetails.length})
              </h3>
            </div>
            <div className="max-h-[400px] overflow-auto">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-white text-xs uppercase tracking-wider text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  <tr>
                    <th className="px-3 py-2">EPC</th>
                    <th className="px-3 py-2">Lector / Antena</th>
                    <th className="px-3 py-2">Puerta leída</th>
                    <th className="px-3 py-2">Puerta esperada</th>
                    <th className="px-3 py-2">Hora</th>
                  </tr>
                </thead>
                <tbody>
                  {errorDetails.map((e, i) => (
                    <tr
                      key={`${e.epc}-${i}`}
                      className="border-t border-slate-200/70 dark:border-slate-700/60"
                    >
                      <td className="px-3 py-2 font-mono text-red-400">{e.epc}</td>
                      <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                        {e.readerName} · Ant {e.antenna}
                      </td>
                      <td className="px-3 py-2 font-semibold text-red-400 line-through opacity-80">
                        {e.dockDoor ?? "—"}
                      </td>
                      <td className="px-3 py-2">
                        <span className="rounded border border-emerald-500/30 bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-500">
                          {e.expectedDockDoor ?? "—"}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-500 dark:text-slate-400">
                        {formatTime(e.timestamp, timeZone)}
                      </td>
                    </tr>
                  ))}
                  {errorDetails.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-3 py-6 text-center text-emerald-500">
                        Sin errores de despacho en el rango. Operación limpia.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
};
