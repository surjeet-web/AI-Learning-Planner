"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { selectNotes, updateNotePosition, updateNoteSize, deleteNote, toggleNoteSticky } from "@/lib/slices/notes-slice"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X, Move, Maximize2, Pin, Edit } from "lucide-react"
import { NoteEditor } from "./note-editor"
import type { Note } from "@/lib/slices/notes-slice"

type DragState = {
  isDragging: boolean
  startX: number
  startY: number
  startLeft: number
  startTop: number
}

type ResizeState = {
  isResizing: boolean
  startX: number
  startY: number
  startWidth: number
  startHeight: number
}

function StickyNote({ note }: { note: Note }) {
  const dispatch = useAppDispatch()
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    startX: 0,
    startY: 0,
    startLeft: 0,
    startTop: 0,
  })
  const [resizeState, setResizeState] = useState<ResizeState>({
    isResizing: false,
    startX: 0,
    startY: 0,
    startWidth: 0,
    startHeight: 0,
  })
  const [editOpen, setEditOpen] = useState(false)
  const noteRef = useRef<HTMLDivElement>(null)

  const position = note.position || { x: 100, y: 100 }
  const size = note.size || { width: 250, height: 200 }

  // Handle dragging
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target !== e.currentTarget) return
    
    setDragState({
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      startLeft: position.x,
      startTop: position.y,
    })
  }, [position])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (dragState.isDragging) {
      const newX = dragState.startLeft + (e.clientX - dragState.startX)
      const newY = dragState.startTop + (e.clientY - dragState.startY)
      
      dispatch(updateNotePosition({
        id: note.id,
        position: { x: Math.max(0, newX), y: Math.max(0, newY) }
      }))
    }
    
    if (resizeState.isResizing) {
      const newWidth = Math.max(200, resizeState.startWidth + (e.clientX - resizeState.startX))
      const newHeight = Math.max(150, resizeState.startHeight + (e.clientY - resizeState.startY))
      
      dispatch(updateNoteSize({
        id: note.id,
        size: { width: newWidth, height: newHeight }
      }))
    }
  }, [dragState, resizeState, dispatch, note.id])

  const handleMouseUp = useCallback(() => {
    setDragState(prev => ({ ...prev, isDragging: false }))
    setResizeState(prev => ({ ...prev, isResizing: false }))
  }, [])

  // Handle resizing
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setResizeState({
      isResizing: true,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: size.width,
      startHeight: size.height,
    })
  }, [size])

  useEffect(() => {
    if (dragState.isDragging || resizeState.isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [dragState.isDragging, resizeState.isResizing, handleMouseMove, handleMouseUp])

  const handleClose = useCallback(() => {
    dispatch(toggleNoteSticky(note.id))
  }, [dispatch, note.id])

  const handleDelete = useCallback(() => {
    dispatch(deleteNote(note.id))
  }, [dispatch, note.id])

  const renderContent = () => {
    switch (note.type) {
      case "checklist":
        return (
          <div className="space-y-1">
            {note.checklist?.items.slice(0, 5).map((item) => (
              <div key={item.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={item.completed}
                  readOnly
                  className="rounded"
                />
                <span className={item.completed ? "line-through text-muted-foreground" : ""}>
                  {item.text}
                </span>
              </div>
            ))}
            {(note.checklist?.items.length || 0) > 5 && (
              <div className="text-xs text-muted-foreground">
                +{(note.checklist?.items.length || 0) - 5} more items
              </div>
            )}
          </div>
        )
      case "code":
        return (
          <pre className="text-xs font-mono overflow-hidden">
            {note.content.slice(0, 200)}
            {note.content.length > 200 && "..."}
          </pre>
        )
      default:
        return (
          <p className="text-sm overflow-hidden">
            {note.content.slice(0, 150)}
            {note.content.length > 150 && "..."}
          </p>
        )
    }
  }

  return (
    <>
      <Card
        ref={noteRef}
        className="fixed z-50 shadow-lg cursor-move select-none"
        style={{
          left: position.x,
          top: position.y,
          width: size.width,
          height: size.height,
          backgroundColor: note.color,
          borderColor: note.isPinned ? "#f59e0b" : undefined,
          borderWidth: note.isPinned ? 2 : 1,
        }}
        onMouseDown={handleMouseDown}
      >
        <CardHeader className="p-2 pb-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Move className="h-3 w-3 text-muted-foreground" />
              <h4 className="text-sm font-medium truncate">{note.title}</h4>
              {note.isPinned && <Pin className="h-3 w-3 text-amber-600" />}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation()
                  setEditOpen(true)
                }}
              >
                <Edit className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation()
                  handleClose()
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-2 pt-0 overflow-hidden">
          {renderContent()}
        </CardContent>
        
        {/* Resize handle */}
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
          onMouseDown={handleResizeStart}
        >
          <Maximize2 className="h-3 w-3 text-muted-foreground" />
        </div>
      </Card>

      <NoteEditor
        open={editOpen}
        onOpenChange={setEditOpen}
        note={note}
        onSave={(updatedNote) => {
          // This will be handled by the parent component
        }}
      />
    </>
  )
}

import { ClientOnly } from "./client-only"

export function StickyNotes() {
  const notes = useAppSelector(selectNotes)
  const stickyNotes = notes.notes.filter(note => note.isSticky)

  return (
    <ClientOnly>
      {stickyNotes.length > 0 && (
        <div className="fixed inset-0 pointer-events-none z-40">
          <div className="relative w-full h-full">
            {stickyNotes.map((note) => (
              <div key={note.id} className="pointer-events-auto">
                <StickyNote note={note} />
              </div>
            ))}
          </div>
        </div>
      )}
    </ClientOnly>
  )
}