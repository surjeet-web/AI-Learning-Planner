"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { selectCourses, setCourses } from "@/lib/slices/courses-slice"
import { selectRoadmap, setRoadmap } from "@/lib/slices/roadmap-slice"
import { selectProgress, setProgress } from "@/lib/slices/progress-slice"
import { selectSettings, setSettings } from "@/lib/slices/settings-slice"
import {
  exportAllData,
  importData,
  loadAllFromIndexedDB,
  toCSV,
  pickDirectory,
  getSavedDirectoryHandle,
  writeBackupToDirectory,
} from "@/lib/local-data"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Download, Upload, HardDrive, Shield, FolderOpen } from "lucide-react"

export function StorageDashboard() {
  const dispatch = useAppDispatch()
  const { toast } = useToast()
  const courses = useAppSelector(selectCourses).list
  const roadmap = useAppSelector(selectRoadmap)
  const progress = useAppSelector(selectProgress)
  const settings = useAppSelector(selectSettings)
  const [estimate, setEstimate] = useState<{ usage?: number; quota?: number }>({})
  const [loading, setLoading] = useState(false)
  const [encrypt, setEncrypt] = useState(false)
  const [password, setPassword] = useState("")
  const [importMode, setImportMode] = useState<"replace" | "merge">("merge")
  const fileRef = useRef<HTMLInputElement>(null)
  const [dirName, setDirName] = useState<string>("")
  const [fsSupported, setFsSupported] = useState<boolean>(false)

  useEffect(() => {
    if (navigator.storage?.estimate) {
      navigator.storage
        .estimate()
        .then((e) => setEstimate({ usage: e.usage, quota: e.quota }))
        .catch(() => {})
    }
  }, [])

  useEffect(() => {
    // Check for File System Access API
    // @ts-ignore
    setFsSupported(!!window.showDirectoryPicker)
    ;(async () => {
      const handle = await getSavedDirectoryHandle()
      if (handle) setDirName((handle as any).name || "Selected directory")
    })()
  }, [])

  const usagePct = useMemo(() => {
    const { usage = 0, quota = 0 } = estimate
    return quota ? Math.round((usage / quota) * 100) : 0
  }, [estimate])

  const doExportJSON = async () => {
    setLoading(true)
    try {
      const blob = await exportAllData({ encrypt, password })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      const date = new Date().toISOString().split("T")[0]
      a.href = url
      a.download = `learning-data-${date}${encrypt ? ".enc" : ""}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast({ title: "Export created", description: "Download started." })
    } catch (e: any) {
      toast({ title: "Export failed", description: e?.message || "Unknown error", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const doExportCSV = async () => {
    const courseBlob = toCSV("courses", courses)
    const a1 = document.createElement("a")
    const date = new Date().toISOString().split("T")[0]
    a1.href = URL.createObjectURL(courseBlob)
    a1.download = `courses-${date}.csv`
    a1.click()
    URL.revokeObjectURL(a1.href)

    const progBlob = toCSV("progress", progress.last30Days)
    const a2 = document.createElement("a")
    a2.href = URL.createObjectURL(progBlob)
    a2.download = `progress-last30-${date}.csv`
    a2.click()
    URL.revokeObjectURL(a2.href)
  }

  const onPickImport = () => fileRef.current?.click()

  const doImport = async (file: File) => {
    setLoading(true)
    try {
      const data = await importData(file, importMode, { password })
      // Refresh UI state from IDB (authoritative)
      const restored = await loadAllFromIndexedDB()
      if (restored.courses) dispatch(setCourses(restored.courses))
      if (restored.progress) dispatch(setProgress(restored.progress as any))
      if (restored.roadmap) dispatch(setRoadmap(restored.roadmap as any))
      if (restored.settings) dispatch(setSettings(restored.settings))
      toast({ title: "Import complete", description: `Mode: ${importMode}` })
    } catch (e: any) {
      toast({ title: "Import failed", description: e?.message || "Unknown error", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const chooseDirectory = async () => {
    try {
      const handle = await pickDirectory()
      if (handle) setDirName((handle as any).name || "Selected directory")
      toast({ title: "Folder selected", description: "Backups will save here." })
    } catch {
      toast({ title: "Folder selection failed", variant: "destructive" })
    }
  }

  const backupToDirectory = async () => {
    try {
      const dir = await getSavedDirectoryHandle()
      if (!dir) {
        toast({ title: "No folder selected", description: "Choose a folder first.", variant: "destructive" })
        return
      }
      const blob = await exportAllData({ encrypt, password })
      const date = new Date().toISOString().replace(/[:.]/g, "-")
      await writeBackupToDirectory(dir, `learning-data-${date}${encrypt ? ".enc" : ""}.json`, blob)
      toast({ title: "Backup saved", description: dirName || "Selected folder" })
    } catch (e: any) {
      toast({ title: "Backup failed", description: e?.message || "Unknown error", variant: "destructive" })
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Storage Dashboard</CardTitle>
          <CardDescription>Local-first data with full portability.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-md border p-3">
              <div className="text-xs text-muted-foreground">Stored courses</div>
              <div className="text-2xl font-semibold">{courses.length}</div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-xs text-muted-foreground">Roadmap modules</div>
              <div className="text-2xl font-semibold">{roadmap?.modules?.length || 0}</div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-xs text-muted-foreground">Total minutes</div>
              <div className="text-2xl font-semibold">{progress.totalMinutes}</div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-xs text-muted-foreground">Storage usage</div>
              <div className="text-2xl font-semibold">{usagePct}%</div>
            </div>
          </div>
          <Separator />
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Local IndexedDB</Badge>
            <Badge variant="outline">{navigator.onLine ? "Online" : "Offline"}</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Export</CardTitle>
          <CardDescription>Download your complete data set.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2">
            <div className="flex items-center gap-2">
              <input id="encrypt" type="checkbox" checked={encrypt} onChange={(e) => setEncrypt(e.target.checked)} />
              <Label htmlFor="encrypt">Encrypt export (AES-GCM)</Label>
            </div>
            {encrypt ? (
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={doExportJSON} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              Export JSON
            </Button>
            <Button variant="outline" onClick={doExportCSV}>
              <Download className="mr-2 h-4 w-4" />
              Export CSVs
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Import</CardTitle>
          <CardDescription>Restore or merge from an export file.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="mode">Mode</Label>
              <select
                id="mode"
                className="rounded-md border bg-background px-3 py-2 text-sm"
                value={importMode}
                onChange={(e) => setImportMode(e.target.value as any)}
              >
                <option value="merge">Merge</option>
                <option value="replace">Replace</option>
              </select>
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label>Encryption password (if applicable)</Label>
              <Input
                type="password"
                placeholder="Enter password if file is encrypted"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              ref={fileRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void doImport(f)
              }}
            />
            <Button variant="secondary" onClick={onPickImport}>
              <Upload className="mr-2 h-4 w-4" />
              Choose file
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Local Backups</CardTitle>
          <CardDescription>Store backups in a folder on your computer.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={chooseDirectory} disabled={!fsSupported}>
              <FolderOpen className="mr-2 h-4 w-4" /> Choose folder
            </Button>
            <div className="text-sm text-muted-foreground">
              {fsSupported
                ? dirName
                  ? `Selected: ${dirName}`
                  : "No folder selected"
                : "File System Access API not supported in this browser"}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={backupToDirectory} disabled={!fsSupported}>
              <HardDrive className="mr-2 h-4 w-4" /> Backup now
            </Button>
            <Button variant="outline" disabled title="Auto-backup coming soon">
              <Shield className="mr-2 h-4 w-4" /> Auto-backup (soon)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
