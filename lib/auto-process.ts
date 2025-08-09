"use client"

import type { AppDispatch } from "@/lib/store"
import { type Course, type CourseModule, updateCourse } from "@/lib/slices/courses-slice"

export async function autoProcessCourse(
  course: Course,
  dispatch: AppDispatch,
  opts?: { generateRoadmap?: boolean; generatePresentation?: boolean },
) {
  const doRoadmap = opts?.generateRoadmap !== false
  const doPresentation = opts?.generatePresentation !== false

  let changes: Partial<Course> = {}

  // 1) Scrape metadata and image
  if (course.url) {
    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: course.url }),
      })
      const data = await res.json()
      if (res.ok) {
        changes = {
          ...changes,
          title: data.title || course.title,
          description: data.description || course.description,
          image: data.image || course.image,
          tags: Array.from(new Set([...(course.tags || []), ...((data.tags as string[]) || [])])),
          provider: data.provider || course.provider,
          author: data.author || course.author,
          level: data.level || course.level,
          rating: typeof data.rating === "number" ? data.rating : course.rating,
          ratingCount: typeof data.ratingCount === "number" ? data.ratingCount : course.ratingCount,
          price: data.price || course.price,
          language: data.language || course.language,
        }
      }
    } catch {
      // ignore scrape errors
    }
  }

  // 2) Generate roadmap for this course
  let modules: CourseModule[] | undefined
  if (doRoadmap) {
    try {
      const res = await fetch("/api/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: changes.title || course.title,
          goals: (changes.description || course.description || "").slice(0, 200),
          durationDays: 30,
          hoursPerWeek: 7,
          mode: "heuristic", // will auto-upgrade to AI if key is present and you switch to "ai"
        }),
      })
      const data = await res.json()
      if (res.ok && Array.isArray(data.modules)) {
        modules = data.modules
        changes = { ...changes, modules }
      }
    } catch {
      // ignore roadmap errors
    }
  }

  // 3) Generate presentation from modules
  if (doPresentation && modules && modules.length) {
    try {
      const res = await fetch("/api/present", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          style: "concise",
          notes: "",
          modules: modules.map((m) => ({ title: m.title, description: m.description, durationDays: m.durationDays })),
        }),
      })
      const data = await res.json()
      if (res.ok && data.markdown) {
        changes = { ...changes, presentationMarkdown: data.markdown }
      }
    } catch {
      // ignore AI errors
    }
  }

  if (Object.keys(changes).length) {
    dispatch(updateCourse({ id: course.id, changes }))
  }
}
