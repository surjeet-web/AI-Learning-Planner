"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Bell, BellOff } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function NotificationsToggle() {
  const { toast } = useToast()
  const [perm, setPerm] = useState<NotificationPermission>(
    typeof window !== "undefined" ? Notification.permission : "default",
  )

  useEffect(() => {
    setPerm(typeof window !== "undefined" ? Notification.permission : "default")
  }, [])

  const enable = async () => {
    try {
      const p = await Notification.requestPermission()
      setPerm(p)
      if (p === "granted") {
        toast({ title: "Notifications enabled" })
        // Demo reminder in 5 seconds
        setTimeout(() => {
          new Notification("Study reminder", { body: "Time to learn! Open your roadmap and start a session." })
        }, 5000)
      } else {
        toast({ title: "Notifications blocked", variant: "destructive" })
      }
    } catch {
      toast({ title: "Permission failed", variant: "destructive" })
    }
  }

  const disable = () => {
    toast({ title: "Use browser settings to manage notifications" })
  }

  return perm === "granted" ? (
    <Button variant="outline" onClick={disable}>
      <BellOff className="mr-2 h-4 w-4" />
      Notifications on
    </Button>
  ) : (
    <Button variant="outline" onClick={enable}>
      <Bell className="mr-2 h-4 w-4" />
      Enable notifications
    </Button>
  )
}
