import { useEffect, useState } from "react";
import { Moon, Sun, Wifi, WifiOff } from "lucide-react";
import type { Theme } from "../../hooks/useTheme";
import { formatTime } from "../../utils/formatters";

// Zona del navegador (para ofrecer la opción "Hora local del dispositivo").
const BROWSER_TIME_ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;

const TIME_ZONE_OPTIONS = [
  {
    value: "America/Costa_Rica",
    label: "America/Costa_Rica (Costa Rica)"
  },
  { value: "America/Caracas", label: "America/Caracas (Venezuela)" },
  {
    value: "America/Mexico_City",
    label: "America/Mexico_City (Mexico)"
  },
  { value: BROWSER_TIME_ZONE, label: `Hora local (${BROWSER_TIME_ZONE})` },
  { value: "UTC", label: "UTC (Tiempo Universal Coordinado)" }
];

type HeaderProps = {
  isConnected: boolean;
  theme: Theme;
  onToggleTheme: () => void;
  timeZone: string;
  setTimeZone: (value: string) => void;
};

export const Header = ({
  isConnected,
  theme,
  onToggleTheme,
  timeZone,
  setTimeZone
}: HeaderProps) => {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur transition-colors duration-300 dark:border-slate-700 dark:bg-slate-800/80">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-5">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
            Monitor RFID
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <div
            className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider ${
              isConnected
                ? "border-success/60 bg-success/10 text-success"
                : "border-danger/60 bg-danger/10 text-danger"
            }`}
          >
            {isConnected ? (
              <Wifi className="h-4 w-4" />
            ) : (
              <WifiOff className="h-4 w-4" />
            )}
            {isConnected ? "Conectado" : "Desconectado"}
            <span className="h-2 w-2 rounded-full bg-current animate-pulse-soft" />
          </div>
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label="Cambiar tema"
            title="Cambiar tema"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 transition-all duration-300 hover:border-sky-400 hover:text-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">
              {theme === "dark" ? "Modo claro" : "Modo oscuro"}
            </span>
          </button>
          <div className="flex items-center gap-2">
            <label
              htmlFor="timezone-switcher"
              className="text-xs uppercase tracking-[0.2em] text-slate-500 transition-colors duration-300 dark:text-slate-400"
            >
              Zona
            </label>
            <select
              id="timezone-switcher"
              value={timeZone}
              onChange={(event) => setTimeZone(event.target.value)}
              className="rounded-md border border-slate-300 bg-transparent px-2 py-1 text-sm text-slate-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-sky-500/50 dark:border-slate-700 dark:text-slate-300"
            >
              {TIME_ZONE_OPTIONS.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                  className="bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100"
                >
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
              Hora ({timeZone.split("/").pop()?.replace("_", " ") ?? timeZone})
            </p>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              {formatTime(now.toISOString(), timeZone)}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};
