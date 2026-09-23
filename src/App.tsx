import { useMemo, useState } from "react";
import {
  BarChart3,
  LayoutDashboard,
  Settings2,
  MonitorSmartphone,
  Truck
} from "lucide-react";
import { Header } from "./components/layout/Header";
import { ControlPanel } from "./components/layout/ControlPanel";
import { KpiGrid } from "./components/dashboard/KpiGrid";
import { DataGrid } from "./components/table/DataGrid";
import { LiveMetricsDashboard } from "./components/charts/LiveMetricsDashboard";
import { AntennaMapping } from "./components/mapping/AntennaMapping";
import { ReportsView } from "./components/reports/ReportsView";
import { MonitorView } from "./components/monitor/MonitorView";
import { TruckLoad } from "./components/truck/TruckLoad";
import { useRFIDStream } from "./hooks/useRFIDStream";
import { useExport } from "./hooks/useExport";
import { useTheme } from "./hooks/useTheme";
import { useTimeZone } from "./hooks/useTimeZone";

const ANTENNAS = [1, 2, 3, 4];

type Tab = "dashboard" | "monitor" | "truck" | "reports" | "mapping";

const TABS: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "monitor", label: "Monitor", icon: MonitorSmartphone },
  { id: "truck", label: "Carga Camión", icon: Truck },
  { id: "reports", label: "Reportes", icon: BarChart3 },
  { id: "mapping", label: "Mapeo de antenas", icon: Settings2 }
];

export default function App() {
  const { events, isConnected, isPaused, togglePause } = useRFIDStream();
  const { exportToExcel } = useExport();
  const { theme, toggleTheme } = useTheme();
  const { timeZone, setTimeZone } = useTimeZone();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [antennaFilter, setAntennaFilter] = useState<number | "all">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [minRssiFilter, setMinRssiFilter] = useState<number | "all">("all");

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const antennaMatch =
        antennaFilter === "all" ? true : event.antenna === antennaFilter;
      const term = searchTerm.toLowerCase();
      const searchMatch =
        event.epc.toLowerCase().includes(term) ||
        (event.pallet ?? "").toLowerCase().includes(term);
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
        <nav className="mt-6 flex flex-wrap gap-2">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                tab === id
                  ? "bg-sky-500 text-white shadow-glow"
                  : "border border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
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
        ) : tab === "monitor" ? (
          <div className="mt-2">
            <MonitorView events={events} timeZone={timeZone} />
          </div>
        ) : tab === "truck" ? (
          <div className="mt-2">
            <TruckLoad timeZone={timeZone} />
          </div>
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
