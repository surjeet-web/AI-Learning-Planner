"use client"

import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

export type RoadmapModule = {
  id: string
  title: string
  description?: string
  durationDays: number
  prerequisites?: string[]
  completed?: boolean
}
type Roadmap = {
  id: string
  subject: string
  modules: RoadmapModule[]
  totalDurationDays: number
  createdAt: number
}
type State =
  | (Roadmap & { id: string })
  | { id: ""; subject?: string; modules: RoadmapModule[]; totalDurationDays?: number; createdAt?: number }

const initialState: State = { id: "", subject: "", modules: [], totalDurationDays: 0, createdAt: 0 }

const roadmapSlice = createSlice({
  name: "roadmap",
  initialState,
  reducers: {
    addRoadmap(_state, action: PayloadAction<Roadmap>) {
      return action.payload
    },
    toggleModuleComplete(state, action: PayloadAction<string>) {
      const m = state.modules.find((x) => x.id === action.payload)
      if (m) m.completed = !m.completed
    },
    setRoadmap(_state, action: PayloadAction<Roadmap>) {
      return action.payload
    },
  },
})

export const { addRoadmap, toggleModuleComplete, setRoadmap } = roadmapSlice.actions
export default roadmapSlice.reducer

export const selectRoadmap = (s: { roadmap: State }) => s.roadmap as Roadmap
