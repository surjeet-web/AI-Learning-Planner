"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { selectRoadmap, toggleModuleComplete } from "@/lib/slices/roadmap-slice"
import { selectProgress, incrementStreak, logStudySession } from "@/lib/slices/progress-slice"
import { useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { Checkbox } from "@/components/ui/checkbox"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { NotificationsToggle } from "@/components/notifications-toggle"

export function ProgressTracker() {
  const { toast } = useToast()
  const dispatch = useAppDispatch()
  const roadmap = useAppSelector(selectRoadmap)
  const prog = useAppSelector(selectProgress)

  const completionPct = roadmap.modules.length
    ? Math.round((roadmap.modules.filter((m) => m.completed).length / roadmap.modules.length) * 100)
    : 0

  useEffect(() => {
    // Simplified: each load increments streak if last session was yesterday or today and a session exists
    // Better logic lives in the slice; here we ensure UI reflects
  }, [])

  const studyToday = () => {
    dispatch(logStudySession({ durationMinutes: 30 }))
    dispatch(incrementStreak())
    toast({ title: "Nice work!", description: "Logged 30 minutes and updated your streak." })
  }

  const chartData = prog.last7Days.map((d) => ({ day: d.label, minutes: d.minutes }))

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Progress Overview</CardTitle>
          <CardDescription>Gamified tracking to keep you motivated.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">{"Overall completion"}</div>
            <div className="flex items-center gap-2">
              <Progress value={completionPct} className="w-40" />
              <span className="text-sm">{completionPct}%</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-md border p-3">
              <div className="text-xs text-muted-foreground">{"Current streak"}</div>
              <div className="text-2xl font-semibold">{prog.streakDays}d</div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-xs text-muted-foreground">{"Total minutes"}</div>
              <div className="text-2xl font-semibold">{prog.totalMinutes}</div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-xs text-muted-foreground">{"Sessions"}</div>
              <div className="text-2xl font-semibold">{prog.sessions}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationsToggle />
          </div>
          <Button onClick={studyToday}>Log 30 min now</Button>
          <div className="pt-2">
            <ChartContainer
              config={{
                minutes: { label: "Minutes", color: "hsl(142 71% 45%)" },
              }}
              className="h-48 w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <Bar dataKey="minutes" fill="var(--color-minutes)" radius={6} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Modules</CardTitle>
          <CardDescription>Mark modules as you complete them.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {roadmap.modules.length === 0 ? (
            <div className="text-sm text-muted-foreground">{"No modules yet. Generate a roadmap first."}</div>
          ) : (
            roadmap.modules.map((m) => (
              <label key={m.id} className="flex items-start gap-3">
                <Checkbox checked={m.completed} onCheckedChange={() => dispatch(toggleModuleComplete(m.id))} />
                <div>
                  <div className="font-medium">{m.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {m.durationDays} days • {m.description}
                  </div>
                </div>
              </label>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
