"use client"

import { useEffect, useState } from "react"

interface HydrationBoundaryProps {
  children: React.ReactNode
}

export function HydrationBoundary({ children }: HydrationBoundaryProps) {
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    // Mark as hydrated after the first render
    setIsHydrated(true)
  }, [])

  // Suppress hydration warnings in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const originalError = console.error
      console.error = (...args) => {
        if (
          typeof args[0] === 'string' &&
          args[0].includes('Hydration failed')
        ) {
          return
        }
        originalError(...args)
      }

      return () => {
        console.error = originalError
      }
    }
  }, [])

  return <div suppressHydrationWarning>{children}</div>
}