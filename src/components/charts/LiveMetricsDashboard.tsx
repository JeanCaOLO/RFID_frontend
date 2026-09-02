import { useMemo, useState } from "react";
import { BarChart3, ChevronDown } from "lucide-react";
import {
  Cell,
  Legend,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip
} from "recharts";
import type { RFIDTagEvent } from "../../types/rfid.types";
import { RssiLineChart } from "./RssiLineChart";

type LiveMetricsDashboardProps = {
  tags: RFIDTagEvent[];
  selectedAntenna?: number | "all";
  timeZone?: string;
};

const ANTENNA_COLORS = {
  1: "#0ea5e9",
  2: "#10b981",
  3: "#f59e0b",
  4: "#8b5cf6"
} as const;

export const LiveMetricsDashboard = ({
  tags,
  selectedAntenna,
  timeZone
}: LiveMetricsDashboardProps) => {
  const [isOpen, setIsOpen] = useState(true);

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
    <section className="rounded-2xl border border-slate-200 bg-white/60 shadow-sm transition-colors duration-300 dark:border-slate-700/50 dark:bg-slate-900/40">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between px-5 py-4"
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-slate-900 dark:text-sky-300">
          <BarChart3 className="h-4 w-4 text-sky-500" />
          Métricas en tiempo real
        </span>
        <ChevronDown
          className={`h-5 w-5 text-slate-500 transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="grid gap-6 px-5 pb-5 lg:grid-cols-2">
          <RssiLineChart
            events={tags}
            selectedAntenna={selectedAntenna}
            timeZone={timeZone}
          />

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-colors duration-300 dark:border-slate-700/50 dark:bg-[#0d1b2a]">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-xs uppercase tracking-[0.3em] text-slate-900 transition-colors duration-300 dark:text-sky-300">
            Distribución por antenas
          </h3>
          <span className="text-xs text-slate-500 transition-colors duration-300 dark:text-slate-400">
            Impacto en tiempo real
          </span>
        </div>
        <div className="h-[300px] text-slate-500 transition-colors duration-300 dark:text-slate-400">
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
                wrapperStyle={{ color: "currentColor", fontSize: 12 }}
              />
            </RadialBarChart>
          </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
