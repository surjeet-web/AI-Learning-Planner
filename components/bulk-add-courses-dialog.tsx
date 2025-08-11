"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  Youtube,
  Zap,
  Globe,
  Sparkles,
  ArrowRight,
  Search,
  RotateCcw
} from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { generateId } from "@/lib/utils"
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
  const [youtubeImporterOpen, setYoutubeImporterOpen] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState("input")

  const parseUrls = (text: string): string[] => {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line)
    const urls: string[] = []
    
    lines.forEach(line => {
      const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/g
      const matches = line.match(urlRegex) || []
      urls.push(...matches)
    })
    
    return Array.from(new Set(urls)).filter(url => {
      try {
        new URL(url)
        return true
      } catch {
        return false
      }
    })
  }

  const processSingleUrl = async (url: string): Promise<ProcessingResult> => {
    const resultId = generateId()
    
    try {
      const urlObj = new URL(url)
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        throw new Error('Invalid protocol. Only HTTP and HTTPS are supported.')
      }

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000)

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

    const initialResults: ProcessingResult[] = urlList.map(url => ({
      id: generateId(),
      url,
      status: "pending",
      title: new URL(url).hostname
    }))
    setResults(initialResults)

    try {
      for (let i = 0; i < urlList.length; i++) {
        const url = urlList[i]
        setCurrentProcessing(url)
        const result = await processSingleUrl(url)
        
        setResults(prev => prev.map(r => 
          r.url === url ? result : r
        ))
        
        setProgress(((i + 1) / urlList.length) * 100)
        
        if (i < urlList.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }
    } catch (error) {
      console.error('Processing error:', error)
      toast({
        title: "Processing interrupted",
        description: "Some URLs may not have been processed.",
        variant: "destructive"
      })
    }

    setProcessing(false)
    setCurrentProcessing("")
    setProgress(100)
    
    const successCount = results.filter(r => r.status === "success").length
    const errorCount = results.filter(r => r.status === "error").length
    
    toast({
      title: "Processing completed",
      description: `${successCount} courses processed successfully, ${errorCount} failed.`,
      variant: successCount > 0 ? "default" : "destructive"
    })
  }

  const handleSaveSuccessful = () => {
    const successfulCourses = results
      .filter(r => r.status === "success" && r.course)
      .map(r => r.course!)
    
    if (successfulCourses.length > 0) {
      onAdded(successfulCourses)
      onOpenChange(false)
      setUrls("")
      setResults([])
      setProgress(0)
      setCurrentProcessing("")
    }
  }

  const loadExampleUrls = () => {
    setUrls(EXAMPLE_URLS)
  }

  const getStatusIcon = (status: ProcessingResult["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "pending":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: ProcessingResult["status"]) => {
    switch (status) {
      case "success": return "border-green-200 bg-green-50"
      case "error": return "border-red-200 bg-red-50"
      case "pending": return "border-blue-200 bg-blue-50"
      default: return "border-gray-200 bg-gray-50"
    }
  }

  const successfulResults = results.filter(r => r.status === "success")
  const errorResults = results.filter(r => r.status === "error")
  const hasResults = results.length > 0
  const urlList = parseUrls(urls)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden p-0" aria-describedby="bulk-add-desc">
        {/* Modern Header */}
        <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-6 text-white">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative">
            <DialogHeader className="space-y-3">
              <DialogTitle className="flex items-center gap-3 text-2xl font-bold">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <Sparkles className="h-6 w-6" />
                </div>
                Advanced Course Importer
              </DialogTitle>
              <DialogDescription id="bulk-add-desc" className="text-blue-100 text-lg">
                Import courses from multiple sources with AI-powered processing
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex items-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-blue-200" />
                <span className="text-sm text-blue-100">Multi-platform</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-300" />
                <span className="text-sm text-blue-100">AI-powered</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-300" />
                <span className="text-sm text-blue-100">Batch processing</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 h-12 p-1 bg-muted/50">
              <TabsTrigger value="input" className="flex items-center gap-2">
                <LinkIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Bulk URLs</span>
              </TabsTrigger>
              <TabsTrigger value="youtube" className="flex items-center gap-2">
                <Youtube className="h-4 w-4" />
                <span className="hidden sm:inline">YouTube</span>
              </TabsTrigger>
              <TabsTrigger value="results" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Results</span>
                {results.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 text-xs">
                    {results.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="youtube" className="space-y-6">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-500 via-red-600 to-red-700 p-8 text-white">
                <div className="relative">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                      <Youtube className="h-8 w-8" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">YouTube Importer</h3>
                      <p className="text-red-100">Import playlists, videos, and channels with ease</p>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => setYoutubeImporterOpen(true)}
                    size="lg"
                    className="bg-white text-red-600 hover:bg-red-50 font-semibold px-8"
                  >
                    <Youtube className="mr-2 h-5 w-5" />
                    Launch YouTube Importer
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="input" className="space-y-6">
              <Card className="border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors">
                <CardContent className="p-6">
                  <div className="text-center space-y-4">
                    <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                      <Upload className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Paste Your URLs</h3>
                      <p className="text-muted-foreground">Drop multiple course URLs here for batch processing</p>
                    </div>
                  </div>
                  
                  <div className="mt-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="urls" className="text-base font-medium">Course URLs</Label>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={loadExampleUrls}>
                          <Sparkles className="h-4 w-4 mr-1" />
                          Examples
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setUrls("")}>
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Clear
                        </Button>
                      </div>
                    </div>
                    
                    <Textarea
                      id="urls"
                      placeholder="Paste your course URLs here (one per line)..."
                      value={urls}
                      onChange={(e) => setUrls(e.target.value)}
                      rows={10}
                      disabled={processing}
                      className="font-mono text-sm resize-none"
                    />
                    
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Found {urlList.length} valid URLs</span>
                      </div>
                      {urlList.length > 50 && (
                        <Badge variant="destructive" className="text-xs">
                          Limit: 50 URLs per batch
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {processing && (
                <Card className="border-primary/50 bg-primary/5">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        <div>
                          <div className="font-medium">Processing URLs...</div>
                          <div className="text-sm text-muted-foreground">
                            {Math.round(progress)}% complete
                          </div>
                        </div>
                      </div>
                      
                      <Progress value={progress} className="w-full h-2" />
                      
                      {currentProcessing && (
                        <div className="p-3 bg-white/50 rounded-lg">
                          <div className="text-xs font-medium text-muted-foreground mb-1">Currently processing:</div>
                          <div className="text-sm font-mono truncate">{currentProcessing}</div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="results" className="space-y-6">
              {hasResults ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Card className="bg-green-50 border-green-200">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-green-700">{successfulResults.length}</div>
                            <div className="text-sm text-green-600">Successful</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-red-50 border-red-200">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-red-100 rounded-lg">
                            <XCircle className="h-5 w-5 text-red-600" />
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-red-700">{errorResults.length}</div>
                            <div className="text-sm text-red-600">Failed</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-blue-50 border-blue-200">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <FileText className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-blue-700">{results.length}</div>
                            <div className="text-sm text-blue-600">Total</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <ScrollArea className="h-96 w-full">
                    <div className="space-y-3">
                      {results.map((result) => (
                        <Card key={result.id} className={`${getStatusColor(result.status)} transition-all hover:shadow-md`}>
                          <CardContent className="p-4">
                            <div className="flex items-start gap-4">
                              <div className="flex-shrink-0 mt-1">
                                {getStatusIcon(result.status)}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm truncate">
                                  {result.title || new URL(result.url).hostname}
                                </h4>
                                <div className="text-xs text-muted-foreground truncate mt-1">
                                  {result.url}
                                </div>
                                
                                {result.error && (
                                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                                    <div className="font-medium">Error:</div>
                                    <div>{result.error}</div>
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
              ) : (
                <div className="text-center py-12">
                  <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No results yet</h3>
                  <p className="text-muted-foreground mb-4">Process some URLs to see results here</p>
                  <Button variant="outline" onClick={() => setActiveTab("input")}>
                    <ArrowRight className="h-4 w-4 mr-1" />
                    Go to Input
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Modern Footer */}
        <div className="border-t bg-muted/30 p-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {hasResults ? (
                <span>{successfulResults.length} of {results.length} URLs processed successfully</span>
              ) : (
                <span>Ready to process {urlList.length} URLs</span>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              
              {!hasResults ? (
                <Button 
                  onClick={handleBulkProcess} 
                  disabled={processing || urlList.length === 0 || urlList.length > 50}
                  size="lg"
                  className="px-8"
                >
                  {processing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-4 w-4" />
                      Process {urlList.length} URLs
                    </>
                  )}
                </Button>
              ) : (
                <Button 
                  onClick={handleSaveSuccessful}
                  disabled={successfulResults.length === 0}
                  size="lg"
                  className="px-8"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Import {successfulResults.length} Courses
                </Button>
              )}
            </div>
          </div>
        </div>
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