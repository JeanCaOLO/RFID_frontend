import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts";
import type { RFIDTagEvent } from "../../types/rfid.types";
import { formatTime } from "../../utils/formatters";

const ANTENNA_COLORS: Record<number, { stroke: string; fill: string }> = {
  1: { stroke: "#0ea5e9", fill: "rgba(14, 165, 233, 0.25)" },
  2: { stroke: "#10b981", fill: "rgba(16, 185, 129, 0.25)" },
  3: { stroke: "#f59e0b", fill: "rgba(245, 158, 11, 0.25)" },
  4: { stroke: "#8b5cf6", fill: "rgba(139, 92, 246, 0.25)" }
};

const getChartData = (
  events: RFIDTagEvent[],
  filter: number | "all"
) => {
  return events
    .slice(0, 40)
    .map((event) => {
      const base = {
        time: formatTime(event.timestamp)
      } as Record<string, number | string | null>;

      if (filter === "all") {
        base.antenna1 = event.antenna === 1 ? event.rssi : null;
        base.antenna2 = event.antenna === 2 ? event.rssi : null;
        base.antenna3 = event.antenna === 3 ? event.rssi : null;
        base.antenna4 = event.antenna === 4 ? event.rssi : null;
      } else {
        base[`antenna${filter}`] = event.rssi;
      }

      return base;
    })
    .reverse();
};

type RssiLineChartProps = {
  events: RFIDTagEvent[];
  selectedAntenna?: number | "all";
};

export const RssiLineChart = ({
  events,
  selectedAntenna
}: RssiLineChartProps) => {
  const [activeFilter, setActiveFilter] = useState<number | "all">("all");

  useEffect(() => {
    if (selectedAntenna !== undefined) {
      setActiveFilter(selectedAntenna);
    }
  }, [selectedAntenna]);
  const data = useMemo(
    () => getChartData(events, activeFilter),
    [events, activeFilter]
  );

  const antennasToRender =
    activeFilter === "all" ? [1, 2, 3, 4] : [activeFilter];

  return (
    <div className="rounded-2xl border border-white/10 bg-panel p-5 shadow-glow">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-primary">
          RSSI en tiempo real
        </h3>
        <div className="flex flex-wrap gap-2">
          {["all", 1, 2, 3, 4].map((value) => {
            const isActive = activeFilter === value;
            return (
              <button
                key={value}
                onClick={() => setActiveFilter(value as number | "all")}
                className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider transition ${
                  isActive
                    ? "bg-primary text-white shadow-glow"
                    : "bg-deep/60 text-text/60 hover:text-text"
                }`}
              >
                {value === "all" ? "Todas" : `Ant ${value}`}
              </button>
            );
          })}
        </div>
      </div>
      <div className="mt-4 h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} />
            <YAxis stroke="#94a3b8" fontSize={10} domain={[-90, -10]} />
            <Tooltip
              contentStyle={{
                background: "#0f172a",
                border: "1px solid rgba(148, 163, 184, 0.2)",
                borderRadius: 12
              }}
              labelStyle={{ color: "#f8fafc" }}
            />
            <defs>
              {antennasToRender.map((antenna) => (
                <linearGradient
                  key={antenna}
                  id={`glow-${antenna}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor={ANTENNA_COLORS[antenna].stroke}
                    stopOpacity={0.45}
                  />
                  <stop
                    offset="100%"
                    stopColor={ANTENNA_COLORS[antenna].stroke}
                    stopOpacity={0}
                  />
                </linearGradient>
              ))}
            </defs>
            {antennasToRender.map((antenna) => {
              const key = `antenna${antenna}`;
              return (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={ANTENNA_COLORS[antenna].stroke}
                  fill={`url(#glow-${antenna})`}
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
              );
            })}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
