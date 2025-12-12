# AI Image Generation Feature

## Overview
AI image generation feature using Google Gemini API, with a Google AI Studio-like UI.

## Files Created

### Backend
```
src/lib/gemini-helper.ts          # API client, generateImage(), types
src/lib/errors/gemini.errors.ts   # Error classes (GeminiError, SafetyError, etc.)
src/app/api/image-gen/route.ts    # POST endpoint for image generation
```

### Frontend
```
src/app/(pages)/image-gen/page.tsx                    # Main page
src/components/image-gen/prompt-input.tsx             # Prompt textarea with image upload
src/components/image-gen/image-preview.tsx            # Image display with zoom/download
src/components/image-gen/generation-settings.tsx      # Model, aspect ratio, count settings
```

### Tests
```
src/__tests__/lib/gemini-helper.test.ts    # 15 tests for helper functions
src/__tests__/api/image-gen.test.ts        # 13 tests for API route
```

### Modified
```
src/components/layout/sidebar.tsx   # Added "Image Gen" nav link
.env.local                          # Added GEMINI_API_KEY
```

---

## Gemini API Details

### SDK
```bash
npm install @google/genai
```

### Client Setup
```typescript
import { GoogleGenAI } from "@google/genai";
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
```

### Generate Image
```typescript
const response = await ai.models.generateContent({
  model: "gemini-2.5-flash-image",  // or "gemini-3-pro-image-preview"
  contents: [{ parts: [{ text: "prompt" }] }],
  config: {
    responseModalities: ["TEXT", "IMAGE"],
    aspectRatio: "16:9",  // optional
  },
});

// Extract image from response
const candidate = response.candidates?.[0];
for (const part of candidate.content.parts) {
  if (part.inlineData) {
    // part.inlineData.data = base64 string
    // part.inlineData.mimeType = "image/png"
  } else if (part.text) {
    // AI's text response
  }
}
```

### Image Editing (with reference images)
```typescript
const response = await ai.models.generateContent({
  model: "gemini-2.5-flash-image",
  contents: [{
    parts: [
      { text: "Make this image brighter" },
      { inlineData: { mimeType: "image/png", data: base64Image } }
    ]
  }],
  config: { responseModalities: ["TEXT", "IMAGE"] },
});
```

### Models
- `gemini-2.5-flash-image` - Fast, general purpose
- `gemini-3-pro-image-preview` - Higher quality, supports 4K

### Aspect Ratios
`1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`, `4:5`, `5:4`, `21:9`

---

## Current UI Features
- Model selection (Flash/Pro) with visual cards
- Aspect ratio selector with shape previews
- Number of images slider (1-4)
- Collapsible settings panels
- Image upload (up to 4 reference images)
- Drag & drop support
- Image preview with zoom/download
- Generation history

---

## TODO: Chat UX Improvements

### Components to Create
1. **LoadingDots** - Animated dots indicator (reusable)
2. **ThinkingCard** - Expandable card for AI thought process
3. **MessageBubble** - User and AI message display
4. **ConversationArea** - Scrollable chat with auto-scroll

### Behavior Requirements
1. On submit: Message appears in chat, input clears
2. Show loading dots animation
3. Show AI thinking/planning in expandable card
4. Auto-scroll down unless user scrolled up
5. Status indicators: "Thinking...", "Generating image..."
6. Streaming updates from API (optional - Gemini may not support)

### Auto-scroll Logic
```typescript
const containerRef = useRef<HTMLDivElement>(null);
const [userScrolled, setUserScrolled] = useState(false);

// Detect user scroll
const handleScroll = () => {
  const el = containerRef.current;
  if (!el) return;
  const isAtBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 50;
  setUserScrolled(!isAtBottom);
};

// Auto-scroll when new content
useEffect(() => {
  if (!userScrolled && containerRef.current) {
    containerRef.current.scrollTop = containerRef.current.scrollHeight;
  }
}, [messages, userScrolled]);
```

---

## API Route Structure

### POST /api/image-gen
**Request:**
```json
{
  "prompt": "A cute cat",
  "model": "gemini-2.5-flash-image",
  "aspectRatio": "1:1",
  "referenceImages": ["base64...", "base64..."]  // optional
}
```

**Response:**
```json
{
  "success": true,
  "images": [{ "base64": "...", "mimeType": "image/png" }],
  "text": "Here's your image!"
}
```

---

## Environment Variables
```
GEMINI_API_KEY=AIzaSy...  # Get from https://aistudio.google.com/apikey
```

---

## Test Commands
```bash
# Run image-gen tests
npm test -- --testPathPatterns="image-gen|gemini"

# Test API directly
node -e "
const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: 'YOUR_KEY' });
// ... test code
"
```
