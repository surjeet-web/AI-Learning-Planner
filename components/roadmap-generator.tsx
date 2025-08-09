"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useState, useMemo } from "react"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Shuffle, Wand2 } from "lucide-react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { addRoadmap, selectRoadmap } from "@/lib/slices/roadmap-slice"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

export function RoadmapGenerator() {
  const { toast } = useToast()
  const dispatch = useAppDispatch()
  const roadmapState = useAppSelector(selectRoadmap)
  const [subject, setSubject] = useState("")
  const [goals, setGoals] = useState("")
  const [durationDays, setDurationDays] = useState(30)
  const [hoursPerWeek, setHoursPerWeek] = useState(7)
  const [loading, setLoading] = useState(false)

  const totalDays = roadmapState.modules.reduce((acc, m) => acc + (m.durationDays || 0), 0)
  const completion = useMemo(() => {
    const count = roadmapState.modules.length
    if (count === 0) return 0
    const done = roadmapState.modules.filter((m) => m.completed).length
    return Math.round((done / count) * 100)
  }, [roadmapState.modules])

  const generate = async (useAI: boolean) => {
    if (!subject.trim()) {
      toast({ title: "Subject required", variant: "destructive" })
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          goals,
          durationDays,
          hoursPerWeek,
          mode: useAI ? "ai" : "heuristic",
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to generate roadmap")
      dispatch(
        addRoadmap({
          id: crypto.randomUUID(),
          subject,
          modules: data.modules || [],
          totalDurationDays: data.totalDurationDays || durationDays,
          createdAt: Date.now(),
        }),
      )
      toast({ title: "Roadmap created", description: "You can adjust durations and order." })
    } catch (e: any) {
      toast({ title: "Generation failed", description: e?.message || "Try again.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Roadmap Generator</CardTitle>
        <CardDescription>{"Transform goals into a structured, time-bound plan."}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="e.g., React.js Fundamentals"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="goals">Goals</Label>
            <Input
              id="goals"
              placeholder="e.g., Build SPA, master hooks"
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="duration">{"Total Duration (days)"}</Label>
            <Input
              id="duration"
              type="number"
              min={7}
              max={365}
              value={durationDays}
              onChange={(e) => setDurationDays(Number.parseInt(e.target.value || "0"))}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="hours">{"Hours per week"}</Label>
            <Input
              id="hours"
              type="number"
              min={1}
              max={60}
              value={hoursPerWeek}
              onChange={(e) => setHoursPerWeek(Number.parseInt(e.target.value || "0"))}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button disabled={loading} onClick={() => generate(true)}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
            Generate with AI
          </Button>
          <Button variant="secondary" disabled={loading} onClick={() => generate(false)}>
            <Shuffle className="mr-2 h-4 w-4" />
            Quick Generate
          </Button>
        </div>

        {roadmapState.modules.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {`Total modules: ${roadmapState.modules.length} • Planned days: ${totalDays || 0}`}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">Completion</span>
                <Progress value={completion} className="w-40" />
                <span className="text-sm">{completion}%</span>
              </div>
            </div>
            <div className="grid gap-3">
              {roadmapState.modules.map((m, idx) => (
                <div key={m.id} className="rounded-md border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{`${idx + 1}. ${m.title}`}</span>
                        {m.prerequisites?.length ? (
                          <Badge variant="outline" className="text-xs">
                            {`Prereqs: ${m.prerequisites.join(", ")}`}
                          </Badge>
                        ) : null}
                      </div>
                      <p className="text-sm text-muted-foreground">{m.description}</p>
                    </div>
                    <div className="text-sm text-muted-foreground whitespace-nowrap">{m.durationDays} days</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
