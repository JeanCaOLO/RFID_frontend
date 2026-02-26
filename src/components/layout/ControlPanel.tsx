import { PauseCircle, PlayCircle, Download } from "lucide-react";

type ControlPanelProps = {
  antennaFilter: number | "all";
  onAntennaChange: (value: number | "all") => void;
  onSearchChange: (value: string) => void;
  onExport: () => void;
  onTogglePause: () => void;
  isPaused: boolean;
  antennas: number[];
};

export const ControlPanel = ({
  antennaFilter,
  onAntennaChange,
  onSearchChange,
  onExport,
  onTogglePause,
  isPaused,
  antennas
}: ControlPanelProps) => {
  return (
    <section className="sticky top-0 z-10 rounded-2xl border border-white/10 bg-panel/90 p-4 backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <button
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
              isPaused
                ? "bg-warning/20 text-warning"
                : "bg-success/20 text-success"
            }`}
            onClick={onTogglePause}
          >
            {isPaused ? (
              <PlayCircle className="h-4 w-4" />
            ) : (
              <PauseCircle className="h-4 w-4" />
            )}
            {isPaused ? "Reanudar" : "Pausar"}
          </button>

          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-slate-800 px-3 py-2">
            <label className="text-xs uppercase tracking-wider text-text/60">
              Antena
            </label>
            <select
              className="rounded-md bg-slate-800 text-sm font-semibold text-text outline-none"
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
          </div>

          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-deep/70 px-3 py-2">
            <label className="text-xs uppercase tracking-wider text-text/60">
              Buscar EPC
            </label>
            <input
              className="w-40 bg-transparent text-sm text-text outline-none"
              placeholder="EPC"
              onChange={(event) => onSearchChange(event.target.value)}
            />
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
