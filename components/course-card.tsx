"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import { useAppDispatch } from "@/lib/store"
import { type Course, removeCourse, updateCourseStatus } from "@/lib/slices/courses-slice"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, ExternalLink } from "lucide-react"
import Link from "next/link"
import { CourseTimer } from "@/components/course-timer"

type Props = {
  course?: Course
}

const defaultCourse: Course = {
  id: "demo",
  title: "Example Course",
  description: "Short description of the course.",
  tags: ["demo"],
  status: "planned",
  url: "",
  image: "/course-thumbnail.png",
  createdAt: Date.now(),
  updatedAt: Date.now(),
  estimatedHours: 8,
  completedHours: 0,
  modules: [],
  notes: "",
  provider: "Demo",
  language: "en",
  presentationMarkdown: "",
  timeTotalMinutes: 0,
}

export function CourseCard({ course = defaultCourse }: Props) {
  const dispatch = useAppDispatch()
  const statusColor =
    course.status === "completed"
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
      : course.status === "in-progress"
        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
        : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="space-y-3">
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-md">
          <Image
            src={course.image || "/placeholder.svg?height=160&width=320&query=course%20thumbnail"}
            alt={`${course.title} thumbnail`}
            fill
            className="object-cover"
          />
        </div>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="line-clamp-1">{course.title}</CardTitle>
            <CardDescription className="line-clamp-2">
              {course.description || "No description available."}
            </CardDescription>
            <div className="mt-1 text-xs text-muted-foreground">
              {course.provider ? `${course.provider}` : ""}
              {course.level ? ` • ${course.level}` : ""}
              {course.language ? ` • ${course.language}` : ""}
              {typeof course.rating === "number" ? ` • ★ ${course.rating}` : ""}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="More actions">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => dispatch(updateCourseStatus({ id: course.id, status: "planned" }))}>
                Mark as Planned
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => dispatch(updateCourseStatus({ id: course.id, status: "in-progress" }))}>
                Mark as In Progress
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => dispatch(updateCourseStatus({ id: course.id, status: "completed" }))}>
                Mark as Completed
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-600" onClick={() => dispatch(removeCourse(course.id))}>
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className={`rounded px-2 py-1 text-xs ${statusColor}`}>{course.status}</span>
          {course.tags.slice(0, 3).map((t) => (
            <Badge key={t} variant="secondary">
              {t}
            </Badge>
          ))}
          {course.tags.length > 3 ? <Badge variant="outline">+{course.tags.length - 3}</Badge> : null}
        </div>
      </CardHeader>

      <CardContent className="mt-auto space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            {course.estimatedHours ? `${course.completedHours}/${course.estimatedHours} hrs` : "No estimate"}
          </div>
          <div className="flex items-center gap-2">
            {course.url ? (
              <Button variant="link" asChild className="px-0">
                <Link href={course.url} target="_blank" rel="noopener noreferrer">
                  Open <ExternalLink className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            ) : null}
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/courses/${course.id}`}>View</Link>
            </Button>
          </div>
        </div>
        <CourseTimer courseId={course.id} compact />
      </CardContent>

      <CardFooter className="justify-end gap-2">
        <Button
          variant="secondary"
          onClick={() => dispatch(updateCourseStatus({ id: course.id, status: "in-progress" }))}
        >
          Start
        </Button>
        <Button onClick={() => dispatch(updateCourseStatus({ id: course.id, status: "completed" }))}>Complete</Button>
      </CardFooter>
    </Card>
  )
}
