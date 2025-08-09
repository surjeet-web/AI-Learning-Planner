"use client"

import { createSlice } from "@reduxjs/toolkit"

type State = {
  darkMode: boolean
}

const initialState: State = {
  darkMode: false,
}

const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    toggleDarkMode(state) {
      state.darkMode = !state.darkMode
    },
    setSettings(_state, action) {
      return action.payload
    },
  },
})

export const { toggleDarkMode, setSettings } = settingsSlice.actions
export default settingsSlice.reducer

export const selectSettings = (s: { settings: State }) => s.settings
