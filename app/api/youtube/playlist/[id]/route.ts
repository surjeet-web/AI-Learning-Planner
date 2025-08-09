import { NextRequest, NextResponse } from "next/server"

// Mock YouTube API implementation
// In production, you would use the actual YouTube Data API v3

const MOCK_PLAYLISTS: Record<string, any> = {
  "PLrAXtmRdnEQy4Qy9RMp2QVXyBb-OLkWxq": {
    id: "PLrAXtmRdnEQy4Qy9RMp2QVXyBb-OLkWxq",
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
      }
    ]
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const playlistId = params.id
    
    // In production, you would make an actual API call to YouTube
    // const response = await fetch(
    //   `https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&id=${playlistId}&key=${process.env.YOUTUBE_API_KEY}`
    // )
    
    // Mock response for demo
    const playlist = MOCK_PLAYLISTS[playlistId]
    
    if (!playlist) {
      return NextResponse.json(
        { error: "Playlist not found" },
        { status: 404 }
      )
    }
    
    return NextResponse.json(playlist)
  } catch (error) {
    console.error("YouTube playlist fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch playlist" },
      { status: 500 }
    )
  }
}