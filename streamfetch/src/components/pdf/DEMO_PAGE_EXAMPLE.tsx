/**
 * Demo Page Example
 *
 * This is a standalone demo page you can create to test the PDF viewer
 * independently from the main PDF editor flow.
 *
 * INSTRUCTIONS:
 * 1. Create: src/app/(pages)/pdf/demo/page.tsx
 * 2. Copy this content into that file
 * 3. Place a test PDF in public/sample.pdf
 * 4. Visit: http://localhost:3000/pdf/demo
 */

"use client";

import { useState } from "react";
import { PDFViewerWithSidebar } from "@/components/pdf";
import { Button } from "@/components/ui/button";
import { Upload, FileText } from "lucide-react";
import Link from "next/link";

export default function PDFDemoPage() {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Sample PDF URLs for testing
  const samplePDFs = [
    {
      name: "Local Sample",
      url: "/sample.pdf",
      description: "Test with a local PDF in your public folder",
    },
    {
      name: "PDF.js Test PDF",
      url: "https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf",
      description: "Official PDF.js test document",
    },
    {
      name: "Lorem Ipsum",
      url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      description: "Simple test PDF",
    },
  ];

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "application/pdf") {
      const url = URL.createObjectURL(file);
      setPdfUrl(url);
    } else {
      alert("Please select a valid PDF file");
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0a]">
      {/* Header */}
      <div className="border-b border-gray-800 bg-[#1a1a1a] px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">
              PDF Viewer Demo
            </h1>
            <p className="text-sm text-gray-400">
              Test the PDF viewer component with sample PDFs
            </p>
          </div>
          <Link href="/pdf/projects">
            <Button variant="outline" className="border-gray-700">
              <FileText className="h-4 w-4 mr-2" />
              Back to Projects
            </Button>
          </Link>
        </div>
      </div>

      {/* Content */}
      {!pdfUrl ? (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-2xl w-full">
            <div className="text-center mb-8">
              <FileText className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">
                Select a PDF to View
              </h2>
              <p className="text-gray-400">
                Choose from sample PDFs or upload your own
              </p>
            </div>

            {/* Upload Button */}
            <div className="mb-8">
              <label
                htmlFor="pdf-upload"
                className="flex items-center justify-center gap-3 w-full px-6 py-4 bg-primary hover:bg-primary/90 text-white rounded-lg cursor-pointer transition-colors"
              >
                <Upload className="h-5 w-5" />
                <span className="font-medium">Upload PDF File</span>
                <input
                  id="pdf-upload"
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-800"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-[#0a0a0a] text-gray-500">
                  Or try a sample PDF
                </span>
              </div>
            </div>

            {/* Sample PDFs */}
            <div className="space-y-3">
              {samplePDFs.map((sample) => (
                <button
                  key={sample.url}
                  onClick={() => setPdfUrl(sample.url)}
                  className="w-full px-6 py-4 bg-[#1a1a1a] hover:bg-[#252525] border border-gray-800 rounded-lg transition-colors text-left"
                >
                  <div className="flex items-start gap-4">
                    <FileText className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="text-white font-medium mb-1">
                        {sample.name}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {sample.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Info Box */}
            <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <h3 className="text-sm font-semibold text-blue-400 mb-2">
                Testing Tips
              </h3>
              <ul className="text-xs text-gray-400 space-y-1">
                <li>• Use arrow keys to navigate pages</li>
                <li>• Press +/- to zoom in/out</li>
                <li>• Press 0 to reset zoom</li>
                <li>• Click thumbnails in sidebar for quick navigation</li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-hidden">
          {/* Controls */}
          <div className="bg-[#1a1a1a] border-b border-gray-800 px-6 py-3 flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPdfUrl(null)}
              className="border-gray-700"
            >
              Choose Different PDF
            </Button>
            <div className="text-sm text-gray-400">
              Current Page: {currentPage}
            </div>
          </div>

          {/* PDF Viewer */}
          <div className="h-[calc(100vh-140px)]">
            <PDFViewerWithSidebar
              pdfUrl={pdfUrl}
              initialZoom={1.0}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * SETUP INSTRUCTIONS
 *
 * 1. Create the demo page:
 *    src/app/(pages)/pdf/demo/page.tsx
 *
 * 2. Add a sample PDF to test with:
 *    public/sample.pdf
 *
 *    You can download a test PDF from:
 *    https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf
 *
 * 3. Visit the demo:
 *    http://localhost:3000/pdf/demo
 *
 * 4. Test the features:
 *    - Upload a PDF from your computer
 *    - Try the sample PDFs
 *    - Test zoom controls
 *    - Test page navigation
 *    - Test keyboard shortcuts
 *    - Check thumbnail sidebar
 *    - Try rotating pages
 *
 * TROUBLESHOOTING
 *
 * If PDFs don't load:
 * - Check browser console for errors
 * - Verify PDF URL is accessible
 * - Check CORS headers for external PDFs
 * - Ensure PDF.js worker is loading
 * - Try a different PDF file
 *
 * Common Issues:
 * - CORS errors with external PDFs: Use local files or proxy
 * - Worker not found: Check worker path configuration
 * - Blank canvas: Verify PDF loaded successfully
 */
