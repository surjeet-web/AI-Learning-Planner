"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAppSelector } from "@/lib/store"
import { selectRoadmap } from "@/lib/slices/roadmap-slice"
import { Calendar } from "lucide-react"
import { createICS } from "@/lib/ics"

export function ScheduleExport() {
  const roadmap = useAppSelector(selectRoadmap)

  const exportICS = () => {
    const now = new Date()
    const ics = createICS({
      calendarName: "AI Learning Planner",
      events: roadmap.modules.map((m, i) => {
        const start = new Date(now.getTime())
        start.setDate(now.getDate() + i * (m.durationDays || 1))
        const end = new Date(start.getTime())
        end.setDate(start.getDate() + (m.durationDays || 1))
        return {
          uid: `${m.id}@ai-learning-planner`,
          title: m.title,
          description: m.description || "",
          start,
          end,
        }
      }),
    })
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "learning-schedule.ics"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calendar Export</CardTitle>
        <CardDescription>Add sessions to your calendar as all-day events.</CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={exportICS} disabled={roadmap.modules.length === 0}>
          <Calendar className="mr-2 h-4 w-4" />
          Export .ics
        </Button>
      </CardContent>
    </Card>
  )
}
