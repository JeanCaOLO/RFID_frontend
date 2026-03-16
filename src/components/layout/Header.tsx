import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Moon, Sun, Wifi, WifiOff } from "lucide-react";
import type { Theme } from "../../hooks/useTheme";

type HeaderProps = {
  isConnected: boolean;
  theme: Theme;
  onToggleTheme: () => void;
};

export const Header = ({ isConnected, theme, onToggleTheme }: HeaderProps) => {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur transition-colors duration-300 dark:border-slate-700 dark:bg-slate-800/80">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-5">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-sky-500">
            FXR90
          </p>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
            Epic RFID Command Center
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
          <div className="text-right">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
              Hora local
            </p>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              {format(now, "HH:mm:ss")}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};
