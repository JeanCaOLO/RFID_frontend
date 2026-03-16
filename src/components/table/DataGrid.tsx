import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp, CheckCircle2, AlertTriangle } from "lucide-react";
import type { GroupedRFIDTag, RFIDTagEvent } from "../../types/rfid.types";
import { formatTime, normalizeRssi } from "../../utils/formatters";

type DataGridProps = {
  events: RFIDTagEvent[];
  antennaFilter: number | "all";
  searchTerm: string;
  minRssiFilter: number | "all";
};

type SortConfig = {
  key: keyof GroupedRFIDTag;
  direction: "asc" | "desc";
};

export const DataGrid = ({
  events,
  antennaFilter,
  searchTerm,
  minRssiFilter
}: DataGridProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "lastSeen",
    direction: "desc"
  });
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
          expectedAntenna: event.expectedAntenna,
          firstSeen: event.timestamp,
          lastSeen: event.timestamp,
          readCount: 1,
          isValid: event.isValid
        });
        return;
      }

      const eventTime = new Date(event.timestamp).getTime();
      const lastSeenTime = new Date(existing.lastSeen).getTime();
      const firstSeenTime = new Date(existing.firstSeen).getTime();

      if (eventTime >= lastSeenTime) {
        existing.lastSeen = event.timestamp;
        existing.rssi = event.rssi;
        existing.antenna = event.antenna;
        existing.expectedAntenna = event.expectedAntenna;
        existing.isValid = event.isValid; // Actualizamos validación
      }
      if (eventTime < firstSeenTime) {
        existing.firstSeen = event.timestamp;
      }

      existing.readCount += 1;
    });

    return Array.from(map.values());
  }, [events]);

  const sortedEvents = useMemo(() => {
    const filtered = groupedEvents.filter((event) => {
      const antennaMatch =
        antennaFilter === "all"
          ? true
          : String(event.antenna) === String(antennaFilter);
      const searchMatch = event.epc
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const rssiMatch =
        minRssiFilter === "all" ? true : event.rssi >= minRssiFilter;
      return antennaMatch && searchMatch && rssiMatch;
    });

    const sorted = [...filtered].sort((a, b) => {
      const { key, direction } = sortConfig;
      const multiplier = direction === "asc" ? 1 : -1;
      
      if (key === "lastSeen" || key === "firstSeen") {
        return (new Date(a[key]).getTime() - new Date(b[key]).getTime()) * multiplier;
      }
      if (typeof a[key] === "number" && typeof b[key] === "number") {
        return ((a[key] as number) - (b[key] as number)) * multiplier;
      }
      if (typeof a[key] === "boolean" && typeof b[key] === "boolean") {
        return (a[key] === b[key] ? 0 : a[key] ? -1 : 1) * multiplier;
      }
      return String(a[key]).localeCompare(String(b[key])) * multiplier;
    });

    return sorted;
  }, [groupedEvents, antennaFilter, searchTerm, minRssiFilter, sortConfig]);

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

  const handleSort = (key: keyof GroupedRFIDTag) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === "asc" ? "desc" : "asc"
        };
      }
      return { key, direction: "desc" };
    });
    setCurrentPage(1);
  };

  const renderSortIcon = (key: keyof GroupedRFIDTag) => {
    if (sortConfig.key !== key) {
      return <ArrowUp className="h-3 w-3 text-transparent" />;
    }
    return sortConfig.direction === "asc" ? (
      <ArrowUp className="h-3 w-3 text-sky-400" />
    ) : (
      <ArrowDown className="h-3 w-3 text-sky-400" />
    );
  };

  const getPaginationItems = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, "...", totalPages];
    }

    if (currentPage >= totalPages - 3) {
      return [
        1,
        "...",
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages
      ];
    }

    return [
      1,
      "...",
      currentPage - 1,
      currentPage,
      currentPage + 1,
      "...",
      totalPages
    ];
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-glow transition-colors duration-300 dark:border-slate-700 dark:bg-slate-800">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <tr>
              {/* --- NUEVA CABECERA: ESTADO --- */}
              <th
                className="px-3 py-2 w-28 text-left transition-all hover:text-sky-400 cursor-pointer"
                onClick={() => handleSort("isValid")}
              >
                <button className="flex w-full items-center justify-start gap-2">
                  Estado
                  {renderSortIcon("isValid")}
                </button>
              </th>
              <th
                className="px-3 py-2 w-[30%] text-left transition-all hover:text-sky-400 cursor-pointer"
                onClick={() => handleSort("epc")}
              >
                <button className="flex w-full items-center justify-start gap-2">
                  EPC
                  {renderSortIcon("epc")}
                </button>
              </th>
              <th
                className="px-3 py-2 w-28 text-left transition-all hover:text-sky-400 cursor-pointer"
                onClick={() => handleSort("antenna")}
              >
                <button className="flex w-full items-center justify-start gap-2">
                  Antena
                  {renderSortIcon("antenna")}
                </button>
              </th>
              <th
                className="px-3 py-2 w-36 text-left transition-all hover:text-sky-400 cursor-pointer"
                onClick={() => handleSort("expectedAntenna")}
              >
                <button className="flex w-full items-center justify-start gap-2">
                  Antena Esperada
                  {renderSortIcon("expectedAntenna")}
                </button>
              </th>
              <th
                className="px-3 py-2 w-40 text-left transition-all hover:text-sky-400 cursor-pointer"
                onClick={() => handleSort("rssi")}
              >
                <button className="flex w-full items-center justify-start gap-2">
                  RSSI
                  {renderSortIcon("rssi")}
                </button>
              </th>
              <th
                className="px-3 py-2 w-32 text-left transition-all hover:text-sky-400 cursor-pointer"
                onClick={() => handleSort("readCount")}
              >
                <button className="flex w-full items-center justify-start gap-2">
                  Veces leído
                  {renderSortIcon("readCount")}
                </button>
              </th>
              <th
                className="px-3 py-2 w-40 text-left transition-all hover:text-sky-400 cursor-pointer"
                onClick={() => handleSort("lastSeen")}
              >
                <button className="flex w-full items-center justify-start gap-2">
                  Última vez
                  {renderSortIcon("lastSeen")}
                </button>
              </th>
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
              
              // --- LÓGICA DE ESTILOS DEL SEMÁFORO ---
              const isError = event.antenna !== event.expectedAntenna;
              let rowBgClass = "";
              if (isError) {
                rowBgClass = "bg-red-500/10"; // Fila roja si hay error
              } else if (isHighlighted) {
                rowBgClass = "bg-sky-500/10"; // Flash azul si es normal y se actualizó
              }

              return (
                <tr
                  key={event.epc}
                  className={`border-t border-slate-200/70 transition-colors duration-300 dark:border-slate-700/60 ${rowBgClass}`}
                >
                  {/* --- NUEVA CELDA: ESTADO --- */}
                  <td className="px-3 py-3 w-28 text-left">
                    {!isError ? (
                      <div className="flex items-center gap-2 text-emerald-500">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-xs font-semibold uppercase tracking-wider">OK</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-red-500">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">Error</span>
                      </div>
                    )}
                  </td>
                  <td className={`px-3 py-3 w-[30%] text-left font-semibold ${isError ? 'text-red-400' : 'text-primary'}`}>
                    {event.epc}
                  </td>
                  <td className="px-3 py-3 w-28 text-left">
                    <span
                      className={
                        isError
                          ? "text-red-400 font-bold line-through opacity-80"
                          : "text-primary"
                      }
                    >
                      Antena {event.antenna}
                    </span>
                  </td>
                  <td className="px-3 py-3 w-36 text-left">
                    <span
                      className={
                        isError
                          ? "text-xs bg-red-500/20 text-red-300 px-2 py-0.5 rounded border border-red-500/30 w-fit"
                          : "text-slate-700 dark:text-slate-200"
                      }
                    >
                      Antena {event.expectedAntenna}
                    </span>
                  </td>
                  <td className="px-3 py-3 w-40 text-left">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-600 dark:text-slate-300">
                        {event.rssi} dBm
                      </span>
                      <div className="h-2 w-24 rounded-full bg-slate-200 dark:bg-slate-900/60">
                        <div
                          className={`h-2 rounded-full ${isError ? 'bg-red-500' : 'bg-success'}`}
                          style={{ width: `${normalized}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 w-32 text-left">
                    <span className={`rounded-full px-2 py-1 text-xs font-mono ${isError ? 'bg-red-500/20 text-red-400' : 'bg-slate-200 text-sky-600 dark:bg-slate-700 dark:text-sky-400'}`}>
                      {event.readCount}
                    </span>
                  </td>
                  <td className="px-3 py-3 w-40 text-left text-slate-600 dark:text-slate-200">
                    {formatTime(event.lastSeen)}
                  </td>
                </tr>
              );
            })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 p-4 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400">
        <span className="font-mono">
          Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1} a{" "}
          {Math.min(currentPage * ITEMS_PER_PAGE, sortedEvents.length)} de{" "}
          {sortedEvents.length} tags únicos
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <button
            className={`rounded-md border border-slate-200 bg-white px-3 py-1 text-slate-700 transition-colors hover:bg-slate-100 hover:text-sky-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-sky-400 ${
              currentPage === 1
                ? "cursor-not-allowed opacity-50"
                : ""
            }`}
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
          >
            Anterior
          </button>
          {getPaginationItems().map((item, index) => {
            if (item === "...") {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="px-3 py-1 text-slate-500 dark:text-slate-500"
                >
                  ...
                </span>
              );
            }

            const page = item as number;
            return (
              <button
                key={page}
                className={`rounded-md border px-3 py-1 transition-colors hover:bg-slate-100 hover:text-sky-500 dark:hover:bg-slate-700 dark:hover:text-sky-400 ${
                  page === currentPage
                    ? "border-sky-500 bg-sky-500/20 font-bold text-sky-400"
                    : "border-slate-200 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                }`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            );
          })}
          <button
            className={`rounded-md border border-slate-200 bg-white px-3 py-1 text-slate-700 transition-colors hover:bg-slate-100 hover:text-sky-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-sky-400 ${
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