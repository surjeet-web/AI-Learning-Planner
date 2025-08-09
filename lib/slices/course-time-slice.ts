"use client"

import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

export type TimeSession = {
  id: string
  courseId: string
  start: number
  end?: number
  durationMinutes?: number
}

export type CourseTime = {
  courseId: string
  isRunning: boolean
  runningSince?: number
  totalMinutes: number
  sessions: TimeSession[]
}

type State = {
  byCourse: Record<string, CourseTime>
}

const initialState: State = {
  byCourse: {},
}

const slice = createSlice({
  name: "courseTime",
  initialState,
  reducers: {
    startTimer(state, action: PayloadAction<{ courseId: string }>) {
      const { courseId } = action.payload
      const entry = state.byCourse[courseId] || { courseId, isRunning: false, totalMinutes: 0, sessions: [] }
      if (!entry.isRunning) {
        entry.isRunning = true
        entry.runningSince = Date.now()
      }
      state.byCourse[courseId] = entry
    },
    stopTimer(state, action: PayloadAction<{ courseId: string }>) {
      const { courseId } = action.payload
      const entry = state.byCourse[courseId]
      if (entry?.isRunning && entry.runningSince) {
        const now = Date.now()
        const mins = Math.max(1, Math.round((now - entry.runningSince) / 60000))
        entry.isRunning = false
        entry.sessions.push({
          id: crypto.randomUUID(),
          courseId,
          start: entry.runningSince,
          end: now,
          durationMinutes: mins,
        })
        entry.totalMinutes += mins
        entry.runningSince = undefined
      }
    },
    addManualSession(state, action: PayloadAction<{ courseId: string; minutes: number }>) {
      const { courseId, minutes } = action.payload
      const entry = state.byCourse[courseId] || { courseId, isRunning: false, totalMinutes: 0, sessions: [] }
      entry.totalMinutes += Math.max(0, Math.round(minutes))
      entry.sessions.push({
        id: crypto.randomUUID(),
        courseId,
        start: Date.now(),
        end: Date.now(),
        durationMinutes: Math.max(0, Math.round(minutes)),
      })
      state.byCourse[courseId] = entry
    },
    resetTimer(state, action: PayloadAction<{ courseId: string }>) {
      const { courseId } = action.payload
      delete state.byCourse[courseId]
    },
  },
})

export const { startTimer, stopTimer, addManualSession, resetTimer } = slice.actions
export default slice.reducer

export const selectCourseTime = (s: { courseTime: State }, id: string) => s.courseTime.byCourse[id]
