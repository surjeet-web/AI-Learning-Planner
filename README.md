# AI Learning Planner Prototype

- Library: Add courses via URL (auto-fill with meta tags) or manual entry
- AI Roadmap: Generate modules with AI (xAI Grok-3 using AI SDK) or heuristic fallback
- Progress: Track completion, streaks, and study minutes
- Presentation: Generate Markdown deck; optional AI enhancement
- Analytics: KPIs and charts
- Calendar: Export .ics for schedules

Enable AI:
1. Add XAI_API_KEY in your environment (Project Settings → Environment Variables) [AI SDK usage]
2. Redeploy, then use "Generate with AI" and "Enhance with AI"

Notes:
- This prototype uses Redux + localStorage (no external DB).
- Scraping uses OG/meta fetch and may be limited by CORS depending on the target site.
