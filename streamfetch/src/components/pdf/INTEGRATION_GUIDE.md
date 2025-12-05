# PDF Viewer Integration Guide

This guide explains how to integrate the PDF.js-based PDF viewer components into your StreamFetch application.

## Components Overview

### 1. PDFViewer (Main Component)
The primary PDF viewer with zoom, navigation, and rotation controls.

**Props:**
- `pdfUrl` (string, required): URL or path to the PDF file
- `initialZoom` (number, optional): Initial zoom level (default: 1.0)
- `onPageChange` (function, optional): Callback when page changes
- `className` (string, optional): Additional CSS classes

**Features:**
- Canvas-based PDF rendering
- Zoom in/out (0.5x to 3.0x)
- Page navigation (next/previous)
- Rotate clockwise
- Keyboard shortcuts (arrow keys, +/-, 0)
- Current page input
- Loading and error states

### 2. PDFThumbnailSidebar
Displays thumbnail previews of all pages in a sidebar for quick navigation.

**Props:**
- `pdfDoc` (PDFDocumentProxy, required): PDF.js document object
- `currentPage` (number, required): Currently active page
- `onPageSelect` (function, required): Callback when a thumbnail is clicked
- `className` (string, optional): Additional CSS classes

### 3. PDFViewerWithSidebar (Recommended)
Combines PDFViewer and PDFThumbnailSidebar into a complete interface.

**Props:**
- `pdfUrl` (string, required): URL or path to the PDF file
- `initialZoom` (number, optional): Initial zoom level (default: 1.0)
- `onPageChange` (function, optional): Callback when page changes
- `className` (string, optional): Additional CSS classes

### 4. PDFPage
Renders a single PDF page on a canvas (used internally by PDFViewer).

### 5. PDFThumbnail
Renders a small thumbnail preview of a page (used by PDFThumbnailSidebar).

## Installation & Setup

### 1. PDF.js Worker Configuration

The PDF.js worker is already configured in the components to use CDN:

```typescript
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
```

**Alternative: Local Worker (Optional)**

If you want to use a local worker instead of CDN:

1. Copy the worker file to your public directory:
   ```bash
   cp node_modules/pdfjs-dist/build/pdf.worker.min.js public/
   ```

2. Update the worker path in PDFViewer.tsx and PDFViewerWithSidebar.tsx:
   ```typescript
   pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
   ```

### 2. Dependencies

The component uses `pdfjs-dist` which is already installed in your package.json:

```json
"pdfjs-dist": "^5.4.449"
```

No additional packages need to be installed.

## Integration Examples

### Example 1: Basic Integration (Recommended)

Replace the placeholder content in `src/app/(pages)/pdf/page.tsx`:

```typescript
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FileText, Save, Download as DownloadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Link from "next/link";
import { PDFViewerWithSidebar } from "@/components/pdf";

interface PDFProjectDto {
  id: string;
  name: string;
  status: string;
  pageCount: number;
  fileSize: number;
  annotationCount: number;
  createdAt: string;
  updatedAt: string;
  fileUrl?: string; // Add this field
}

export default function PDFEditorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");

  const [project, setProject] = useState<PDFProjectDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(1.0);

  useEffect(() => {
    if (projectId) {
      fetchProject(projectId);
    } else {
      router.push("/pdf/projects");
    }
  }, [projectId, router]);

  const fetchProject = async (id: string) => {
    try {
      const response = await fetch(`/api/pdf/project/${id}`);
      const data = await response.json();

      if (data.success) {
        setProject(data.data);
      } else {
        toast.error("Project not found");
        router.push("/pdf/projects");
      }
    } catch (error) {
      console.error("Failed to fetch project:", error);
      toast.error("Failed to load project");
      router.push("/pdf/projects");
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSave = async () => {
    toast.success("Project saved successfully");
  };

  const handleExport = async () => {
    if (!project) return;

    try {
      const response = await fetch(`/api/pdf/export/${project.id}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${project.name}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("PDF exported successfully");
    } catch (error) {
      toast.error("Failed to export PDF");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a]">
        <div className="text-gray-400">Loading PDF editor...</div>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  // Construct PDF URL - adjust based on your API
  const pdfUrl = project.fileUrl || `/api/pdf/download/${project.id}`;

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0a]">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-gray-800 bg-[#1a1a1a] px-6 py-3">
        <div className="flex items-center gap-4">
          <Link href="/pdf/projects">
            <Button variant="outline" size="sm" className="border-gray-700">
              <FileText className="h-4 w-4 mr-2" />
              Projects
            </Button>
          </Link>

          <div className="h-6 w-px bg-gray-700" />

          <div>
            <h1 className="text-lg font-semibold text-white">{project.name}</h1>
            <p className="text-xs text-gray-500">
              {project.pageCount} pages • {project.annotationCount} annotations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-gray-700"
            onClick={handleSave}
          >
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
          <Button
            className="bg-primary hover:bg-primary/90"
            size="sm"
            onClick={handleExport}
          >
            <DownloadIcon className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* PDF Viewer with Sidebar */}
      <div className="flex-1 overflow-hidden">
        <PDFViewerWithSidebar
          pdfUrl={pdfUrl}
          initialZoom={1.0}
          onPageChange={handlePageChange}
        />
      </div>

      {/* Status Bar */}
      <div className="border-t border-gray-800 bg-[#1a1a1a] px-6 py-2">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div>Page {currentPage} of {project.pageCount}</div>
          <div className="flex items-center gap-4">
            <span>Status: {project.status}</span>
            <span>Auto-save: Enabled</span>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Example 2: Standalone PDFViewer (No Sidebar)

If you want just the viewer without thumbnails:

```typescript
import { PDFViewer } from "@/components/pdf";

export default function SimplePDFPage() {
  const [currentPage, setCurrentPage] = useState(1);

  return (
    <div className="h-screen">
      <PDFViewer
        pdfUrl="/path/to/your/document.pdf"
        initialZoom={1.0}
        onPageChange={(page) => setCurrentPage(page)}
      />
    </div>
  );
}
```

### Example 3: Custom Layout with Manual Control

For full control over the layout:

```typescript
import { useState, useEffect } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { PDFThumbnailSidebar, PDFViewer } from "@/components/pdf";

export default function CustomPDFPage() {
  const [pdfDoc, setPdfDoc] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    // Load PDF
    const loadPDF = async () => {
      const loadingTask = pdfjsLib.getDocument("/path/to/pdf.pdf");
      const pdf = await loadingTask.promise;
      setPdfDoc(pdf);
    };
    loadPDF();
  }, []);

  return (
    <div className="flex h-screen">
      {/* Custom Sidebar */}
      <aside className="w-64">
        <PDFThumbnailSidebar
          pdfDoc={pdfDoc}
          currentPage={currentPage}
          onPageSelect={setCurrentPage}
        />
      </aside>

      {/* Main Content */}
      <main className="flex-1">
        <PDFViewer
          pdfUrl="/path/to/pdf.pdf"
          onPageChange={setCurrentPage}
        />
      </main>
    </div>
  );
}
```

## API Requirements

### Required Backend Changes

Your PDF project API needs to return a `fileUrl` or file path. Update your DTOs:

```typescript
interface PDFProjectDto {
  id: string;
  name: string;
  status: string;
  pageCount: number;
  fileSize: number;
  annotationCount: number;
  createdAt: string;
  updatedAt: string;
  fileUrl: string; // Add this field
}
```

### Option 1: Direct File URL

If PDFs are stored in a public directory or cloud storage:

```typescript
// In your API route
return NextResponse.json({
  success: true,
  data: {
    ...project,
    fileUrl: `https://your-storage.com/pdfs/${project.id}.pdf`
  }
});
```

### Option 2: API Endpoint Stream

If PDFs need to be streamed through your API:

```typescript
// Implement GET /api/pdf/file/[id]/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Read file from storage
  const filePath = path.join(process.cwd(), 'uploads', 'pdfs', `${id}.pdf`);
  const fileBuffer = await fs.promises.readFile(filePath);

  return new NextResponse(fileBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline',
    },
  });
}

// Then use in component:
const pdfUrl = `/api/pdf/file/${project.id}`;
```

## Keyboard Shortcuts

- **Arrow Left/Right**: Navigate pages
- **+ or =**: Zoom in
- **-**: Zoom out
- **0**: Reset zoom to 100%

## Styling & Customization

All components use Tailwind CSS with the dark theme matching your app. Key classes:

- Background: `bg-[#0a0a0a]`, `bg-[#0f0f0f]`, `bg-[#1a1a1a]`
- Borders: `border-gray-800`, `border-gray-700`
- Text: `text-white`, `text-gray-400`, `text-gray-500`
- Primary color: `text-primary`, `bg-primary`

To customize, modify the className prop or edit the component files directly.

## Troubleshooting

### Issue: PDF doesn't load

**Solutions:**
1. Check that the PDF URL is accessible
2. Verify CORS headers if loading from external source
3. Check browser console for errors
4. Ensure PDF.js worker is loaded correctly

### Issue: Worker script error

**Solutions:**
1. Verify worker URL is accessible
2. Try using local worker instead of CDN
3. Check network tab for worker loading errors

### Issue: Blank canvas

**Solutions:**
1. Ensure canvas has proper dimensions
2. Check if PDF document loaded successfully
3. Verify rendering context exists
4. Look for console errors during page render

### Issue: Performance issues with large PDFs

**Solutions:**
1. Use thumbnail component which renders at lower scale
2. Implement lazy loading for thumbnails
3. Consider splitting very large PDFs
4. Use PDF.js text layer for better performance (not implemented yet)

## Next Steps

### Recommended Enhancements

1. **Annotation Support**
   - Add drawing tools (pen, highlighter, shapes)
   - Text annotations
   - Save annotations to backend

2. **Search Functionality**
   - Full-text PDF search
   - Highlight search results
   - Navigate between matches

3. **Text Layer**
   - Implement PDF.js text layer for text selection
   - Copy/paste support
   - Better accessibility

4. **Mobile Responsiveness**
   - Touch gestures for zoom/pan
   - Mobile-optimized controls
   - Responsive sidebar

5. **Performance Optimization**
   - Virtual scrolling for thumbnails
   - Lazy loading pages
   - Caching rendered pages

## Support

For PDF.js documentation: https://mozilla.github.io/pdf.js/

For StreamFetch specific issues, check the main project documentation.
