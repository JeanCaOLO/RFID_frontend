import { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  Maximize2,
  Minimize2,
  MonitorSmartphone,
  Search,
  X
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import type { RFIDTagEvent } from "../../types/rfid.types";
import { formatTime } from "../../utils/formatters";

type MonitorViewProps = {
  events: RFIDTagEvent[];
  timeZone: string;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
};

// ok = verde, error = rojo (rechazo del WMS, p. ej. andén equivocado).
type ReadKind = "ok" | "error";
type StatusFilter = "all" | ReadKind;

const POPUP_MS = 4000;
const DOCK_STORAGE_KEY = "monitor.dock";

// Mensajes del WMS que indican que el pallet ya se leyó/procesó antes.
// Si el WMS usa otro texto para ese caso, agregarlo aquí.
const REPEAT_PATTERNS = [
  /ya se encuentra dado de baja/i,
  /ya (fue|ha sido) le[ií]do/i
];

// Un pallet correcto se sigue leyendo mientras pasa por la antena, y esas
// lecturas extra vuelven del WMS como "ya leído". El Monitor las oculta: solo
// muestra las lecturas OK y los errores reales (andén equivocado, etc.).
const isRepeat = (event: RFIDTagEvent) =>
  !event.isValid &&
  REPEAT_PATTERNS.some((re) => re.test(event.reason ?? ""));

const classify = (event: RFIDTagEvent): ReadKind =>
  event.isValid ? "ok" : "error";

const KIND_STYLE: Record<
  ReadKind,
  { label: string; text: string; row: string; popup: string; chip: string }
> = {
  ok: {
    label: "OK",
    text: "text-emerald-500",
    row: "",
    popup: "bg-emerald-600",
    chip: "bg-emerald-500 text-white"
  },
  error: {
    label: "Error",
    text: "text-red-500",
    row: "bg-red-500/10",
    popup: "bg-red-600",
    chip: "bg-red-500 text-white"
  }
};

const KindIcon = ({ kind, className }: { kind: ReadKind; className: string }) =>
  kind === "ok" ? (
    <CheckCircle2 className={className} />
  ) : (
    <AlertTriangle className={className} />
  );

const readStoredDock = () => {
  try {
    return window.localStorage.getItem(DOCK_STORAGE_KEY) ?? "all";
  } catch {
    return "all";
  }
};

/**
 * Vista operativa "Monitor".
 *
 * Muestra las lecturas que van pasando por las antenas y, ante cada lectura
 * nueva, lanza un pop-up grande: verde (OK) o rojo (rechazado, con el error
 * tal cual devuelve el WMS). Las lecturas "ya leído" no se muestran.
 *
 * Con un andén seleccionado, tabla y pop-up muestran solo lo que pasa por ese
 * andén; la selección se recuerda en este equipo (pantalla fija por andén).
 */
export const MonitorView = ({
  events,
  timeZone,
  isFullscreen,
  onToggleFullscreen
}: MonitorViewProps) => {
  const [popup, setPopup] = useState<RFIDTagEvent | null>(null);
  const [palletFilter, setPalletFilter] = useState("");
  const [reasonFilter, setReasonFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dockFilter, setDockFilter] = useState<string>(readStoredDock);
  const [configuredDocks, setConfiguredDocks] = useState<string[]>([]);
  const lastKeyRef = useRef<string | null>(null);
  const timerRef = useRef<number | null>(null);

  // Lecturas que se muestran: sin los "ya leído".
  const visibleEvents = useMemo(
    () => events.filter((e) => !isRepeat(e)),
    [events]
  );

  // Andenes configurados en el mapeo de antenas (aunque aún no tengan lecturas).
  useEffect(() => {
    supabase
      .from("antennas")
      .select("dock_door")
      .then(({ data }) => {
        setConfiguredDocks(
          (data ?? [])
            .map((row) => row.dock_door as string | null)
            .filter((d): d is string => !!d)
        );
      });
  }, []);

  const docks = useMemo(() => {
    const all = new Set(configuredDocks);
    events.forEach((e) => e.dockDoor && all.add(e.dockDoor));
    if (dockFilter !== "all") all.add(dockFilter);
    return Array.from(all).sort((a, b) =>
      a.localeCompare(b, "es", { numeric: true })
    );
  }, [configuredDocks, events, dockFilter]);

  const changeDock = (value: string) => {
    // Al cambiar de andén no se muestra pop-up de lecturas ya existentes.
    lastKeyRef.current = null;
    setPopup(null);
    setDockFilter(value);
    try {
      window.localStorage.setItem(DOCK_STORAGE_KEY, value);
    } catch {
      // Sin almacenamiento local: el filtro funciona igual, solo no se recuerda.
    }
  };

  // Detecta la lectura más reciente del andén seleccionado y dispara el pop-up.
  useEffect(() => {
    const latest = visibleEvents.find(
      (e) => dockFilter === "all" || e.dockDoor === dockFilter
    );
    if (!latest) return;
    const key = `${latest.epc}-${latest.timestamp}`;
    if (lastKeyRef.current === null) {
      // Primera carga: no mostramos pop-up del histórico.
      lastKeyRef.current = key;
      return;
    }
    if (key === lastKeyRef.current) return;

    lastKeyRef.current = key;
    setPopup(latest);

    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setPopup(null), POPUP_MS);
  }, [visibleEvents, dockFilter]);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  const recent = useMemo(() => {
    const reasonTerm = reasonFilter.trim().toLowerCase();
    const palletTerm = palletFilter.trim().toLowerCase();
    return visibleEvents
      .filter((event) => {
        const statusMatch =
          statusFilter === "all" ? true : classify(event) === statusFilter;
        const reasonMatch = reasonTerm
          ? (event.reason ?? "").toLowerCase().includes(reasonTerm)
          : true;
        const palletMatch = palletTerm
          ? (event.pallet ?? "").toLowerCase().includes(palletTerm) ||
            event.epc.toLowerCase().includes(palletTerm)
          : true;
        const dockMatch =
          dockFilter === "all" ? true : event.dockDoor === dockFilter;
        return statusMatch && reasonMatch && palletMatch && dockMatch;
      })
      .slice(0, 40);
  }, [visibleEvents, palletFilter, reasonFilter, statusFilter, dockFilter]);

  return (
    <section
      className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-colors duration-300 dark:border-slate-700 dark:bg-slate-800 ${
        isFullscreen ? "flex h-full flex-col" : ""
      }`}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <MonitorSmartphone className="h-5 w-5 text-sky-500" />
          <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-900 dark:text-sky-300">
            Monitor operativo
          </h3>
          {dockFilter !== "all" && (
            <span className="rounded-full bg-sky-500 px-3 py-0.5 text-xs font-bold text-white">
              {dockFilter}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Andén: con uno seleccionado, solo se ve lo que pasa por él */}
          <select
            value={dockFilter}
            onChange={(e) => changeDock(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-sky-500/50 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200"
          >
            <option value="all">Todos los andenes</option>
            {docks.map((dock) => (
              <option key={dock} value={dock}>
                {dock}
              </option>
            ))}
          </select>

          {/* Buscador por pallet (o EPC) */}
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 dark:border-slate-700 dark:bg-slate-900/60">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={palletFilter}
              onChange={(e) => setPalletFilter(e.target.value)}
              placeholder="Buscar pallet"
              className="w-40 bg-transparent text-sm text-slate-700 outline-none dark:text-slate-200"
            />
            {palletFilter && (
              <button
                onClick={() => setPalletFilter("")}
                aria-label="Limpiar búsqueda de pallet"
                className="text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filtro por texto del motivo (WMS) */}
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 dark:border-slate-700 dark:bg-slate-900/60">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={reasonFilter}
              onChange={(e) => setReasonFilter(e.target.value)}
              placeholder="Filtrar por motivo"
              className="w-44 bg-transparent text-sm text-slate-700 outline-none dark:text-slate-200"
            />
            {reasonFilter && (
              <button
                onClick={() => setReasonFilter("")}
                aria-label="Limpiar filtro"
                className="text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filtro rápido por estado */}
          <div className="inline-flex rounded-full border border-slate-200 bg-slate-100 p-1 dark:border-slate-700 dark:bg-slate-900/60">
            {(
              [
                { id: "all", label: "Todos" },
                { id: "ok", label: "OK" },
                { id: "error", label: "Error" }
              ] as { id: StatusFilter; label: string }[]
            ).map((opt) => (
              <button
                key={opt.id}
                onClick={() => setStatusFilter(opt.id)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  statusFilter === opt.id
                    ? opt.id === "all"
                      ? "bg-sky-500 text-white"
                      : KIND_STYLE[opt.id].chip
                    : "text-slate-600 dark:text-slate-300"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button
            onClick={onToggleFullscreen}
            title={
              isFullscreen
                ? "Salir de pantalla completa (Esc)"
                : "Pantalla completa"
            }
            aria-label={
              isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"
            }
            className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-slate-600 transition hover:text-sky-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300"
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      <div
        className={
          isFullscreen ? "min-h-0 flex-1 overflow-auto" : "overflow-x-auto"
        }
      >
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <tr>
              <th className="px-3 py-2 w-28">Estado</th>
              <th className="px-3 py-2 w-[28%]">Pallet</th>
              <th className="px-3 py-2 w-32">Lector / Antena</th>
              <th className="px-3 py-2 w-32">Puerta</th>
              <th className="px-3 py-2">Motivo (WMS)</th>
              <th className="px-3 py-2 w-32">Hora</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((event, index) => {
              const kind = classify(event);
              const style = KIND_STYLE[kind];
              return (
                <tr
                  key={`${event.epc}-${event.timestamp}-${index}`}
                  className={`border-t border-slate-200/70 dark:border-slate-700/60 ${style.row}`}
                >
                  <td className="px-3 py-3">
                    <div className={`flex items-center gap-2 ${style.text}`}>
                      <KindIcon kind={kind} className="h-4 w-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">
                        {style.label}
                      </span>
                    </div>
                  </td>
                  <td
                    className={`px-3 py-3 font-semibold ${
                      kind === "ok" ? "text-primary" : style.text
                    }`}
                  >
                    <div className="flex flex-col">
                      <span>{event.pallet ?? "—"}</span>
                      <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
                        {event.epc}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-slate-700 dark:text-slate-200">
                    {event.readerName}
                    <span className="text-slate-400"> · Ant {event.antenna}</span>
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={
                        kind === "error"
                          ? "text-red-400 line-through opacity-80"
                          : "text-primary"
                      }
                    >
                      {event.dockDoor ?? "—"}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={`text-xs ${
                        kind === "ok"
                          ? "text-slate-500 dark:text-slate-400"
                          : style.text
                      }`}
                    >
                      {event.reason ?? "—"}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-slate-600 dark:text-slate-200">
                    {formatTime(event.timestamp, timeZone)}
                  </td>
                </tr>
              );
            })}
            {recent.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-12 text-center text-slate-500 dark:text-slate-400"
                >
                  {palletFilter || reasonFilter || statusFilter !== "all"
                    ? "Ninguna lectura coincide con el filtro."
                    : dockFilter !== "all"
                    ? `Esperando lecturas en ${dockFilter}…`
                    : "Esperando lecturas de las antenas…"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {popup && <MonitorPopup event={popup} onClose={() => setPopup(null)} />}
    </section>
  );
};

type MonitorPopupProps = {
  event: RFIDTagEvent;
  onClose: () => void;
};

const POPUP_TITLE: Record<ReadKind, string> = {
  ok: "Lectura correcta",
  error: "Lectura rechazada"
};

const MonitorPopup = ({ event, onClose }: MonitorPopupProps) => {
  const kind = classify(event);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div
        className={`relative w-full max-w-xl overflow-hidden rounded-3xl p-10 text-white shadow-2xl ${KIND_STYLE[kind].popup} animate-in`}
        role="alert"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full bg-white/20 p-1.5 transition hover:bg-white/30"
          aria-label="Cerrar"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex flex-col items-center gap-4 text-center">
          <KindIcon kind={kind} className="h-20 w-20" />

          <p className="text-sm font-semibold uppercase tracking-[0.3em] opacity-90">
            {POPUP_TITLE[kind]}
          </p>

          <p className="text-5xl font-black tracking-tight">
            {event.pallet ?? event.epc}
          </p>

          {kind !== "ok" && (
            <p className="max-w-md text-lg font-medium opacity-95">
              {event.reason ?? "Rechazado por el WMS"}
            </p>
          )}
          {kind === "ok" && (
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-lg font-medium opacity-95">
              <span>
                Puerta:{" "}
                <span className="font-bold">{event.dockDoor ?? "—"}</span>
              </span>
              <span>
                Antena: <span className="font-bold">{event.antenna}</span>
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
