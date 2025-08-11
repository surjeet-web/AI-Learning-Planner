"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { BulkAddCoursesDialog } from "./bulk-add-courses-dialog"
import { YouTubePlaylistImporter } from "./youtube-playlist-importer"

export function ImportTest() {
  const [bulkOpen, setBulkOpen] = useState(false)
  const [youtubeOpen, setYoutubeOpen] = useState(false)

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">Import Components Test</h2>
      
      <div className="flex gap-4">
        <Button onClick={() => setBulkOpen(true)}>
          Test Bulk Importer
        </Button>
        <Button onClick={() => setYoutubeOpen(true)}>
          Test YouTube Importer
        </Button>
      </div>

      <BulkAddCoursesDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        onAdded={(courses) => {
          console.log('Bulk imported:', courses)
        }}
      />

      <YouTubePlaylistImporter
        open={youtubeOpen}
        onOpenChange={setYoutubeOpen}
        onImport={(courses) => {
          console.log('YouTube imported:', courses)
        }}
      />
    </div>
  )
}