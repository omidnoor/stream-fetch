# ElevenLabs API Setup Guide

This guide will help you set up and use the ElevenLabs API for video dubbing in your application.

## 1. Installation

The ElevenLabs SDK has already been installed:

```bash
npm install @elevenlabs/elevenlabs-js
```

## 2. Get Your API Key

1. Go to [ElevenLabs Settings](https://elevenlabs.io/app/settings/api-keys)
2. Create a new API key or copy your existing one
3. Add it to your `.env.local` file:

```env
ELEVENLABS_API_KEY=your_api_key_here
```

## 3. API Routes

Three API routes have been created for dubbing functionality:

### Create Dubbing Job

**Endpoint:** `POST /api/dubbing/create`

**Request Body:**
```json
{
  "sourceUrl": "https://example.com/video.mp4",
  "targetLanguage": "es",
  "sourceLanguage": "en",
  "numSpeakers": 1,
  "watermark": true
}
```

**Response:**
```json
{
  "success": true,
  "dubbingId": "dub_xxxxx",
  "message": "Dubbing job created successfully"
}
```

### Check Dubbing Status

**Endpoint:** `GET /api/dubbing/status?dubbingId=dub_xxxxx`

**Response:**
```json
{
  "success": true,
  "dubbingId": "dub_xxxxx",
  "status": "dubbing|dubbed|failed",
  "targetLanguage": "es",
  "expectedDuration": 120
}
```

### Download Dubbed Audio

**Endpoint:** `GET /api/dubbing/download?dubbingId=dub_xxxxx&targetLanguage=es`

Returns the dubbed audio file as an MP3.

## 4. Supported Languages

The following languages are supported for dubbing:

- `en` - English
- `es` - Spanish
- `fr` - French
- `de` - German
- `it` - Italian
- `pt` - Portuguese
- `pl` - Polish
- `tr` - Turkish
- `ru` - Russian
- `nl` - Dutch
- `cs` - Czech
- `ar` - Arabic
- `zh` - Chinese (Simplified)
- `ja` - Japanese
- `ko` - Korean
- `hi` - Hindi
- `uk` - Ukrainian
- `id` - Indonesian
- `ms` - Malay
- `th` - Thai
- `vi` - Vietnamese
- `fil` - Filipino
- `sv` - Swedish
- `bg` - Bulgarian
- `ro` - Romanian
- `el` - Greek
- `sk` - Slovak
- `hr` - Croatian
- `ta` - Tamil
- `hu` - Hungarian

## 5. Usage Example

### Frontend Component Example

```tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

export function DubbingDemo() {
  const [dubbingId, setDubbingId] = useState<string>("")
  const [status, setStatus] = useState<string>("")
  const [loading, setLoading] = useState(false)

  // Step 1: Create dubbing job
  const createDubbing = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/dubbing/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceUrl: "https://example.com/video.mp4",
          targetLanguage: "es", // Spanish
          watermark: true,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setDubbingId(data.dubbingId)
        setStatus("Dubbing job created")
        // Start polling for status
        pollStatus(data.dubbingId)
      }
    } catch (error) {
      console.error("Error:", error)
      setStatus("Failed to create dubbing job")
    } finally {
      setLoading(false)
    }
  }

  // Step 2: Poll for status
  const pollStatus = async (id: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/dubbing/status?dubbingId=${id}`)
        const data = await response.json()

        if (data.status === "dubbed") {
          setStatus("Dubbing complete! Ready to download.")
          clearInterval(interval)
        } else if (data.status === "failed") {
          setStatus("Dubbing failed")
          clearInterval(interval)
        } else {
          setStatus(`Dubbing in progress... (${data.status})`)
        }
      } catch (error) {
        console.error("Error checking status:", error)
        clearInterval(interval)
      }
    }, 5000) // Check every 5 seconds
  }

  // Step 3: Download dubbed audio
  const downloadDubbing = () => {
    if (!dubbingId) return

    const url = `/api/dubbing/download?dubbingId=${dubbingId}&targetLanguage=es`
    window.open(url, "_blank")
  }

  return (
    <div className="space-y-4">
      <Button onClick={createDubbing} disabled={loading}>
        {loading ? "Creating..." : "Create Dubbing Job"}
      </Button>

      {dubbingId && (
        <>
          <p>Dubbing ID: {dubbingId}</p>
          <p>Status: {status}</p>
          <Button onClick={downloadDubbing} disabled={!status.includes("complete")}>
            Download Dubbed Audio
          </Button>
        </>
      )}
    </div>
  )
}
```

## 6. Cost Estimation

The utility functions include a cost estimator:

```typescript
import { estimateDubbingCost } from "@/lib/elevenlabs-helper"

// For a 1-minute video with watermark
const { characters, estimatedDollars } = estimateDubbingCost(60, true)
console.log(`Estimated cost: $${estimatedDollars}`) // ~$0.42
```

### Pricing Overview

- **With watermark:** ~2,000 characters per minute
- **Without watermark:** ~3,000 characters per minute
- **Cost range:** $0.24 - $0.60 per minute (varies by plan)
- **You're charged per output language**

For a 1-minute video:
- With watermark: ~$0.24 - $0.42
- Without watermark: ~$0.42 - $0.60

## 7. Best Practices

1. **Use watermarks for testing** - Save credits during development
2. **Poll status every 5-10 seconds** - Don't overwhelm the API
3. **Handle errors gracefully** - Network issues and API limits can occur
4. **Store dubbing IDs** - Allow users to check status later
5. **Validate inputs** - Ensure URLs are accessible and languages are supported

## 8. Troubleshooting

### "ELEVENLABS_API_KEY is not set"
- Make sure you've added your API key to `.env.local`
- Restart your development server after adding environment variables

### "Failed to create dubbing job"
- Check that your API key is valid
- Ensure the video URL is publicly accessible
- Verify you have enough credits in your ElevenLabs account

### Dubbing takes too long
- Dubbing time varies based on video length
- Typical: 1-2 minutes per minute of video
- Check status using the status endpoint

## 9. Additional Resources

- [ElevenLabs API Documentation](https://elevenlabs.io/docs)
- [ElevenLabs Pricing](https://elevenlabs.io/pricing)
- [Supported Languages](https://elevenlabs.io/languages)

## 10. Next Steps

1. Add your API key to `.env.local`
2. Test the API with a short video
3. Integrate dubbing into your video download workflow
4. Add UI components for language selection
5. Implement progress tracking and notifications
