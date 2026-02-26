import { useMemo, useState } from "react";
import { Header } from "./components/layout/Header";
import { ControlPanel } from "./components/layout/ControlPanel";
import { KpiGrid } from "./components/dashboard/KpiGrid";
import { DataGrid } from "./components/table/DataGrid";
import { RssiLineChart } from "./components/charts/RssiLineChart";
import { useRFIDStream } from "./hooks/useRFIDStream";
import { useExport } from "./hooks/useExport";
import type { RFIDTagEvent } from "./types/rfid.types";

const ANTENNAS = [1, 2, 3, 4];

const getTopAntenna = (events: RFIDTagEvent[]) => {
  const counts = new Map<number, number>();
  events.forEach((event) => {
    counts.set(event.antenna, (counts.get(event.antenna) ?? 0) + 1);
  });
  let top: number | null = null;
  let max = 0;
  counts.forEach((value, key) => {
    if (value > max) {
      max = value;
      top = key;
    }
  });
  return top;
};

export default function App() {
  const { events, isConnected, isPaused, togglePause } = useRFIDStream();
  const { exportToExcel } = useExport();
  const [antennaFilter, setAntennaFilter] = useState<number | "all">("all");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const antennaMatch =
        antennaFilter === "all" ? true : event.antenna === antennaFilter;
      const searchMatch = event.epc
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      return antennaMatch && searchMatch;
    });
  }, [events, antennaFilter, searchTerm]);

  const stats = useMemo(() => {
    const uniqueTags = new Set(events.map((event) => event.epc)).size;
    const peakRssi = events.reduce(
      (max, event) => (event.rssi > max ? event.rssi : max),
      Number.NEGATIVE_INFINITY
    );
    const topAntenna = getTopAntenna(events);
    return {
      totalReads: events.length,
      uniqueTags,
      peakRssi: Number.isFinite(peakRssi) ? peakRssi : 0,
      topAntenna
    };
  }, [events]);

  return (
    <div className="min-h-screen">
      <Header isConnected={isConnected} />

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 pb-12">
        <KpiGrid
          totalReads={stats.totalReads}
          uniqueTags={stats.uniqueTags}
          peakRssi={stats.peakRssi}
          topAntenna={stats.topAntenna}
        />

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <RssiLineChart events={events} />
          <div className="rounded-2xl bg-panel p-5 shadow-glow">
            <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-primary">
              Diagnóstico en vivo
            </h3>
            <div className="mt-4 space-y-3 text-sm text-text/80">
              <p>
                Estado del stream: {isPaused ? "Pausado" : "Activo"}
              </p>
              <p>Eventos visibles: {filteredEvents.length}</p>
              <p>Antena dominante: {stats.topAntenna ?? "-"}</p>
              <p>RSSI máximo: {stats.peakRssi} dBm</p>
            </div>
          </div>
        </div>

        <ControlPanel
          antennaFilter={antennaFilter}
          onAntennaChange={setAntennaFilter}
          onSearchChange={setSearchTerm}
          onExport={() => exportToExcel(filteredEvents)}
          onTogglePause={togglePause}
          isPaused={isPaused}
          antennas={ANTENNAS}
        />

        <DataGrid events={filteredEvents} />
      </main>
    </div>
  );
}
