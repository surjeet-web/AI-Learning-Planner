"use client"

import { useEffect, useMemo, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Plus, Sparkles, BarChart3, Library, Presentation, Timer, Sun, Moon } from "lucide-react"
import { AddCourseDialog } from "@/components/add-course-dialog"
import { CourseCard } from "@/components/course-card"
import { RoadmapGenerator } from "@/components/roadmap-generator"
import { ProgressTracker } from "@/components/progress-tracker"
import { PresentationCreator } from "@/components/presentation-creator"
import { AnalyticsDashboard } from "@/components/analytics-dashboard"
import { ScheduleExport } from "@/components/schedule-export"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { addCourse, selectCourses } from "@/lib/slices/courses-slice"
import { selectRoadmap } from "@/lib/slices/roadmap-slice"
import { selectProgress } from "@/lib/slices/progress-slice"
import { selectSettings, toggleDarkMode } from "@/lib/slices/settings-slice"
import { useTheme } from "next-themes"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { VoiceCapture } from "@/components/voice-capture"
import { PWARegister } from "@/components/pwa-register"
import { StorageDashboard } from "@/components/storage-dashboard"
import { LocalDataSync } from "@/components/local-data-sync"
import { OfflineBanner } from "@/components/offline-banner"
import { useToast } from "@/hooks/use-toast"

export default function Page() {
  const dispatch = useAppDispatch()
  const courses = useAppSelector(selectCourses)
  const roadmap = useAppSelector(selectRoadmap)
  const progress = useAppSelector(selectProgress)
  const settings = useAppSelector(selectSettings)
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()
  const [openAdd, setOpenAdd] = useState(false)
  const [filter, setFilter] = useState("all")
  const [query, setQuery] = useState("")

  useEffect(() => {
    if (settings.darkMode !== undefined) {
      setTheme(settings.darkMode ? "dark" : "light")
    }
  }, [settings.darkMode, setTheme])

  const filteredCourses = useMemo(() => {
    const q = query.trim().toLowerCase()
    return courses.list
      .filter((c) => (filter === "all" ? true : c.status === filter))
      .filter((c) => {
        if (!q) return true
        return (
          c.title.toLowerCase().includes(q) ||
          (c.description || "").toLowerCase().includes(q) ||
          c.tags.some((t) => t.toLowerCase().includes(q))
        )
      })
  }, [courses.list, filter, query])

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <LocalDataSync />
      <OfflineBanner />
      <PWARegister />
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Image
            src="/placeholder.svg?height=48&width=48"
            width={48}
            height={48}
            alt="AI Learning Planner Logo"
            className="rounded"
          />
          <div>
            <h1 className="text-2xl font-semibold">AI Learning Planner</h1>
            <p className="text-sm text-muted-foreground">Plan, track, and master new skills with an AI copilot.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => dispatch(toggleDarkMode())} aria-label="Toggle dark mode">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <VoiceCapture onCaptured={(text) => setQuery(text)} />
          <Button onClick={() => setOpenAdd(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Course
          </Button>
        </div>
      </header>

      <Tabs defaultValue="library" className="space-y-6">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="library" className="flex items-center gap-2">
            <Library className="h-4 w-4" /> Library
          </TabsTrigger>
          <TabsTrigger value="roadmap" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" /> AI Roadmap
          </TabsTrigger>
          <TabsTrigger value="progress" className="flex items-center gap-2">
            <Timer className="h-4 w-4" /> Progress
          </TabsTrigger>
          <TabsTrigger value="present" className="flex items-center gap-2">
            <Presentation className="h-4 w-4" /> Presentation
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" /> Analytics
          </TabsTrigger>
          <TabsTrigger value="storage" className="flex items-center gap-2">
            <Library className="h-4 w-4" /> Storage
          </TabsTrigger>
        </TabsList>

        <TabsContent value="library" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Course Library</CardTitle>
                <CardDescription>Centralized repository of your learning resources.</CardDescription>
              </div>
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                <div className="flex items-center gap-2">
                  <label htmlFor="status" className="sr-only">
                    Filter status
                  </label>
                  <select
                    id="status"
                    className="min-w-[160px] rounded-md border bg-background px-3 py-2 text-sm"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  >
                    <option value="all">All Statuses</option>
                    <option value="planned">Planned</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div className="relative">
                  <label htmlFor="search" className="sr-only">
                    Search
                  </label>
                  <Input
                    id="search"
                    placeholder="Search title, tags..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
                <Button onClick={() => setOpenAdd(true)} className="whitespace-nowrap">
                  <Plus className="mr-2 h-4 w-4" /> Quick Add
                </Button>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="pt-6">
              {filteredCourses.length === 0 ? (
                <div className="grid place-items-center rounded-md border p-8 text-center">
                  <p className="text-muted-foreground">
                    No courses yet. Click {'"'}Add Course{'"'} to get started.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredCourses.map((c) => (
                    <CourseCard key={c.id} course={c} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roadmap" className="space-y-4">
          <RoadmapGenerator />
          <ScheduleExport />
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          <ProgressTracker />
        </TabsContent>

        <TabsContent value="present" className="space-y-4">
          <PresentationCreator />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <AnalyticsDashboard />
        </TabsContent>

        <TabsContent value="storage" className="space-y-4">
          <StorageDashboard />
        </TabsContent>
      </Tabs>

      <AddCourseDialog
        open={openAdd}
        onOpenChange={setOpenAdd}
        onAdded={async (course) => {
          dispatch(addCourse(course))
          toast({ title: "Course added", description: "Auto-processing details & roadmap..." })
          try {
            const { autoProcessCourse } = await import("@/lib/auto-process")
            await autoProcessCourse(course, dispatch)
            toast({ title: "Course processed", description: "Details enriched and roadmap generated." })
          } catch {
            // ignore
          }
        }}
      />
    </main>
  )
}
