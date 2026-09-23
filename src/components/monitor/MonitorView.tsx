import { useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  MonitorSmartphone,
  X
} from "lucide-react";
import type { RFIDTagEvent } from "../../types/rfid.types";
import { formatTime } from "../../utils/formatters";

type MonitorViewProps = {
  events: RFIDTagEvent[];
  timeZone: string;
};

const POPUP_MS = 4000;

/**
 * Vista operativa "Monitor".
 *
 * Muestra las lecturas que van pasando por las antenas (igual que el registro
 * del dashboard: si el pallet pasa o no, con el motivo) y, ante cada lectura
 * nueva, lanza un pop-up grande:
 *   - Verde: pallet OK, con puerta y antena por la que pasó.
 *   - Rojo: pallet rechazado, con el error tal cual devuelve el WMS.
 */
export const MonitorView = ({ events, timeZone }: MonitorViewProps) => {
  const [popup, setPopup] = useState<RFIDTagEvent | null>(null);
  const lastKeyRef = useRef<string | null>(null);
  const timerRef = useRef<number | null>(null);

  // Detecta la lectura más reciente y dispara el pop-up.
  useEffect(() => {
    if (!events.length) return;
    const latest = events[0];
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
  }, [events]);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  const recent = events.slice(0, 40);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-colors duration-300 dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-4 flex items-center gap-2">
        <MonitorSmartphone className="h-5 w-5 text-sky-500" />
        <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-900 dark:text-sky-300">
          Monitor operativo
        </h3>
      </div>

      <div className="overflow-x-auto">
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
              const isError = !event.isValid;
              return (
                <tr
                  key={`${event.epc}-${event.timestamp}-${index}`}
                  className={`border-t border-slate-200/70 dark:border-slate-700/60 ${
                    isError ? "bg-red-500/10" : ""
                  }`}
                >
                  <td className="px-3 py-3">
                    {!isError ? (
                      <div className="flex items-center gap-2 text-emerald-500">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-xs font-semibold uppercase tracking-wider">
                          OK
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-red-500">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">
                          Error
                        </span>
                      </div>
                    )}
                  </td>
                  <td
                    className={`px-3 py-3 font-semibold ${
                      isError ? "text-red-400" : "text-primary"
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
                    <span className={isError ? "text-red-400 line-through opacity-80" : "text-primary"}>
                      {event.dockDoor ?? "—"}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={
                        isError
                          ? "text-xs text-red-400"
                          : "text-xs text-slate-500 dark:text-slate-400"
                      }
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
                  Esperando lecturas de las antenas…
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

const MonitorPopup = ({ event, onClose }: MonitorPopupProps) => {
  const isError = !event.isValid;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div
        className={`relative w-full max-w-xl overflow-hidden rounded-3xl p-10 text-white shadow-2xl ${
          isError ? "bg-red-600" : "bg-emerald-600"
        } animate-in`}
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
          {isError ? (
            <AlertTriangle className="h-20 w-20" />
          ) : (
            <CheckCircle2 className="h-20 w-20" />
          )}

          <p className="text-sm font-semibold uppercase tracking-[0.3em] opacity-90">
            {isError ? "Lectura rechazada" : "Lectura correcta"}
          </p>

          <p className="text-5xl font-black tracking-tight">
            {event.pallet ?? event.epc}
          </p>

          {isError ? (
            <p className="max-w-md text-lg font-medium opacity-95">
              {event.reason ?? "Rechazado por el WMS"}
            </p>
          ) : (
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
