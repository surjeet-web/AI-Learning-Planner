"use client"

import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

type DayRecord = { date: string; label: string; minutes: number }

function formatDate(d: Date) {
  return d.toISOString().slice(0, 10)
}
function makeWindow(days: number): DayRecord[] {
  const arr: DayRecord[] = []
  const now = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(now.getDate() - i)
    arr.push({
      date: formatDate(d),
      label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      minutes: 0,
    })
  }
  return arr
}

type State = {
  streakDays: number
  lastSessionDate?: string
  totalMinutes: number
  sessions: number
  last7Days: DayRecord[]
  last30Days: DayRecord[]
}

const initialState: State = {
  streakDays: 0,
  lastSessionDate: undefined,
  totalMinutes: 0,
  sessions: 0,
  last7Days: makeWindow(7),
  last30Days: makeWindow(30),
}

const progressSlice = createSlice({
  name: "progress",
  initialState,
  reducers: {
    logStudySession(state, action: PayloadAction<{ durationMinutes: number }>) {
      const now = new Date()
      const key = formatDate(now)
      state.totalMinutes += action.payload.durationMinutes
      state.sessions += 1
      const upd = (arr: DayRecord[]) => {
        const idx = arr.findIndex((d) => d.date === key)
        if (idx >= 0) arr[idx].minutes += action.payload.durationMinutes
      }
      upd(state.last7Days)
      upd(state.last30Days)
      state.lastSessionDate = key
    },
    incrementStreak(state) {
      const today = formatDate(new Date())
      if (!state.lastSessionDate) {
        state.streakDays = 1
      } else {
        const prev = new Date(state.lastSessionDate + "T00:00:00")
        const todayDate = new Date(today + "T00:00:00")
        const diff = Math.round((+todayDate - +prev) / 86400000)
        if (diff === 0) {
          // already counted today
        } else if (diff === 1) {
          state.streakDays += 1
        } else {
          state.streakDays = 1
        }
      }
      state.lastSessionDate = today
    },
    setProgress(_state, action: PayloadAction<State>) {
      return action.payload
    },
  },
})

export const { logStudySession, incrementStreak, setProgress } = progressSlice.actions
export default progressSlice.reducer

export const selectProgress = (s: { progress: State }) => s.progress
