import { useEffect, useMemo, useRef, useState } from "react";
import type { GroupedRFIDTag, RFIDTagEvent } from "../../types/rfid.types";
import { formatTime, normalizeRssi } from "../../utils/formatters";

type DataGridProps = {
  events: RFIDTagEvent[];
};

export const DataGrid = ({ events }: DataGridProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [highlightedEpcs, setHighlightedEpcs] = useState<Set<string>>(
    () => new Set()
  );
  const prevCountsRef = useRef<Map<string, number>>(new Map());

  const ITEMS_PER_PAGE = 12;

  const groupedEvents = useMemo<GroupedRFIDTag[]>(() => {
    const map = new Map<string, GroupedRFIDTag>();

    events.forEach((event) => {
      const existing = map.get(event.epc);
      if (!existing) {
        map.set(event.epc, {
          epc: event.epc,
          rssi: event.rssi,
          antenna: event.antenna,
          firstSeen: event.timestamp,
          lastSeen: event.timestamp,
          readCount: 1
        });
        return;
      }

      const eventTime = new Date(event.timestamp).getTime();
      const lastSeenTime = new Date(existing.lastSeen).getTime();
      const firstSeenTime = new Date(existing.firstSeen).getTime();

      if (eventTime > lastSeenTime) {
        existing.lastSeen = event.timestamp;
        existing.rssi = event.rssi;
        existing.antenna = event.antenna;
      }
      if (eventTime < firstSeenTime) {
        existing.firstSeen = event.timestamp;
      }

      existing.readCount += 1;
    });

    return Array.from(map.values());
  }, [events]);

  const sortedEvents = useMemo(() => {
    return [...groupedEvents].sort(
      (a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime()
    );
  }, [groupedEvents]);

  const totalPages = Math.max(
    1,
    Math.ceil(sortedEvents.length / ITEMS_PER_PAGE)
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const paginatedEvents = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedEvents.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedEvents, currentPage]);

  useEffect(() => {
    const updated = new Set<string>();
    groupedEvents.forEach((item) => {
      const prevCount = prevCountsRef.current.get(item.epc) ?? 0;
      if (item.readCount > prevCount) {
        updated.add(item.epc);
      }
    });

    if (updated.size) {
      setHighlightedEpcs((prev) => {
        const next = new Set(prev);
        updated.forEach((epc) => next.add(epc));
        return next;
      });

      window.setTimeout(() => {
        setHighlightedEpcs((prev) => {
          const next = new Set(prev);
          updated.forEach((epc) => next.delete(epc));
          return next;
        });
      }, 350);
    }

    prevCountsRef.current = new Map(
      groupedEvents.map((item) => [item.epc, item.readCount])
    );
  }, [groupedEvents]);

  const handleScroll = () => {
    const container = scrollRef.current;
    if (!container) return;
    const threshold = 50;
    const isAtBottom =
      container.scrollTop + container.clientHeight >=
      container.scrollHeight - threshold;
    setIsUserScrolling(!isAtBottom);
  };

  useEffect(() => {
    if (isUserScrolling || currentPage !== 1) return;
    const container = scrollRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [paginatedEvents, isUserScrolling, currentPage]);

  return (
    <section className="rounded-2xl border border-white/10 bg-panel p-4 shadow-glow">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-wider text-text/60">
            <tr>
              <th className="px-3 py-2">EPC</th>
              <th className="px-3 py-2">Antena</th>
              <th className="px-3 py-2">RSSI</th>
              <th className="px-3 py-2">Veces leído</th>
              <th className="px-3 py-2">Hora</th>
            </tr>
          </thead>
        </table>
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="max-h-[420px] overflow-y-auto"
        >
          <table className="w-full text-left text-sm">
            <tbody>
            {paginatedEvents.map((event) => {
              const normalized = normalizeRssi(event.rssi);
              const isHighlighted = highlightedEpcs.has(event.epc);
              return (
                <tr
                  key={event.epc}
                  className={`border-t border-white/5 transition ${
                    isHighlighted ? "bg-sky-500/10" : ""
                  }`}
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
                  <td className="px-3 py-3">
                    <span className="rounded-full bg-slate-700 px-2 py-1 text-xs font-mono text-sky-400">
                      {event.readCount}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-text/80">
                    {formatTime(event.lastSeen)}
                  </td>
                </tr>
              );
            })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-700 bg-slate-800/50 p-4 text-sm text-slate-400">
        <span className="font-mono">
          Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1} a{" "}
          {Math.min(currentPage * ITEMS_PER_PAGE, sortedEvents.length)} de{" "}
          {sortedEvents.length} tags únicos
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <button
            className={`rounded-md border border-slate-700 bg-slate-800 px-3 py-1 text-slate-300 transition-colors hover:bg-slate-700 hover:text-sky-400 ${
              currentPage === 1
                ? "cursor-not-allowed opacity-50"
                : ""
            }`}
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
          >
            Anterior
          </button>
          {Array.from({ length: totalPages }, (_, index) => index + 1).map(
            (page) => (
              <button
                key={page}
                className={`rounded-md border px-3 py-1 text-slate-300 transition-colors hover:bg-slate-700 hover:text-sky-400 ${
                  page === currentPage
                    ? "border-sky-500 bg-sky-500/20 font-bold text-sky-400"
                    : "border-slate-700 bg-slate-800"
                }`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            )
          )}
          <button
            className={`rounded-md border border-slate-700 bg-slate-800 px-3 py-1 text-slate-300 transition-colors hover:bg-slate-700 hover:text-sky-400 ${
              currentPage === totalPages
                ? "cursor-not-allowed opacity-50"
                : ""
            }`}
            disabled={currentPage === totalPages}
            onClick={() =>
              setCurrentPage((prev) => Math.min(totalPages, prev + 1))
            }
          >
            Siguiente
          </button>
        </div>
      </div>
    </section>
  );
};
