import { useState } from "react";
import {
  Truck,
  RefreshCw,
  PackageCheck,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Package
} from "lucide-react";
import { useTruckLoad } from "../../hooks/useTruckLoad";
import type { TruckLoadRow } from "../../types/rfid.types";
import { formatTime } from "../../utils/formatters";

type TruckLoadProps = {
  timeZone: string;
};

const statusBadge = (status: TruckLoadRow["status"]) => {
  switch (status) {
    case "closed":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-500">
          <CheckCircle2 className="h-3 w-3" /> Cerrado
        </span>
      );
    case "closing":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/15 px-2 py-0.5 text-xs font-semibold text-sky-500">
          <Loader2 className="h-3 w-3 animate-spin" /> Cerrando…
        </span>
      );
    case "error":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-semibold text-red-500">
          <AlertTriangle className="h-3 w-3" /> Error
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
          <Package className="h-3 w-3" /> En carga
        </span>
      );
  }
};

export const TruckLoad = ({ timeZone }: TruckLoadProps) => {
  const {
    groups,
    loading,
    error,
    reload,
    executeClose,
    executeCloseAll,
    hasPending
  } = useTruckLoad();
  const [closingPlaca, setClosingPlaca] = useState<string | null>(null);
  const [closingAll, setClosingAll] = useState(false);

  const handleClose = async (placa: string) => {
    setClosingPlaca(placa);
    await executeClose(placa);
    // El estado real ('closed'/'error') llega por Realtime desde el backend.
    setClosingPlaca(null);
  };

  const handleCloseAll = async () => {
    setClosingAll(true);
    await executeCloseAll();
    setClosingAll(false);
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-colors duration-300 dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Truck className="h-5 w-5 text-sky-500" />
          <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-900 dark:text-sky-300">
            Carga Camión
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCloseAll}
            disabled={!hasPending || closingAll}
            className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold transition ${
              !hasPending
                ? "cursor-not-allowed bg-slate-200 text-slate-400 dark:bg-slate-700 dark:text-slate-500"
                : closingAll
                ? "cursor-wait bg-emerald-500/70 text-white"
                : "bg-emerald-500 text-white shadow-glow hover:bg-emerald-600"
            }`}
          >
            {closingAll ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <PackageCheck className="h-3 w-3" />
            )}
            Cerrar todas las cargas
          </button>
          <button
            onClick={reload}
            className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-700 dark:text-slate-200"
          >
            <RefreshCw className="h-3 w-3" />
            Recargar
          </button>
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500">
          {error}
        </p>
      )}

      {loading && (
        <div className="flex items-center gap-2 py-8 text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Cargando…
        </div>
      )}

      {!loading && groups.length === 0 && (
        <div className="py-12 text-center text-slate-500 dark:text-slate-400">
          No hay pallets en carga. Los pallets validados aparecerán aquí
          agrupados por placa.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {groups.map((group) => {
          const isClosing =
            closingPlaca === group.placa ||
            group.pallets.some((p) => p.status === "closing");
          const pendientes = group.loadedCount;

          return (
            <div
              key={group.placa}
              className={`rounded-2xl border p-4 transition-colors ${
                group.allClosed
                  ? "border-emerald-500/40 bg-emerald-500/5"
                  : "border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/40"
              }`}
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-slate-500" />
                  <span className="font-mono text-base font-bold text-slate-900 dark:text-slate-100">
                    {group.placa}
                  </span>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {group.pallets.length} pallet
                  {group.pallets.length !== 1 ? "s" : ""}
                  {group.closedCount > 0 &&
                    ` · ${group.closedCount} cerrado${
                      group.closedCount !== 1 ? "s" : ""
                    }`}
                </span>
              </div>

              <ul className="mb-4 max-h-56 space-y-1 overflow-y-auto">
                {group.pallets.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm dark:bg-slate-800"
                  >
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-800 dark:text-slate-100">
                        {p.pallet}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {p.dock_door ?? "—"} ·{" "}
                        {formatTime(p.loaded_at, timeZone)}
                      </span>
                      {p.status === "error" && p.close_error && (
                        <span className="text-[11px] text-red-400">
                          {p.close_error}
                        </span>
                      )}
                    </div>
                    {statusBadge(p.status)}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleClose(group.placa)}
                disabled={isClosing || group.allClosed || pendientes === 0}
                className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                  group.allClosed
                    ? "cursor-not-allowed bg-emerald-500/20 text-emerald-500"
                    : isClosing
                    ? "cursor-wait bg-sky-500/70 text-white"
                    : "bg-sky-500 text-white shadow-glow hover:bg-sky-600"
                }`}
              >
                {group.allClosed ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Carga cerrada
                  </>
                ) : isClosing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Cerrando carga…
                  </>
                ) : (
                  <>
                    <PackageCheck className="h-4 w-4" />
                    Ejecutar carga camión
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
};
