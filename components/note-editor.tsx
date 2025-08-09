"use client"

import { useState, useCallback, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Type, 
  CheckSquare, 
  Bell, 
  Link, 
  Code, 
  Calendar as CalendarIcon,
  Plus,
  X,
  Pin,
  Sticky
} from "lucide-react"
import type { Note, NoteType } from "@/lib/slices/notes-slice"
import { format } from "date-fns"
import { ClientOnly } from "./client-only"
import { generateId } from "@/lib/utils"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  note?: Note
  courseId?: string
  onSave: (note: Partial<Note>) => void
}

const NOTE_COLORS = [
  "#fef3c7", // yellow
  "#dbeafe", // blue
  "#dcfce7", // green
  "#fce7f3", // pink
  "#f3e8ff", // purple
  "#fed7d7", // red
  "#e0f2fe", // cyan
  "#f0f9ff", // sky
]

const NOTE_TYPES: Array<{ value: NoteType; label: string; icon: any }> = [
  { value: "text", label: "Text Note", icon: Type },
  { value: "checklist", label: "Checklist", icon: CheckSquare },
  { value: "reminder", label: "Reminder", icon: Bell },
  { value: "link", label: "Link Collection", icon: Link },
  { value: "code", label: "Code Snippet", icon: Code },
]

export function NoteEditor({ open, onOpenChange, note, courseId, onSave }: Props) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [type, setType] = useState<NoteType>("text")
  const [color, setColor] = useState(NOTE_COLORS[0])
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [isPinned, setIsPinned] = useState(false)
  const [isSticky, setIsSticky] = useState(false)
  const [reminderDate, setReminderDate] = useState<Date>()
  const [checklistItems, setChecklistItems] = useState<Array<{ id: string; text: string; completed: boolean }>>([])
  const [newItemText, setNewItemText] = useState("")

  useEffect(() => {
    if (note) {
      setTitle(note.title)
      setContent(note.content)
      setType(note.type)
      setColor(note.color)
      setTags(note.tags)
      setIsPinned(note.isPinned)
      setIsSticky(note.isSticky)
      setReminderDate(note.reminder ? new Date(note.reminder.date) : undefined)
      setChecklistItems(note.checklist?.items || [])
    } else {
      // Reset form for new note
      setTitle("")
      setContent("")
      setType("text")
      setColor(NOTE_COLORS[0])
      setTags([])
      setIsPinned(false)
      setIsSticky(false)
      setReminderDate(undefined)
      setChecklistItems([])
    }
  }, [note, open])

  const addTag = useCallback(() => {
    const tag = tagInput.trim()
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag])
      setTagInput("")
    }
  }, [tagInput, tags])

  const removeTag = useCallback((tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }, [tags])

  const addChecklistItem = useCallback(() => {
    if (newItemText.trim()) {
      setChecklistItems([
        ...checklistItems,
        {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          text: newItemText.trim(),
          completed: false,
        }
      ])
      setNewItemText("")
    }
  }, [checklistItems, newItemText])

  const toggleChecklistItem = useCallback((itemId: string) => {
    setChecklistItems(items =>
      items.map(item =>
        item.id === itemId ? { ...item, completed: !item.completed } : item
      )
    )
  }, [])

  const removeChecklistItem = useCallback((itemId: string) => {
    setChecklistItems(items => items.filter(item => item.id !== itemId))
  }, [])

  const handleSave = useCallback(() => {
    if (!title.trim()) return

    const noteData: Partial<Note> = {
      id: note?.id || generateId(),
      title: title.trim(),
      content: content.trim(),
      type,
      color,
      tags,
      isPinned,
      isSticky,
      courseId,
      createdAt: note?.createdAt || Date.now(),
      updatedAt: Date.now(),
    }

    if (reminderDate) {
      noteData.reminder = {
        date: reminderDate.getTime(),
        notified: false,
      }
    }

    if (type === "checklist") {
      noteData.checklist = { items: checklistItems }
    }

    onSave(noteData)
    onOpenChange(false)
  }, [title, content, type, color, tags, isPinned, isSticky, courseId, reminderDate, checklistItems, note, onSave, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{note ? "Edit Note" : "Create New Note"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter note title..."
            />
          </div>

          {/* Type Selection */}
          <div>
            <Label>Note Type</Label>
            <Select value={type} onValueChange={(value: NoteType) => setType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NOTE_TYPES.map((noteType) => {
                  const Icon = noteType.icon
                  return (
                    <SelectItem key={noteType.value} value={noteType.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {noteType.label}
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Content based on type */}
          {type === "checklist" ? (
            <div>
              <Label>Checklist Items</Label>
              <div className="space-y-2">
                {checklistItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-2">
                    <Checkbox
                      checked={item.completed}
                      onCheckedChange={() => toggleChecklistItem(item.id)}
                    />
                    <span className={item.completed ? "line-through text-muted-foreground" : ""}>
                      {item.text}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeChecklistItem(item.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input
                    value={newItemText}
                    onChange={(e) => setNewItemText(e.target.value)}
                    placeholder="Add new item..."
                    onKeyDown={(e) => e.key === "Enter" && addChecklistItem()}
                  />
                  <Button onClick={addChecklistItem}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter your note content..."
                rows={type === "code" ? 10 : 6}
                className={type === "code" ? "font-mono" : ""}
              />
            </div>
          )}

          {/* Reminder for reminder type */}
          {type === "reminder" && (
            <div>
              <Label>Reminder Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    <ClientOnly fallback="Pick a date">
                      {reminderDate ? format(reminderDate, "PPP") : "Pick a date"}
                    </ClientOnly>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={reminderDate}
                    onSelect={setReminderDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* Color Selection */}
          <div>
            <Label>Color</Label>
            <div className="flex gap-2 mt-2">
              {NOTE_COLORS.map((noteColor) => (
                <button
                  key={noteColor}
                  className={`w-8 h-8 rounded-full border-2 ${
                    color === noteColor ? "border-gray-800" : "border-gray-300"
                  }`}
                  style={{ backgroundColor: noteColor }}
                  onClick={() => setColor(noteColor)}
                />
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  {tag}
                  <button onClick={() => removeTag(tag)}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add tag..."
                onKeyDown={(e) => e.key === "Enter" && addTag()}
              />
              <Button onClick={addTag}>Add</Button>
            </div>
          </div>

          {/* Options */}
          <div className="flex gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="pinned"
                checked={isPinned}
                onCheckedChange={setIsPinned}
              />
              <Label htmlFor="pinned" className="flex items-center gap-1">
                <Pin className="h-4 w-4" />
                Pin Note
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="sticky"
                checked={isSticky}
                onCheckedChange={setIsSticky}
              />
              <Label htmlFor="sticky" className="flex items-center gap-1">
                <Sticky className="h-4 w-4" />
                Sticky Note
              </Label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!title.trim()}>
              {note ? "Update" : "Create"} Note
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}