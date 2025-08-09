import { NextRequest, NextResponse } from "next/server"

const MOCK_VIDEOS: Record<string, any> = {
  "bMknfKXIFA8": {
    id: "bMknfKXIFA8",
    title: "React.js Tutorial #1 - Introduction",
    description: "Introduction to React.js and setting up your development environment. In this tutorial, we'll cover the basics of React and get you started with your first React application.",
    thumbnail: "https://img.youtube.com/vi/bMknfKXIFA8/mqdefault.jpg",
    duration: "PT15M30S",
    publishedAt: "2024-01-15T10:00:00Z",
    channelTitle: "React Academy",
    channelId: "UCReactAcademy",
    viewCount: 125000,
    likeCount: 3200,
    tags: ["react", "javascript", "tutorial", "beginner", "web development"]
  },
  "SqcY0GlETPk": {
    id: "SqcY0GlETPk",
    title: "React.js Tutorial #2 - Components",
    description: "Understanding React components and JSX syntax. Learn how to create reusable components and understand the component lifecycle.",
    thumbnail: "https://img.youtube.com/vi/SqcY0GlETPk/mqdefault.jpg",
    duration: "PT22M45S",
    publishedAt: "2024-01-16T10:00:00Z",
    channelTitle: "React Academy",
    channelId: "UCReactAcademy",
    viewCount: 98000,
    likeCount: 2800,
    tags: ["react", "components", "jsx", "tutorial", "frontend"]
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const videoId = params.id
    
    // Mock response for demo
    const video = MOCK_VIDEOS[videoId]
    
    if (!video) {
      return NextResponse.json(
        { error: "Video not found" },
        { status: 404 }
      )
    }
    
    return NextResponse.json(video)
  } catch (error) {
    console.error("YouTube video fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch video" },
      { status: 500 }
    )
  }
}