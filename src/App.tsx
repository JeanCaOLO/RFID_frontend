import { useMemo, useState } from "react";
import { Header } from "./components/layout/Header";
import { ControlPanel } from "./components/layout/ControlPanel";
import { KpiGrid } from "./components/dashboard/KpiGrid";
import { DataGrid } from "./components/table/DataGrid";
import { LiveMetricsDashboard } from "./components/charts/LiveMetricsDashboard";
import { useRFIDStream } from "./hooks/useRFIDStream";
import { useExport } from "./hooks/useExport";

const ANTENNAS = [1, 2, 3, 4];

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

  return (
    <div className="min-h-screen">
      <Header isConnected={isConnected} />

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 pb-12">
        <KpiGrid tags={events} />

        <LiveMetricsDashboard tags={events} selectedAntenna={antennaFilter} />

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