# Implementation Example: Service Layer Pattern

This document shows a **practical, step-by-step example** of refactoring the current YouTube integration to use the service layer pattern.

## Before: Current Structure

Currently, business logic is embedded directly in API routes:

```
src/app/api/video-info/route.ts  (206 lines)
├── Input validation
├── Business logic (getVideoInfoWithFallback)
├── Data transformation
├── Error handling
└── Response formatting
```

**Problems:**
- Can't unit test business logic without mocking Next.js
- Logic can't be reused elsewhere
- Hard to add caching, logging, etc.

## After: Service Layer Structure

```
src/
├── app/api/video-info/
│   └── route.ts                 (40 lines - just HTTP layer)
├── services/youtube/
│   ├── youtube.service.ts       (Core business logic)
│   ├── youtube.repository.ts    (Data fetching)
│   ├── youtube.validator.ts     (Validation logic)
│   └── youtube.mapper.ts        (Data transformation)
├── lib/
│   ├── cache/
│   │   └── cache.interface.ts
│   └── logger/
│       └── logger.ts
```

---

## Step-by-Step Implementation

### Step 1: Create Service Interface

First, define what the service should do:

```typescript
// src/services/youtube/youtube.service.interface.ts

export interface IYouTubeService {
  /**
   * Get video information from YouTube
   * @throws InvalidUrlError if URL is invalid
   * @throws VideoNotFoundError if video doesn't exist
   */
  getVideoInfo(url: string): Promise<VideoInfoDto>;

  /**
   * Get direct download URL for a specific format
   */
  getDownloadUrl(url: string, itag: number): Promise<DownloadUrlDto>;
}

export interface VideoInfoDto {
  video: {
    title: string;
    thumbnail: string;
    duration: number;
    author: string;
    viewCount: string;
  };
  formats: FormatDto[];
}

export interface FormatDto {
  itag: number;
  quality: string;
  container: string;
  hasAudio: boolean;
  hasVideo: boolean;
  filesize: number | null;
  fps: number | null;
  codec: string | null;
}

export interface DownloadUrlDto {
  url: string;
  mimeType: string;
  filename: string;
  contentLength?: string;
}
```

### Step 2: Create Validator

Extract validation logic:

```typescript
// src/services/youtube/youtube.validator.ts

import { InvalidUrlError } from '@/lib/errors/youtube.errors';

export class YouTubeValidator {
  private readonly URL_PATTERNS = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/
  ];

  validateUrl(url: string): void {
    if (!url || typeof url !== 'string') {
      throw new InvalidUrlError('URL is required');
    }

    if (!this.isValidYouTubeUrl(url)) {
      throw new InvalidUrlError(url);
    }
  }

  private isValidYouTubeUrl(url: string): boolean {
    return this.URL_PATTERNS.some(pattern => pattern.test(url));
  }

  extractVideoId(url: string): string {
    for (const pattern of this.URL_PATTERNS) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    throw new InvalidUrlError(url);
  }
}
```

### Step 3: Create Repository (Data Access Layer)

Handle external API calls:

```typescript
// src/services/youtube/youtube.repository.ts

import { Innertube, UniversalCache } from 'youtubei.js';
import { logger } from '@/lib/logger';
import { VideoNotFoundError } from '@/lib/errors/youtube.errors';

export class YouTubeRepository {
  private readonly FALLBACK_CLIENTS = ['ANDROID', 'IOS', 'TV_EMBEDDED', 'WEB'] as const;

  async fetchVideoInfo(videoId: string): Promise<any> {
    let lastError: Error | null = null;

    for (const clientType of this.FALLBACK_CLIENTS) {
      try {
        logger.debug(`Attempting to fetch video with ${clientType} client`, { videoId });

        const info = await this.fetchWithClient(videoId, clientType);

        logger.info(`Successfully fetched video info`, {
          videoId,
          clientType,
          formatCount: info.formats?.length || 0
        });

        return info;

      } catch (error) {
        logger.warn(`Failed to fetch with ${clientType} client`, {
          videoId,
          clientType,
          error
        });
        lastError = error as Error;
      }
    }

    // All strategies failed
    throw new VideoNotFoundError(videoId);
  }

  private async fetchWithClient(videoId: string, clientType: string): Promise<any> {
    const yt = await Innertube.create({
      cache: new UniversalCache(false),
      generate_session_locally: true
    });

    if (clientType === 'WEB') {
      return await yt.getInfo(videoId);
    }

    return await yt.actions.execute('/player', {
      videoId,
      client: clientType as any,
      parse: true
    });
  }
}
```

### Step 4: Create Mapper (Data Transformation)

Transform external data to internal DTOs:

```typescript
// src/services/youtube/youtube.mapper.ts

import { VideoInfoDto, FormatDto } from './youtube.service.interface';

export class YouTubeMapper {
  async mapToVideoInfo(rawInfo: any): Promise<VideoInfoDto> {
    const videoDetails = this.extractVideoDetails(rawInfo);
    const formats = await this.extractFormats(rawInfo);

    return {
      video: {
        title: videoDetails.title || 'Unknown',
        thumbnail: this.extractThumbnail(rawInfo),
        duration: parseInt(videoDetails.lengthSeconds || '0'),
        author: videoDetails.author?.name || 'Unknown',
        viewCount: videoDetails.viewCount || '0',
      },
      formats: this.filterAndSortFormats(formats),
    };
  }

  private extractVideoDetails(rawInfo: any) {
    return rawInfo.videoDetails || rawInfo.video_details;
  }

  private extractThumbnail(rawInfo: any): string {
    const thumbnails =
      rawInfo.basic_info?.thumbnail ||
      rawInfo.videoDetails?.thumbnail?.thumbnails ||
      rawInfo.videoDetails?.thumbnails ||
      [];

    return thumbnails[0]?.url || '';
  }

  private async extractFormats(rawInfo: any): Promise<FormatDto[]> {
    const streamingData = rawInfo.streaming_data || rawInfo.streamingData;
    if (!streamingData) return [];

    const formats: FormatDto[] = [];
    const allFormats = [
      ...(streamingData.formats || []),
      ...(streamingData.adaptive_formats || streamingData.adaptiveFormats || [])
    ];

    for (const format of allFormats) {
      const url = typeof format.decipher === 'function'
        ? await format.decipher(rawInfo.session?.player)
        : (format.url || '');

      if (url && format.hasVideo) {
        formats.push({
          itag: format.itag,
          quality: format.quality_label || format.qualityLabel || 'unknown',
          container: this.extractContainer(format.mime_type || format.mimeType),
          hasAudio: format.has_audio || format.hasAudio || false,
          hasVideo: format.has_video || format.hasVideo || false,
          filesize: this.parseFilesize(format.content_length || format.contentLength),
          fps: format.fps || null,
          codec: format.mime_type || format.mimeType || null,
        });
      }
    }

    return formats;
  }

  private extractContainer(mimeType: string): string {
    return mimeType?.split('/')[1]?.split(';')[0] || 'mp4';
  }

  private parseFilesize(contentLength: string | undefined): number | null {
    return contentLength ? parseInt(contentLength) : null;
  }

  private filterAndSortFormats(formats: FormatDto[]): FormatDto[] {
    // Only formats with audio for direct playback
    const withAudio = formats.filter(f => f.hasAudio);

    // Sort by quality
    const qualityOrder: Record<string, number> = {
      '2160p': 5, '1440p': 4, '1080p': 3, '720p': 2, '480p': 1, '360p': 0
    };

    return withAudio
      .sort((a, b) => (qualityOrder[b.quality] || 0) - (qualityOrder[a.quality] || 0))
      .filter((format, index, self) =>
        index === self.findIndex(f => f.quality === format.quality)
      );
  }
}
```

### Step 5: Create Main Service

Orchestrate everything:

```typescript
// src/services/youtube/youtube.service.ts

import { IYouTubeService, VideoInfoDto, DownloadUrlDto } from './youtube.service.interface';
import { YouTubeValidator } from './youtube.validator';
import { YouTubeRepository } from './youtube.repository';
import { YouTubeMapper } from './youtube.mapper';
import { CacheService } from '@/lib/cache/cache.interface';
import { logger } from '@/lib/logger';

export class YouTubeService implements IYouTubeService {
  constructor(
    private readonly validator: YouTubeValidator,
    private readonly repository: YouTubeRepository,
    private readonly mapper: YouTubeMapper,
    private readonly cache?: CacheService
  ) {}

  async getVideoInfo(url: string): Promise<VideoInfoDto> {
    // 1. Validate input
    this.validator.validateUrl(url);
    const videoId = this.validator.extractVideoId(url);

    // 2. Check cache
    if (this.cache) {
      const cached = await this.cache.get<VideoInfoDto>(`video:${videoId}`);
      if (cached) {
        logger.debug('Cache hit for video info', { videoId });
        return cached;
      }
    }

    // 3. Fetch from YouTube
    logger.info('Fetching video info from YouTube', { videoId });
    const rawInfo = await this.repository.fetchVideoInfo(videoId);

    // 4. Transform data
    const videoInfo = await this.mapper.mapToVideoInfo(rawInfo);

    // 5. Cache result
    if (this.cache) {
      await this.cache.set(`video:${videoId}`, videoInfo, 3600);
    }

    return videoInfo;
  }

  async getDownloadUrl(url: string, itag: number): Promise<DownloadUrlDto> {
    this.validator.validateUrl(url);
    const videoId = this.validator.extractVideoId(url);

    const rawInfo = await this.repository.fetchVideoInfo(videoId);

    // Find the requested format
    const streamingData = rawInfo.streaming_data || rawInfo.streamingData;
    const allFormats = [
      ...(streamingData?.formats || []),
      ...(streamingData?.adaptive_formats || streamingData?.adaptiveFormats || [])
    ];

    const format = allFormats.find((f: any) => f.itag === itag);
    if (!format) {
      throw new Error(`Format with itag ${itag} not found`);
    }

    const downloadUrl = typeof format.decipher === 'function'
      ? await format.decipher(rawInfo.session?.player)
      : format.url;

    return {
      url: downloadUrl,
      mimeType: format.mime_type || format.mimeType || 'video/mp4',
      filename: this.sanitizeFilename(rawInfo.videoDetails?.title || 'video'),
      contentLength: format.content_length || format.contentLength,
    };
  }

  private sanitizeFilename(title: string): string {
    return title.replace(/[<>:"/\\|?*]/g, '_') + '.mp4';
  }
}
```

### Step 6: Create Service Factory

Centralized instantiation:

```typescript
// src/services/youtube/youtube.factory.ts

import { YouTubeService } from './youtube.service';
import { YouTubeValidator } from './youtube.validator';
import { YouTubeRepository } from './youtube.repository';
import { YouTubeMapper } from './youtube.mapper';
import { getCacheService } from '@/lib/cache/cache.factory';

let youtubeServiceInstance: YouTubeService | null = null;

export function getYouTubeService(): YouTubeService {
  if (!youtubeServiceInstance) {
    youtubeServiceInstance = new YouTubeService(
      new YouTubeValidator(),
      new YouTubeRepository(),
      new YouTubeMapper(),
      getCacheService()
    );
  }
  return youtubeServiceInstance;
}
```

### Step 7: Refactor API Route

Now the API route becomes simple:

```typescript
// src/app/api/video-info/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getYouTubeService } from "@/services/youtube/youtube.factory";
import { errorHandler } from "@/middleware/error-handler";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const url = searchParams.get("url");

    if (!url) {
      return NextResponse.json(
        { success: false, error: "URL parameter is required" },
        { status: 400 }
      );
    }

    // Use the service
    const youtubeService = getYouTubeService();
    const videoInfo = await youtubeService.getVideoInfo(url);

    logger.info('Video info retrieved successfully', {
      title: videoInfo.video.title,
      formatCount: videoInfo.formats.length
    });

    return NextResponse.json({
      success: true,
      data: videoInfo,
    });

  } catch (error) {
    return errorHandler(error);
  }
}
```

**Result**: API route went from 206 lines to ~30 lines!

---

## Testing the Service

Now you can easily test the service:

```typescript
// src/services/youtube/__tests__/youtube.service.test.ts

import { YouTubeService } from '../youtube.service';
import { YouTubeValidator } from '../youtube.validator';
import { MockYouTubeRepository } from './mocks/youtube.repository.mock';
import { YouTubeMapper } from '../youtube.mapper';
import { MockCacheService } from '@/lib/cache/__tests__/cache.mock';
import { InvalidUrlError } from '@/lib/errors/youtube.errors';

describe('YouTubeService', () => {
  let service: YouTubeService;
  let mockRepository: MockYouTubeRepository;
  let mockCache: MockCacheService;

  beforeEach(() => {
    mockRepository = new MockYouTubeRepository();
    mockCache = new MockCacheService();

    service = new YouTubeService(
      new YouTubeValidator(),
      mockRepository,
      new YouTubeMapper(),
      mockCache
    );
  });

  describe('getVideoInfo', () => {
    it('should throw InvalidUrlError for invalid URL', async () => {
      await expect(service.getVideoInfo('not-a-url'))
        .rejects
        .toThrow(InvalidUrlError);
    });

    it('should return cached data if available', async () => {
      const mockData = { video: { title: 'Test' }, formats: [] };
      mockCache.set('video:test123', mockData, 3600);

      const result = await service.getVideoInfo('https://youtube.com/watch?v=test123');

      expect(result).toEqual(mockData);
      expect(mockRepository.fetchVideoInfo).not.toHaveBeenCalled();
    });

    it('should fetch from repository if not cached', async () => {
      mockRepository.setMockData({
        videoDetails: {
          title: 'Test Video',
          videoId: 'test123',
          lengthSeconds: '120',
          author: { name: 'Test Channel' },
          viewCount: '1000',
          thumbnails: [{ url: 'https://example.com/thumb.jpg' }]
        },
        streaming_data: {
          formats: [{
            itag: 18,
            quality_label: '360p',
            mime_type: 'video/mp4',
            hasVideo: true,
            hasAudio: true,
            url: 'https://example.com/video.mp4'
          }]
        }
      });

      const result = await service.getVideoInfo('https://youtube.com/watch?v=test123');

      expect(result.video.title).toBe('Test Video');
      expect(result.formats).toHaveLength(1);
    });

    it('should cache the result after fetching', async () => {
      mockRepository.setMockData({ /* ... */ });

      await service.getVideoInfo('https://youtube.com/watch?v=test123');

      const cached = await mockCache.get('video:test123');
      expect(cached).toBeDefined();
    });
  });
});
```

---

## Benefits Achieved

### ✅ Testability
- Can test each component in isolation
- Easy to mock dependencies
- Fast unit tests (no HTTP calls)

### ✅ Maintainability
- Clear separation of concerns
- Each class has one responsibility
- Easy to locate and fix bugs

### ✅ Reusability
- Service can be used from any context (API routes, CLI, background jobs)
- Components can be reused in different services

### ✅ Extensibility
- Want to add caching? Just inject CacheService
- Want to change data source? Replace Repository
- Want to add logging? Inject Logger

### ✅ Type Safety
- Clear interfaces define contracts
- TypeScript can catch errors at compile time
- Better IDE autocomplete

---

## Migration Path

You can migrate gradually:

1. **Week 1**: Create service layer alongside existing code
2. **Week 2**: Update video-info endpoint to use service
3. **Week 3**: Update download endpoint to use service
4. **Week 4**: Update dubbing endpoints
5. **Week 5**: Remove old helper functions
6. **Week 6**: Add tests and refine

This lets you keep the app working while improving it incrementally.

---

## Summary

**Before**:
```
API Route (206 lines)
├── Everything mixed together
└── Hard to test, hard to reuse
```

**After**:
```
API Route (30 lines) → Service Layer
                        ├── Validator (20 lines)
                        ├── Repository (60 lines)
                        ├── Mapper (80 lines)
                        └── Service (50 lines)
```

Total lines increased slightly, but:
- ✅ Each file is focused and testable
- ✅ Logic is reusable
- ✅ Easy to extend and maintain
- ✅ Professional architecture

Would you like me to implement this refactoring for you?
