"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  FileText, 
  Upload, 
  Download, 
  Rss, 
  Globe, 
  BookOpen, 
  Video, 
  Headphones,
  FileSpreadsheet,
  Calendar,
  Link2,
  Zap,
  Settings,
  Filter,
  Tag,
  Clock,
  Users,
  Star
} from "lucide-react"

type ImportSource = 'csv' | 'json' | 'rss' | 'opml' | 'bookmarks' | 'calendar'

export function AdvancedImportFeatures() {
  const [selectedSource, setSelectedSource] = useState<ImportSource>('csv')
  const [autoTagging, setAutoTagging] = useState(true)
  const [duplicateDetection, setDuplicateDetection] = useState(true)
  const [contentAnalysis, setContentAnalysis] = useState(false)

  const importSources = [
    {
      id: 'csv' as ImportSource,
      title: 'CSV/Excel Import',
      description: 'Import from spreadsheets with custom field mapping',
      icon: <FileSpreadsheet className="h-5 w-5 text-green-500" />,
      features: ['Custom field mapping', 'Bulk validation', 'Preview before import']
    },
    {
      id: 'json' as ImportSource,
      title: 'JSON Import',
      description: 'Import structured course data from JSON files',
      icon: <FileText className="h-5 w-5 text-blue-500" />,
      features: ['Schema validation', 'Nested data support', 'Batch processing']
    },
    {
      id: 'rss' as ImportSource,
      title: 'RSS/Atom Feeds',
      description: 'Subscribe to course feeds and auto-import new content',
      icon: <Rss className="h-5 w-5 text-orange-500" />,
      features: ['Auto-sync', 'Feed monitoring', 'Content filtering']
    },
    {
      id: 'opml' as ImportSource,
      title: 'OPML Import',
      description: 'Import podcast subscriptions and learning feeds',
      icon: <Headphones className="h-5 w-5 text-purple-500" />,
      features: ['Podcast support', 'Category preservation', 'Bulk subscription']
    },
    {
      id: 'bookmarks' as ImportSource,
      title: 'Browser Bookmarks',
      description: 'Import learning bookmarks from your browser',
      icon: <Globe className="h-5 w-5 text-cyan-500" />,
      features: ['Multi-browser support', 'Folder structure', 'Auto-categorization']
    },
    {
      id: 'calendar' as ImportSource,
      title: 'Calendar Integration',
      description: 'Import scheduled learning sessions and events',
      icon: <Calendar className="h-5 w-5 text-red-500" />,
      features: ['iCal support', 'Recurring events', 'Time blocking']
    }
  ]

  const advancedFeatures = [
    {
      title: 'AI Content Analysis',
      description: 'Automatically analyze course content and extract key topics',
      icon: <Zap className="h-4 w-4 text-yellow-500" />,
      enabled: contentAnalysis,
      onToggle: setContentAnalysis
    },
    {
      title: 'Smart Auto-Tagging',
      description: 'Generate relevant tags based on content and metadata',
      icon: <Tag className="h-4 w-4 text-green-500" />,
      enabled: autoTagging,
      onToggle: setAutoTagging
    },
    {
      title: 'Duplicate Detection',
      description: 'Identify and merge duplicate courses automatically',
      icon: <Filter className="h-4 w-4 text-blue-500" />,
      enabled: duplicateDetection,
      onToggle: setDuplicateDetection
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Advanced Import Options</h3>
        <p className="text-muted-foreground text-sm">
          Import courses from various sources with intelligent processing
        </p>
      </div>

      <Tabs value={selectedSource} onValueChange={(value) => setSelectedSource(value as ImportSource)}>
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
          {importSources.map((source) => (
            <TabsTrigger key={source.id} value={source.id} className="text-xs">
              {source.icon}
            </TabsTrigger>
          ))}
        </TabsList>

        {importSources.map((source) => (
          <TabsContent key={source.id} value={source.id} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {source.icon}
                  {source.title}
                </CardTitle>
                <CardDescription>{source.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {source.features.map((feature) => (
                    <Badge key={feature} variant="secondary" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>

                {source.id === 'csv' && (
                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="csv-file">CSV File</Label>
                        <Input id="csv-file" type="file" accept=".csv,.xlsx,.xls" />
                      </div>
                      <div>
                        <Label htmlFor="delimiter">Delimiter</Label>
                        <Select defaultValue="comma">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="comma">Comma (,)</SelectItem>
                            <SelectItem value="semicolon">Semicolon (;)</SelectItem>
                            <SelectItem value="tab">Tab</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Expected columns: Title, URL, Description, Tags, Provider, Level
                    </div>
                  </div>
                )}

                {source.id === 'json' && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="json-file">JSON File</Label>
                      <Input id="json-file" type="file" accept=".json" />
                    </div>
                    <div>
                      <Label htmlFor="json-schema">Schema Validation</Label>
                      <Select defaultValue="auto">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="auto">Auto-detect</SelectItem>
                          <SelectItem value="custom">Custom schema</SelectItem>
                          <SelectItem value="none">No validation</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {source.id === 'rss' && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="rss-url">RSS/Atom Feed URL</Label>
                      <Input 
                        id="rss-url" 
                        placeholder="https://example.com/courses.rss"
                        type="url"
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="sync-interval">Sync Interval</Label>
                        <Select defaultValue="daily">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hourly">Hourly</SelectItem>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="manual">Manual only</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="max-items">Max Items</Label>
                        <Input id="max-items" type="number" defaultValue="50" min="1" max="500" />
                      </div>
                    </div>
                  </div>
                )}

                {source.id === 'opml' && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="opml-file">OPML File</Label>
                      <Input id="opml-file" type="file" accept=".opml,.xml" />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="preserve-categories" defaultChecked />
                      <Label htmlFor="preserve-categories">Preserve categories as tags</Label>
                    </div>
                  </div>
                )}

                {source.id === 'bookmarks' && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="bookmarks-file">Bookmarks File</Label>
                      <Input id="bookmarks-file" type="file" accept=".html,.json" />
                    </div>
                    <div>
                      <Label htmlFor="folder-filter">Filter by Folder</Label>
                      <Input 
                        id="folder-filter" 
                        placeholder="Learning, Courses, Tutorials"
                      />
                    </div>
                  </div>
                )}

                {source.id === 'calendar' && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="ical-file">iCal File (.ics)</Label>
                      <Input id="ical-file" type="file" accept=".ics" />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="event-filter">Event Filter</Label>
                        <Input 
                          id="event-filter" 
                          placeholder="course, learning, study"
                        />
                      </div>
                      <div>
                        <Label htmlFor="date-range">Date Range</Label>
                        <Select defaultValue="future">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All events</SelectItem>
                            <SelectItem value="future">Future only</SelectItem>
                            <SelectItem value="past">Past only</SelectItem>
                            <SelectItem value="custom">Custom range</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}

                <Button className="w-full">
                  <Upload className="mr-2 h-4 w-4" />
                  Import from {source.title}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Advanced Processing Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Processing Options
          </CardTitle>
          <CardDescription>
            Configure how imported content is processed and enhanced
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {advancedFeatures.map((feature) => (
            <div key={feature.title} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                {feature.icon}
                <div>
                  <h4 className="text-sm font-medium">{feature.title}</h4>
                  <p className="text-xs text-muted-foreground">{feature.description}</p>
                </div>
              </div>
              <Switch
                checked={feature.enabled}
                onCheckedChange={feature.onToggle}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Import Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Import Templates
          </CardTitle>
          <CardDescription>
            Download templates for different import formats
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              CSV Template
            </Button>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              JSON Schema
            </Button>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              OPML Example
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}