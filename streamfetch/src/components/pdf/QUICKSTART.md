# PDF Viewer - Quick Start Guide

Get the PDF viewer running in 5 minutes!

## Step 1: Verify Installation

PDF.js is already installed. Verify:

```bash
npm list pdfjs-dist
# Should show: pdfjs-dist@5.4.449
```

## Step 2: Test with Demo Page (Recommended)

Create a test page to verify everything works:

1. **Create demo page:**
   ```bash
   # Create the directory
   mkdir -p src/app/(pages)/pdf/demo

   # Create the page file
   # Copy content from DEMO_PAGE_EXAMPLE.tsx
   ```

2. **Add a test PDF:**
   - Download: https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf
   - Save as: `public/sample.pdf`

3. **Run the app:**
   ```bash
   npm run dev
   ```

4. **Visit:**
   ```
   http://localhost:3000/pdf/demo
   ```

## Step 3: Integrate into Existing Page

Update `src/app/(pages)/pdf/page.tsx`:

```typescript
import { PDFViewerWithSidebar } from "@/components/pdf";

// In your component:
<PDFViewerWithSidebar
  pdfUrl={pdfUrl}
  initialZoom={1.0}
  onPageChange={(page) => console.log(page)}
/>
```

See `EXAMPLE_IMPLEMENTATION.tsx` for complete code.

## Step 4: Configure Backend

Your API needs to provide PDF file URLs. Choose one:

### Option A: Direct URL in API Response

```typescript
// In your getPDFService()
return {
  ...project,
  fileUrl: `/api/pdf/file/${project.id}`
};
```

### Option B: Create File Serving Endpoint

Create `src/app/api/pdf/file/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const filePath = path.join(process.cwd(), 'uploads', 'pdfs', `${id}.pdf`);
  const fileBuffer = await fs.promises.readFile(filePath);

  return new NextResponse(fileBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline',
    },
  });
}
```

### Option C: Use Cloud Storage

```typescript
fileUrl: `https://your-bucket.s3.amazonaws.com/pdfs/${id}.pdf`
```

## Common Issues

### PDF doesn't load
- Check browser console for errors
- Verify PDF URL is accessible: open it in a new tab
- Check CORS if using external URLs

### Worker error
- Worker is configured to use CDN automatically
- If offline, use local worker (see INTEGRATION_GUIDE.md)

### Blank screen
- Ensure PDF loaded successfully
- Check that pdfUrl is defined
- Look for errors in console

## Features Available

- Page navigation (arrows, thumbnails)
- Zoom (0.5x - 3.0x)
- Rotation (90° increments)
- Keyboard shortcuts
- Loading states
- Error handling

## Next Steps

1. **Read the docs:**
   - `README.md` - Component overview
   - `INTEGRATION_GUIDE.md` - Detailed integration examples
   - `EXAMPLE_IMPLEMENTATION.tsx` - Full example code

2. **Test thoroughly:**
   - Try different PDF files
   - Test with large PDFs (50+ pages)
   - Check mobile responsiveness
   - Test error states

3. **Customize:**
   - Adjust styling via className prop
   - Add annotation tools
   - Implement text search
   - Add more features

## Support

- PDF.js docs: https://mozilla.github.io/pdf.js/
- Check INTEGRATION_GUIDE.md for troubleshooting
- Review browser console for errors

## File Structure

```
src/components/pdf/
├── PDFViewer.tsx                    # Main viewer
├── PDFViewerWithSidebar.tsx         # Viewer + sidebar combo
├── PDFThumbnailSidebar.tsx          # Thumbnail navigation
├── PDFThumbnail.tsx                 # Single thumbnail
├── PDFPage.tsx                      # Page renderer
├── index.ts                         # Exports
├── types.ts                         # TypeScript types
├── README.md                        # Documentation
├── QUICKSTART.md                    # This file
├── INTEGRATION_GUIDE.md             # Detailed guide
├── EXAMPLE_IMPLEMENTATION.tsx       # Full example
└── DEMO_PAGE_EXAMPLE.tsx           # Demo page code
```

Happy coding!
