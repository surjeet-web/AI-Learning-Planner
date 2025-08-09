"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useAppSelector } from "@/lib/store"
import { selectRoadmap } from "@/lib/slices/roadmap-slice"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Download, Copy, Wand2 } from "lucide-react"

export function PresentationCreator() {
  const roadmap = useAppSelector(selectRoadmap)
  const { toast } = useToast()
  const [style, setStyle] = useState("concise")
  const [notes, setNotes] = useState("")
  const [output, setOutput] = useState("")
  const [loading, setLoading] = useState(false)

  const baseOutline = useMemo(() => {
    if (roadmap.modules.length === 0) return []
    return roadmap.modules.map((m, i) => ({
      title: `${i + 1}. ${m.title}`,
      bullets: [
        m.description || "Key concepts",
        ...(m.prerequisites?.length ? [`Prerequisites: ${m.prerequisites.join(", ")}`] : []),
        `Estimated: ${m.durationDays} days`,
      ],
    }))
  }, [roadmap.modules])

  const toMarkdown = (outline: { title: string; bullets: string[] }[]) => {
    const header = "# Learning Presentation\n\n"
    const slides = outline.map((s) => `## ${s.title}\n\n${s.bullets.map((b) => `- ${b}`).join("\n")}`).join("\n\n")
    const extras = notes.trim() ? `\n\n---\n\n### Presenter Notes\n\n${notes.trim()}\n` : ""
    return header + slides + extras
  }

  const generate = async (enhanceWithAI: boolean) => {
    if (baseOutline.length === 0) {
      toast({ title: "No content", description: "Generate a roadmap first.", variant: "destructive" })
      return
    }
    setLoading(true)
    try {
      if (enhanceWithAI) {
        const res = await fetch("/api/present", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            style,
            notes,
            modules: roadmap.modules.map((m) => ({
              title: m.title,
              description: m.description,
              durationDays: m.durationDays,
            })),
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "AI failed")
        setOutput(data.markdown)
      } else {
        setOutput(toMarkdown(baseOutline))
      }
      toast({ title: "Presentation ready", description: "Preview and export below." })
    } catch (e: any) {
      toast({ title: "Generation failed", description: e?.message || "Try again.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(output)
      toast({ title: "Copied to clipboard" })
    } catch {
      toast({ title: "Copy failed", variant: "destructive" })
    }
  }

  const download = () => {
    const blob = new Blob([output], { type: "text/markdown;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "learning-presentation.md"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Presentation Creator</CardTitle>
        <CardDescription>Turn your learning into a shareable deck.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label>Style</Label>
            <Select value={style} onValueChange={setStyle}>
              <SelectTrigger>
                <SelectValue placeholder="Select a style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="concise">Concise (bulleted)</SelectItem>
                <SelectItem value="narrative">Narrative (explanatory)</SelectItem>
                <SelectItem value="technical">Technical (code-focused)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Presenter Notes (optional)</Label>
            <Textarea
              placeholder="Any customization or emphasis..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => generate(false)} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Generate Outline
          </Button>
          <Button variant="secondary" onClick={() => generate(true)} disabled={loading}>
            <Wand2 className="mr-2 h-4 w-4" />
            Enhance with AI
          </Button>
        </div>
        {output ? (
          <div className="rounded-md border p-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm font-medium">{"Markdown Preview"}</div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={copy}>
                  <Copy className="mr-2 h-3 w-3" /> Copy
                </Button>
                <Button size="sm" onClick={download}>
                  <Download className="mr-2 h-3 w-3" /> Download .md
                </Button>
              </div>
            </div>
            <pre className="max-h-[360px] overflow-auto whitespace-pre-wrap text-sm">{output}</pre>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
