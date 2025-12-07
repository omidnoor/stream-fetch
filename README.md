# StreamFetch - YouTube Video Platform

A comprehensive web application for downloading YouTube videos and creating automated dubbed content using AI. Built with modern web technologies including CORS workarounds, streaming data handling, parallel processing, and ElevenLabs AI integration.

- **CORS (Cross-Origin Resource Sharing)** and server-side proxying
- **Streaming vs buffering** data
- **Next.js App Router** and API routes
- **TypeScript** for type safety
- **Modern UI development** with Tailwind CSS and shadcn/ui
- **Node.js streams** and Web Streams API
- **Automated dubbing pipeline** with parallel processing
- **Real-time progress tracking** with Server-Sent Events

## Features

### Core Features
- Modern dark-themed UI with gradient effects
- Sidebar navigation matching professional designs
- YouTube video metadata fetching
- Multiple quality options for downloads
- Video streaming through server proxy
- Type-safe API with TypeScript

### 🎬 Automated Dubbing Pipeline (NEW)
Transform YouTube videos into dubbed content in any language with our fully automated pipeline:

- **Intelligent Video Processing**: Automatic chunking based on configurable duration
- **Parallel Dubbing**: Process multiple chunks simultaneously with ElevenLabs AI
- **Cost Estimation**: Preview time and cost before starting
- **Real-Time Progress**: Live updates via Server-Sent Events
- **Error Recovery**: Automatic retry with exponential backoff
- **Job Management**: Full history, cancel, retry, and delete capabilities
- **Professional Output**: High-quality merged video with dubbed audio

## Tech Stack

- **Next.js 16** - React framework with App Router
- **TypeScript** - Type safety and better DX
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Beautiful UI components
- **youtubei.js** - YouTube InnerTube API client
- **ElevenLabs API** - AI voice dubbing
- **FFmpeg** - Video processing and manipulation
- **Lucide React** - Icon library

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- **FFmpeg** installed and available in PATH (required for automation features)
- **ElevenLabs API key** (required for dubbing features)

### Installation

1. Navigate to the project directory:
   ```bash
   cd streamfetch
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the root directory:
   ```env
   ELEVENLABS_API_KEY=your_api_key_here
   ```

   Get your API key from [ElevenLabs](https://elevenlabs.io/)

4. Verify FFmpeg installation:
   ```bash
   ffmpeg -version
   ```

   If not installed:
   - **macOS**: `brew install ffmpeg`
   - **Ubuntu/Debian**: `sudo apt install ffmpeg`
   - **Windows**: Download from [ffmpeg.org](https://ffmpeg.org/download.html)

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open your browser and visit:
   ```
   http://localhost:3000
   ```
   (or http://localhost:3001 if port 3000 is in use)

## How It Works

### The CORS Problem

When you try to fetch YouTube videos directly from the browser, you encounter CORS errors:

```
❌ Browser → YouTube
   Error: CORS policy blocks this request
```

### Our Solution: Server-Side Proxy

We use Next.js API routes as a server-side proxy:

```
✅ Browser → Our Server → YouTube → Our Server → Browser
   No CORS issues!
```

The server doesn't have CORS restrictions, so it can freely communicate with YouTube.

### Streaming Architecture

Instead of downloading the entire video to our server first:

```
❌ YouTube → [Download Complete] → Our Server → [Download Complete] → Client
   Slow and memory-intensive
```

We stream data in chunks:

```
✅ YouTube → [Chunk 1] → Our Server → [Chunk 1] → Client
   YouTube → [Chunk 2] → Our Server → [Chunk 2] → Client
   Fast and memory-efficient
```

## 🎬 Automated Dubbing Pipeline

The automated dubbing pipeline transforms YouTube videos into professionally dubbed content through a six-phase process:

### Pipeline Architecture

```
┌─────────────────────────────────────────────────────────┐
│  AUTOMATED DUBBING PIPELINE                             │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  1. Download    → Download video from YouTube           │
│  2. Chunk       → Split into manageable segments        │
│  3. Dub         → Process chunks in parallel (ElevenLabs)│
│  4. Merge       → Combine dubbed audio with video       │
│  5. Concatenate → Merge all chunks into final video     │
│  6. Finalize    → Cleanup and deliver                   │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### How to Use the Automation Feature

1. **Navigate to Automation Page**
   - Click "Automation" in the sidebar
   - Or visit `/automation` directly

2. **Get Cost Estimate**
   - Paste a YouTube URL
   - Click "Get Estimate"
   - Review chunks, time, and cost before proceeding

3. **Configure Settings**
   - **Chunk Duration**: 30s, 1min, 2min, or 5min (default: 1min)
   - **Target Language**: Spanish, French, German, Italian, etc.
   - **Parallel Jobs**: 1-5 concurrent dubbing operations (default: 3)
   - **Watermark**: Enable for 50% cost discount

4. **Start Pipeline**
   - Click "Start Dubbing Pipeline"
   - Monitor real-time progress with live logs
   - Receive notifications on completion

5. **Manage Jobs**
   - View all jobs in `/automation/history`
   - Cancel running jobs
   - Retry failed chunks
   - Delete completed jobs
   - Download final videos

### Pipeline Stages Explained

#### Phase 1: Download
- Fetches video from YouTube using `youtubei.js`
- Multi-client fallback strategy (Android → iOS → TV → Web)
- Saves to temporary directory for processing

#### Phase 2: Chunking
- Splits video using FFmpeg segment muxer
- Copy codec for fast, lossless splitting
- Generates manifest file tracking all chunks
- Supports fixed duration and smart strategies

#### Phase 3: Parallel Dubbing
- Processes multiple chunks simultaneously
- Configurable concurrency (1-5 parallel jobs)
- ElevenLabs AI voice dubbing per chunk
- Automatic retry with exponential backoff
- Rate limiting and quota management

#### Phase 4: Audio Merging
- Replaces original audio with dubbed audio
- Preserves video quality (no re-encoding)
- FFmpeg command: `-c:v copy -c:a aac`

#### Phase 5: Concatenation
- Merges all dubbed chunks sequentially
- FFmpeg concat demuxer for seamless joining
- Progress tracking throughout

#### Phase 6: Finalization
- Generates final output file
- Cleanup of intermediate files
- Schedules output cleanup (24h retention)

### Cost & Performance

**Pricing** (ElevenLabs):
- $0.24 per minute of video
- 50% discount with watermark ($0.12/min)

**Time Estimates**:
- Download: ~30s per minute of video
- Chunking: ~5s per minute
- Dubbing: ~2x real-time (parallelized by config)
- Merging: ~10s per minute

**Example**: 10-minute video with 3 parallel jobs
- Cost: $2.40 (or $1.20 with watermark)
- Time: ~8-12 minutes total

### API Endpoints

The automation feature exposes these endpoints:

```typescript
POST   /api/automation/start            // Start new dubbing job
GET    /api/automation/status/:jobId    // Get job status
GET    /api/automation/stream/:jobId    // SSE real-time updates
POST   /api/automation/cancel/:jobId    // Cancel running job
POST   /api/automation/retry/:jobId     // Retry failed chunks
GET    /api/automation/download/:jobId  // Download final video
GET    /api/automation/jobs             // List all jobs (paginated)
DELETE /api/automation/jobs/:jobId      // Delete job and files
```

### Real-Time Progress Tracking

Uses Server-Sent Events (SSE) for live updates:

```javascript
// Example client-side subscription
const eventSource = new EventSource(`/api/automation/stream/${jobId}`);

eventSource.addEventListener('progress', (event) => {
  const progress = JSON.parse(event.data);
  console.log(`Overall: ${progress.overallPercent}%`);
});

eventSource.addEventListener('log', (event) => {
  const log = JSON.parse(event.data);
  console.log(`[${log.level}] ${log.message}`);
});

eventSource.addEventListener('complete', (event) => {
  const result = JSON.parse(event.data);
  console.log(`Completed: ${result.outputFile}`);
});
```

### Error Handling & Recovery

The pipeline includes comprehensive error handling:

- **Network Failures**: Automatic retry with exponential backoff
- **API Rate Limits**: Queue management with rate limiting
- **Chunk Failures**: Retry individual failed chunks without reprocessing successful ones
- **User Cancellation**: Clean termination with file cleanup
- **Disk Space Issues**: Pre-flight checks and graceful degradation

### File Storage & Cleanup

```
temp/automation/
├── jobs/
│   └── {jobId}.json              # Job metadata and state
└── {jobId}/
    ├── source/
    │   └── video.mp4              # Downloaded video
    ├── chunks/
    │   ├── chunk_000.mp4          # Video chunks
    │   └── manifest.json          # Chunk metadata
    ├── dubbed/
    │   ├── chunk_000.mp3          # Dubbed audio
    │   └── chunk_001.mp3
    ├── merged/
    │   ├── chunk_000.mp4          # Video + dubbed audio
    │   └── chunk_001.mp4
    └── output/
        └── final.mp4              # Final merged video
```

**Cleanup Policy**:
- Intermediate files deleted immediately after merge
- Final output retained for 24 hours
- Orphaned files cleaned on server restart

## Project Structure

```
streamfetch/
├── app/
│   ├── api/
│   │   ├── video-info/
│   │   │   └── route.ts          # Fetches video metadata
│   │   └── download/
│   │       └── route.ts          # Streams video data
│   ├── downloads/
│   │   └── page.tsx              # Downloads history page
│   ├── settings/
│   │   └── page.tsx              # Settings page
│   ├── layout.tsx                # Root layout with sidebar
│   ├── page.tsx                  # Main landing page
│   └── globals.css               # Global styles
├── components/
│   ├── ui/
│   │   ├── button.tsx            # Button component
│   │   └── input.tsx             # Input component
│   ├── sidebar.tsx               # Navigation sidebar
│   └── video-info-card.tsx       # Video display component
├── lib/
│   ├── utils.ts                  # Utility functions
│   └── types.ts                  # TypeScript types
└── README.md
```

## Technical Implementation

### 1. CORS Bypass ([app/api/video-info/route.ts](app/api/video-info/route.ts))

Server-side proxying to solve CORS restrictions.

### 2. Streaming Data ([app/api/download/route.ts](app/api/download/route.ts))

Efficient data transfer using streaming instead of buffering.

### 3. Type Safety ([lib/types.ts](lib/types.ts))

TypeScript for preventing bugs and improving developer experience.

### 4. Modern React Patterns ([app/page.tsx](app/page.tsx))

React hooks, state management, and error handling.

### 5. UI Components ([components/](components/))

Component composition and reusable UI patterns.

## Testing the Application

1. Start the dev server (if not already running)
2. Paste a YouTube URL in the input field
   - Example: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
3. Click "Fetch" to retrieve video information
4. Select a quality option
5. Click "Download Video" to start the download

## Important Notes

### Legal & Terms of Service

- Downloading YouTube videos may violate YouTube's Terms of Service
- Only use with:
  - Your own uploaded content
  - Content with explicit download permission
  - Archival purposes where legally permitted

### Technical Limitations

- YouTube frequently changes their internal APIs
- The `@distube/ytdl-core` library may need updates
- Some videos (music, copyrighted content) have additional restrictions
- Rate limiting may occur with heavy usage

## Future Enhancements

Potential features to implement:

1. **Scene Detection Chunking**: Intelligent split points using FFmpeg scene detection
2. **Subtitle Generation**: Auto-generate subtitles in target language
3. **Playlist Support**: Batch process multiple videos from playlists
4. **User Authentication**: Add accounts for job tracking and API key management
5. **Cloud Storage Integration**: S3/GCS for output files
6. **Advanced Audio Options**: Voice cloning, accent selection, speed control
7. **Video Editor Integration**: Pre-processing clips before dubbing
8. **Webhook Notifications**: Alerts on job completion
9. **Cost Analytics Dashboard**: Track usage and spending over time
10. **Multi-language Output**: Generate multiple language versions in one job

## Documentation

### General Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Streams API](https://developer.mozilla.org/en-US/docs/Web/API/Streams_API)

### Automation Pipeline
- [ElevenLabs API Documentation](https://elevenlabs.io/docs)
- [FFmpeg Documentation](https://ffmpeg.org/documentation.html)
- [Server-Sent Events (SSE)](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- [YouTubeI.js Library](https://github.com/LuanRT/YouTube.js)

### Project-Specific Docs
- [Automation Plan](docs/automation-plan/) - Detailed implementation phases
- [YouTube 403 Errors Guide](docs/YOUTUBE_403_ERRORS.md) - Troubleshooting
- [ElevenLabs Setup](docs/ELEVENLABS_SETUP.md) - API configuration

## Contributing

Contributions are welcome! This project demonstrates:
- Modern Next.js patterns with App Router
- TypeScript best practices
- Real-time data streaming (SSE)
- Parallel processing and queue management
- FFmpeg video manipulation
- API integration patterns
- Error handling and recovery strategies

Feel free to open issues or submit pull requests.

## License

MIT License - See LICENSE file for details.

**Important**: This project is for educational purposes. Please respect:
- YouTube's Terms of Service
- ElevenLabs API Terms
- Copyright and fair use laws

Only use this tool with content you have permission to process.

## Disclaimer

Users are responsible for complying with all applicable laws and terms of service when using this software.
