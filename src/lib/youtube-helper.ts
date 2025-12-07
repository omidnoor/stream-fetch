import { Innertube, UniversalCache } from 'youtubei.js'
import * as path from "path"
import * as fs from "fs"

const CACHE_DIR = path.join(process.cwd(), '.cache')

// Ensure cache directory exists
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true })
}

export interface YoutubeOptions {
  useAndroidClient?: boolean
  useIOSClient?: boolean
  useTVClient?: boolean
}

export interface VideoFormat {
  itag: number
  url: string
  mimeType: string
  quality: string
  qualityLabel?: string
  hasAudio: boolean
  hasVideo: boolean
  contentLength?: string
  approxDurationMs?: string
  fps?: number
}

export interface VideoInfo {
  title: string
  videoId: string
  formats: VideoFormat[]
  streamingData: any
  videoDetails: {
    title: string
    videoId: string
    thumbnails: Array<{ url: string; width: number; height: number }>
    lengthSeconds: string
    author: {
      name: string
      id: string
    }
    viewCount: string
  }
}

export async function getVideoInfoWithFallback(url: string, options: YoutubeOptions = {}): Promise<VideoInfo> {
  const strategies = []

  // Extract video ID from URL
  const videoId = extractVideoId(url)
  if (!videoId) {
    throw new Error('Invalid YouTube URL')
  }

  // Strategy 1: Try Android client (usually works best)
  if (options.useAndroidClient !== false) {
    strategies.push({
      name: 'Android Client',
      fn: async () => {
        const yt = await Innertube.create({
          cache: new UniversalCache(false),
          generate_session_locally: true
        })
        // Use actions.execute to specify ANDROID client
        const playerData = await yt.actions.execute('/player', {
          videoId,
          client: 'ANDROID',
          parse: true
        })
        return playerData
      }
    })
  }

  // Strategy 2: Try iOS client
  if (options.useIOSClient !== false) {
    strategies.push({
      name: 'iOS Client',
      fn: async () => {
        const yt = await Innertube.create({
          cache: new UniversalCache(false),
          generate_session_locally: true
        })
        const playerData = await yt.actions.execute('/player', {
          videoId,
          client: 'IOS',
          parse: true
        })
        return playerData
      }
    })
  }

  // Strategy 3: Try TV Embedded client
  if (options.useTVClient !== false) {
    strategies.push({
      name: 'TV Client',
      fn: async () => {
        const yt = await Innertube.create({
          cache: new UniversalCache(false),
          generate_session_locally: true
        })
        const playerData = await yt.actions.execute('/player', {
          videoId,
          client: 'TV_EMBEDDED',
          parse: true
        })
        return playerData
      }
    })
  }

  // Strategy 4: Regular web client as last resort
  strategies.push({
    name: 'Web Client',
    fn: async () => {
      const yt = await Innertube.create({
        cache: new UniversalCache(false),
        generate_session_locally: true
      })
      return await yt.getInfo(videoId)
    }
  })

  let lastError: Error | null = null

  for (const strategy of strategies) {
    try {
      console.log(`[YouTube Helper] Trying strategy: ${strategy.name}`)
      const info = await strategy.fn()
      console.log(`[YouTube Helper] ✅ Success with: ${strategy.name}`)

      // Convert youtubei.js format to our normalized format
      return await normalizeVideoInfo(info)
    } catch (error) {
      console.log(`[YouTube Helper] ❌ Failed with ${strategy.name}:`, error)
      lastError = error as Error
      // Continue to next strategy
    }
  }

  // All strategies failed
  throw lastError || new Error('All strategies failed')
}

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/ // Direct video ID
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) {
      return match[1]
    }
  }

  return null
}

async function normalizeVideoInfo(info: any): Promise<VideoInfo> {
  const formats: VideoFormat[] = []

  // Handle both getInfo() response and actions.execute('/player') response
  const streamingData = info.streaming_data || info.streamingData
  const videoDetails = info.videoDetails || info.video_details

  // Debug: See what's in videoDetails
  if (videoDetails) {
    console.log('[YouTube Helper] video_details keys:', Object.keys(videoDetails))
  }

  // Extract thumbnails from various possible locations
  let thumbnails = []
  if (info.basic_info?.thumbnail) {
    console.log('[YouTube Helper] Using basic_info.thumbnail')
    thumbnails = info.basic_info.thumbnail
  } else if (videoDetails?.thumbnail?.thumbnails) {
    console.log('[YouTube Helper] Using videoDetails.thumbnail.thumbnails')
    thumbnails = videoDetails.thumbnail.thumbnails
  } else if (videoDetails?.thumbnail) {
    console.log('[YouTube Helper] Using videoDetails.thumbnail')
    thumbnails = videoDetails.thumbnail
  } else if (videoDetails?.thumbnails) {
    console.log('[YouTube Helper] Using videoDetails.thumbnails')
    thumbnails = videoDetails.thumbnails
  }

  console.log('[YouTube Helper] Thumbnails array:', thumbnails)

  const basicInfo = info.basic_info || {
    title: videoDetails?.title,
    id: videoDetails?.videoId || videoDetails?.video_id,
    author: videoDetails?.author?.name || videoDetails?.author,
    channel_id: videoDetails?.channelId || videoDetails?.channel_id,
    thumbnail: thumbnails,
    duration: videoDetails?.lengthSeconds || videoDetails?.length_seconds,
    view_count: videoDetails?.viewCount || videoDetails?.view_count
  }

  if (!streamingData) {
    throw new Error('No streaming data available')
  }

  // Process combined formats (video + audio)
  if (streamingData.formats) {
    for (const format of streamingData.formats) {
      const url = typeof format.decipher === 'function'
        ? await format.decipher(info.session?.player)
        : (format.url || '')

      formats.push({
        itag: format.itag,
        url,
        mimeType: format.mime_type || format.mimeType || '',
        quality: format.quality || '',
        qualityLabel: format.quality_label || format.qualityLabel,
        hasAudio: true, // Combined formats have both
        hasVideo: true,
        contentLength: format.content_length || format.contentLength,
        approxDurationMs: format.approx_duration_ms || format.approxDurationMs,
        fps: format.fps || null
      })
    }
  }

  // Also include adaptive formats for more options
  if (streamingData.adaptive_formats || streamingData.adaptiveFormats) {
    const adaptiveFormats = streamingData.adaptive_formats || streamingData.adaptiveFormats
    for (const format of adaptiveFormats) {
      const url = typeof format.decipher === 'function'
        ? await format.decipher(info.session?.player)
        : (format.url || '')

      formats.push({
        itag: format.itag,
        url,
        mimeType: format.mime_type || format.mimeType || '',
        quality: format.quality || '',
        qualityLabel: format.quality_label || format.qualityLabel,
        hasAudio: format.has_audio || format.hasAudio || false,
        hasVideo: format.has_video || format.hasVideo || false,
        contentLength: format.content_length || format.contentLength,
        approxDurationMs: format.approx_duration_ms || format.approxDurationMs,
        fps: format.fps || null
      })
    }
  }

  return {
    title: basicInfo.title || 'Unknown',
    videoId: basicInfo.id || basicInfo.videoId || '',
    formats,
    streamingData,
    videoDetails: {
      title: basicInfo.title || 'Unknown',
      videoId: basicInfo.id || basicInfo.videoId || '',
      thumbnails: (basicInfo.thumbnail || []).map((t: any) => ({
        url: t.url,
        width: t.width,
        height: t.height
      })),
      lengthSeconds: basicInfo.duration?.toString() || '0',
      author: {
        name: basicInfo.author || 'Unknown',
        id: basicInfo.channel_id || basicInfo.channelId || ''
      },
      viewCount: basicInfo.view_count?.toString() || basicInfo.viewCount?.toString() || '0'
    }
  }
}

export function validateURL(url: string): boolean {
  return extractVideoId(url) !== null
}

export function chooseFormat(formats: VideoFormat[], options: { quality?: 'highest' | 'lowest' } = {}): VideoFormat | undefined {
  // Filter for formats that have both audio and video
  const combinedFormats = formats.filter(f => f.hasAudio && f.hasVideo)

  if (combinedFormats.length === 0) {
    return undefined
  }

  if (options.quality === 'lowest') {
    return combinedFormats[combinedFormats.length - 1]
  }

  // Default to highest quality
  return combinedFormats[0]
}
