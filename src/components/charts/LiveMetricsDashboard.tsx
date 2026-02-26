import { useMemo } from "react";
import {
  Cell,
  Legend,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip
} from "recharts";
import { RssiLineChart } from "./RssiLineChart";

type RFIDTag = {
  epc: string;
  antenna: number;
  rssi: number;
  timestamp: string;
};

type LiveMetricsDashboardProps = {
  tags: RFIDTag[];
  selectedAntenna?: number | "all";
};

const ANTENNA_COLORS = {
  1: "#0ea5e9",
  2: "#10b981",
  3: "#f59e0b",
  4: "#8b5cf6"
} as const;

export const LiveMetricsDashboard = ({
  tags,
  selectedAntenna
}: LiveMetricsDashboardProps) => {
  const filteredTags = useMemo(() => {
    if (!selectedAntenna || selectedAntenna === "all") return tags;
    return tags.filter((tag) => tag.antenna === selectedAntenna);
  }, [tags, selectedAntenna]);

  const antennaDistribution = useMemo(() => {
    const counts = new Map<number, number>();
    filteredTags.forEach((tag) => {
      counts.set(tag.antenna, (counts.get(tag.antenna) ?? 0) + 1);
    });

    return [1, 2, 3, 4].map((antenna) => ({
      name: `Antena ${antenna}`,
      value: counts.get(antenna) ?? 0,
      fill: ANTENNA_COLORS[antenna as 1 | 2 | 3 | 4]
    }));
  }, [filteredTags]);

  return (
    <section className="grid gap-6 lg:grid-cols-2">
      <RssiLineChart events={tags} selectedAntenna={selectedAntenna} />

      <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-xs uppercase tracking-[0.3em] text-slate-400">
            Distribución por antenas
          </h3>
          <span className="text-xs text-slate-500">Impacto en tiempo real</span>
        </div>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              data={antennaDistribution}
              innerRadius="35%"
              outerRadius="90%"
              startAngle={90}
              endAngle={-270}
            >
              <PolarAngleAxis type="number" domain={[0, "dataMax"]} tick={false} />
              <RadialBar dataKey="value" background cornerRadius={12}>
                {antennaDistribution.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={entry.fill}
                    style={{ filter: `drop-shadow(0 0 10px ${entry.fill})` }}
                  />
                ))}
              </RadialBar>
              <Tooltip
                contentStyle={{
                  background: "#1e293b",
                  border: "1px solid rgba(14, 165, 233, 0.4)",
                  borderRadius: 12,
                  color: "#f8fafc"
                }}
              />
              <Legend
                iconType="circle"
                layout="horizontal"
                verticalAlign="bottom"
                wrapperStyle={{ color: "#94a3b8", fontSize: 12 }}
              />
            </RadialBarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
};
