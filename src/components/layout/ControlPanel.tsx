import { Pause, Play, Download, Search, ChevronDown } from "lucide-react";

type ControlPanelProps = {
  antennaFilter: number | "all";
  onAntennaChange: (value: number | "all") => void;
  onSearchChange: (value: string) => void;
  minRssiFilter: number | "all";
  onMinRssiChange: (value: number | "all") => void;
  onExport: () => void;
  onTogglePause: () => void;
  isPaused: boolean;
  antennas: number[];
};

export const ControlPanel = ({
  antennaFilter,
  onAntennaChange,
  onSearchChange,
  minRssiFilter,
  onMinRssiChange,
  onExport,
  onTogglePause,
  isPaused,
  antennas
}: ControlPanelProps) => {
  return (
    <section className="sticky top-0 z-10 rounded-full border border-slate-200 bg-white p-3 shadow-lg backdrop-blur transition-colors duration-300 dark:border-transparent dark:bg-[#1e293b] dark:shadow-none">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <button
            className={`flex items-center gap-2 rounded-full border px-5 py-2 text-sm font-semibold transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-sky-500/50 ${
              isPaused
                ? "border-amber-500 bg-amber-500/20 text-amber-500"
                : "bg-transparent border border-emerald-500 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950"
            }`}
            onClick={onTogglePause}
          >
            {isPaused ? (
              <Play className="h-4 w-4" />
            ) : (
              <Pause className="h-4 w-4" />
            )}
            {isPaused ? "Reanudar" : "Pausar"}
          </button>

          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-3 py-2 transition-colors duration-300 dark:border-transparent dark:bg-slate-700">
            <label className="text-xs uppercase tracking-wider text-slate-500 transition-colors duration-300 dark:text-slate-400">
              Antena
            </label>
            <div className="relative">
              <select
                className="appearance-none rounded-lg border border-slate-200 bg-slate-100 px-4 py-2 pr-9 text-sm font-semibold text-slate-900 outline-none transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-sky-500/50 dark:border-transparent dark:bg-slate-700 dark:text-white"
                value={antennaFilter}
                onChange={(event) => {
                  const value = event.target.value;
                  onAntennaChange(value === "all" ? "all" : Number(value));
                }}
              >
                <option className="bg-slate-100 text-slate-900" value="all">
                  Todas
                </option>
                {antennas.map((antenna) => (
                  <option
                    key={antenna}
                    value={antenna}
                    className="bg-slate-100 text-slate-900"
                  >
                    Antena {antenna}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 transition-colors duration-300 dark:text-slate-400" />
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-deep/70 px-3 py-2 focus-within:ring-2 focus-within:ring-sky-500/50">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              className="w-44 bg-transparent text-sm text-text outline-none"
              placeholder="Buscar EPC"
              onChange={(event) => onSearchChange(event.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-3 py-2 transition-colors duration-300 dark:border-transparent dark:bg-slate-700">
            <label className="text-xs uppercase tracking-wider text-slate-500 transition-colors duration-300 dark:text-slate-400">
              RSSI
            </label>
            <div className="relative">
              <select
                className="appearance-none rounded-lg border border-slate-200 bg-slate-100 px-4 py-2 pr-9 text-sm font-semibold text-slate-900 outline-none transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-sky-500/50 dark:border-transparent dark:bg-slate-700 dark:text-white"
                value={minRssiFilter}
                onChange={(event) => {
                  const value = event.target.value;
                  onMinRssiChange(value === "all" ? "all" : Number(value));
                }}
              >
                <option className="bg-slate-100 text-slate-900" value="all">
                  Todas
                </option>
                <option className="bg-slate-100 text-slate-900" value={-60}>
                  Buena (&gt; -60 dBm)
                </option>
                <option className="bg-slate-100 text-slate-900" value={-40}>
                  Excelente (&gt; -40 dBm)
                </option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 transition-colors duration-300 dark:text-slate-400" />
            </div>
          </div>
        </div>

        <button
          className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-glow transition hover:bg-sky-400"
          onClick={onExport}
        >
          <Download className="h-4 w-4" />
          Exportar Excel
        </button>
      </div>
    </section>
  );
};
