"use client"

import { Button } from "@/components/ui/button"
import { Play, Square } from "lucide-react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { addManualSession, selectCourseTime, startTimer, stopTimer } from "@/lib/slices/course-time-slice"
import { updateCourseStatus } from "@/lib/slices/courses-slice"
import { useEffect, useMemo, useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Props = {
  courseId?: string
  compact?: boolean
}

function formatMinutes(total: number) {
  const h = Math.floor(total / 60)
  const m = total % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export function CourseTimer({ courseId = "", compact = false }: Props) {
  const dispatch = useAppDispatch()
  const time = useAppSelector((s) => selectCourseTime(s as any, courseId))
  const [now, setNow] = useState(Date.now())
  const [manual, setManual] = useState("")

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const liveMinutes = useMemo(() => {
    if (!time?.isRunning || !time?.runningSince) return 0
    return Math.floor((now - time.runningSince) / 60000)
  }, [now, time?.isRunning, time?.runningSince])

  const total = (time?.totalMinutes || 0) + liveMinutes

  const onStart = () => {
    if (!courseId) return
    dispatch(startTimer({ courseId }))
    // set course status to in-progress
    dispatch(updateCourseStatus({ id: courseId, status: "in-progress" }))
  }
  const onStop = () => {
    if (!courseId) return
    dispatch(stopTimer({ courseId }))
  }
  const addManual = () => {
    const n = Number.parseInt(manual || "0", 10)
    if (Number.isFinite(n) && n > 0 && courseId) {
      dispatch(addManualSession({ courseId, minutes: n }))
      setManual("")
    }
  }

  if (compact) {
    return (
      <div className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
        <div>Time spent: {formatMinutes(total)}</div>
        {time?.isRunning ? (
          <Button size="sm" variant="destructive" onClick={onStop}>
            <Square className="mr-2 h-3 w-3" />
            Stop
          </Button>
        ) : (
          <Button size="sm" onClick={onStart}>
            <Play className="mr-2 h-3 w-3" />
            Start
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2 rounded-md border p-3">
      <div className="flex items-center justify-between">
        <div className="font-medium">Time spent: {formatMinutes(total)}</div>
        {time?.isRunning ? (
          <Button size="sm" variant="destructive" onClick={onStop}>
            <Square className="mr-2 h-3 w-3" />
            Stop
          </Button>
        ) : (
          <Button size="sm" onClick={onStart}>
            <Play className="mr-2 h-3 w-3" />
            Start
          </Button>
        )}
      </div>
      <div className="flex items-end gap-2">
        <div className="grid gap-1">
          <Label htmlFor="manual-min">Add minutes</Label>
          <Input
            id="manual-min"
            type="number"
            min={1}
            className="w-28"
            placeholder="e.g. 15"
            value={manual}
            onChange={(e) => setManual(e.target.value)}
          />
        </div>
        <Button variant="outline" onClick={addManual}>
          Add
        </Button>
      </div>
      <div className="text-xs text-muted-foreground">
        {time?.sessions?.length ? `${time.sessions.length} sessions logged` : "No sessions yet"}
      </div>
    </div>
  )
}
