import { AlertTriangle, Antenna, Loader2, Radio, WifiOff } from "lucide-react";
import type { AntennaRow, ReaderStatus } from "../../types/rfid.types";

const formatPower = (value: number | null) =>
  value === null || value === undefined ? "—" : `${Number(value)} dBm`;

const antennaStyle = (status: AntennaRow["connection_status"], dimmed: boolean) => {
  if (dimmed || status === "unknown") {
    return {
      box: "border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60",
      dot: "bg-slate-400",
      label: "Sin datos",
      text: "text-slate-500 dark:text-slate-400"
    };
  }
  if (status === "connected") {
    return {
      box: "border-emerald-300 bg-emerald-50 dark:border-emerald-500/40 dark:bg-emerald-500/10",
      dot: "bg-emerald-500",
      label: "Conectada",
      text: "text-emerald-700 dark:text-emerald-300"
    };
  }
  return {
    box: "border-red-300 bg-red-50 dark:border-red-500/50 dark:bg-red-500/10",
    dot: "bg-red-500 animate-pulse",
    label: "Desconectada",
    text: "text-red-700 dark:text-red-300"
  };
};

const ReaderBadge = ({ reader }: { reader: ReaderStatus }) => {
  if (reader.isStale) {
    return (
      <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
        Sin datos
      </span>
    );
  }
  return reader.is_online ? (
    <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-300">
      En línea
    </span>
  ) : (
    <span className="flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-semibold text-red-600 dark:text-red-300">
      <WifiOff className="h-3 w-3" />
      Sin conexión
    </span>
  );
};

/**
 * Visualizador del estado de cada lector y sus antenas (lo reporta el backend
 * consultando cada lector). Resalta en rojo las antenas desconectadas.
 */
export const ReaderStatusPanel = ({
  readers,
  loading,
  backendStale
}: {
  readers: ReaderStatus[];
  loading: boolean;
  backendStale: boolean;
}) => (
  <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-colors duration-300 dark:border-slate-700 dark:bg-slate-800">
    <div className="mb-4 flex items-center gap-2">
      <Radio className="h-5 w-5 text-sky-500" />
      <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-900 dark:text-sky-300">
        Estado de lectores
      </h3>
    </div>

    {backendStale && (
      <p className="mb-4 flex items-center gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
        <AlertTriangle className="h-4 w-4" />
        El backend no está reportando estado: verifica que esté en ejecución.
      </p>
    )}

    {loading ? (
      <div className="flex items-center gap-2 py-6 text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Cargando lectores...
      </div>
    ) : (
      <div className="grid gap-4 md:grid-cols-3">
        {readers.map((reader) => {
          const dimmed = reader.isStale || !reader.is_online;
          return (
            <div
              key={reader.id}
              className="rounded-xl border border-slate-200 p-4 dark:border-slate-700"
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-100">
                    {reader.name}
                  </p>
                  <p className="font-mono text-xs text-slate-500 dark:text-slate-400">
                    {reader.host ?? "—"}
                  </p>
                </div>
                <ReaderBadge reader={reader} />
              </div>

              <div className="grid grid-cols-2 gap-2">
                {reader.antennas.map((antenna) => {
                  const style = antennaStyle(antenna.connection_status, dimmed);
                  return (
                    <div
                      key={antenna.id}
                      className={`rounded-lg border p-2 ${style.box}`}
                      title={antenna.wms_reader_id ?? undefined}
                    >
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
                          <Antenna className="h-3 w-3" />
                          Antena {antenna.antenna_port}
                        </span>
                        <span className={`h-2.5 w-2.5 rounded-full ${style.dot}`} />
                      </div>
                      <p className="mt-1 truncate font-mono text-xs text-sky-600 dark:text-sky-400">
                        {antenna.dock_door ?? "—"}
                      </p>
                      <div className="mt-1 flex items-center justify-between text-[11px]">
                        <span className={style.text}>{style.label}</span>
                        <span className="text-slate-500 dark:text-slate-400">
                          {formatPower(antenna.applied_tx_power_dbm)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {!reader.isStale && reader.last_error && (
                <p
                  className="mt-3 truncate text-xs text-red-500"
                  title={reader.last_error}
                >
                  {reader.last_error}
                </p>
              )}
            </div>
          );
        })}
      </div>
    )}
  </section>
);

/** Banner global con las antenas/lectores con problemas. */
export const ReaderAlertBanner = ({ issues }: { issues: string[] }) =>
  issues.length === 0 ? null : (
    <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/50 dark:bg-red-500/10 dark:text-red-300">
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 animate-pulse" />
      <div>
        <p className="font-semibold">
          {issues.length === 1 ? "1 problema en lectores" : `${issues.length} problemas en lectores`}
        </p>
        <ul className="mt-1 list-inside list-disc">
          {issues.map((issue) => (
            <li key={issue}>{issue}</li>
          ))}
        </ul>
      </div>
    </div>
  );
