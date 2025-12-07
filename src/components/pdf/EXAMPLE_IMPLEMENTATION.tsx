/**
 * Example Implementation: PDF Editor Page
 *
 * This file shows how to integrate the PDFViewerWithSidebar component
 * into the existing PDF editor page at src/app/(pages)/pdf/page.tsx
 *
 * INSTRUCTIONS:
 * 1. Replace the content in src/app/(pages)/pdf/page.tsx with this code
 * 2. Adjust the pdfUrl construction based on your API structure
 * 3. Test with a real PDF project
 */

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
  fileUrl?: string; // Add this field to your DTO
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
    if (!project) return;

    try {
      // Implement save logic here
      // For example, save annotations or changes to the backend
      toast.success("Project saved successfully");
    } catch (error) {
      console.error("Failed to save project:", error);
      toast.error("Failed to save project");
    }
  };

  const handleExport = async () => {
    if (!project) return;

    try {
      const response = await fetch(`/api/pdf/export/${project.id}`);

      if (!response.ok) {
        throw new Error("Export failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${project.name}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success("PDF exported successfully");
    } catch (error) {
      console.error("Failed to export PDF:", error);
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

  // Construct PDF URL based on your API structure
  // Option 1: If you have a direct file URL in the project data
  const pdfUrl = project.fileUrl;

  // Option 2: If you need to fetch through an API endpoint
  // const pdfUrl = `/api/pdf/file/${project.id}`;

  // Option 3: For testing with a sample PDF
  // const pdfUrl = "/sample.pdf";

  // Ensure pdfUrl exists before rendering
  if (!pdfUrl) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a]">
        <div className="text-center">
          <FileText className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">
            PDF File Not Available
          </h2>
          <p className="text-gray-400 mb-4">
            The PDF file URL is not configured for this project.
          </p>
          <Link href="/pdf/projects">
            <Button variant="outline">Back to Projects</Button>
          </Link>
        </div>
      </div>
    );
  }

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
          <div>
            Page {currentPage} of {project.pageCount}
          </div>
          <div className="flex items-center gap-4">
            <span>Status: {project.status}</span>
            <span>Auto-save: Enabled</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * BACKEND REQUIREMENTS
 *
 * To make this work, you need to ensure your backend provides PDF file URLs.
 *
 * Option 1: Add fileUrl to your project data
 * ----------------------------------------
 * Update your getPDFService() to include fileUrl in the response:
 *
 * // In src/services/pdf/index.ts or similar
 * export function mapToProjectDto(project: PDFProject): PDFProjectDto {
 *   return {
 *     id: project.id,
 *     name: project.name,
 *     status: project.status,
 *     pageCount: project.pageCount,
 *     fileSize: project.fileSize,
 *     annotationCount: project.annotationCount,
 *     createdAt: project.createdAt.toISOString(),
 *     updatedAt: project.updatedAt.toISOString(),
 *     fileUrl: `/api/pdf/file/${project.id}`, // Add this
 *   };
 * }
 *
 * Option 2: Create a new API endpoint to serve PDF files
 * ------------------------------------------------------
 * Create: src/app/api/pdf/file/[id]/route.ts
 *
 * import { NextRequest, NextResponse } from 'next/server';
 * import fs from 'fs';
 * import path from 'path';
 *
 * export async function GET(
 *   request: NextRequest,
 *   { params }: { params: Promise<{ id: string }> }
 * ) {
 *   const { id } = await params;
 *
 *   // Read the PDF file from storage
 *   const filePath = path.join(process.cwd(), 'uploads', 'pdfs', `${id}.pdf`);
 *
 *   // Check if file exists
 *   if (!fs.existsSync(filePath)) {
 *     return NextResponse.json(
 *       { success: false, error: 'File not found' },
 *       { status: 404 }
 *     );
 *   }
 *
 *   // Read file buffer
 *   const fileBuffer = await fs.promises.readFile(filePath);
 *
 *   // Return PDF with proper headers
 *   return new NextResponse(fileBuffer, {
 *     headers: {
 *       'Content-Type': 'application/pdf',
 *       'Content-Disposition': 'inline',
 *       'Cache-Control': 'public, max-age=31536000',
 *     },
 *   });
 * }
 *
 * Option 3: Use cloud storage URLs
 * ---------------------------------
 * If you're using AWS S3, Azure Blob, or similar:
 *
 * fileUrl: `https://your-bucket.s3.amazonaws.com/pdfs/${project.id}.pdf`
 */
