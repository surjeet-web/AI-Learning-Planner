"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BulkAddCoursesDialog } from "./bulk-add-courses-dialog"
import { Upload, BookOpen, Zap, Shield, BarChart3 } from "lucide-react"

export function BulkImportDemo() {
  const [open, setOpen] = useState(false)

  const features = [
    {
      icon: <Zap className="h-5 w-5 text-yellow-500" />,
      title: "Smart Batch Processing",
      description: "Processes URLs in optimized batches to avoid rate limits and ensure reliability."
    },
    {
      icon: <Shield className="h-5 w-5 text-green-500" />,
      title: "Error Handling & Retry",
      description: "Automatic retry for failed requests with detailed error reporting."
    },
    {
      icon: <BarChart3 className="h-5 w-5 text-blue-500" />,
      title: "Real-time Progress",
      description: "Live progress tracking with detailed status for each URL."
    },
    {
      icon: <BookOpen className="h-5 w-5 text-purple-500" />,
      title: "Multi-platform Support",
      description: "Works with Udemy, Coursera, YouTube, edX, Khan Academy, and more."
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Bulk Course Import
        </CardTitle>
        <CardDescription>
          Import multiple courses at once with our enhanced bulk importer
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start gap-3 p-3 rounded-lg border bg-muted/50">
              {feature.icon}
              <div>
                <h4 className="text-sm font-medium">{feature.title}</h4>
                <p className="text-xs text-muted-foreground">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="pt-2">
          <Button onClick={() => setOpen(true)} className="w-full">
            <Upload className="mr-2 h-4 w-4" />
            Try Bulk Import
          </Button>
        </div>

        <BulkAddCoursesDialog
          open={open}
          onOpenChange={setOpen}
          onAdded={(courses) => {
            console.log('Imported courses:', courses)
            // Handle the imported courses here
          }}
        />
      </CardContent>
    </Card>
  )
}