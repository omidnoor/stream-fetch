export interface VideoDetails {
  title: string
  thumbnail: string
  duration: number // in seconds
  author: string
  viewCount: string
}

export interface VideoFormat {
  itag: number // YouTube's format identifier
  quality: string // "1080p", "720p", etc.
  container: string // "mp4", "webm", etc.
  hasAudio: boolean
  hasVideo: boolean
  filesize: number | null
  fps: number | null
  codec: string | null
}

export interface VideoInfoResponse {
  success: boolean
  data?: {
    video: VideoDetails
    formats: VideoFormat[]
  }
  error?: string
  details?: string
}

export interface DownloadRequest {
  url: string
  itag?: number
}
