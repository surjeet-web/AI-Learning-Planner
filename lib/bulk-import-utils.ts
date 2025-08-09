export interface ImportResult {
  success: boolean
  data?: any
  error?: string
  url: string
}

export interface BulkImportOptions {
  batchSize?: number
  timeout?: number
  retryAttempts?: number
  retryDelay?: number
}

export class BulkImporter {
  private options: Required<BulkImportOptions>

  constructor(options: BulkImportOptions = {}) {
    this.options = {
      batchSize: options.batchSize || 3,
      timeout: options.timeout || 15000,
      retryAttempts: options.retryAttempts || 2,
      retryDelay: options.retryDelay || 1000,
    }
  }

  async processUrls(
    urls: string[],
    onProgress?: (progress: number, current: string) => void,
    onResult?: (result: ImportResult) => void
  ): Promise<ImportResult[]> {
    const results: ImportResult[] = []
    
    for (let i = 0; i < urls.length; i += this.options.batchSize) {
      const batch = urls.slice(i, i + this.options.batchSize)
      const batchPromises = batch.map(url => this.processUrl(url))
      
      const batchResults = await Promise.allSettled(batchPromises)
      
      batchResults.forEach((result, index) => {
        const url = batch[index]
        const importResult: ImportResult = result.status === 'fulfilled' 
          ? result.value 
          : { success: false, error: 'Promise rejected', url }
        
        results.push(importResult)
        onResult?.(importResult)
      })
      
      const progress = Math.min(((i + this.options.batchSize) / urls.length) * 100, 100)
      onProgress?.(progress, batch[batch.length - 1])
      
      // Delay between batches
      if (i + this.options.batchSize < urls.length) {
        await this.delay(this.options.retryDelay)
      }
    }
    
    return results
  }

  private async processUrl(url: string, attempt = 1): Promise<ImportResult> {
    try {
      // Validate URL
      const urlObj = new URL(url)
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return {
          success: false,
          error: 'Invalid protocol. Only HTTP and HTTPS are supported.',
          url
        }
      }

      // Create abort controller for timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.options.timeout)

      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        return {
          success: false,
          error: errorData.error || `HTTP ${response.status}: ${response.statusText}`,
          url
        }
      }

      const data = await response.json()
      return {
        success: true,
        data,
        url
      }

    } catch (error: any) {
      // Retry logic
      if (attempt < this.options.retryAttempts) {
        await this.delay(this.options.retryDelay * attempt)
        return this.processUrl(url, attempt + 1)
      }

      let errorMessage = 'Unknown error occurred'
      
      if (error.name === 'AbortError') {
        errorMessage = `Request timed out (${this.options.timeout / 1000}s limit)`
      } else if (error.message) {
        errorMessage = error.message
      }

      return {
        success: false,
        error: errorMessage,
        url
      }
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

export function parseUrls(text: string): string[] {
  // Split by lines and clean up
  const lines = text.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
  
  const urls: string[] = []
  
  lines.forEach(line => {
    // Extract URLs from each line using a more comprehensive regex
    const urlRegex = /https?:\/\/(?:[-\w.])+(?:\:[0-9]+)?(?:\/(?:[\w\/_.])*(?:\?(?:[\w&=%.])*)?(?:\#(?:[\w.])*)?)?/g
    const matches = line.match(urlRegex) || []
    urls.push(...matches)
  })
  
  // Remove duplicates and validate
  const uniqueUrls = Array.from(new Set(urls)).filter(url => {
    try {
      const urlObj = new URL(url)
      return ['http:', 'https:'].includes(urlObj.protocol)
    } catch {
      return false
    }
  })
  
  return uniqueUrls
}

export function validateUrls(urls: string[]): { valid: string[], invalid: string[] } {
  const valid: string[] = []
  const invalid: string[] = []
  
  urls.forEach(url => {
    try {
      const urlObj = new URL(url)
      if (['http:', 'https:'].includes(urlObj.protocol)) {
        valid.push(url)
      } else {
        invalid.push(url)
      }
    } catch {
      invalid.push(url)
    }
  })
  
  return { valid, invalid }
}

export function exportResults(results: any[], filename = 'bulk-import-results.json') {
  const dataStr = JSON.stringify(results, null, 2)
  const dataBlob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(dataBlob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}