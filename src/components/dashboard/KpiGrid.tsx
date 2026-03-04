import { Activity, AlertTriangle, RadioTower, SignalHigh } from "lucide-react";
import type { RFIDTagEvent } from "../../types/rfid.types";

type KpiGridProps = {
  tags: RFIDTagEvent[];
};

const CardBase = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-5 shadow-lg transition hover:border-sky-500/50">
    <div className="flex items-start gap-4">{children}</div>
  </div>
);

export const KpiGrid = ({ tags }: KpiGridProps) => {
  const totalReads = tags.length;
  const uniqueTags = new Set(tags.map((tag) => tag.epc)).size;

  const antennaCounts = new Map<number, number>();
  tags.forEach((tag) => {
    antennaCounts.set(tag.antenna, (antennaCounts.get(tag.antenna) ?? 0) + 1);
  });

  let topAntenna: number | null = null;
  let topCount = 0;
  antennaCounts.forEach((count, antenna) => {
    if (count > topCount) {
      topCount = count;
      topAntenna = antenna;
    }
  });

  const bestSignal = tags.reduce<RFIDTagEvent | null>((best, current) => {
    if (!best) return current;
    return current.rssi > best.rssi ? current : best;
  }, null);

  const bestRssi = bestSignal ? `${bestSignal.rssi} dBm` : "0 dBm";
  const bestEpc = bestSignal
    ? `...${bestSignal.epc.slice(-6)}`
    : "Esperando datos...";

  const errorTags = tags.filter((tag) => !tag.isValid);
  const totalErrors = errorTags.length;

  const errorAntennaCounts = new Map<number, number>();
  errorTags.forEach((tag) => {
    errorAntennaCounts.set(
      tag.antenna,
      (errorAntennaCounts.get(tag.antenna) ?? 0) + 1
    );
  });

  let topErrorAntenna: number | null = null;
  let topErrorCount = 0;
  errorAntennaCounts.forEach((count, antenna) => {
    if (count > topErrorCount) {
      topErrorCount = count;
      topErrorAntenna = antenna;
    }
  });

  return (
    <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
      <CardBase>
        <Activity className="h-6 w-6 text-sky-500" />
        <div>
          <p className="text-xs uppercase text-slate-400">
            Lecturas (Únicas / Total)
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-50">
            {uniqueTags}
          </p>
          <p className="text-xs text-slate-500">
            de {totalReads} lecturas globales
          </p>
        </div>
      </CardBase>

      <CardBase>
        <RadioTower className="h-6 w-6 text-emerald-500" />
        <div>
          <p className="text-xs uppercase text-slate-400">Antena Más Activa</p>
          <p className="mt-2 text-2xl font-bold text-slate-50">
            {topAntenna ? `Antena ${topAntenna}` : "N/A"}
          </p>
          <p className="flex items-center gap-2 text-xs text-slate-500">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            Procesando mayor tráfico
          </p>
        </div>
      </CardBase>

      <CardBase>
        <SignalHigh className="h-6 w-6 text-amber-500" />
        <div>
          <p className="text-xs uppercase text-slate-400">Mejor Señal (RSSI)</p>
          <p className="mt-2 text-2xl font-bold text-slate-50">
            {bestRssi}
          </p>
          <p className="text-xs font-mono text-sky-400">Tag: {bestEpc}</p>
        </div>
      </CardBase>

      <div className="rounded-xl border border-red-500/50 bg-red-950/30 p-5 shadow-[0_0_15px_rgba(239,68,68,0.2)] transition hover:border-red-400">
        <div className="flex items-start gap-4">
          <AlertTriangle className="h-6 w-6 text-red-500" />
          <div>
            <p className="text-xs uppercase text-red-400/80">
              Alertas de Despacho
            </p>
            <p
              className={`mt-2 text-2xl font-bold text-red-500 ${
                totalErrors > 0 ? "animate-pulse" : ""
              }`}
            >
              {totalErrors}
            </p>
            <p className="text-sm text-slate-400">
              {totalErrors > 0
                ? `Principal foco: Antena ${topErrorAntenna ?? "Ninguna"}`
                : "Operación normal"}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
