"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface DisciplineChartProps {
  data: { disciplina: string; media: number }[];
}

export function DisciplineChart({ data }: DisciplineChartProps) {
  return (
    <div className="h-[260px] w-full" data-testid="discipline-chart">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="78%">
          <PolarGrid stroke="rgba(255,255,255,0.08)" />
          <PolarAngleAxis
            dataKey="disciplina"
            tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 11 }}
          />
          <Tooltip
            contentStyle={{
              background: "rgba(15,15,22,0.95)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12,
              fontSize: 12,
              color: "white",
            }}
          />
          <Radar
            dataKey="media"
            stroke="#a78bfa"
            fill="#6366f1"
            fillOpacity={0.45}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
