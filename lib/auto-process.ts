"use client"

import type { AppDispatch } from "@/lib/store"
import { type Course, type CourseModule, updateCourse } from "@/lib/slices/courses-slice"

const MAX_RETRIES = 3
const RETRY_DELAY = 1000

async function fetchWithRetry(url: string, options: RequestInit, retries = MAX_RETRIES): Promise<Response> {
  try {
    const response = await fetch(url, options)
    if (!response.ok && response.status >= 500 && retries > 0) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
      return fetchWithRetry(url, options, retries - 1)
    }
    return response
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
      return fetchWithRetry(url, options, retries - 1)
    }
    throw error
  }
}

export async function autoProcessCourse(
  course: Course,
  dispatch: AppDispatch,
  opts?: { generateRoadmap?: boolean; generatePresentation?: boolean },
) {
  const doRoadmap = opts?.generateRoadmap !== false
  const doPresentation = opts?.generatePresentation !== false

  let changes: Partial<Course> = {}

  // 1) Scrape metadata and image with retry logic
  if (course.url) {
    try {
      const res = await fetchWithRetry("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: course.url }),
      })
      
      if (res.ok) {
        const data = await res.json()
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
    } catch (error) {
      console.warn(`Failed to scrape course metadata for ${course.title}:`, error)
    }
  }

  // 2) Generate roadmap for this course
  let modules: CourseModule[] | undefined
  if (doRoadmap) {
    try {
      const res = await fetchWithRetry("/api/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: changes.title || course.title,
          goals: (changes.description || course.description || "").slice(0, 200),
          durationDays: 30,
          hoursPerWeek: 7,
          mode: "heuristic",
        }),
      })
      
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data.modules)) {
          modules = data.modules
          changes = { ...changes, modules }
        }
      }
    } catch (error) {
      console.warn(`Failed to generate roadmap for ${course.title}:`, error)
    }
  }

  // 3) Generate presentation from modules
  if (doPresentation && modules && modules.length) {
    try {
      const res = await fetchWithRetry("/api/present", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          style: "concise",
          notes: "",
          modules: modules.map((m) => ({ 
            title: m.title, 
            description: m.description, 
            durationDays: m.durationDays 
          })),
        }),
      })
      
      if (res.ok) {
        const data = await res.json()
        if (data.markdown) {
          changes = { ...changes, presentationMarkdown: data.markdown }
        }
      }
    } catch (error) {
      console.warn(`Failed to generate presentation for ${course.title}:`, error)
    }
  }

  // Apply changes if any were made
  if (Object.keys(changes).length) {
    dispatch(updateCourse({ id: course.id, changes }))
  }
}
