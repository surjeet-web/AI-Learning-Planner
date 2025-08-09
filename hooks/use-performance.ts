import { useEffect } from "react"

export function usePerformanceMonitoring() {
  useEffect(() => {
    if (typeof window === "undefined" || !window.performance) return

    // Monitor Core Web Vitals
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === "measure") {
          console.log(`Performance: ${entry.name} took ${entry.duration}ms`)
        }
      }
    })

    observer.observe({ entryTypes: ["measure", "navigation"] })

    // Monitor memory usage (if available)
    if ("memory" in performance) {
      const memoryInfo = (performance as any).memory
      console.log("Memory usage:", {
        used: Math.round(memoryInfo.usedJSHeapSize / 1048576) + " MB",
        total: Math.round(memoryInfo.totalJSHeapSize / 1048576) + " MB",
        limit: Math.round(memoryInfo.jsHeapSizeLimit / 1048576) + " MB",
      })
    }

    return () => observer.disconnect()
  }, [])
}