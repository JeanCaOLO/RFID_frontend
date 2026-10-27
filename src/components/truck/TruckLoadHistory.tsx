import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, History, Search } from "lucide-react";
import type { TruckLoadHistoryEntry } from "../../types/rfid.types";
import { formatDateTime } from "../../utils/formatters";

type TruckLoadHistoryProps = {
  history: TruckLoadHistoryEntry[];
  timeZone: string;
};

/**
 * Historial de cargas camión ejecutadas: una fila por cierre (placa + fecha),
 * expandible para ver los pallets que se cerraron en esa carga.
 */
export const TruckLoadHistory = ({ history, timeZone }: TruckLoadHistoryProps) => {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return history;
    return history.filter(
      (entry) =>
        entry.placa.toLowerCase().includes(term) ||
        entry.pallets.some((p) => p.pallet.toLowerCase().includes(term))
    );
  }, [history, search]);

  return (
    <div>
      <div className="mb-4 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/40">
        <Search className="h-4 w-4 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por placa o pallet…"
          className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-center text-slate-500 dark:text-slate-400">
          <History className="h-6 w-6" />
          {history.length === 0
            ? "Aún no se ha ejecutado ninguna carga camión."
            : "Ninguna carga coincide con la búsqueda."}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <tr>
                <th className="w-8 px-3 py-2" />
                <th className="px-3 py-2">Ejecutada</th>
                <th className="px-3 py-2">Placa</th>
                <th className="px-3 py-2">Pallets</th>
                <th className="px-3 py-2">Puertas</th>
                <th className="px-3 py-2">Primer pallet</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry) => {
                const isOpen = expanded === entry.key;
                return (
                  <HistoryRow
                    key={entry.key}
                    entry={entry}
                    isOpen={isOpen}
                    timeZone={timeZone}
                    onToggle={() => setExpanded(isOpen ? null : entry.key)}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

type HistoryRowProps = {
  entry: TruckLoadHistoryEntry;
  isOpen: boolean;
  timeZone: string;
  onToggle: () => void;
};

const HistoryRow = ({ entry, isOpen, timeZone, onToggle }: HistoryRowProps) => (
  <>
    <tr
      onClick={onToggle}
      className="cursor-pointer border-t border-slate-200/70 transition hover:bg-slate-50 dark:border-slate-700/60 dark:hover:bg-slate-900/40"
    >
      <td className="px-3 py-3 text-slate-400">
        {isOpen ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </td>
      <td className="px-3 py-3 font-mono text-slate-700 dark:text-slate-200">
        {formatDateTime(entry.closedAt, timeZone)}
      </td>
      <td className="px-3 py-3 font-mono font-bold text-slate-900 dark:text-slate-100">
        {entry.placa}
      </td>
      <td className="px-3 py-3 text-slate-600 dark:text-slate-300">
        {entry.pallets.length}
      </td>
      <td className="px-3 py-3 font-mono text-sky-600 dark:text-sky-400">
        {entry.doors.length > 0 ? entry.doors.join(", ") : "—"}
      </td>
      <td className="px-3 py-3 font-mono text-slate-500 dark:text-slate-400">
        {formatDateTime(entry.firstLoadedAt, timeZone)}
      </td>
    </tr>
    {isOpen && (
      <tr className="bg-slate-50 dark:bg-slate-900/40">
        <td />
        <td colSpan={5} className="px-3 pb-4 pt-1">
          <ul className="grid gap-1 sm:grid-cols-2">
            {entry.pallets.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm dark:bg-slate-800"
              >
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  {p.pallet}
                </span>
                <span className="text-[11px] text-slate-400">
                  {p.dock_door ?? "—"} · {formatDateTime(p.loaded_at, timeZone)}
                </span>
              </li>
            ))}
          </ul>
        </td>
      </tr>
    )}
  </>
);
