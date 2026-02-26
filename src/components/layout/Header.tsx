import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Wifi, WifiOff } from "lucide-react";

type HeaderProps = {
  isConnected: boolean;
};

export const Header = ({ isConnected }: HeaderProps) => {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <header className="border-b border-white/10 bg-panel/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-5">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-primary">
            FXR90
          </p>
          <h1 className="text-2xl font-semibold text-text">
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
          <div className="text-right">
            <p className="text-xs uppercase tracking-[0.3em] text-text/60">
              Hora local
            </p>
            <p className="text-sm font-semibold text-text">
              {format(now, "HH:mm:ss")}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};
