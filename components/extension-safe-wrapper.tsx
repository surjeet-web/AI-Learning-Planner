"use client"

import { useEffect, useState } from "react"

interface ExtensionSafeWrapperProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

/**
 * Wrapper component that prevents hydration mismatches caused by browser extensions
 * that inject DOM attributes/elements before React hydrates
 */
export function ExtensionSafeWrapper({ children, fallback = null }: ExtensionSafeWrapperProps) {
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    // Only render after hydration is complete to avoid extension-related mismatches
    setIsHydrated(true)
    
    // Clean up any extension attributes that might cause issues
    const cleanExtensionAttributes = () => {
      if (typeof window !== 'undefined' && document.body) {
        // Remove known problematic extension attributes
        const extensionAttrs = [
          'inmaintabuse',
          'cz-shortcut-listen', 
          'data-new-gr-c-s-check-loaded',
          'data-gr-ext-installed',
          'spellcheck'
        ]
        
        extensionAttrs.forEach(attr => {
          if (document.body.hasAttribute(attr)) {
            document.body.removeAttribute(attr)
          }
        })
        
        // Clean extension classes
        const extensionClasses = [
          'clickup-chrome-ext_installed',
          'grammarly-desktop-integration',
          'notion-chrome-ext'
        ]
        
        extensionClasses.forEach(cls => {
          document.body.classList.remove(cls)
        })
      }
    }
    
    // Clean immediately and set up observer for future changes
    cleanExtensionAttributes()
    
    const observer = new MutationObserver(() => {
      cleanExtensionAttributes()
    })
    
    if (document.body) {
      observer.observe(document.body, {
        attributes: true,
        attributeFilter: ['class', 'inmaintabuse', 'cz-shortcut-listen']
      })
    }
    
    // Cleanup observer after a reasonable time
    const cleanup = setTimeout(() => {
      observer.disconnect()
    }, 5000)
    
    return () => {
      clearTimeout(cleanup)
      observer.disconnect()
    }
  }, [])

  // During SSR and initial hydration, show fallback or nothing
  if (!isHydrated) {
    return <>{fallback}</>
  }

  // After hydration, show actual content
  return <>{children}</>
}

/**
 * Hook to safely check if we're on the client side after hydration
 */
export function useIsHydrated() {
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  return isHydrated
}