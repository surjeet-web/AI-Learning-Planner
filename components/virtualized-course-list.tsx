"use client"

import { useMemo } from "react"
import { CourseCard } from "@/components/optimized-course-card"
import type { Course } from "@/lib/slices/courses-slice"

type Props = {
  courses: Course[]
  className?: string
}

export function VirtualizedCourseList({ courses, className }: Props) {
  const memoizedCourses = useMemo(() => courses, [courses])

  if (memoizedCourses.length === 0) {
    return (
      <div className="grid place-items-center rounded-md border p-8 text-center">
        <p className="text-muted-foreground">
          No courses yet. Click "Add Course" to get started.
        </p>
      </div>
    )
  }

  return (
    <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 ${className || ""}`}>
      {memoizedCourses.map((course) => (
        <CourseCard key={course.id} course={course} />
      ))}
    </div>
  )
}