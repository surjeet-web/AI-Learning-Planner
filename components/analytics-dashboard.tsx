"use client";

import { memo, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAppSelector } from "@/lib/store";
import { selectProgress } from "@/lib/slices/progress-slice";
import { selectRoadmap } from "@/lib/slices/roadmap-slice";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Pie,
  PieChart,
  Cell,
  ResponsiveContainer,
  Line,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";

const COLORS = ["hsl(142 70% 45%)", "hsl(50 94% 50%)"];

export const AnalyticsDashboard = memo(function AnalyticsDashboard() {
  const prog = useAppSelector(selectProgress);
  const roadmap = useAppSelector(selectRoadmap);

  const { categoryData, completionRate, activeModules } = useMemo(() => {
    const completedModules = roadmap.modules.filter((m) => m.completed).length;
    const activeModules = roadmap.modules.filter((m) => !m.completed).length;

    return {
      categoryData: [
        { name: "Completed", value: completedModules },
        { name: "Active", value: activeModules },
      ],
      completionRate: roadmap.modules.length
        ? Math.round((completedModules / roadmap.modules.length) * 100)
        : 0,
      activeModules,
    };
  }, [roadmap.modules]);

  const velocityData = useMemo(
    () =>
      prog.last30Days.map((d) => ({
        day: d.label,
        minutes: d.minutes,
      })),
    [prog.last30Days]
  );

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Learning Analytics</CardTitle>
          <CardDescription>
            Key metrics to optimize your learning.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-4">
          <div className="rounded-md border p-3">
            <div className="text-xs text-muted-foreground">Completion</div>
            <div className="text-2xl font-semibold">{completionRate}%</div>
          </div>
          <div className="rounded-md border p-3">
            <div className="text-xs text-muted-foreground">Total Minutes</div>
            <div className="text-2xl font-semibold">{prog.totalMinutes}</div>
          </div>
          <div className="rounded-md border p-3">
            <div className="text-xs text-muted-foreground">Active Modules</div>
            <div className="text-2xl font-semibold">{activeModules}</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Module Mix</CardTitle>
          <CardDescription>
            Distribution of active vs completed.
          </CardDescription>
        </CardHeader>
        <CardContent className="h-64">
          <ChartContainer
            config={{
              completed: { label: "Completed", color: COLORS[0] },
              active: { label: "Active", color: COLORS[1] },
            }}
            className="h-full w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={48}
                  outerRadius={80}
                >
                  {categoryData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent payload={[]} />} />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Learning Velocity</CardTitle>
          <CardDescription>
            Minutes studied per day (last 30 days).
          </CardDescription>
        </CardHeader>
        <CardContent className="h-72">
          <ChartContainer
            config={{
              minutes: { label: "Minutes", color: "hsl(222 84% 55%)" },
            }}
            className="h-full w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={velocityData}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Line
                  type="monotone"
                  dataKey="minutes"
                  stroke="var(--color-minutes)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
});
