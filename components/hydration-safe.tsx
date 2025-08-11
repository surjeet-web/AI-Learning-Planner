"use client"

import { useEffect, useState } from "react"

interface HydrationSafeProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  className?: string
}

export function HydrationSafe({ children, fallback = null, className }: HydrationSafeProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    // Ensure we're fully hydrated before showing client-only content
    setIsClient(true)
  }, [])

  // During SSR and initial hydration, show fallback
  if (!isClient) {
    return (
      <div className={className} suppressHydrationWarning>
        {fallback}
      </div>
    )
  }

  // After hydration, show actual content
  return (
    <div className={className} suppressHydrationWarning>
      {children}
    </div>
  )
}

// Hook to check if we're on the client side
export function useIsClient() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  return isClient
}