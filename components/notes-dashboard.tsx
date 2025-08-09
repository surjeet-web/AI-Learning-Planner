"use client"

import { useState, useMemo, useCallback } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { 
  selectNotes, 
  addNote, 
  updateNote, 
  deleteNote, 
  toggleNotePin, 
  toggleNoteSticky,
  setSearchQuery,
  setSelectedTags,
  setSortBy,
  type Note 
} from "@/lib/slices/notes-slice"
import { selectCourses } from "@/lib/slices/courses-slice"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Plus, 
  Search, 
  Pin, 
  Sticky, 
  Edit, 
  Trash2, 
  Calendar,
  CheckSquare,
  Type,
  Link,
  Code,
  Bell,
  Filter,
  SortAsc,
  SortDesc
} from "lucide-react"
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

function NoteCard({ note, onEdit }: { note: Note; onEdit: (note: Note) => void }) {
  const dispatch = useAppDispatch()
  const courses = useAppSelector(selectCourses)
  
  const course = note.courseId ? courses.list.find(c => c.id === note.courseId) : null
  const Icon = NOTE_TYPE_ICONS[note.type]

  const handlePin = useCallback(() => {
    dispatch(toggleNotePin(note.id))
  }, [dispatch, note.id])

  const handleSticky = useCallback(() => {
    dispatch(toggleNoteSticky(note.id))
  }, [dispatch, note.id])

  const handleDelete = useCallback(() => {
    if (confirm("Are you sure you want to delete this note?")) {
      dispatch(deleteNote(note.id))
    }
  }, [dispatch, note.id])

  const renderContent = () => {
    switch (note.type) {
      case "checklist":
        const completedItems = note.checklist?.items.filter(item => item.completed).length || 0
        const totalItems = note.checklist?.items.length || 0
        return (
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              {completedItems}/{totalItems} completed
            </p>
            <div className="space-y-1">
              {note.checklist?.items.slice(0, 3).map((item) => (
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
              {totalItems > 3 && (
                <p className="text-xs text-muted-foreground">+{totalItems - 3} more items</p>
              )}
            </div>
          </div>
        )
      case "reminder":
        return (
          <div>
            {note.reminder && (
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  <ClientOnly fallback="Loading date...">
                    {format(new Date(note.reminder.date), "PPP")}
                  </ClientOnly>
                </span>
              </div>
            )}
            <p className="text-sm">{note.content}</p>
          </div>
        )
      case "code":
        return (
          <pre className="text-xs font-mono bg-muted p-2 rounded overflow-x-auto">
            {note.content.slice(0, 200)}
            {note.content.length > 200 && "..."}
          </pre>
        )
      default:
        return (
          <p className="text-sm">
            {note.content.slice(0, 150)}
            {note.content.length > 150 && "..."}
          </p>
        )
    }
  }

  return (
    <Card 
      className="h-full cursor-pointer hover:shadow-md transition-shadow"
      style={{ backgroundColor: note.color }}
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
                handlePin()
              }}
            >
              <Pin className={`h-3 w-3 ${note.isPinned ? "text-amber-600" : "text-muted-foreground"}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation()
                handleSticky()
              }}
            >
              <Sticky className={`h-3 w-3 ${note.isSticky ? "text-blue-600" : "text-muted-foreground"}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation()
                onEdit(note)
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
                handleDelete()
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
        {course && (
          <CardDescription className="text-xs">
            Course: {course.title}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        {renderContent()}
        
        {note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {note.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {note.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{note.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
        
        <div className="text-xs text-muted-foreground mt-2">
          <ClientOnly fallback="Loading...">
            {format(new Date(note.updatedAt), "MMM d, yyyy")}
          </ClientOnly>
        </div>
      </CardContent>
    </Card>
  )
}

export function NotesDashboard() {
  const dispatch = useAppDispatch()
  const notesState = useAppSelector(selectNotes)
  const courses = useAppSelector(selectCourses)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | undefined>()
  const [selectedCourse, setSelectedCourse] = useState<string>("all")

  const allTags = useMemo(() => {
    const tags = new Set<string>()
    notesState.notes.forEach(note => {
      note.tags.forEach(tag => tags.add(tag))
    })
    return Array.from(tags)
  }, [notesState.notes])

  const filteredNotes = useMemo(() => {
    let filtered = notesState.notes

    // Filter by search query
    if (notesState.searchQuery) {
      const query = notesState.searchQuery.toLowerCase()
      filtered = filtered.filter(note =>
        note.title.toLowerCase().includes(query) ||
        note.content.toLowerCase().includes(query) ||
        note.tags.some(tag => tag.toLowerCase().includes(query))
      )
    }

    // Filter by selected tags
    if (notesState.selectedTags.length > 0) {
      filtered = filtered.filter(note =>
        notesState.selectedTags.some(tag => note.tags.includes(tag))
      )
    }

    // Filter by course
    if (selectedCourse !== "all") {
      filtered = filtered.filter(note => note.courseId === selectedCourse)
    }

    // Sort notes
    filtered.sort((a, b) => {
      const aValue = a[notesState.sortBy]
      const bValue = b[notesState.sortBy]
      
      if (notesState.sortBy === "title") {
        return notesState.sortOrder === "asc" 
          ? (aValue as string).localeCompare(bValue as string)
          : (bValue as string).localeCompare(aValue as string)
      } else {
        return notesState.sortOrder === "asc" 
          ? (aValue as number) - (bValue as number)
          : (bValue as number) - (aValue as number)
      }
    })

    // Pinned notes first
    return filtered.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1
      if (!a.isPinned && b.isPinned) return 1
      return 0
    })
  }, [notesState, selectedCourse])

  const handleCreateNote = useCallback(() => {
    setEditingNote(undefined)
    setEditorOpen(true)
  }, [])

  const handleEditNote = useCallback((note: Note) => {
    setEditingNote(note)
    setEditorOpen(true)
  }, [])

  const handleSaveNote = useCallback((noteData: Partial<Note>) => {
    if (editingNote) {
      dispatch(updateNote({ id: editingNote.id, changes: noteData }))
    } else {
      dispatch(addNote(noteData as Note))
    }
  }, [dispatch, editingNote])

  const handleTagClick = useCallback((tag: string) => {
    const newTags = notesState.selectedTags.includes(tag)
      ? notesState.selectedTags.filter(t => t !== tag)
      : [...notesState.selectedTags, tag]
    dispatch(setSelectedTags(newTags))
  }, [dispatch, notesState.selectedTags])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Notes</h2>
          <p className="text-muted-foreground">
            Manage your learning notes and sticky reminders
          </p>
        </div>
        <Button onClick={handleCreateNote}>
          <Plus className="mr-2 h-4 w-4" />
          New Note
        </Button>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search notes..."
                value={notesState.searchQuery}
                onChange={(e) => dispatch(setSearchQuery(e.target.value))}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                <SelectItem value="global">Global Notes</SelectItem>
                {courses.list.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={`${notesState.sortBy}-${notesState.sortOrder}`}
              onValueChange={(value) => {
                const [sortBy, sortOrder] = value.split('-') as [typeof notesState.sortBy, typeof notesState.sortOrder]
                dispatch(setSortBy({ sortBy, sortOrder }))
              }}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="updatedAt-desc">
                  <div className="flex items-center gap-2">
                    <SortDesc className="h-4 w-4" />
                    Latest First
                  </div>
                </SelectItem>
                <SelectItem value="updatedAt-asc">
                  <div className="flex items-center gap-2">
                    <SortAsc className="h-4 w-4" />
                    Oldest First
                  </div>
                </SelectItem>
                <SelectItem value="title-asc">
                  <div className="flex items-center gap-2">
                    <SortAsc className="h-4 w-4" />
                    Title A-Z
                  </div>
                </SelectItem>
                <SelectItem value="title-desc">
                  <div className="flex items-center gap-2">
                    <SortDesc className="h-4 w-4" />
                    Title Z-A
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tag filters */}
          {allTags.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filter by tags:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {allTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant={notesState.selectedTags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => handleTagClick(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes Grid */}
      {filteredNotes.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              No notes found. Create your first note to get started!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onEdit={handleEditNote}
            />
          ))}
        </div>
      )}

      {/* Note Editor */}
      <NoteEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        note={editingNote}
        onSave={handleSaveNote}
      />
    </div>
  )
}