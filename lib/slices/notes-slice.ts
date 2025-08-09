"use client"

import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

export type NoteType = "text" | "checklist" | "reminder" | "link" | "code"

export type Note = {
  id: string
  title: string
  content: string
  type: NoteType
  courseId?: string // If attached to a specific course
  tags: string[]
  color: string
  isPinned: boolean
  isSticky: boolean // For sticky notes that float on screen
  position?: { x: number; y: number } // For sticky notes positioning
  size?: { width: number; height: number } // For resizable sticky notes
  createdAt: number
  updatedAt: number
  reminder?: {
    date: number
    notified: boolean
  }
  checklist?: {
    items: Array<{
      id: string
      text: string
      completed: boolean
    }>
  }
}

type State = {
  notes: Note[]
  selectedTags: string[]
  searchQuery: string
  sortBy: "createdAt" | "updatedAt" | "title"
  sortOrder: "asc" | "desc"
}

const initialState: State = {
  notes: [],
  selectedTags: [],
  searchQuery: "",
  sortBy: "updatedAt",
  sortOrder: "desc",
}

const notesSlice = createSlice({
  name: "notes",
  initialState,
  reducers: {
    addNote(state, action: PayloadAction<Note>) {
      state.notes.unshift(action.payload)
    },
    updateNote(state, action: PayloadAction<{ id: string; changes: Partial<Note> }>) {
      const note = state.notes.find(n => n.id === action.payload.id)
      if (note) {
        Object.assign(note, action.payload.changes)
        note.updatedAt = Date.now()
      }
    },
    deleteNote(state, action: PayloadAction<string>) {
      state.notes = state.notes.filter(n => n.id !== action.payload)
    },
    toggleNotePin(state, action: PayloadAction<string>) {
      const note = state.notes.find(n => n.id === action.payload)
      if (note) {
        note.isPinned = !note.isPinned
        note.updatedAt = Date.now()
      }
    },
    toggleNoteSticky(state, action: PayloadAction<string>) {
      const note = state.notes.find(n => n.id === action.payload)
      if (note) {
        note.isSticky = !note.isSticky
        note.updatedAt = Date.now()
      }
    },
    updateNotePosition(state, action: PayloadAction<{ id: string; position: { x: number; y: number } }>) {
      const note = state.notes.find(n => n.id === action.payload.id)
      if (note) {
        note.position = action.payload.position
      }
    },
    updateNoteSize(state, action: PayloadAction<{ id: string; size: { width: number; height: number } }>) {
      const note = state.notes.find(n => n.id === action.payload.id)
      if (note) {
        note.size = action.payload.size
      }
    },
    toggleChecklistItem(state, action: PayloadAction<{ noteId: string; itemId: string }>) {
      const note = state.notes.find(n => n.id === action.payload.noteId)
      if (note?.checklist) {
        const item = note.checklist.items.find(i => i.id === action.payload.itemId)
        if (item) {
          item.completed = !item.completed
          note.updatedAt = Date.now()
        }
      }
    },
    addChecklistItem(state, action: PayloadAction<{ noteId: string; text: string }>) {
      const note = state.notes.find(n => n.id === action.payload.noteId)
      if (note?.checklist) {
        note.checklist.items.push({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          text: action.payload.text,
          completed: false,
        })
        note.updatedAt = Date.now()
      }
    },
    removeChecklistItem(state, action: PayloadAction<{ noteId: string; itemId: string }>) {
      const note = state.notes.find(n => n.id === action.payload.noteId)
      if (note?.checklist) {
        note.checklist.items = note.checklist.items.filter(i => i.id !== action.payload.itemId)
        note.updatedAt = Date.now()
      }
    },
    setSearchQuery(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload
    },
    setSelectedTags(state, action: PayloadAction<string[]>) {
      state.selectedTags = action.payload
    },
    setSortBy(state, action: PayloadAction<{ sortBy: State["sortBy"]; sortOrder: State["sortOrder"] }>) {
      state.sortBy = action.payload.sortBy
      state.sortOrder = action.payload.sortOrder
    },
    setNotes(state, action: PayloadAction<Note[]>) {
      state.notes = action.payload
    },
  },
})

export const {
  addNote,
  updateNote,
  deleteNote,
  toggleNotePin,
  toggleNoteSticky,
  updateNotePosition,
  updateNoteSize,
  toggleChecklistItem,
  addChecklistItem,
  removeChecklistItem,
  setSearchQuery,
  setSelectedTags,
  setSortBy,
  setNotes,
} = notesSlice.actions

export default notesSlice.reducer

export const selectNotes = (s: { notes: State }) => s.notes