import { NextResponse, type NextRequest } from "next/server"

// Minimal ingest endpoint for the browser-based prototype.
// In a serverless DB-backed app this would save to a database.
// Here we simply echo back for extension compatibility.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    return NextResponse.json({ ok: true, received: body })
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
}
