"use client"

import { useEffect, useState } from "react"

export function OfflineBanner() {
  const [online, setOnline] = useState(true)
  useEffect(() => {
    const update = () => setOnline(navigator.onLine)
    update()
    window.addEventListener("online", update)
    window.addEventListener("offline", update)
    return () => {
      window.removeEventListener("online", update)
      window.removeEventListener("offline", update)
    }
  }, [])
  if (online) return null
  return (
    <div
      role="status"
      className="mb-4 rounded-md border border-amber-300 bg-amber-50 p-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950"
    >
      You are offline. Changes will be saved locally and backed up when online.
    </div>
  )
}
