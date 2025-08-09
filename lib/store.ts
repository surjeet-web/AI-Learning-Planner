"use client"

import { configureStore } from "@reduxjs/toolkit"
import { useDispatch, useSelector, type TypedUseSelectorHook } from "react-redux"
import coursesReducer from "@/lib/slices/courses-slice"
import roadmapReducer from "@/lib/slices/roadmap-slice"
import progressReducer from "@/lib/slices/progress-slice"
import settingsReducer from "@/lib/slices/settings-slice"
import courseTimeReducer from "@/lib/slices/course-time-slice"
import notesReducer from "@/lib/slices/notes-slice"

// Optimized Redux setup with throttled localStorage persistence

const PERSIST_KEY = "ai-learning-state-v1"
const SAVE_THROTTLE_MS = 1000

function loadState() {
  if (typeof window === "undefined") return undefined
  try {
    const raw = localStorage.getItem(PERSIST_KEY)
    if (!raw) return undefined
    const parsed = JSON.parse(raw)
    // Ensure consistent initial state structure
    return {
      courses: parsed.courses || { list: [] },
      roadmap: parsed.roadmap || { modules: [] },
      progress: parsed.progress || { totalMinutes: 0, last30Days: [] },
      settings: parsed.settings || { darkMode: false },
      courseTime: parsed.courseTime || {},
      notes: parsed.notes || { 
        notes: [], 
        selectedTags: [], 
        searchQuery: "", 
        sortBy: "updatedAt", 
        sortOrder: "desc" 
      },
    }
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
    notes: notesReducer,
  },
  preloadedState: loadState(),
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
})

// Throttled persistence to avoid excessive localStorage writes
let saveTimeout: NodeJS.Timeout | null = null
if (typeof window !== "undefined") {
  store.subscribe(() => {
    if (saveTimeout) clearTimeout(saveTimeout)
    saveTimeout = setTimeout(() => {
      try {
        const state = store.getState()
        localStorage.setItem(PERSIST_KEY, JSON.stringify(state))
      } catch (error) {
        console.warn('Failed to save state to localStorage:', error)
      }
    }, SAVE_THROTTLE_MS)
  })
}

export type AppDispatch = typeof store.dispatch
export type RootState = ReturnType<typeof store.getState>
export const useAppDispatch: () => AppDispatch = useDispatch
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
