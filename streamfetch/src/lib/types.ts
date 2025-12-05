/**
 * EDUCATIONAL NOTE: TypeScript Types
 *
 * Defining types helps us:
 * - Catch errors at compile time instead of runtime
 * - Get better IDE autocomplete
 * - Document our data structures
 * - Ensure API consistency between frontend and backend
 */

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

/**
 * EDUCATIONAL NOTE: Type Safety Benefits
 *
 * With these types, TypeScript will:
 * - Warn us if we try to access a property that doesn't exist
 * - Ensure we handle both success and error cases
 * - Prevent typos in property names
 * - Make refactoring safer
 *
 * Example:
 * const response: VideoInfoResponse = await fetch(...)
 * response.data.video.title // ✅ TypeScript knows this exists
 * response.data.video.foo   // ❌ TypeScript error: property doesn't exist
 */
