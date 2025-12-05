# PDF Components

PDF.js-based PDF viewer components for StreamFetch application.

## Quick Start

```typescript
import { PDFViewerWithSidebar } from "@/components/pdf";

export default function MyPage() {
  return (
    <div className="h-screen">
      <PDFViewerWithSidebar
        pdfUrl="/path/to/document.pdf"
        initialZoom={1.0}
        onPageChange={(page) => console.log("Current page:", page)}
      />
    </div>
  );
}
```

## Components

### PDFViewerWithSidebar (Recommended)
Complete PDF viewer with thumbnail sidebar - ready to use out of the box.

```typescript
<PDFViewerWithSidebar
  pdfUrl="/document.pdf"
  initialZoom={1.0}
  onPageChange={(page) => console.log(page)}
/>
```

### PDFViewer
Main viewer with controls but without sidebar.

```typescript
<PDFViewer
  pdfUrl="/document.pdf"
  initialZoom={1.0}
  onPageChange={(page) => console.log(page)}
/>
```

### PDFThumbnailSidebar
Thumbnail sidebar that can be used separately.

```typescript
<PDFThumbnailSidebar
  pdfDoc={pdfDoc}
  currentPage={currentPage}
  onPageSelect={(page) => setCurrentPage(page)}
/>
```

### PDFPage
Renders a single PDF page (used internally).

```typescript
<PDFPage
  pageNum={1}
  pdfDoc={pdfDoc}
  scale={1.0}
  rotation={0}
  onRenderComplete={() => console.log("Page rendered")}
/>
```

### PDFThumbnail
Renders a page thumbnail (used internally).

```typescript
<PDFThumbnail
  pageNum={1}
  pdfDoc={pdfDoc}
  isActive={true}
  onClick={(page) => console.log(page)}
/>
```

## Features

- Canvas-based PDF rendering with PDF.js
- Zoom controls (0.5x to 3.0x)
- Page navigation (next/previous/direct input)
- Page rotation (90-degree increments)
- Thumbnail sidebar with auto-scroll
- Keyboard shortcuts
- Loading states
- Error handling
- Dark theme matching StreamFetch UI
- Fully typed with TypeScript

## Keyboard Shortcuts

- **Arrow Left**: Previous page
- **Arrow Right**: Next page
- **+ or =**: Zoom in
- **-**: Zoom out
- **0**: Reset zoom

## Props

### PDFViewerWithSidebar Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| pdfUrl | string | Yes | - | URL or path to PDF file |
| initialZoom | number | No | 1.0 | Initial zoom level (0.5-3.0) |
| onPageChange | function | No | - | Callback: (page: number) => void |
| className | string | No | "" | Additional CSS classes |

### PDFViewer Props

Same as PDFViewerWithSidebar.

### PDFThumbnailSidebar Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| pdfDoc | PDFDocumentProxy \| null | Yes | PDF.js document object |
| currentPage | number | Yes | Currently active page |
| onPageSelect | function | Yes | Callback: (page: number) => void |
| className | string | No | Additional CSS classes |

## Configuration

### PDF.js Worker

The worker is configured to use CDN by default:

```typescript
pdfjsLib.GlobalWorkerOptions.workerSrc =
  `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
```

To use a local worker:

1. Copy worker to public:
   ```bash
   cp node_modules/pdfjs-dist/build/pdf.worker.min.js public/
   ```

2. Update worker path in components:
   ```typescript
   pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
   ```

## Integration Examples

See [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) for detailed examples including:

- Basic integration with existing PDF editor page
- Standalone viewer usage
- Custom layouts
- API requirements
- Backend setup
- Error handling
- Performance optimization

## File Structure

```
src/components/pdf/
├── README.md                    # This file
├── INTEGRATION_GUIDE.md         # Detailed integration guide
├── index.ts                     # Component exports
├── types.ts                     # TypeScript type definitions
├── PDFViewer.tsx               # Main viewer component
├── PDFViewerWithSidebar.tsx    # Viewer + sidebar combo
├── PDFThumbnailSidebar.tsx     # Thumbnail sidebar
├── PDFThumbnail.tsx            # Single thumbnail
└── PDFPage.tsx                 # Single page renderer
```

## Dependencies

- `pdfjs-dist` (^5.4.449) - Already installed
- `lucide-react` - For icons (already installed)
- Tailwind CSS - For styling (already configured)

No additional packages needed!

## Styling

Components use Tailwind classes matching the StreamFetch dark theme:

- Background: `bg-[#0a0a0a]`, `bg-[#0f0f0f]`, `bg-[#1a1a1a]`
- Borders: `border-gray-800`, `border-gray-700`
- Text: `text-white`, `text-gray-400`, `text-gray-500`

Customize via the `className` prop or edit component files.

## Browser Support

Works in all modern browsers that support:
- Canvas API
- ES6+
- Async/await
- PDF.js (Chrome, Firefox, Safari, Edge)

## Performance Notes

- Thumbnails render at lower scale for faster loading
- Each page is rendered independently
- Large PDFs may take time to load all thumbnails
- Consider lazy loading for PDFs with 50+ pages

## Troubleshooting

**PDF doesn't load:**
- Check PDF URL is accessible
- Verify CORS headers if external
- Check browser console for errors

**Worker error:**
- Verify worker URL is accessible
- Try local worker instead of CDN

**Blank canvas:**
- Ensure PDF loaded successfully
- Check canvas dimensions
- Look for render errors in console

For more help, see [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md).

## License

Part of the StreamFetch project.
