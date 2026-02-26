import { Activity, SignalHigh, Radar } from "lucide-react";

type KpiGridProps = {
  totalReads: number;
  uniqueTags: number;
  peakRssi: number;
  topAntenna: number | null;
};

const Card = ({
  label,
  value,
  icon: Icon
}: {
  label: string;
  value: string | number;
  icon: typeof Activity;
}) => (
  <div className="rounded-2xl border border-white/10 bg-panel p-5 shadow-glow">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-text/60">
          {label}
        </p>
        <p className="mt-2 text-2xl font-semibold text-text">{value}</p>
      </div>
      <div className="rounded-full bg-primary/20 p-3 text-primary">
        <Icon className="h-5 w-5" />
      </div>
    </div>
  </div>
);

export const KpiGrid = ({
  totalReads,
  uniqueTags,
  peakRssi,
  topAntenna
}: KpiGridProps) => {
  return (
    <section className="grid gap-4 md:grid-cols-3">
      <Card label="Total lecturas" value={totalReads} icon={Activity} />
      <Card label="Tags únicos" value={uniqueTags} icon={Radar} />
      <Card
        label="Pico RSSI"
        value={`${peakRssi} dBm · Antena ${topAntenna ?? "-"}`}
        icon={SignalHigh}
      />
    </section>
  );
};
