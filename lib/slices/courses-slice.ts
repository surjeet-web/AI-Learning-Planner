"use client"

import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

export type CourseModule = {
  id: string
  title: string
  description?: string
  durationDays?: number
  prerequisites?: string[]
  completed?: boolean
}

export type Course = {
  id: string
  title: string
  description?: string
  url?: string
  tags: string[]
  status: "planned" | "in-progress" | "completed"
  image?: string
  // Enriched metadata (optional)
  provider?: string
  author?: string
  level?: string
  rating?: number
  ratingCount?: number
  price?: string
  language?: string
  // Learning plan and content per-course
  modules: CourseModule[]
  presentationMarkdown?: string
  // Aggregates
  estimatedHours: number
  completedHours: number
  createdAt: number
  updatedAt: number
  timeTotalMinutes?: number
  notes?: string
}

type State = {
  list: Course[]
}

const initialState: State = {
  list: [],
}

const coursesSlice = createSlice({
  name: "courses",
  initialState,
  reducers: {
    addCourse(state, action: PayloadAction<Course>) {
      state.list.unshift(action.payload)
    },
    removeCourse(state, action: PayloadAction<string>) {
      state.list = state.list.filter((c) => c.id !== action.payload)
    },
    updateCourseStatus(state, action: PayloadAction<{ id: string; status: Course["status"] }>) {
      const c = state.list.find((x) => x.id === action.payload.id)
      if (c) {
        c.status = action.payload.status
        c.updatedAt = Date.now()
      }
    },
    updateCourse(state, action: PayloadAction<{ id: string; changes: Partial<Course> }>) {
      const c = state.list.find((x) => x.id === action.payload.id)
      if (c) {
        Object.assign(c, action.payload.changes)
        c.updatedAt = Date.now()
      }
    },
    setCourses(state, action: PayloadAction<Course[]>) {
      state.list = action.payload
    },
  },
})

export const { addCourse, removeCourse, updateCourseStatus, setCourses, updateCourse } = coursesSlice.actions
export default coursesSlice.reducer

export const selectCourses = (s: { courses: State }) => s.courses
