import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { xai } from "@ai-sdk/xai"

// Uses the AI SDK to generate a personalized learning roadmap when XAI_API_KEY is set.
// Falls back to a deterministic heuristic if the key is missing or the user selects heuristic. [^1]

type Body = {
  subject: string
  goals?: string
  durationDays?: number
  hoursPerWeek?: number
  mode?: "ai" | "heuristic"
}

export async function POST(req: NextRequest) {
  try {
    const body: Body = await req.json()
    const { subject, goals = "", durationDays = 30, hoursPerWeek = 7, mode = "heuristic" } = body
    if (!subject) return NextResponse.json({ error: "Subject required" }, { status: 400 })

    const useAI = mode === "ai" && !!process.env.XAI_API_KEY

    if (useAI) {
      try {
        const { text } = await generateText({
          model: xai("grok-3"),
          system:
            "You are an expert learning coach. Build a concise learning roadmap with 6-10 modules. " +
            "Each module should have: title, description, durationDays (integer), and optional prerequisites (2-3). " +
            "Return only JSON with { modules: Module[] } where Module = { title, description, durationDays, prerequisites? }.",
          prompt: `Subject: ${subject}\nGoals: ${goals}\nTotal Duration Days: ${durationDays}\nHours/Week: ${hoursPerWeek}\n`,
        })
        // Try to parse JSON from the response
        const jsonStart = text.indexOf("{")
        const jsonEnd = text.lastIndexOf("}")
        const parsed = jsonStart >= 0 ? JSON.parse(text.slice(jsonStart, jsonEnd + 1)) : null
        const modules = (parsed?.modules || []).slice(0, 12).map((m: any) => ({
          id: crypto.randomUUID(),
          title: String(m.title || "Module"),
          description: String(m.description || ""),
          durationDays: Number.isFinite(m.durationDays)
            ? Math.max(1, Math.min(28, Math.round(m.durationDays)))
            : Math.max(1, Math.round(durationDays / 8)),
          prerequisites: Array.isArray(m.prerequisites) ? m.prerequisites.slice(0, 3).map(String) : [],
          completed: false,
        }))
        const totalDurationDays = modules.reduce((a: number, m: any) => a + (m.durationDays || 0), 0)
        return NextResponse.json({ modules, totalDurationDays })
      } catch (e: any) {
        // fallthrough to heuristic
      }
    }

    // Heuristic generator
    const modCount = Math.min(10, Math.max(6, Math.round(durationDays / 5)))
    const baseDur = Math.max(1, Math.floor(durationDays / modCount))
    const topics = [
      "Fundamentals",
      "Core Concepts",
      "Hands-on Practice",
      "Advanced Topics",
      "Ecosystem & Tools",
      "Performance & Testing",
      "Project Build",
      "Deployment",
      "Best Practices",
      "Capstone Review",
    ]
    const modules = Array.from({ length: modCount }).map((_, i) => ({
      id: crypto.randomUUID(),
      title: `${subject}: ${topics[i] || `Module ${i + 1}`}`,
      description: goals
        ? `Focus: ${goals}. ${topics[i] || "Module"}.`
        : `${topics[i] || "Module"} overview and exercises.`,
      durationDays: i === modCount - 1 ? durationDays - baseDur * (modCount - 1) : baseDur,
      prerequisites: i === 0 ? [] : [topics[Math.max(0, i - 1)]].filter(Boolean),
      completed: false,
    }))
    const totalDurationDays = modules.reduce((a, m) => a + m.durationDays, 0)
    return NextResponse.json({ modules, totalDurationDays })
  } catch (e: any) {
    return NextResponse.json({ error: "Failed to generate" }, { status: 500 })
  }
}
