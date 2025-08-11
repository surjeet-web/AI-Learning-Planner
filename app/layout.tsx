import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"
import { ReduxProvider } from "@/components/redux-provider"
import { ErrorBoundary } from "@/components/error-boundary"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { HydrationBoundary } from "@/components/hydration-boundary"

export const metadata: Metadata = {
  title: "AI Learning Planner",
  description: "Plan, track, and master new skills with an AI copilot",
  generator: "Next.js",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Prevent hydration mismatch from browser extensions
              (function() {
                if (typeof window === 'undefined') return;
                
                // Store original body state for comparison
                let originalBodyHTML = '';
                
                function cleanExtensionAttributes() {
                  if (!document.body) return;
                  
                  // Remove specific problematic extension attributes
                  const problematicAttrs = [
                    'inmaintabuse',
                    'cz-shortcut-listen', 
                    'data-new-gr-c-s-check-loaded',
                    'data-gr-ext-installed',
                    'data-clickup-chrome-ext'
                  ];
                  
                  problematicAttrs.forEach(function(attr) {
                    if (document.body.hasAttribute(attr)) {
                      document.body.removeAttribute(attr);
                    }
                  });
                  
                  // Remove extension classes that cause hydration issues
                  const problematicClasses = [
                    'clickup-chrome-ext_installed',
                    'grammarly-desktop-integration'
                  ];
                  
                  problematicClasses.forEach(function(cls) {
                    document.body.classList.remove(cls);
                  });
                }
                
                // Clean before React hydrates
                if (document.readyState === 'loading') {
                  document.addEventListener('DOMContentLoaded', function() {
                    originalBodyHTML = document.body.outerHTML;
                    cleanExtensionAttributes();
                  });
                } else {
                  originalBodyHTML = document.body.outerHTML;
                  cleanExtensionAttributes();
                }
                
                // Monitor for extension changes during hydration
                let cleanupTimer;
                const observer = new MutationObserver(function(mutations) {
                  clearTimeout(cleanupTimer);
                  cleanupTimer = setTimeout(cleanExtensionAttributes, 10);
                });
                
                // Start observing body changes
                setTimeout(function() {
                  if (document.body) {
                    observer.observe(document.body, {
                      attributes: true,
                      attributeFilter: ['class', 'inmaintabuse', 'cz-shortcut-listen']
                    });
                  }
                }, 0);
                
                // Stop observing after React has hydrated
                setTimeout(function() {
                  observer.disconnect();
                }, 3000);
              })();
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <HydrationBoundary>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <ErrorBoundary>
              <ReduxProvider>
                {children}
                <Toaster />
              </ReduxProvider>
            </ErrorBoundary>
          </ThemeProvider>
        </HydrationBoundary>
      </body>
    </html>
  )
}
