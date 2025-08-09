"use client"

import { useState, useCallback, useMemo } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { 
  Youtube, 
  Play, 
  Clock, 
  Eye, 
  ThumbsUp, 
  User, 
  Calendar,
  CheckCircle,
  XCircle,
  Loader2,
  Download,
  Filter,
  SortAsc,
  SortDesc,
  Search,
  Settings,
  BookOpen,
  Tag
} from "lucide-react"
import { YouTubeParser, type YouTubePlaylist, type YouTubeVideo } from "@/lib/youtube-utils"
import { generateId } from "@/lib/utils"
import type { Course } from "@/lib/slices/courses-slice"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (courses: Course[]) => void
}

type ImportMode = 'playlist' | 'individual' | 'channel'
type SortOption = 'order' | 'title' | 'duration' | 'views' | 'date'
type FilterOption = 'all' | 'short' | 'medium' | 'long'

interface VideoSelection {
  video: YouTubeVideo
  selected: boolean
  course?: Course
}

export function YouTubePlaylistImporter({ open, onOpenChange, onImport }: Props) {
  const { toast } = useToast()
  const [url, setUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [playlist, setPlaylist] = useState<YouTubePlaylist | null>(null)
  const [videoSelections, setVideoSelections] = useState<VideoSelection[]>([])
  const [importMode, setImportMode] = useState<ImportMode>('playlist')
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<SortOption>('order')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [filterBy, setFilterBy] = useState<FilterOption>('all')
  const [selectAll, setSelectAll] = useState(true)
  const [customTags, setCustomTags] = useState("")
  const [groupBySeries, setGroupBySeries] = useState(true)
  const [estimatedHours, setEstimatedHours] = useState<number>(0)

  const parseUrl = useCallback(async () => {
    if (!url.trim()) {
      toast({ title: "Please enter a YouTube URL", variant: "destructive" })
      return
    }

    const urlType = YouTubeParser.getUrlType(url)
    
    if (urlType === 'unknown') {
      toast({ title: "Invalid YouTube URL", description: "Please enter a valid YouTube playlist, video, or channel URL", variant: "destructive" })
      return
    }

    setLoading(true)
    
    try {
      if (urlType === 'playlist') {
        const playlistId = YouTubeParser.extractPlaylistId(url)
        if (!playlistId) throw new Error("Could not extract playlist ID")
        
        // Mock API call - in production, use actual YouTube API
        const mockPlaylist: YouTubePlaylist = {
          id: playlistId,
          title: "React.js Complete Course",
          description: "Learn React.js from scratch with this comprehensive tutorial series",
          thumbnail: "https://img.youtube.com/vi/bMknfKXIFA8/mqdefault.jpg",
          channelTitle: "React Academy",
          channelId: "UCReactAcademy",
          itemCount: 25,
          publishedAt: "2024-01-15T10:00:00Z",
          privacy: "public",
          videos: [
            {
              id: "bMknfKXIFA8",
              title: "React.js Tutorial #1 - Introduction",
              description: "Introduction to React.js and setting up your development environment",
              thumbnail: "https://img.youtube.com/vi/bMknfKXIFA8/mqdefault.jpg",
              duration: "PT15M30S",
              publishedAt: "2024-01-15T10:00:00Z",
              channelTitle: "React Academy",
              channelId: "UCReactAcademy",
              viewCount: 125000,
              likeCount: 3200,
              tags: ["react", "javascript", "tutorial", "beginner"]
            },
            {
              id: "SqcY0GlETPk",
              title: "React.js Tutorial #2 - Components",
              description: "Understanding React components and JSX syntax",
              thumbnail: "https://img.youtube.com/vi/SqcY0GlETPk/mqdefault.jpg",
              duration: "PT22M45S",
              publishedAt: "2024-01-16T10:00:00Z",
              channelTitle: "React Academy",
              channelId: "UCReactAcademy",
              viewCount: 98000,
              likeCount: 2800,
              tags: ["react", "components", "jsx", "tutorial"]
            },
            {
              id: "dQw4w9WgXcQ",
              title: "React.js Tutorial #3 - State Management",
              description: "Learn about React state and props",
              thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
              duration: "PT18M20S",
              publishedAt: "2024-01-17T10:00:00Z",
              channelTitle: "React Academy",
              channelId: "UCReactAcademy",
              viewCount: 87000,
              likeCount: 2500,
              tags: ["react", "state", "props", "tutorial"]
            }
          ]
        }
        
        setPlaylist(mockPlaylist)
        setVideoSelections(mockPlaylist.videos.map(video => ({
          video,
          selected: true,
          course: videoToCourse(video, mockPlaylist)
        })))
        
        // Calculate estimated hours
        const totalMinutes = mockPlaylist.videos.reduce((acc, video) => {
          const duration = YouTubeParser.formatDuration(video.duration)
          const [minutes, seconds] = duration.split(':').map(Number)
          return acc + minutes + (seconds / 60)
        }, 0)
        setEstimatedHours(Math.round(totalMinutes / 60 * 100) / 100)
        
      } else if (urlType === 'video') {
        const videoId = YouTubeParser.extractVideoId(url)
        if (!videoId) throw new Error("Could not extract video ID")
        
        // Mock single video
        const mockVideo: YouTubeVideo = {
          id: videoId,
          title: "React.js Advanced Concepts",
          description: "Deep dive into advanced React concepts",
          thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
          duration: "PT45M30S",
          publishedAt: "2024-01-20T10:00:00Z",
          channelTitle: "React Academy",
          channelId: "UCReactAcademy",
          viewCount: 250000,
          likeCount: 8500,
          tags: ["react", "advanced", "javascript", "tutorial"]
        }
        
        const mockPlaylist: YouTubePlaylist = {
          id: "single-video",
          title: mockVideo.title,
          description: mockVideo.description,
          thumbnail: mockVideo.thumbnail,
          channelTitle: mockVideo.channelTitle,
          channelId: mockVideo.channelId,
          itemCount: 1,
          publishedAt: mockVideo.publishedAt,
          privacy: "public",
          videos: [mockVideo]
        }
        
        setPlaylist(mockPlaylist)
        setVideoSelections([{
          video: mockVideo,
          selected: true,
          course: videoToCourse(mockVideo, mockPlaylist)
        }])
        setEstimatedHours(0.75)
      }
      
      toast({ title: "Successfully loaded YouTube content!" })
    } catch (error: any) {
      toast({ 
        title: "Failed to load YouTube content", 
        description: error.message,
        variant: "destructive" 
      })
    } finally {
      setLoading(false)
    }
  }, [url, toast])

  const videoToCourse = (video: YouTubeVideo, playlist: YouTubePlaylist): Course => {
    const tags = [
      ...(video.tags || []),
      ...(customTags.split(',').map(t => t.trim()).filter(t => t)),
      'youtube',
      'video'
    ]

    return {
      id: generateId(),
      title: video.title,
      description: video.description,
      url: `https://www.youtube.com/watch?v=${video.id}`,
      tags: Array.from(new Set(tags)),
      status: "planned",
      image: video.thumbnail,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      estimatedHours: parseDurationToHours(video.duration),
      completedHours: 0,
      modules: [],
      notes: "",
      provider: "YouTube",
      author: video.channelTitle,
      level: "intermediate",
      language: "en"
    }
  }

  const parseDurationToHours = (duration: string): number => {
    const formatted = YouTubeParser.formatDuration(duration)
    const parts = formatted.split(':').map(Number)
    if (parts.length === 2) {
      return Math.round((parts[0] + parts[1] / 60) / 60 * 100) / 100
    } else if (parts.length === 3) {
      return Math.round((parts[0] + parts[1] / 60 + parts[2] / 3600) * 100) / 100
    }
    return 0
  }

  const filteredAndSortedVideos = useMemo(() => {
    let filtered = videoSelections.filter(selection => {
      const video = selection.video
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        if (!video.title.toLowerCase().includes(query) && 
            !video.description.toLowerCase().includes(query) &&
            !video.channelTitle.toLowerCase().includes(query)) {
          return false
        }
      }
      
      // Duration filter
      if (filterBy !== 'all') {
        const duration = YouTubeParser.formatDuration(video.duration)
        const [minutes] = duration.split(':').map(Number)
        
        switch (filterBy) {
          case 'short':
            if (minutes > 10) return false
            break
          case 'medium':
            if (minutes <= 10 || minutes > 30) return false
            break
          case 'long':
            if (minutes <= 30) return false
            break
        }
      }
      
      return true
    })
    
    // Sort
    filtered.sort((a, b) => {
      const videoA = a.video
      const videoB = b.video
      let comparison = 0
      
      switch (sortBy) {
        case 'title':
          comparison = videoA.title.localeCompare(videoB.title)
          break
        case 'duration':
          const durationA = YouTubeParser.formatDuration(videoA.duration)
          const durationB = YouTubeParser.formatDuration(videoB.duration)
          const minutesA = parseInt(durationA.split(':')[0])
          const minutesB = parseInt(durationB.split(':')[0])
          comparison = minutesA - minutesB
          break
        case 'views':
          comparison = (videoA.viewCount || 0) - (videoB.viewCount || 0)
          break
        case 'date':
          comparison = new Date(videoA.publishedAt).getTime() - new Date(videoB.publishedAt).getTime()
          break
        default: // 'order'
          comparison = 0
      }
      
      return sortOrder === 'desc' ? -comparison : comparison
    })
    
    return filtered
  }, [videoSelections, searchQuery, filterBy, sortBy, sortOrder])

  const handleSelectAll = useCallback((checked: boolean) => {
    setSelectAll(checked)
    setVideoSelections(prev => prev.map(selection => ({
      ...selection,
      selected: checked
    })))
  }, [])

  const handleVideoSelect = useCallback((videoId: string, selected: boolean) => {
    setVideoSelections(prev => prev.map(selection => 
      selection.video.id === videoId 
        ? { ...selection, selected }
        : selection
    ))
  }, [])

  const handleImport = useCallback(() => {
    const selectedCourses = videoSelections
      .filter(selection => selection.selected && selection.course)
      .map(selection => selection.course!)
    
    if (selectedCourses.length === 0) {
      toast({ title: "No videos selected", description: "Please select at least one video to import", variant: "destructive" })
      return
    }
    
    onImport(selectedCourses)
    onOpenChange(false)
    
    // Reset state
    setUrl("")
    setPlaylist(null)
    setVideoSelections([])
    setSearchQuery("")
    setCustomTags("")
    
    toast({ 
      title: "Import successful!", 
      description: `Imported ${selectedCourses.length} videos as courses` 
    })
  }, [videoSelections, onImport, onOpenChange, toast])

  const selectedCount = videoSelections.filter(s => s.selected).length
  const totalDuration = videoSelections
    .filter(s => s.selected)
    .reduce((acc, s) => acc + parseDurationToHours(s.video.duration), 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Youtube className="h-5 w-5 text-red-500" />
            YouTube Playlist Importer
          </DialogTitle>
          <DialogDescription>
            Import YouTube playlists, videos, or channels as learning courses
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 flex-1 min-h-0">
          {/* URL Input */}
          <div className="space-y-2">
            <Label htmlFor="youtube-url">YouTube URL</Label>
            <div className="flex gap-2">
              <Input
                id="youtube-url"
                placeholder="https://www.youtube.com/playlist?list=..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={loading}
              />
              <Button onClick={parseUrl} disabled={loading || !url.trim()}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Load"}
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">
              Supports: Playlists, individual videos, and channel URLs
            </div>
          </div>

          {playlist && (
            <Tabs defaultValue="videos" className="flex-1 flex flex-col min-h-0">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="videos">Videos ({playlist.videos.length})</TabsTrigger>
                <TabsTrigger value="settings">Import Settings</TabsTrigger>
                <TabsTrigger value="preview">Preview ({selectedCount})</TabsTrigger>
              </TabsList>

              <TabsContent value="videos" className="flex-1 flex flex-col min-h-0 space-y-4">
                {/* Playlist Info */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-4">
                      <img 
                        src={playlist.thumbnail} 
                        alt={playlist.title}
                        className="w-20 h-15 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg">{playlist.title}</CardTitle>
                        <CardDescription className="line-clamp-2">
                          {playlist.description}
                        </CardDescription>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {playlist.channelTitle}
                          </span>
                          <span className="flex items-center gap-1">
                            <Play className="h-3 w-3" />
                            {playlist.itemCount} videos
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            ~{estimatedHours}h total
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                {/* Controls */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={selectAll}
                      onCheckedChange={handleSelectAll}
                    />
                    <Label>Select All ({playlist.videos.length})</Label>
                  </div>
                  
                  <div className="flex gap-2 flex-1">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Search videos..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    
                    <Select value={filterBy} onValueChange={(value: FilterOption) => setFilterBy(value)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Duration</SelectItem>
                        <SelectItem value="short">Short (≤10m)</SelectItem>
                        <SelectItem value="medium">Medium (10-30m)</SelectItem>
                        <SelectItem value="long">Long (>30m)</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
                      const [sort, order] = value.split('-') as [SortOption, 'asc' | 'desc']
                      setSortBy(sort)
                      setSortOrder(order)
                    }}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="order-asc">Original Order</SelectItem>
                        <SelectItem value="title-asc">Title A-Z</SelectItem>
                        <SelectItem value="title-desc">Title Z-A</SelectItem>
                        <SelectItem value="duration-asc">Shortest First</SelectItem>
                        <SelectItem value="duration-desc">Longest First</SelectItem>
                        <SelectItem value="views-desc">Most Views</SelectItem>
                        <SelectItem value="date-desc">Newest First</SelectItem>
                        <SelectItem value="date-asc">Oldest First</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Video List */}
                <ScrollArea className="flex-1 border rounded-md">
                  <div className="p-4 space-y-3">
                    {filteredAndSortedVideos.map((selection) => (
                      <Card key={selection.video.id} className={`transition-colors ${selection.selected ? 'ring-2 ring-primary' : ''}`}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <Checkbox
                              checked={selection.selected}
                              onCheckedChange={(checked) => handleVideoSelect(selection.video.id, !!checked)}
                            />
                            
                            <img 
                              src={selection.video.thumbnail}
                              alt={selection.video.title}
                              className="w-32 h-18 object-cover rounded flex-shrink-0"
                            />
                            
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium line-clamp-2 mb-1">
                                {selection.video.title}
                              </h4>
                              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                {selection.video.description}
                              </p>
                              
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {YouTubeParser.formatDuration(selection.video.duration)}
                                </span>
                                {selection.video.viewCount && (
                                  <span className="flex items-center gap-1">
                                    <Eye className="h-3 w-3" />
                                    {YouTubeParser.formatViewCount(selection.video.viewCount)}
                                  </span>
                                )}
                                {selection.video.likeCount && (
                                  <span className="flex items-center gap-1">
                                    <ThumbsUp className="h-3 w-3" />
                                    {selection.video.likeCount.toLocaleString()}
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(selection.video.publishedAt).toLocaleDateString()}
                                </span>
                              </div>
                              
                              {selection.video.tags && selection.video.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {selection.video.tags.slice(0, 4).map((tag) => (
                                    <Badge key={tag} variant="outline" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                  {selection.video.tags.length > 4 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{selection.video.tags.length - 4}
                                    </Badge>
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
              </TabsContent>

              <TabsContent value="settings" className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Import Options</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="custom-tags">Additional Tags</Label>
                        <Input
                          id="custom-tags"
                          placeholder="react, tutorial, beginner"
                          value={customTags}
                          onChange={(e) => setCustomTags(e.target.value)}
                        />
                        <div className="text-xs text-muted-foreground">
                          Comma-separated tags to add to all imported courses
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="group-series"
                          checked={groupBySeries}
                          onCheckedChange={setGroupBySeries}
                        />
                        <Label htmlFor="group-series" className="text-sm">
                          Group as series
                        </Label>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Import Statistics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Total Videos:</span>
                        <span>{playlist.videos.length}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Selected:</span>
                        <span>{selectedCount}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Total Duration:</span>
                        <span>~{totalDuration.toFixed(1)}h</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Channel:</span>
                        <span>{playlist.channelTitle}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="preview" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Import Preview</CardTitle>
                    <CardDescription>
                      {selectedCount} videos will be imported as individual courses
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-64">
                      <div className="space-y-2">
                        {videoSelections
                          .filter(s => s.selected)
                          .map((selection) => (
                            <div key={selection.video.id} className="flex items-center gap-3 p-2 border rounded">
                              <BookOpen className="h-4 w-4 text-muted-foreground" />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium truncate">
                                  {selection.video.title}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {YouTubeParser.formatDuration(selection.video.duration)} • YouTube • {selection.video.channelTitle}
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}

          {/* Footer */}
          <Separator />
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {playlist && `${selectedCount} of ${playlist.videos.length} videos selected`}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleImport}
                disabled={!playlist || selectedCount === 0}
              >
                <Download className="mr-2 h-4 w-4" />
                Import {selectedCount} Courses
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}