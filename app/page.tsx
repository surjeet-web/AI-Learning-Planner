"use client"

import { useEffect, useMemo, useState, lazy, Suspense, useCallback } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Plus, Sparkles, BarChart3, Library, Presentation, Timer, Sun, Moon, ChevronDown, Upload, StickyNote } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AddCourseDialog } from "@/components/add-course-dialog"
import { BulkAddCoursesDialog } from "@/components/bulk-add-courses-dialog"
import { VirtualizedCourseList } from "@/components/virtualized-course-list"
import { StickyNotes } from "@/components/sticky-notes"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { addCourse, selectCourses } from "@/lib/slices/courses-slice"
import { selectSettings, toggleDarkMode } from "@/lib/slices/settings-slice"
import { useTheme } from "next-themes"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { VoiceCapture } from "@/components/voice-capture"
import { PWARegister } from "@/components/pwa-register"
import { LocalDataSync } from "@/components/local-data-sync"
import { OfflineBanner } from "@/components/offline-banner"
import { useToast } from "@/hooks/use-toast"
import { useDebouncedSearch } from "@/hooks/use-debounced-search"
import { Skeleton } from "@/components/ui/skeleton"

// Lazy load heavy components
const RoadmapGenerator = lazy(() => import("@/components/roadmap-generator").then(m => ({ default: m.RoadmapGenerator })))
const ProgressTracker = lazy(() => import("@/components/progress-tracker").then(m => ({ default: m.ProgressTracker })))
const PresentationCreator = lazy(() => import("@/components/presentation-creator").then(m => ({ default: m.PresentationCreator })))
const AnalyticsDashboard = lazy(() => import("@/components/analytics-dashboard").then(m => ({ default: m.AnalyticsDashboard })))
const ScheduleExport = lazy(() => import("@/components/schedule-export").then(m => ({ default: m.ScheduleExport })))
const StorageDashboard = lazy(() => import("@/components/storage-dashboard").then(m => ({ default: m.StorageDashboard })))
const NotesDashboard = lazy(() => import("@/components/notes-dashboard").then(m => ({ default: m.NotesDashboard })))

const ComponentSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-8 w-48" />
    <Skeleton className="h-32 w-full" />
    <Skeleton className="h-24 w-full" />
  </div>
)

export default function Page() {
  const dispatch = useAppDispatch()
  const courses = useAppSelector(selectCourses)
  const settings = useAppSelector(selectSettings)
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()
  const [openAdd, setOpenAdd] = useState(false)
  const [openBulkAdd, setOpenBulkAdd] = useState(false)
  const [filter, setFilter] = useState("all")
  const [debouncedQuery, query, setQuery] = useDebouncedSearch("", 300)

  useEffect(() => {
    if (settings.darkMode !== undefined) {
      setTheme(settings.darkMode ? "dark" : "light")
    }
  }, [settings.darkMode, setTheme])

  const filteredCourses = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase()
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
  }, [courses.list, filter, debouncedQuery])

  const handleCourseAdded = useCallback(async (course: any) => {
    dispatch(addCourse(course))
    toast({ title: "Course added", description: "Auto-processing details & roadmap..." })
    try {
      const { autoProcessCourse } = await import("@/lib/auto-process")
      await autoProcessCourse(course, dispatch)
      toast({ title: "Course processed", description: "Details enriched and roadmap generated." })
    } catch {
      // ignore
    }
  }, [dispatch, toast])

  const handleBulkCoursesAdded = useCallback(async (courses: any[]) => {
    courses.forEach(course => dispatch(addCourse(course)))
    toast({ 
      title: `${courses.length} courses added`, 
      description: "Auto-processing details & roadmaps..." 
    })
    
    try {
      const { autoProcessCourse } = await import("@/lib/auto-process")
      const processPromises = courses.map(course => 
        autoProcessCourse(course, dispatch).catch(() => {})
      )
      await Promise.allSettled(processPromises)
      toast({ 
        title: "Bulk processing completed", 
        description: "All courses have been processed and roadmaps generated." 
      })
    } catch {
      // ignore overall failure
    }
  }, [dispatch, toast])

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <LocalDataSync />
      <OfflineBanner />
      <PWARegister />
      <StickyNotes />
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between" suppressHydrationWarning>
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Course
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setOpenAdd(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Single Course
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setOpenBulkAdd(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Advanced Import
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <Tabs defaultValue="library" className="space-y-6">
        <TabsList className="flex flex-wrap" suppressHydrationWarning>
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
          <TabsTrigger value="notes" className="flex items-center gap-2">
            <StickyNote className="h-4 w-4" /> Notes
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="whitespace-nowrap">
                      <Plus className="mr-2 h-4 w-4" />
                      Quick Add
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setOpenAdd(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Single Course
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setOpenBulkAdd(true)}>
                      <Upload className="mr-2 h-4 w-4" />
                      Advanced Import
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="pt-6">
              <VirtualizedCourseList courses={filteredCourses} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roadmap" className="space-y-4">
          <Suspense fallback={<ComponentSkeleton />}>
            <RoadmapGenerator />
            <ScheduleExport />
          </Suspense>
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          <Suspense fallback={<ComponentSkeleton />}>
            <ProgressTracker />
          </Suspense>
        </TabsContent>

        <TabsContent value="present" className="space-y-4">
          <Suspense fallback={<ComponentSkeleton />}>
            <PresentationCreator />
          </Suspense>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Suspense fallback={<ComponentSkeleton />}>
            <AnalyticsDashboard />
          </Suspense>
        </TabsContent>

        <TabsContent value="notes" className="space-y-4">
          <Suspense fallback={<ComponentSkeleton />}>
            <NotesDashboard />
          </Suspense>
        </TabsContent>

        <TabsContent value="storage" className="space-y-4">
          <Suspense fallback={<ComponentSkeleton />}>
            <StorageDashboard />
          </Suspense>
        </TabsContent>
      </Tabs>

      <AddCourseDialog
        open={openAdd}
        onOpenChange={setOpenAdd}
        onAdded={handleCourseAdded}
      />

      <BulkAddCoursesDialog
        open={openBulkAdd}
        onOpenChange={setOpenBulkAdd}
        onAdded={handleBulkCoursesAdded}
      />
    </main>
  )
}
