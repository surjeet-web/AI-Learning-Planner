"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import type { Course } from "@/lib/slices/courses-slice"
import { 
  Loader2, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Upload, 
  Link as LinkIcon, 
  FileText,
  Trash2,
  RefreshCw,
  Download,
  Eye,
  EyeOff,
  Youtube,
  PlayCircle,
  Zap
} from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { generateId } from "@/lib/utils"
import { YouTubeParser } from "@/lib/youtube-utils"
import { YouTubePlaylistImporter } from "./youtube-playlist-importer"

type Props = {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onAdded?: (courses: Course[]) => void
}

type ProcessingResult = {
  id: string
  url: string
  status: "pending" | "success" | "error" | "skipped"
  course?: Course
  error?: string
  title?: string
}

const EXAMPLE_URLS = `https://www.udemy.com/course/react-complete-guide/
https://www.coursera.org/learn/machine-learning
https://www.youtube.com/watch?v=dQw4w9WgXcQ
https://www.edx.org/course/introduction-to-computer-science
https://www.khanacademy.org/computing/computer-programming`

export function BulkAddCoursesDialog({ open = false, onOpenChange = () => {}, onAdded = () => {} }: Props) {
  const { toast } = useToast()
  const [urls, setUrls] = React.useState("")
  const [processing, setProcessing] = React.useState(false)
  const [results, setResults] = React.useState<ProcessingResult[]>([])
  const [progress, setProgress] = React.useState(0)
  const [currentProcessing, setCurrentProcessing] = React.useState("")
  const [showDetails, setShowDetails] = React.useState(true)
  const [batchSize, setBatchSize] = React.useState(3)
  const [retryFailed, setRetryFailed] = React.useState(false)
  const [youtubeImporterOpen, setYoutubeImporterOpen] = React.useState(false)

  const parseUrls = (text: string): string[] => {
    // More robust URL parsing
    const lines = text.split('\n').map(line => line.trim()).filter(line => line)
    const urls: string[] = []
    
    lines.forEach(line => {
      // Extract URLs from each line
      const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/g
      const matches = line.match(urlRegex) || []
      urls.push(...matches)
    })
    
    // Remove duplicates and validate
    const uniqueUrls = Array.from(new Set(urls)).filter(url => {
      try {
        new URL(url)
        return true
      } catch {
        return false
      }
    })
    
    return uniqueUrls
  }

  const detectYouTubeUrls = (text: string): { youtube: string[], other: string[] } => {
    const urls = parseUrls(text)
    const youtube: string[] = []
    const other: string[] = []
    
    urls.forEach(url => {
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        youtube.push(url)
      } else {
        other.push(url)
      }
    })
    
    return { youtube, other }
  }

  const processSingleUrl = async (url: string): Promise<ProcessingResult> => {
    const resultId = generateId()
    
    try {
      // Validate URL first
      const urlObj = new URL(url)
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        throw new Error('Invalid protocol. Only HTTP and HTTPS are supported.')
      }

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      const data = await res.json()
      
      if (!res.ok) {
        return {
          id: resultId,
          url,
          status: "error",
          error: data.error || `HTTP ${res.status}: ${res.statusText}`,
          title: urlObj.hostname
        }
      }

      const course: Course = {
        id: generateId(),
        title: data.title || urlObj.hostname,
        description: data.description || "",
        url: url.trim(),
        tags: Array.isArray(data.tags) ? data.tags : [],
        status: "planned",
        image: data.image || "/placeholder.svg?height=160&width=320",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        estimatedHours: data.estimatedHours || 0,
        completedHours: 0,
        modules: [],
        notes: "",
        provider: data.provider,
        author: data.author,
        level: data.level,
        rating: data.rating,
        ratingCount: data.ratingCount,
        price: data.price,
        language: data.language,
      }

      return {
        id: resultId,
        url,
        status: "success",
        course,
        title: course.title
      }
    } catch (error: any) {
      let errorMessage = "Unknown error occurred"
      
      if (error.name === 'AbortError') {
        errorMessage = "Request timed out (15s limit)"
      } else if (error.message) {
        errorMessage = error.message
      }

      return {
        id: resultId,
        url,
        status: "error",
        error: errorMessage,
        title: url.split('/').pop() || url
      }
    }
  }

  const processBatch = async (urls: string[], startIndex: number) => {
    const batch = urls.slice(startIndex, startIndex + batchSize)
    const promises = batch.map(async (url, index) => {
      setCurrentProcessing(url)
      const result = await processSingleUrl(url)
      
      // Update individual result
      setResults(prev => {
        const newResults = [...prev]
        const existingIndex = newResults.findIndex(r => r.url === url)
        if (existingIndex >= 0) {
          newResults[existingIndex] = result
        }
        return newResults
      })
      
      // Small delay between requests in the same batch
      if (index < batch.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200))
      }
      
      return result
    })
    
    await Promise.all(promises)
  }

  const handleBulkProcess = async () => {
    const urlList = parseUrls(urls)
    
    if (urlList.length === 0) {
      toast({ 
        title: "No valid URLs found", 
        description: "Please paste some valid HTTP/HTTPS URLs to process.",
        variant: "destructive" 
      })
      return
    }

    if (urlList.length > 50) {
      toast({ 
        title: "Too many URLs", 
        description: "Please limit to 50 URLs per batch for optimal performance.",
        variant: "destructive" 
      })
      return
    }

    setProcessing(true)
    setProgress(0)
    setCurrentProcessing("")

    // Initialize results with pending status
    const initialResults: ProcessingResult[] = urlList.map(url => ({
      id: generateId(),
      url,
      status: "pending",
      title: new URL(url).hostname
    }))
    setResults(initialResults)

    try {
      // Process in batches to avoid overwhelming the server
      for (let i = 0; i < urlList.length; i += batchSize) {
        await processBatch(urlList, i)
        setProgress(Math.min(((i + batchSize) / urlList.length) * 100, 100))
        
        // Delay between batches
        if (i + batchSize < urlList.length) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }
    } catch (error) {
      console.error('Batch processing error:', error)
      toast({
        title: "Processing interrupted",
        description: "Some URLs may not have been processed. Check the results below.",
        variant: "destructive"
      })
    }

    setProcessing(false)
    setCurrentProcessing("")
    setProgress(100)
    
    const successCount = results.filter(r => r.status === "success").length
    const errorCount = results.filter(r => r.status === "error").length
    
    toast({
      title: "Bulk processing completed",
      description: `${successCount} courses processed successfully, ${errorCount} failed.`,
      variant: successCount > 0 ? "default" : "destructive"
    })
  }

  const handleRetryFailed = async () => {
    const failedResults = results.filter(r => r.status === "error")
    if (failedResults.length === 0) return

    setRetryFailed(true)
    
    for (const failedResult of failedResults) {
      setCurrentProcessing(failedResult.url)
      const newResult = await processSingleUrl(failedResult.url)
      
      setResults(prev => prev.map(r => 
        r.id === failedResult.id ? newResult : r
      ))
      
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    setRetryFailed(false)
    setCurrentProcessing("")
  }

  const handleSaveSuccessful = () => {
    const successfulCourses = results
      .filter(r => r.status === "success" && r.course)
      .map(r => r.course!)
    
    if (successfulCourses.length > 0) {
      onAdded(successfulCourses)
      onOpenChange(false)
      resetState()
    }
  }

  const resetState = () => {
    setUrls("")
    setResults([])
    setProgress(0)
    setCurrentProcessing("")
  }

  const handleRemoveResult = (id: string) => {
    setResults(prev => prev.filter(r => r.id !== id))
  }

  const loadExampleUrls = () => {
    setUrls(EXAMPLE_URLS)
  }

  const exportResults = () => {
    const successfulCourses = results.filter(r => r.status === "success" && r.course)
    const dataStr = JSON.stringify(successfulCourses.map(r => r.course), null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'bulk-imported-courses.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  const getStatusIcon = (status: ProcessingResult["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "pending":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      case "skipped":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: ProcessingResult["status"]) => {
    switch (status) {
      case "success": return "border-green-200 bg-green-50"
      case "error": return "border-red-200 bg-red-50"
      case "pending": return "border-blue-200 bg-blue-50"
      case "skipped": return "border-yellow-200 bg-yellow-50"
      default: return "border-gray-200 bg-gray-50"
    }
  }

  const successfulResults = results.filter(r => r.status === "success")
  const errorResults = results.filter(r => r.status === "error")
  const hasResults = results.length > 0
  const urlList = parseUrls(urls)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden" aria-describedby="bulk-add-desc">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Bulk Import Courses
          </DialogTitle>
          <DialogDescription id="bulk-add-desc">
            Import multiple courses at once by pasting URLs. Supports most learning platforms.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="input" className="flex-1">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="input" className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4" />
              Input URLs
            </TabsTrigger>
            <TabsTrigger value="youtube" className="flex items-center gap-2">
              <Youtube className="h-4 w-4" />
              YouTube
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Results ({results.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="youtube" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Youtube className="h-5 w-5 text-red-500" />
                  YouTube Import
                </CardTitle>
                <CardDescription>
                  Import YouTube playlists, videos, or channels with advanced options
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Card className="p-4">
                    <div className="flex items-center gap-3">
                      <PlayCircle className="h-8 w-8 text-red-500" />
                      <div>
                        <h4 className="font-medium">Playlist Import</h4>
                        <p className="text-sm text-muted-foreground">
                          Import entire playlists with metadata
                        </p>
                      </div>
                    </div>
                  </Card>
                  
                  <Card className="p-4">
                    <div className="flex items-center gap-3">
                      <Zap className="h-8 w-8 text-yellow-500" />
                      <div>
                        <h4 className="font-medium">Smart Processing</h4>
                        <p className="text-sm text-muted-foreground">
                          Automatic metadata extraction and tagging
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>
                
                <Button 
                  onClick={() => setYoutubeImporterOpen(true)}
                  className="w-full"
                  size="lg"
                >
                  <Youtube className="mr-2 h-5 w-5" />
                  Open YouTube Importer
                </Button>
                
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>• Supports playlists, individual videos, and channels</p>
                  <p>• Extracts titles, descriptions, thumbnails, and tags</p>
                  <p>• Batch processing with progress tracking</p>
                  <p>• Advanced filtering and sorting options</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="input" className="space-y-4">
            <div className="grid gap-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="urls">Course URLs</Label>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={loadExampleUrls}>
                    Load Examples
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setUrls("")}>
                    Clear
                  </Button>
                </div>
              </div>
              
              <Textarea
                id="urls"
                placeholder="Paste URLs here (one per line)..."
                value={urls}
                onChange={(e) => setUrls(e.target.value)}
                rows={8}
                disabled={processing}
                className="font-mono text-sm"
              />
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Found {urlList.length} valid URLs</span>
                  {urlList.length > 50 && (
                    <span className="text-red-500">Limit: 50 URLs per batch</span>
                  )}
                </div>
                
                {(() => {
                  const { youtube, other } = detectYouTubeUrls(urls)
                  if (youtube.length > 0) {
                    return (
                      <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded text-sm">
                        <Youtube className="h-4 w-4 text-red-500" />
                        <span>
                          {youtube.length} YouTube URL{youtube.length > 1 ? 's' : ''} detected. 
                          Consider using the YouTube tab for better results.
                        </span>
                      </div>
                    )
                  }
                  return null
                })()}
              </div>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Processing Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-4">
                    <Label htmlFor="batch-size" className="text-sm">Batch Size:</Label>
                    <Input
                      id="batch-size"
                      type="number"
                      min="1"
                      max="10"
                      value={batchSize}
                      onChange={(e) => setBatchSize(Math.max(1, Math.min(10, parseInt(e.target.value) || 3)))}
                      className="w-20"
                      disabled={processing}
                    />
                    <span className="text-xs text-muted-foreground">
                      Smaller batches are more reliable but slower
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {processing && (
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Processing URLs...</span>
                      <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="w-full" />
                    {currentProcessing && (
                      <div className="text-xs text-muted-foreground truncate">
                        Current: {currentProcessing}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="results" className="space-y-4">
            {hasResults && (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Badge variant="outline" className="text-green-600">
                      ✓ {successfulResults.length} Success
                    </Badge>
                    <Badge variant="outline" className="text-red-600">
                      ✗ {errorResults.length} Failed
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDetails(!showDetails)}
                    >
                      {showDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      {showDetails ? "Hide" : "Show"} Details
                    </Button>
                    {successfulResults.length > 0 && (
                      <Button variant="outline" size="sm" onClick={exportResults}>
                        <Download className="h-4 w-4 mr-1" />
                        Export
                      </Button>
                    )}
                    {errorResults.length > 0 && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleRetryFailed}
                        disabled={retryFailed}
                      >
                        {retryFailed ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        ) : (
                          <RefreshCw className="h-4 w-4 mr-1" />
                        )}
                        Retry Failed
                      </Button>
                    )}
                  </div>
                </div>

                <ScrollArea className="h-96 w-full border rounded-md">
                  <div className="p-4 space-y-2">
                    {results.map((result) => (
                      <Card key={result.id} className={`${getStatusColor(result.status)} transition-colors`}>
                        <CardContent className="p-3">
                          <div className="flex items-start gap-3">
                            {getStatusIcon(result.status)}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h4 className="text-sm font-medium truncate">
                                  {result.title || result.url}
                                </h4>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => handleRemoveResult(result.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                              
                              <div className="text-xs text-muted-foreground truncate mt-1">
                                {result.url}
                              </div>
                              
                              {result.error && (
                                <div className="text-xs text-red-600 mt-1 p-2 bg-red-50 rounded">
                                  {result.error}
                                </div>
                              )}
                              
                              {showDetails && result.course && (
                                <div className="mt-2 space-y-1">
                                  {result.course.description && (
                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                      {result.course.description}
                                    </p>
                                  )}
                                  {result.course.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                      {result.course.tags.slice(0, 5).map((tag, i) => (
                                        <Badge key={i} variant="secondary" className="text-xs">
                                          {tag}
                                        </Badge>
                                      ))}
                                      {result.course.tags.length > 5 && (
                                        <Badge variant="outline" className="text-xs">
                                          +{result.course.tags.length - 5}
                                        </Badge>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </>
            )}
          </TabsContent>
        </Tabs>

        <Separator />

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          
          {!hasResults ? (
            <Button 
              onClick={handleBulkProcess} 
              disabled={processing || urlList.length === 0 || urlList.length > 50}
            >
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Process {urlList.length} URLs
                </>
              )}
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={resetState}>
                Start Over
              </Button>
              <Button 
                onClick={handleSaveSuccessful}
                disabled={successfulResults.length === 0}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Import {successfulResults.length} Courses
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
      
      <YouTubePlaylistImporter
        open={youtubeImporterOpen}
        onOpenChange={setYoutubeImporterOpen}
        onImport={(courses) => {
          onAdded(courses)
          setYoutubeImporterOpen(false)
        }}
      />
    </Dialog>
  )
}