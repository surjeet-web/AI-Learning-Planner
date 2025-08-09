"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import type { Course } from "@/lib/slices/courses-slice"
import { Loader2 } from "lucide-react"

type Props = {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onAdded?: (course: Course) => void
}

export function AddCourseDialog({ open = false, onOpenChange = () => {}, onAdded = () => {} }: Props) {
  const { toast } = useToast()
  const [url, setUrl] = React.useState("")
  const [title, setTitle] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [tags, setTags] = React.useState<string[]>([])
  const [tagInput, setTagInput] = React.useState("")
  const [loading, setLoading] = React.useState(false)

  const addTag = () => {
    const t = tagInput.trim()
    if (t && !tags.includes(t)) setTags([...tags, t])
    setTagInput("")
  }

  const removeTag = (t: string) => setTags(tags.filter((x) => x !== t))

  const handleScrape = async () => {
    if (!url) return
    setLoading(true)
    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to fetch metadata")
      setTitle(data.title || "")
      setDescription(data.description || "")
      if (data.tags && Array.isArray(data.tags)) {
        setTags(Array.from(new Set([...(tags || []), ...data.tags])))
      }
      toast({ title: "Course details fetched", description: "You can edit before saving." })
    } catch (e: any) {
      toast({ title: "Could not auto-fill", description: e?.message || "Try manual entry.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = () => {
    if (!title.trim()) {
      toast({ title: "Title is required", variant: "destructive" })
      return
    }
    const course: Course = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      title: title.trim(),
      description: description.trim(),
      url: url.trim(),
      tags,
      status: "planned",
      image: "/placeholder.svg?height=160&width=320",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      estimatedHours: 0,
      completedHours: 0,
      modules: [],
      notes: "",
    }
    onAdded(course)
    onOpenChange(false)
    setUrl("")
    setTitle("")
    setDescription("")
    setTags([])
    setTagInput("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby="add-course-desc">
        <DialogHeader>
          <DialogTitle>Add a Course</DialogTitle>
          <DialogDescription id="add-course-desc">
            Paste a URL to auto-detect details, or add manually.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="url">Course URL</Label>
            <div className="flex gap-2">
              <Input id="url" placeholder="https://..." value={url} onChange={(e) => setUrl(e.target.value)} />
              <Button variant="secondary" onClick={handleScrape} disabled={loading || !url}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Auto-fill
              </Button>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="e.g., React.js for Beginners"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="desc">Description</Label>
            <Textarea
              id="desc"
              placeholder="Short summary..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap items-center gap-2">
              {tags.map((t) => (
                <Badge key={t} variant="secondary" className="flex items-center gap-2">
                  {t}
                  <button
                    aria-label={`Remove ${t}`}
                    onClick={() => removeTag(t)}
                    className="rounded px-1 text-xs text-muted-foreground hover:bg-muted"
                  >
                    {"×"}
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add tag"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addTag()
                  }
                }}
              />
              <Button variant="outline" onClick={addTag}>
                Add
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>Save Course</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
