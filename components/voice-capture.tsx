"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Mic, Square } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAppDispatch } from "@/lib/store"
import { addCourse } from "@/lib/slices/courses-slice"

type Props = {
  onCaptured?: (text: string) => void
}

export function VoiceCapture({ onCaptured = () => {} }: Props) {
  const { toast } = useToast()
  const dispatch = useAppDispatch()
  const [supported, setSupported] = useState(false)
  const [listening, setListening] = useState(false)
  const [lastText, setLastText] = useState("")
  const recRef = useRef<any>(null)

  useEffect(() => {
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SR) {
      setSupported(true)
      const r = new SR()
      r.continuous = false
      r.lang = "en-US"
      r.interimResults = false
      r.onresult = (e: any) => {
        const text = e.results?.[0]?.[0]?.transcript || ""
        setLastText(text)
        onCaptured(text)
        tryParseCommand(text)
      }
      r.onend = () => setListening(false)
      recRef.current = r
    }
  }, [onCaptured])

  const tryParseCommand = (text: string) => {
    const t = text.toLowerCase().trim()
    // Commands:
    // "add course {title}"
    // "plan {subject} for {n} days"
    // "add url {url}"
    if (t.startsWith("add course ")) {
      const title = text.slice("add course ".length).trim()
      if (title) {
        dispatch(
          addCourse({
            id: crypto.randomUUID(),
            title,
            description: "",
            tags: [],
            status: "planned",
            url: "",
            image: "/placeholder.svg?height=160&width=320",
            createdAt: Date.now(),
            updatedAt: Date.now(),
            estimatedHours: 0,
            completedHours: 0,
            modules: [],
            notes: "",
          }),
        )
        toast({ title: "Course added", description: `"${title}"` })
      }
    } else if (t.startsWith("add url ")) {
      const url = text.slice("add url ".length).trim()
      toast({ title: "Captured URL", description: url })
      // The user can paste into the Add dialog; or we could call /api/scrape here if desired.
    } else if (t.startsWith("plan ")) {
      // Extract duration if present: "... for 30 days"
      const match = t.match(/plan\s+(.+?)\s+for\s+(\d{1,3})\s+days/)
      if (match) {
        const subject = match[1]
        const days = Number.parseInt(match[2], 10)
        toast({ title: "Planning request", description: `Subject: ${subject}, Days: ${days}` })
      } else {
        toast({ title: "Planning request captured", description: text })
      }
    } else {
      toast({ title: "Voice captured", description: text })
    }
  }

  const toggle = () => {
    if (!supported) return
    if (!listening) {
      try {
        recRef.current?.start()
        setListening(true)
      } catch {
        setListening(false)
      }
    } else {
      try {
        recRef.current?.stop()
      } catch {
        // ignore
      }
    }
  }

  if (!supported) {
    return (
      <Button variant="ghost" disabled title="Voice capture not supported in this browser">
        <Mic className="h-4 w-4" />
      </Button>
    )
  }

  return (
    <Button
      variant={listening ? "destructive" : "ghost"}
      onClick={toggle}
      aria-pressed={listening}
      title={lastText || "Voice capture"}
    >
      {listening ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
    </Button>
  )
}
