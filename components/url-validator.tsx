"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, XCircle, AlertTriangle, Globe } from "lucide-react"

type UrlValidation = {
  url: string
  isValid: boolean
  domain: string
  protocol: string
  error?: string
}

type Props = {
  urls: string[]
  onValidationChange?: (valid: string[], invalid: string[]) => void
}

export function UrlValidator({ urls, onValidationChange }: Props) {
  const [validations, setValidations] = useState<UrlValidation[]>([])

  useEffect(() => {
    const newValidations = urls.map(url => {
      try {
        const urlObj = new URL(url.trim())
        const isValid = ['http:', 'https:'].includes(urlObj.protocol)
        
        return {
          url: url.trim(),
          isValid,
          domain: urlObj.hostname,
          protocol: urlObj.protocol,
          error: isValid ? undefined : 'Only HTTP and HTTPS protocols are supported'
        }
      } catch (error) {
        return {
          url: url.trim(),
          isValid: false,
          domain: 'Invalid',
          protocol: 'Invalid',
          error: 'Invalid URL format'
        }
      }
    })

    setValidations(newValidations)
    
    if (onValidationChange) {
      const valid = newValidations.filter(v => v.isValid).map(v => v.url)
      const invalid = newValidations.filter(v => !v.isValid).map(v => v.url)
      onValidationChange(valid, invalid)
    }
  }, [urls, onValidationChange])

  if (validations.length === 0) return null

  const validCount = validations.filter(v => v.isValid).length
  const invalidCount = validations.length - validCount

  // Group by domain for better organization
  const domainGroups = validations.reduce((acc, validation) => {
    const domain = validation.domain
    if (!acc[domain]) acc[domain] = []
    acc[domain].push(validation)
    return acc
  }, {} as Record<string, UrlValidation[]>)

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">URL Validation</h4>
            <div className="flex gap-2">
              <Badge variant="outline" className="text-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                {validCount} Valid
              </Badge>
              {invalidCount > 0 && (
                <Badge variant="outline" className="text-red-600">
                  <XCircle className="h-3 w-3 mr-1" />
                  {invalidCount} Invalid
                </Badge>
              )}
            </div>
          </div>

          {invalidCount > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-amber-600">
                <AlertTriangle className="h-4 w-4" />
                <span>Some URLs have issues:</span>
              </div>
              
              <div className="space-y-1">
                {validations
                  .filter(v => !v.isValid)
                  .slice(0, 5) // Show only first 5 errors
                  .map((validation, index) => (
                    <div key={index} className="text-xs p-2 bg-red-50 border border-red-200 rounded">
                      <div className="font-mono truncate">{validation.url}</div>
                      <div className="text-red-600 mt-1">{validation.error}</div>
                    </div>
                  ))}
                
                {validations.filter(v => !v.isValid).length > 5 && (
                  <div className="text-xs text-muted-foreground">
                    +{validations.filter(v => !v.isValid).length - 5} more invalid URLs
                  </div>
                )}
              </div>
            </div>
          )}

          {validCount > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span>Supported platforms detected:</span>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {Object.entries(domainGroups)
                  .filter(([_, validations]) => validations.some(v => v.isValid))
                  .map(([domain, validations]) => (
                    <Badge key={domain} variant="secondary" className="text-xs">
                      <Globe className="h-3 w-3 mr-1" />
                      {domain} ({validations.filter(v => v.isValid).length})
                    </Badge>
                  ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}