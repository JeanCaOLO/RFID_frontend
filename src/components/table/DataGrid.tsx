import { useEffect, useMemo, useState } from "react";
import type { RFIDTagEvent } from "../../types/rfid.types";
import { formatTime, normalizeRssi } from "../../utils/formatters";

const PAGE_SIZE = 12;

type DataGridProps = {
  events: RFIDTagEvent[];
};

export const DataGrid = ({ events }: DataGridProps) => {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(events.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [events.length]);

  const pageItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return events.slice(start, start + PAGE_SIZE);
  }, [events, page]);

  return (
    <section className="rounded-2xl border border-white/10 bg-panel p-4 shadow-glow">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-wider text-text/60">
            <tr>
              <th className="px-3 py-2">EPC</th>
              <th className="px-3 py-2">Antena</th>
              <th className="px-3 py-2">RSSI</th>
              <th className="px-3 py-2">Hora</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((event, index) => {
              const normalized = normalizeRssi(event.rssi);
              return (
                <tr
                  key={`${event.epc}-${event.timestamp}-${index}`}
                  className="animate-fade-in border-t border-white/5"
                >
                  <td className="px-3 py-3 font-semibold text-primary">
                    {event.epc}
                  </td>
                  <td className="px-3 py-3">Antena {event.antenna}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-text/70">
                        {event.rssi} dBm
                      </span>
                      <div className="h-2 w-24 rounded-full bg-deep/60">
                        <div
                          className="h-2 rounded-full bg-success"
                          style={{ width: `${normalized}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-text/80">
                    {formatTime(event.timestamp)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-text/60">
        <span>
          Página {page} de {totalPages}
        </span>
        <div className="flex gap-2">
          <button
            className="rounded-full border border-white/10 px-3 py-1 disabled:opacity-40"
            disabled={page === 1}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          >
            Anterior
          </button>
          <button
            className="rounded-full border border-white/10 px-3 py-1 disabled:opacity-40"
            disabled={page === totalPages}
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
          >
            Siguiente
          </button>
        </div>
      </div>
    </section>
  );
};
