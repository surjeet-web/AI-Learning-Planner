import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { xai } from "@ai-sdk/xai"

// Uses the AI SDK to transform modules into a Markdown presentation outline when XAI_API_KEY is set. [^1]

type Body = {
  style: "concise" | "narrative" | "technical"
  notes?: string
  modules: { title: string; description?: string; durationDays?: number }[]
}

export async function POST(req: NextRequest) {
  try {
    const body: Body = await req.json()
    const { style, notes = "", modules } = body
    if (!Array.isArray(modules) || modules.length === 0) {
      return NextResponse.json({ error: "No modules" }, { status: 400 })
    }

    const useAI = !!process.env.XAI_API_KEY
    if (useAI) {
      const { text } = await generateText({
        model: xai("grok-3"),
        system:
          "Create a Markdown presentation. Start with '# Learning Presentation'. " +
          "Then for each slide use '## {title}' and 3-5 bullets aligned to the requested style. " +
          "End with an optional '### Presenter Notes' section if notes are provided.",
        prompt:
          `Style: ${style}\nNotes: ${notes}\nModules:\n` +
          modules
            .map((m, i) => `${i + 1}. ${m.title} — ${m.description || ""} (${m.durationDays || 1} days)`)
            .join("\n"),
      })
      return NextResponse.json({ markdown: text })
    }

    // Fallback: deterministic markdown
    const header = "# Learning Presentation\n\n"
    const slides = modules
      .map((m, i) => {
        const bullets =
          style === "technical"
            ? ["Key APIs/Methods", "Code example", "Common pitfalls", "Testing tips"]
            : style === "narrative"
              ? ["Why it matters", "Story/example", "How it works", "What to practice"]
              : ["Key ideas", "Practice tasks", "Resources", "Next steps"]
        return `## ${i + 1}. ${m.title}\n\n- ${bullets.join("\n- ")}`
      })
      .join("\n\n")
    const extras = notes.trim() ? `\n\n### Presenter Notes\n\n${notes.trim()}\n` : ""
    return NextResponse.json({ markdown: header + slides + extras })
  } catch (e: any) {
    return NextResponse.json({ error: "Failed to generate presentation" }, { status: 500 })
  }
}
