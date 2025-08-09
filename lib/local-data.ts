import { getAll, put, bulkPut, clear, get as idbGet } from "@/lib/idb"
import type { Course } from "@/lib/slices/courses-slice"
import type { RootState } from "@/lib/store"

const EXPORT_VERSION = "1.0.0"

export type ExportBundle = {
  version: string
  exportDate: string
  courses: Course[]
  progress: any // matches progress-slice state
  roadmap: any // matches roadmap-slice state
  presentations: any[]
  settings: any
}

export async function loadAllFromIndexedDB(): Promise<Partial<ExportBundle>> {
  const courses = await getAll<Course>("courses")
  // progress stored as single record with id "progress"
  const progress = (await idbGet<any>("progress", "progress")) || undefined
  const roadmap = (await idbGet<any>("roadmaps", "current")) || {
    id: "",
    subject: "",
    modules: [],
    totalDurationDays: 0,
    createdAt: 0,
  }
  const presentations = await getAll<any>("presentations")
  const settings = (await idbGet<any>("user_data", "settings")) || undefined
  return { courses, progress, roadmap, presentations, settings }
}

export async function saveAllToIndexedDB(state: RootState): Promise<void> {
  // Courses
  await clear("courses")
  await bulkPut("courses", state.courses.list)
  // Progress
  await put("progress", { id: "progress", ...state.progress })
  // Roadmap
  await put("roadmaps", { id: "current", ...state.roadmap })
  // Presentations (not yet used in UI)
  const pres = await getAll<any>("presentations") // keep what we have; or clear if you maintain them in Redux later
  if (pres.length) await bulkPut("presentations", pres)
  // Settings
  await put("user_data", { id: "settings", ...state.settings })
}

export async function exportAllData(opts?: { encrypt?: boolean; password?: string }): Promise<Blob> {
  const { courses, progress, roadmap, presentations, settings } = await loadAllFromIndexedDB()
  const payload: ExportBundle = {
    version: EXPORT_VERSION,
    exportDate: new Date().toISOString(),
    courses: courses || [],
    progress: progress || null,
    roadmap: roadmap || null,
    presentations: presentations || [],
    settings: settings || null,
  }
  const json = JSON.stringify(payload, null, 2)
  if (opts?.encrypt && opts.password) {
    const { data, meta } = await encryptText(json, opts.password)
    const out = JSON.stringify({ __encrypted__: true, meta, data }, null, 2)
    return new Blob([out], { type: "application/json" })
  }
  return new Blob([json], { type: "application/json" })
}

export async function importData(file: File, mode: "replace" | "merge" = "merge", opts?: { password?: string }) {
  const text = await file.text()
  let parsed: any
  try {
    parsed = JSON.parse(text)
  } catch (e) {
    throw new Error("Invalid JSON file")
  }
  if (parsed?.__encrypted__) {
    if (!opts?.password) throw new Error("Password required to decrypt")
    const plain = await decryptText(parsed.data, opts.password, parsed.meta)
    parsed = JSON.parse(plain)
  }
  if (!validateExportBundle(parsed)) throw new Error("Invalid data format")

  if (mode === "replace") {
    await clear("courses")
    await bulkPut("courses", parsed.courses || [])
    await clear("presentations")
    if (parsed.presentations?.length) await bulkPut("presentations", parsed.presentations)
    await put("progress", { id: "progress", ...(parsed.progress || {}) })
    await put("roadmaps", { id: "current", ...(parsed.roadmap || {}) })
    if (parsed.settings) await put("user_data", { id: "settings", ...parsed.settings })
    return parsed
  }

  // merge
  // Courses: by id; if id collision, keep the one with newer updatedAt
  const existingCourses: Course[] = (await getAll<Course>("courses")) || []
  const byId = new Map<string, Course>(existingCourses.map((c) => [c.id, c]))
  for (const nc of parsed.courses || []) {
    const ex = byId.get(nc.id)
    if (!ex) byId.set(nc.id, nc)
    else {
      const newer = (nc.updatedAt || 0) >= (ex.updatedAt || 0) ? nc : ex
      byId.set(nc.id, newer)
    }
  }
  await clear("courses")
  await bulkPut("courses", Array.from(byId.values()))
  // Progress: prefer totals max and merge windows by date
  if (parsed.progress) {
    const merged = await mergeProgress(parsed.progress)
    await put("progress", { id: "progress", ...merged })
  }
  // Roadmap: prefer imported if subject differs or if imported has more modules
  if (parsed.roadmap) {
    const current = (await idbGet<any>("roadmaps", "current")) || null
    const useImported =
      !current ||
      (parsed.roadmap?.subject && parsed.roadmap.subject !== current.subject) ||
      (parsed.roadmap?.modules?.length || 0) >= (current?.modules?.length || 0)
    if (useImported) await put("roadmaps", { id: "current", ...parsed.roadmap })
  }
  // Presentations: naive append by id uniqueness
  if (parsed.presentations?.length) {
    const exPres = await getAll<any>("presentations")
    const presById = new Map<string, any>(exPres.map((p) => [p.id, p]))
    for (const np of parsed.presentations) if (!presById.has(np.id)) presById.set(np.id, np)
    await clear("presentations")
    await bulkPut("presentations", Array.from(presById.values()))
  }
  // Settings: merge (prefer existing), otherwise imported
  if (parsed.settings) {
    const existing = (await idbGet<any>("user_data", "settings")) || {}
    await put("user_data", { id: "settings", ...existing, ...parsed.settings })
  }
  return parsed
}

function validateExportBundle(d: any): d is ExportBundle {
  if (!d || typeof d !== "object") return false
  if (!("version" in d) || !("exportDate" in d)) return false
  if (!("courses" in d) || !Array.isArray(d.courses)) return false
  return true
}

async function mergeProgress(imported: any) {
  const existing = (await idbGet<any>("progress", "progress")) || {}
  const out = { ...existing }
  out.totalMinutes = Math.max(existing.totalMinutes || 0, imported.totalMinutes || 0)
  out.sessions = Math.max(existing.sessions || 0, imported.sessions || 0)
  out.streakDays = Math.max(existing.streakDays || 0, imported.streakDays || 0)
  // merge windows by date
  const mergeWindow = (w1: any[] = [], w2: any[] = []) => {
    const map = new Map<string, any>()
    for (const r of w1) map.set(r.date, { ...r })
    for (const r of w2) {
      const ex = map.get(r.date)
      if (!ex) map.set(r.date, { ...r })
      else map.set(r.date, { ...ex, minutes: Math.max(ex.minutes || 0, r.minutes || 0) })
    }
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date))
  }
  out.last7Days = mergeWindow(existing.last7Days, imported.last7Days)
  out.last30Days = mergeWindow(existing.last30Days, imported.last30Days)
  out.lastSessionDate = [existing.lastSessionDate, imported.lastSessionDate].filter(Boolean).sort()?.pop()
  return out
}

// CSV helpers
export function toCSV(name: "courses" | "progress", data: any[]): Blob {
  if (name === "courses") {
    const header = [
      "id",
      "title",
      "description",
      "url",
      "status",
      "tags",
      "estimatedHours",
      "completedHours",
      "updatedAt",
    ]
    const rows = (data as Course[]).map((c) => [
      c.id,
      escapeCSV(c.title),
      escapeCSV(c.description || ""),
      c.url || "",
      c.status,
      (c.tags || []).join("|"),
      String(c.estimatedHours || 0),
      String(c.completedHours || 0),
      String(c.updatedAt || 0),
    ])
    return new Blob([header.join(",") + "\n" + rows.map((r) => r.join(",")).join("\n")], { type: "text/csv" })
  }
  // progress: last30Days rows
  const header = ["date", "label", "minutes"]
  const rows = data.map((r) => [r.date, escapeCSV(r.label), String(r.minutes)])
  return new Blob([header.join(",") + "\n" + rows.map((r) => r.join(",")).join("\n")], { type: "text/csv" })
}
function escapeCSV(s: string) {
  if (s.includes(",") || s.includes('"') || s.includes("\n")) return `"${s.replace(/"/g, '""')}"`
  return s
}

// File System Access helpers
export async function pickDirectory(): Promise<FileSystemDirectoryHandle | null> {
  // @ts-ignore
  if (!window.showDirectoryPicker) return null
  // @ts-ignore
  const handle: FileSystemDirectoryHandle = await window.showDirectoryPicker()
  // Persist handle in IDB (FileSystemHandle is serializable in IndexedDB in supporting browsers)
  await put("user_data", { id: "dirHandle", handle })
  return handle
}

export async function getSavedDirectoryHandle(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const rec: any = await (await import("@/lib/idb")).get("user_data" as any, "dirHandle")
    return rec?.handle || null
  } catch {
    return null
  }
}

export async function writeBackupToDirectory(dir: FileSystemDirectoryHandle, fileName: string, blob: Blob) {
  const backups = await dir.getDirectoryHandle("backups", { create: true })
  const file = await backups.getFileHandle(fileName, { create: true })
  const writable = await file.createWritable()
  await writable.write(blob)
  await writable.close()
}

// Crypto (password-based AES-GCM)
async function getKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder().encode(password)
  const keyMaterial = await crypto.subtle.importKey("raw", enc, "PBKDF2", false, ["deriveKey"])
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  )
}

export async function encryptText(plain: string, password: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const key = await getKey(password, salt)
  const data = new TextEncoder().encode(plain)
  const buf = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, data)
  const out = btoa(String.fromCharCode(...new Uint8Array(buf)))
  return { data: out, meta: { iv: Array.from(iv), salt: Array.from(salt) } }
}

export async function decryptText(b64: string, password: string, meta: { iv: number[]; salt: number[] }) {
  const iv = new Uint8Array(meta.iv)
  const salt = new Uint8Array(meta.salt)
  const key = await getKey(password, salt)
  const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
  const buf = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, bin)
  return new TextDecoder().decode(buf)
}
