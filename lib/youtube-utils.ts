export interface YouTubeVideo {
  id: string
  title: string
  description: string
  thumbnail: string
  duration: string
  publishedAt: string
  channelTitle: string
  channelId: string
  viewCount?: number
  likeCount?: number
  tags?: string[]
}

export interface YouTubePlaylist {
  id: string
  title: string
  description: string
  thumbnail: string
  channelTitle: string
  channelId: string
  itemCount: number
  videos: YouTubeVideo[]
  publishedAt: string
  privacy: 'public' | 'unlisted' | 'private'
}

export interface YouTubeChannel {
  id: string
  title: string
  description: string
  thumbnail: string
  subscriberCount?: number
  videoCount?: number
  customUrl?: string
}

export class YouTubeParser {
  private static readonly PLAYLIST_REGEX = /(?:youtube\.com\/(?:playlist\?list=|watch\?.*&list=)|youtu\.be\/.*\?.*list=)([a-zA-Z0-9_-]+)/
  private static readonly VIDEO_REGEX = /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  private static readonly CHANNEL_REGEX = /youtube\.com\/(?:channel\/([a-zA-Z0-9_-]+)|c\/([a-zA-Z0-9_-]+)|user\/([a-zA-Z0-9_-]+)|@([a-zA-Z0-9_-]+))/

  static extractPlaylistId(url: string): string | null {
    const match = url.match(this.PLAYLIST_REGEX)
    return match ? match[1] : null
  }

  static extractVideoId(url: string): string | null {
    const match = url.match(this.VIDEO_REGEX)
    return match ? match[1] : null
  }

  static extractChannelId(url: string): string | null {
    const match = url.match(this.CHANNEL_REGEX)
    return match ? (match[1] || match[2] || match[3] || match[4]) : null
  }

  static isPlaylistUrl(url: string): boolean {
    return this.PLAYLIST_REGEX.test(url)
  }

  static isVideoUrl(url: string): boolean {
    return this.VIDEO_REGEX.test(url)
  }

  static isChannelUrl(url: string): boolean {
    return this.CHANNEL_REGEX.test(url)
  }

  static getUrlType(url: string): 'playlist' | 'video' | 'channel' | 'unknown' {
    if (this.isPlaylistUrl(url)) return 'playlist'
    if (this.isVideoUrl(url)) return 'video'
    if (this.isChannelUrl(url)) return 'channel'
    return 'unknown'
  }

  static formatDuration(duration: string): string {
    // Convert ISO 8601 duration (PT4M13S) to readable format (4:13)
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
    if (!match) return '0:00'
    
    const hours = parseInt(match[1] || '0')
    const minutes = parseInt(match[2] || '0')
    const seconds = parseInt(match[3] || '0')
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  static formatViewCount(count: number): string {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M views`
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K views`
    }
    return `${count} views`
  }

  static generateThumbnailUrl(videoId: string, quality: 'default' | 'medium' | 'high' | 'standard' | 'maxres' = 'medium'): string {
    const qualityMap = {
      default: 'default',
      medium: 'mqdefault',
      high: 'hqdefault',
      standard: 'sddefault',
      maxres: 'maxresdefault'
    }
    return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}.jpg`
  }
}

export async function fetchYouTubePlaylist(playlistId: string): Promise<YouTubePlaylist> {
  // This would typically use YouTube Data API v3
  // For demo purposes, we'll simulate the response
  const response = await fetch(`/api/youtube/playlist/${playlistId}`)
  
  if (!response.ok) {
    throw new Error(`Failed to fetch playlist: ${response.statusText}`)
  }
  
  return response.json()
}

export async function fetchYouTubeVideo(videoId: string): Promise<YouTubeVideo> {
  const response = await fetch(`/api/youtube/video/${videoId}`)
  
  if (!response.ok) {
    throw new Error(`Failed to fetch video: ${response.statusText}`)
  }
  
  return response.json()
}

export async function fetchYouTubeChannel(channelId: string): Promise<YouTubeChannel> {
  const response = await fetch(`/api/youtube/channel/${channelId}`)
  
  if (!response.ok) {
    throw new Error(`Failed to fetch channel: ${response.statusText}`)
  }
  
  return response.json()
}