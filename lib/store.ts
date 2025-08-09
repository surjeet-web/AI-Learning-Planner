"use client"

import { configureStore } from "@reduxjs/toolkit"
import { useDispatch, useSelector, type TypedUseSelectorHook } from "react-redux"
import coursesReducer from "@/lib/slices/courses-slice"
import roadmapReducer from "@/lib/slices/roadmap-slice"
import progressReducer from "@/lib/slices/progress-slice"
import settingsReducer from "@/lib/slices/settings-slice"
import courseTimeReducer from "@/lib/slices/course-time-slice"

// Minimal Redux setup with localStorage persistence (offline-friendly)

const PERSIST_KEY = "ai-learning-state-v1"

function loadState() {
  if (typeof window === "undefined") return undefined
  try {
    const raw = localStorage.getItem(PERSIST_KEY)
    if (!raw) return undefined
    return JSON.parse(raw)
  } catch {
    return undefined
  }
}

export const store = configureStore({
  reducer: {
    courses: coursesReducer,
    roadmap: roadmapReducer,
    progress: progressReducer,
    settings: settingsReducer,
    courseTime: courseTimeReducer,
  },
  preloadedState: loadState(),
})

let saving = false
if (typeof window !== "undefined") {
  store.subscribe(() => {
    if (saving) return
    saving = true
    try {
      const state = store.getState()
      localStorage.setItem(PERSIST_KEY, JSON.stringify(state))
    } finally {
      saving = false
    }
  })
}

export type AppDispatch = typeof store.dispatch
export type RootState = ReturnType<typeof store.getState>
export const useAppDispatch: () => AppDispatch = useDispatch
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
