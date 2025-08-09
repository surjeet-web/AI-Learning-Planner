"use client"

import { useEffect, useRef } from "react"
import { useAppSelector } from "@/lib/store"
import { saveAllToIndexedDB, loadAllFromIndexedDB } from "@/lib/local-data"
import { useAppDispatch } from "@/lib/store"
import { setCourses } from "@/lib/slices/courses-slice"
import { setRoadmap } from "@/lib/slices/roadmap-slice"
import { setProgress } from "@/lib/slices/progress-slice"
import { setSettings } from "@/lib/slices/settings-slice"

// Sync Redux <-> IndexedDB
export function LocalDataSync() {
  const dispatch = useAppDispatch()
  const state = useAppSelector((s) => s)
  const initialized = useRef(false)
  const saveTimeout = useRef<number | null>(null)

  // Initial load from IDB to Redux (once)
  useEffect(() => {
    if (initialized.current) return
    ;(async () => {
      const restored = await loadAllFromIndexedDB()
      if (restored.courses) dispatch(setCourses(restored.courses))
      if (restored.progress) dispatch(setProgress(restored.progress as any))
      if (restored.roadmap) dispatch(setRoadmap(restored.roadmap as any))
      if (restored.settings) dispatch(setSettings(restored.settings))
      initialized.current = true
    })()
  }, [dispatch])

  // Save debounced on changes
  useEffect(() => {
    if (!initialized.current) return
    if (saveTimeout.current) window.clearTimeout(saveTimeout.current)
    saveTimeout.current = window.setTimeout(() => {
      void saveAllToIndexedDB(state as any)
    }, 500)
    return () => {
      if (saveTimeout.current) window.clearTimeout(saveTimeout.current)
    }
  }, [state])

  return null
}
