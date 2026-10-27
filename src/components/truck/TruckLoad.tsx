import { useState } from "react";
import {
  Truck,
  RefreshCw,
  PackageCheck,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Package,
  History,
  X,
} from "lucide-react";
import { useTruckLoad } from "../../hooks/useTruckLoad";
import { TruckLoadHistory } from "./TruckLoadHistory";
import type { TruckLoadRow } from "../../types/rfid.types";
import { formatTime } from "../../utils/formatters";

// Descripción del cierre pendiente de confirmar.
type PendingClose =
  { type: "one"; placa: string } | { type: "all"; placas: string[] };

type View = "active" | "history";

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
    history,
    loading,
    error,
    reload,
    executeClose,
    executeCloseAll,
    hasPending,
  } = useTruckLoad();
  const [closingPlaca, setClosingPlaca] = useState<string | null>(null);
  const [closingAll, setClosingAll] = useState(false);
  // Cierre pendiente de confirmación (null = sin modal).
  const [pending, setPending] = useState<PendingClose | null>(null);
  const [view, setView] = useState<View>("active");

  // Placas con pallets pendientes de cerrar (loaded / error).
  const pendingPlacas = groups
    .filter((g) => g.pendingCount > 0)
    .map((g) => g.placa);

  // Paso 1: el botón solo abre la confirmación.
  const askClose = (placa: string) => setPending({ type: "one", placa });
  const askCloseAll = () => setPending({ type: "all", placas: pendingPlacas });

  // Paso 2: al confirmar, se ejecuta realmente el cierre.
  const confirmClose = async () => {
    if (!pending) return;
    const action = pending;
    setPending(null);

    if (action.type === "one") {
      setClosingPlaca(action.placa);
      await executeClose(action.placa);
      setClosingPlaca(null);
    } else {
      setClosingAll(true);
      await executeCloseAll();
      setClosingAll(false);
    }
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
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-full border border-slate-200 bg-slate-100 p-0.5 dark:border-slate-700 dark:bg-slate-900/60">
            {(
              [
                {
                  id: "active",
                  label: `En carga (${groups.length})`,
                  icon: Truck,
                },
                {
                  id: "history",
                  label: `Historial (${history.length})`,
                  icon: History,
                },
              ] as const
            ).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setView(id)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition ${
                  view === id
                    ? "bg-sky-500 text-white"
                    : "text-slate-600 hover:text-sky-500 dark:text-slate-300"
                }`}
              >
                <Icon className="h-3 w-3" />
                {label}
              </button>
            ))}
          </div>
          {view === "active" && (
            <button
              onClick={askCloseAll}
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
          )}
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

      {!loading && view === "history" && (
        <TruckLoadHistory history={history} timeZone={timeZone} />
      )}

      {!loading && view === "active" && groups.length === 0 && (
        <div className="py-12 text-center text-slate-500 dark:text-slate-400">
          No hay pallets en carga. Los pallets validados aparecerán aquí
          agrupados por placa; las cargas ya ejecutadas están en Historial.
        </div>
      )}

      {view === "active" && (
        <div className="grid gap-4 md:grid-cols-2">
          {groups.map((group) => {
            const isClosing = closingPlaca === group.placa || group.isClosing;
            const pendientes = group.pendingCount;

            return (
              <div
                key={group.placa}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition-colors dark:border-slate-700 dark:bg-slate-900/40"
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
                  onClick={() => askClose(group.placa)}
                  disabled={isClosing || pendientes === 0}
                  className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                    isClosing
                      ? "cursor-wait bg-sky-500/70 text-white"
                      : "bg-sky-500 text-white shadow-glow hover:bg-sky-600"
                  }`}
                >
                  {isClosing ? (
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
      )}

      {pending && (
        <ConfirmDialog
          pending={pending}
          onCancel={() => setPending(null)}
          onConfirm={confirmClose}
        />
      )}
    </section>
  );
};

type ConfirmDialogProps = {
  pending: PendingClose;
  onCancel: () => void;
  onConfirm: () => void;
};

const ConfirmDialog = ({
  pending,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) => {
  const isAll = pending.type === "all";
  const count = isAll ? pending.placas.length : 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-800">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-500/15 text-amber-500">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Confirmar cierre de carga
          </h3>
        </div>

        {isAll ? (
          <div className="mb-6 text-sm text-slate-600 dark:text-slate-300">
            {count === 0 ? (
              <p>No hay cargas pendientes por cerrar.</p>
            ) : (
              <>
                <p className="mb-2">
                  ¿Seguro que quieres cerrar <b>todas</b> las cargas pendientes?
                  Se cerrarán {count} placa{count !== 1 ? "s" : ""}:
                </p>
                <ul className="max-h-40 space-y-1 overflow-y-auto rounded-lg bg-slate-100 p-2 font-mono text-xs dark:bg-slate-900/60">
                  {pending.placas.map((placa) => (
                    <li
                      key={placa}
                      className="text-slate-700 dark:text-slate-200"
                    >
                      {placa}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        ) : (
          <p className="mb-6 text-sm text-slate-600 dark:text-slate-300">
            ¿Seguro que quieres cerrar la carga camión de la placa{" "}
            <b className="font-mono text-slate-900 dark:text-slate-100">
              {pending.placa}
            </b>
            ?
          </p>
        )}

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <X className="h-4 w-4" />
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isAll && count === 0}
            className="flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-white shadow-glow transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <PackageCheck className="h-4 w-4" />
            {isAll ? "Cerrar todas" : "Sí, cerrar"}
          </button>
        </div>
      </div>
    </div>
  );
};
