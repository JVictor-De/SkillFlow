"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface ErrorChartProps {
  data: { categoria: string; total: number }[];
}

export function ErrorChart({ data }: ErrorChartProps) {
  return (
    <div className="h-[260px] w-full" data-testid="error-chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
          <defs>
            <linearGradient id="bar-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.85} />
              <stop offset="100%" stopColor="#6366f1" stopOpacity={0.85} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis
            dataKey="categoria"
            tick={{ fill: "rgba(255,255,255,0.65)", fontSize: 11 }}
            axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.05)" }}
            contentStyle={{
              background: "rgba(15,15,22,0.95)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12,
              fontSize: 12,
              color: "white",
            }}
          />
          <Bar
            dataKey="total"
            radius={[8, 8, 0, 0]}
            fill="url(#bar-gradient)"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
