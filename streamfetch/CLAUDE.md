# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

StreamFetch is an educational YouTube downloader built with Next.js 16 (App Router). The project demonstrates CORS bypass patterns, streaming data handling, and modern web development practices. All code includes extensive educational comments marked with `EDUCATIONAL NOTE:` for teaching purposes.

**Important:** This is an educational project only. Respect YouTube's Terms of Service.

## Project Structure

This project uses the **`src` directory pattern** for Next.js. All application code (app, components, lib) is organized under the `src/` directory, which is the recommended pattern for better code organization and clearer separation between source code and configuration files.

- Path alias `@/*` points to `src/*`
- Tailwind scans `src/**/*` for class names
- All imports use `@/` prefix (e.g., `@/lib/utils`, `@/components/ui/button`)

## Development Commands

```bash
# Install dependencies
npm install

# Development server (Turbopack)
npm run dev
# Server runs on http://localhost:3000 (or next available port)

# Production build
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Critical Architecture Details

### YouTube Integration Layer

**Library**: `youtubei.js` (YouTube's InnerTube API client)

- **Location**: `src/lib/youtube-helper.ts`
- **Strategy**: Multi-client fallback system (Android → iOS → TV → Web)
- **Key Async Pattern**: `format.decipher()` returns a **Promise** and MUST be awaited
  - Without `await`, you get `[object Promise]` instead of the URL string
  - This breaks the fetch call with "Invalid URL" errors

### Multi-Client Fallback Strategy

The `getVideoInfoWithFallback()` function tries different YouTube client types:

1. **Android Client** - Uses mobile app API (best success rate)
2. **iOS Client** - Apple device API
3. **TV Embedded Client** - Smart TV/embedded player API
4. **Web Client** - Desktop browser (fallback)

Each strategy uses `yt.actions.execute('/player', { videoId, client: 'TYPE', parse: true })` to get video data with specific client contexts.

### Data Flow Architecture

**Video Info Endpoint** (`/api/video-info`):
```
Client → Next.js API → youtubei.js → YouTube InnerTube API → Normalize data → Client
```

**Download Endpoint** (`/api/download`):
```
Client → Next.js API → youtubei.js (get formats) → Decipher URLs → fetch() → Stream → Client
```

**Critical**: The download route streams video data in chunks, not buffering. YouTube CDN → Server (pass-through) → Client browser.

### Data Normalization Layer

`normalizeVideoInfo()` in `src/lib/youtube-helper.ts` handles two response types:
- `getInfo()` response: Returns `{ basic_info, streaming_data, session }`
- `actions.execute('/player')` response: Returns raw player data

The function converts both to a consistent `VideoInfo` interface. This abstraction allows the API routes to work regardless of which YouTube client succeeds.

### URL Deciphering Pattern

YouTube obfuscates streaming URLs. The pattern is:

```typescript
// ❌ WRONG - Returns Promise object
const url = format.decipher(info.session?.player)

// ✅ CORRECT - Must await
const url = await format.decipher(info.session?.player)
```

This is an **async operation** that executes YouTube's deobfuscation algorithm using their player code.

### CORS Bypass Implementation

Browser cannot directly access YouTube (CORS restriction). Solution:

1. Client calls our Next.js API routes (same origin, no CORS)
2. Server-side Next.js route calls YouTube (servers don't enforce CORS)
3. Server streams response back to client

This is the "proxy pattern" and is the core architectural concept of the project.

## File Organization

```
streamfetch/
├── src/                          # Source directory
│   ├── app/                      # Next.js App Router
│   │   ├── api/
│   │   │   ├── video-info/route.ts  # Fetches metadata via youtubei.js
│   │   │   ├── download/route.ts    # Streams video via deciphered URLs
│   │   │   └── dubbing/             # ElevenLabs dubbing endpoints
│   │   ├── downloads/page.tsx    # Downloads page
│   │   ├── settings/page.tsx     # Settings page
│   │   ├── page.tsx              # Main UI (URL input, video display)
│   │   ├── layout.tsx            # Root layout with sidebar
│   │   └── globals.css           # Global styles
│   ├── lib/
│   │   ├── youtube-helper.ts     # youtubei.js wrapper with fallbacks
│   │   ├── elevenlabs-helper.ts  # ElevenLabs API integration
│   │   ├── types.ts              # TypeScript interfaces
│   │   └── utils.ts              # Tailwind utilities
│   └── components/
│       ├── ui/                   # shadcn/ui components
│       ├── sidebar.tsx           # Navigation
│       ├── video-info-card.tsx   # Video display component
│       └── dubbing-card.tsx      # Dubbing interface component
└── docs/
    └── YOUTUBE_403_ERRORS.md     # Troubleshooting guide
```

## Common Issues & Solutions

### 403 Forbidden Errors

YouTube actively blocks download tools. Solutions:

- Update `youtubei.js`: `npm update youtubei.js`
- Multi-client fallback system helps work around restrictions
- Some videos have additional protections (age-restricted, music videos)
- See `docs/YOUTUBE_403_ERRORS.md` for detailed troubleshooting

### "Failed to parse URL from [object Promise]"

This means `format.decipher()` wasn't awaited. The fix:
- Make function `async`
- Add `await` before `format.decipher()`
- See `src/lib/youtube-helper.ts:normalizeVideoInfo()` for correct pattern

### Port Already in Use

Next.js automatically uses next available port (3001, 3002, etc.). Check terminal output for actual port.

## Educational Comments Pattern

All critical code sections include educational comments:

```typescript
/**
 * EDUCATIONAL NOTE: [Topic]
 *
 * Explanation of why/how/what
 */
```

When adding features, maintain this pattern to preserve the educational value.

## Technology Stack Context

- **Next.js 16 App Router**: File-based routing, Server Components, API Routes
- **TypeScript**: Strict mode enabled, full type safety
- **Tailwind CSS + shadcn/ui**: Utility-first styling with pre-built components
- **youtubei.js**: YouTube InnerTube API client (actively maintained)
- **React 19**: Latest React features, Server/Client Components

## Key Constraints

1. **Educational Focus**: Code clarity over optimization
2. **Type Safety**: All functions properly typed
3. **Streaming Architecture**: Never buffer entire videos in memory
4. **Multi-Strategy**: Always provide fallback mechanisms
5. **Legal Compliance**: Emphasize educational use only
