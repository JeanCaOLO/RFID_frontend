import { useMemo, useState } from "react";
import { BarChart3, LayoutDashboard, Settings2 } from "lucide-react";
import { DEFAULT_TIME_ZONE } from "./utils/formatters";
import { Header } from "./components/layout/Header";
import { ControlPanel } from "./components/layout/ControlPanel";
import { KpiGrid } from "./components/dashboard/KpiGrid";
import { DataGrid } from "./components/table/DataGrid";
import { LiveMetricsDashboard } from "./components/charts/LiveMetricsDashboard";
import { AntennaMapping } from "./components/mapping/AntennaMapping";
import { ReportsView } from "./components/reports/ReportsView";
import { useRFIDStream } from "./hooks/useRFIDStream";
import { useExport } from "./hooks/useExport";
import { useTheme } from "./hooks/useTheme";

const ANTENNAS = [1, 2, 3, 4];

type Tab = "dashboard" | "reports" | "mapping";

export default function App() {
  const { events, isConnected, isPaused, togglePause } = useRFIDStream();
  const { exportToExcel } = useExport();
  const { theme, toggleTheme } = useTheme();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [antennaFilter, setAntennaFilter] = useState<number | "all">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [minRssiFilter, setMinRssiFilter] = useState<number | "all">("all");
  const [timeZone, setTimeZone] = useState(DEFAULT_TIME_ZONE);

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
        timeZone={timeZone}
        setTimeZone={setTimeZone}
      />

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 pb-12">
        <nav className="mt-6 flex gap-2">
          <button
            onClick={() => setTab("dashboard")}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
              tab === "dashboard"
                ? "bg-sky-500 text-white shadow-glow"
                : "border border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </button>
          <button
            onClick={() => setTab("reports")}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
              tab === "reports"
                ? "bg-sky-500 text-white shadow-glow"
                : "border border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            Reportes
          </button>
          <button
            onClick={() => setTab("mapping")}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
              tab === "mapping"
                ? "bg-sky-500 text-white shadow-glow"
                : "border border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            <Settings2 className="h-4 w-4" />
            Mapeo de antenas
          </button>
        </nav>

        {tab === "dashboard" ? (
          <>
            <KpiGrid tags={events} />

            <LiveMetricsDashboard
              tags={events}
              selectedAntenna={antennaFilter}
              timeZone={timeZone}
            />

            <ControlPanel
              antennaFilter={antennaFilter}
              onAntennaChange={setAntennaFilter}
              onSearchChange={setSearchTerm}
              minRssiFilter={minRssiFilter}
              onMinRssiChange={setMinRssiFilter}
              onExport={() => exportToExcel(filteredEvents, timeZone)}
              onTogglePause={togglePause}
              isPaused={isPaused}
              antennas={ANTENNAS}
            />

            <DataGrid
              events={events}
              antennaFilter={antennaFilter}
              searchTerm={searchTerm}
              minRssiFilter={minRssiFilter}
              timeZone={timeZone}
            />
          </>
        ) : tab === "reports" ? (
          <div className="mt-2">
            <ReportsView timeZone={timeZone} />
          </div>
        ) : (
          <div className="mt-2">
            <AntennaMapping />
          </div>
        )}
      </main>
    </div>
  );
}
