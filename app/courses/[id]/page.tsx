"use client"

import { useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { selectCourses, updateCourse } from "@/lib/slices/courses-slice"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import Link from "next/link"
import { ExternalLink, RefreshCw, Check } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { CourseTimer } from "@/components/course-timer"
import { CourseNotes } from "@/components/course-notes"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { autoProcessCourse } from "@/lib/auto-process"

export default function CourseDetailPage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { toast } = useToast()
  const coursesState = useAppSelector(selectCourses)
  const course = useMemo(() => coursesState.list.find((c) => c.id === id), [coursesState.list, id])

  const [saving, setSaving] = useState(false)

  if (!course) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-6">
        <div className="rounded-md border p-6">
          <div className="mb-3 text-lg font-semibold">Course not found</div>
          <Button variant="outline" onClick={() => router.push("/")}>
            Go back
          </Button>
        </div>
      </main>
    )
  }

  const completionPct = course.modules.length
    ? Math.round((course.modules.filter((m) => m.completed).length / course.modules.length) * 100)
    : 0

  const regenerateRoadmap = async () => {
    setSaving(true)
    await autoProcessCourse(course, dispatch, { generateRoadmap: true, generatePresentation: true })
    setSaving(false)
    toast({ title: "Course updated", description: "Roadmap and presentation were regenerated." })
  }

  const toggleModule = (mid: string) => {
    const mods = course.modules.map((m) => (m.id === mid ? { ...m, completed: !m.completed } : m))
    dispatch(updateCourse({ id: course.id, changes: { modules: mods } }))
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 space-y-6">
      <div className="flex items-start gap-4">
        <div className="relative h-28 w-48 flex-shrink-0 overflow-hidden rounded-md">
          <Image
            src={course.image || "/placeholder.svg?height=112&width=192&query=course%20cover"}
            alt={`${course.title} cover`}
            fill
            className="object-cover"
          />
        </div>
        <div className="min-w-0">
          <h1 className="line-clamp-2 text-2xl font-semibold">{course.title}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            {course.provider ? <Badge variant="secondary">{course.provider}</Badge> : null}
            {course.level ? <Badge variant="outline">{course.level}</Badge> : null}
            {course.language ? <Badge variant="outline">{course.language}</Badge> : null}
            {typeof course.rating === "number" ? <Badge variant="outline">{"★ " + course.rating}</Badge> : null}
            {course.tags.slice(0, 4).map((t) => (
              <Badge key={t} variant="secondary">
                {t}
              </Badge>
            ))}
            {course.url ? (
              <Button variant="link" size="sm" asChild>
                <Link href={course.url} target="_blank" rel="noopener noreferrer">
                  Open <ExternalLink className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            ) : null}
          </div>
          <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{course.description}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Timer</CardTitle>
            <CardDescription>Track time spent on this course.</CardDescription>
          </CardHeader>
          <CardContent>
            <CourseTimer courseId={course.id} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Roadmap</CardTitle>
              <CardDescription>{`Completion: ${completionPct}%`}</CardDescription>
            </div>
            <Button size="sm" variant="outline" onClick={regenerateRoadmap} disabled={saving}>
              <RefreshCw className="mr-2 h-4 w-4" /> Regenerate
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {course.modules.length === 0 ? (
              <div className="text-sm text-muted-foreground">No modules yet. Use Regenerate to create one.</div>
            ) : (
              course.modules.map((m, idx) => (
                <label key={m.id} className="flex items-start gap-3 rounded-md border p-3">
                  <Checkbox checked={!!m.completed} onCheckedChange={() => toggleModule(m.id)} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{`${idx + 1}. ${m.title}`}</span>
                      {m.completed ? <Check className="h-4 w-4 text-emerald-500" /> : null}
                    </div>
                    {m.description ? <div className="text-xs text-muted-foreground">{m.description}</div> : null}
                    <div className="text-xs text-muted-foreground">
                      {m.durationDays ? `${m.durationDays} days` : ""}{" "}
                      {m.prerequisites?.length ? `• Prereqs: ${m.prerequisites.join(", ")}` : ""}
                    </div>
                  </div>
                </label>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Presentation</CardTitle>
              <CardDescription>Auto-generated Markdown outline for sharing.</CardDescription>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                await autoProcessCourse(course, dispatch, { generateRoadmap: false, generatePresentation: true })
                toast({ title: "Presentation updated" })
              }}
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Regenerate
            </Button>
          </CardHeader>
          <CardContent>
            {course.presentationMarkdown ? (
              <pre className="max-h-[360px] overflow-auto whitespace-pre-wrap rounded-md border p-3 text-sm">
                {course.presentationMarkdown}
              </pre>
            ) : (
              <div className="text-sm text-muted-foreground">No presentation yet. Click Regenerate to create one.</div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Course Notes</CardTitle>
            <CardDescription>Manage your notes for this course.</CardDescription>
          </CardHeader>
          <CardContent>
            <CourseNotes courseId={course.id} />
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Quick Notes</CardTitle>
            <CardDescription>Simple text notes about this course.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Input
              placeholder="Update title"
              value={course.title}
              onChange={(e) => dispatch(updateCourse({ id: course.id, changes: { title: e.target.value } }))}
            />
            <Textarea
              placeholder="Detail notes..."
              value={course.notes || ""}
              onChange={(e) => dispatch(updateCourse({ id: course.id, changes: { notes: e.target.value } }))}
            />
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
