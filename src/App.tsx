import { useMemo, useState } from "react";
import { Header } from "./components/layout/Header";
import { ControlPanel } from "./components/layout/ControlPanel";
import { KpiGrid } from "./components/dashboard/KpiGrid";
import { DataGrid } from "./components/table/DataGrid";
import { LiveMetricsDashboard } from "./components/charts/LiveMetricsDashboard";
import { useRFIDStream } from "./hooks/useRFIDStream";
import { useExport } from "./hooks/useExport";
import { useTheme } from "./hooks/useTheme";

const ANTENNAS = [1, 2, 3, 4];

export default function App() {
  const { events, isConnected, isPaused, togglePause } = useRFIDStream();
  const { exportToExcel } = useExport();
  const { theme, toggleTheme } = useTheme();
  const [antennaFilter, setAntennaFilter] = useState<number | "all">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [minRssiFilter, setMinRssiFilter] = useState<number | "all">("all");

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const antennaMatch =
        antennaFilter === "all" ? true : event.antenna === antennaFilter;
      const searchMatch = event.epc
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const rssiMatch =
        minRssiFilter === "all" ? true : event.rssi >= minRssiFilter;
      return antennaMatch && searchMatch && rssiMatch;
    });
  }, [events, antennaFilter, searchTerm, minRssiFilter]);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 transition-colors duration-300 dark:bg-slate-900 dark:text-slate-50">
      <Header
        isConnected={isConnected}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 pb-12">
        <KpiGrid tags={events} />

        <LiveMetricsDashboard tags={events} selectedAntenna={antennaFilter} />

        <ControlPanel
          antennaFilter={antennaFilter}
          onAntennaChange={setAntennaFilter}
          onSearchChange={setSearchTerm}
          minRssiFilter={minRssiFilter}
          onMinRssiChange={setMinRssiFilter}
          onExport={() => exportToExcel(filteredEvents)}
          onTogglePause={togglePause}
          isPaused={isPaused}
          antennas={ANTENNAS}
        />

        <DataGrid
          events={events}
          antennaFilter={antennaFilter}
          searchTerm={searchTerm}
          minRssiFilter={minRssiFilter}
        />
      </main>
    </div>
  );
}