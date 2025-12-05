# StreamFetch - Educational YouTube Downloader

An educational web application demonstrating modern web development concepts including CORS workarounds, streaming data handling, and API integration.

## Purpose

This project is built for **educational purposes only** to teach students about:

- **CORS (Cross-Origin Resource Sharing)** and server-side proxying
- **Streaming vs buffering** data
- **Next.js App Router** and API routes
- **TypeScript** for type safety
- **Modern UI development** with Tailwind CSS and shadcn/ui
- **Node.js streams** and Web Streams API

## Features

- Modern dark-themed UI with gradient effects
- Sidebar navigation matching professional designs
- YouTube video metadata fetching
- Multiple quality options for downloads
- Video streaming through server proxy
- Comprehensive educational comments throughout the codebase
- Type-safe API with TypeScript

## Tech Stack

- **Next.js 16** - React framework with App Router
- **TypeScript** - Type safety and better DX
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Beautiful UI components
- **@distube/ytdl-core** - YouTube integration
- **Lucide React** - Icon library

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Navigate to the project directory:
   ```bash
   cd streamfetch
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and visit:
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

## Key Learning Points

### 1. CORS Bypass ([app/api/video-info/route.ts](app/api/video-info/route.ts))

Learn how server-side proxying solves CORS restrictions.

### 2. Streaming Data ([app/api/download/route.ts](app/api/download/route.ts))

Understand the difference between buffering and streaming, and how to implement efficient data transfer.

### 3. Type Safety ([lib/types.ts](lib/types.ts))

See how TypeScript prevents bugs and improves developer experience.

### 4. Modern React Patterns ([app/page.tsx](app/page.tsx))

Learn about React hooks, state management, and error handling.

### 5. UI Components ([components/](components/))

Explore component composition and reusable UI patterns.

## Educational Comments

Every critical section of code includes educational comments explaining:

- **Why** we're doing something
- **How** it works
- **What** problems it solves
- **Where** students can learn more

Look for comments starting with `EDUCATIONAL NOTE:` throughout the codebase.

## Testing the Application

1. Start the dev server (if not already running)
2. Paste a YouTube URL in the input field
   - Example: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
3. Click "Fetch" to retrieve video information
4. Select a quality option
5. Click "Download Video" to start the download

## Important Notes

### Legal & Terms of Service

- This is for **educational purposes only**
- Downloading YouTube videos may violate YouTube's Terms of Service
- Only use with:
  - Your own uploaded content
  - Content with explicit download permission
  - Educational/archival purposes where legally permitted

### Technical Limitations

- YouTube frequently changes their internal APIs
- The `@distube/ytdl-core` library may need updates
- Some videos (music, copyrighted content) have additional restrictions
- Rate limiting may occur with heavy usage

## Future Enhancements

Students can extend this project by implementing:

1. **Download Queue**: Manage multiple simultaneous downloads
2. **Progress Tracking**: Real-time progress bars using Fetch API streaming
3. **Resume Support**: Implement HTTP Range requests for pause/resume
4. **Playlist Support**: Download multiple videos from playlists
5. **Format Conversion**: Server-side video/audio conversion with FFmpeg
6. **User Authentication**: Add accounts and download history
7. **Download History**: Track and manage past downloads with localStorage or database
8. **Settings Panel**: Configure default quality, naming conventions, etc.

## Learning Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [CORS Explained](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Streams API](https://developer.mozilla.org/en-US/docs/Web/API/Streams_API)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)

## Contributing

This is an educational project. Feel free to fork and extend it for learning purposes!

## License

MIT License - See LICENSE file for details

## Disclaimer

This tool is for educational purposes only. Users are responsible for complying with all applicable laws and terms of service when using this software.

---

Built with ❤️ for education
