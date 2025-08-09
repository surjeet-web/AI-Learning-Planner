"use client"

import { useState, useMemo, useCallback } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { selectNotes, addNote, updateNote, deleteNote, type Note } from "@/lib/slices/notes-slice"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Pin, Sticky, Type, CheckSquare, Bell, Link, Code } from "lucide-react"
import { NoteEditor } from "./note-editor"
import { format } from "date-fns"
import { ClientOnly } from "./client-only"

const NOTE_TYPE_ICONS = {
  text: Type,
  checklist: CheckSquare,
  reminder: Bell,
  link: Link,
  code: Code,
}

type Props = {
  courseId: string
  compact?: boolean
}

export function CourseNotes({ courseId, compact = false }: Props) {
  const dispatch = useAppDispatch()
  const notesState = useAppSelector(selectNotes)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | undefined>()

  const courseNotes = useMemo(() => {
    return notesState.notes
      .filter(note => note.courseId === courseId)
      .sort((a, b) => {
        // Pinned notes first
        if (a.isPinned && !b.isPinned) return -1
        if (!a.isPinned && b.isPinned) return 1
        // Then by updated date
        return b.updatedAt - a.updatedAt
      })
  }, [notesState.notes, courseId])

  const handleCreateNote = useCallback(() => {
    setEditingNote(undefined)
    setEditorOpen(true)
  }, [])

  const handleEditNote = useCallback((note: Note) => {
    setEditingNote(note)
    setEditorOpen(true)
  }, [])

  const handleSaveNote = useCallback((noteData: Partial<Note>) => {
    const finalNoteData = { ...noteData, courseId }
    if (editingNote) {
      dispatch(updateNote({ id: editingNote.id, changes: finalNoteData }))
    } else {
      dispatch(addNote(finalNoteData as Note))
    }
  }, [dispatch, editingNote, courseId])

  const handleDeleteNote = useCallback((noteId: string) => {
    if (confirm("Are you sure you want to delete this note?")) {
      dispatch(deleteNote(noteId))
    }
  }, [dispatch])

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium">Notes ({courseNotes.length})</h4>
          <Button size="sm" variant="outline" onClick={handleCreateNote}>
            <Plus className="h-3 w-3 mr-1" />
            Add
          </Button>
        </div>
        
        {courseNotes.length === 0 ? (
          <p className="text-xs text-muted-foreground">No notes yet</p>
        ) : (
          <div className="space-y-1">
            {courseNotes.slice(0, 3).map((note) => {
              const Icon = NOTE_TYPE_ICONS[note.type]
              return (
                <div
                  key={note.id}
                  className="flex items-center gap-2 p-2 rounded border cursor-pointer hover:bg-muted/50"
                  style={{ backgroundColor: note.color }}
                  onClick={() => handleEditNote(note)}
                >
                  <Icon className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs truncate flex-1">{note.title}</span>
                  {note.isPinned && <Pin className="h-3 w-3 text-amber-600" />}
                  {note.isSticky && <Sticky className="h-3 w-3 text-blue-600" />}
                </div>
              )
            })}
            {courseNotes.length > 3 && (
              <p className="text-xs text-muted-foreground">
                +{courseNotes.length - 3} more notes
              </p>
            )}
          </div>
        )}

        <NoteEditor
          open={editorOpen}
          onOpenChange={setEditorOpen}
          note={editingNote}
          courseId={courseId}
          onSave={handleSaveNote}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Course Notes</h3>
        <Button onClick={handleCreateNote}>
          <Plus className="mr-2 h-4 w-4" />
          New Note
        </Button>
      </div>

      {courseNotes.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">
              No notes for this course yet. Create your first note to get started!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courseNotes.map((note) => {
            const Icon = NOTE_TYPE_ICONS[note.type]
            return (
              <Card
                key={note.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                style={{ backgroundColor: note.color }}
                onClick={() => handleEditNote(note)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <CardTitle className="text-sm truncate">{note.title}</CardTitle>
                      {note.isPinned && <Pin className="h-3 w-3 text-amber-600 flex-shrink-0" />}
                      {note.isSticky && <Sticky className="h-3 w-3 text-blue-600 flex-shrink-0" />}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditNote(note)
                        }}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-red-600"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteNote(note.id)
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {note.type === "checklist" ? (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          {note.checklist?.items.filter(item => item.completed).length || 0}/
                          {note.checklist?.items.length || 0} completed
                        </p>
                        <div className="space-y-1">
                          {note.checklist?.items.slice(0, 2).map((item) => (
                            <div key={item.id} className="flex items-center gap-2 text-xs">
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
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs">
                        {note.content.slice(0, 100)}
                        {note.content.length > 100 && "..."}
                      </p>
                    )}

                    {note.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {note.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {note.tags.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{note.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground">
                      <ClientOnly fallback="Loading...">
                        {format(new Date(note.updatedAt), "MMM d, yyyy")}
                      </ClientOnly>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <NoteEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        note={editingNote}
        courseId={courseId}
        onSave={handleSaveNote}
      />
    </div>
  )
}