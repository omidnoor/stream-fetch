"use client";

/**
 * PDF Editor Page
 *
 * Main PDF editing interface
 * - Loads and displays PDF
 * - Provides annotation tools
 * - Handles editing operations
 */

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAnnotations } from "@/lib/pdf/annotations";
import { FileText, Upload, Save, Download as DownloadIcon, Settings, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Link from "next/link";
import dynamic from "next/dynamic";
import { PDFJS_OPTIONS } from "@/lib/pdf/pdfjs.config";
import { AnnotationProvider } from "@/lib/pdf/annotations";
import type { PDFDocumentProxy } from "pdfjs-dist";

// Dynamically import PDF components to avoid SSR issues
const AnnotatablePDFViewer = dynamic(
  () => import("@/components/pdf/AnnotatablePDFViewer").then((mod) => ({ default: mod.AnnotatablePDFViewer })),
  { ssr: false }
);

const PDFThumbnail = dynamic(() => import("@/components/pdf/PDFThumbnail"), {
  ssr: false,
});

const PDFZoomControls = dynamic(
  () => import("@/components/pdf/PDFZoomControls").then((mod) => ({ default: mod.PDFZoomControls })),
  { ssr: false }
);

const AnnotationToolbar = dynamic(() => import("@/components/pdf/AnnotationToolbar").then((mod) => ({ default: mod.AnnotationToolbar })), {
  ssr: false,
});

const AnnotationProperties = dynamic(() => import("@/components/pdf/AnnotationProperties").then((mod) => ({ default: mod.AnnotationProperties })), {
  ssr: false,
});

interface PDFProjectDto {
  id: string;
  name: string;
  status: string;
  pageCount: number;
  fileSize: number;
  annotationCount: number;
  fileUrl?: string;
  createdAt: string;
  updatedAt: string;
}

function PDFEditorContent({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [project, setProject] = useState<PDFProjectDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState<number>(PDFJS_OPTIONS.defaultScale);
  const [pdfFileUrl, setPdfFileUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { getAllAnnotations, loadAnnotations } = useAnnotations();

  useEffect(() => {
    if (projectId) {
      fetchProject(projectId);
      loadProjectAnnotations(projectId);
    }
  }, [projectId]);

  const fetchProject = async (id: string) => {
    try {
      const response = await fetch(`/api/pdf/project/${id}`);
      const data = await response.json();

      if (data.success) {
        setProject(data.data);
        // Use the actual file URL from the project
        if (data.data.fileUrl) {
          setPdfFileUrl(data.data.fileUrl);
        } else {
          toast.error("No PDF file found in project");
        }
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

  const handleDocumentLoad = (pdf: PDFDocumentProxy) => {
    setPdfDoc(pdf);
  };

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const handleZoomChange = (newScale: number) => {
    setScale(newScale);
  };

  const loadProjectAnnotations = async (id: string) => {
    try {
      const response = await fetch(`/api/pdf/project/${id}/annotations`);
      const data = await response.json();

      if (data.success && data.data) {
        // Convert object to Map
        const annotationsMap = new Map();
        Object.entries(data.data).forEach(([pageNum, annotations]) => {
          annotationsMap.set(parseInt(pageNum), annotations);
        });
        loadAnnotations(annotationsMap);
      }
    } catch (error) {
      console.error("Failed to load annotations:", error);
    }
  };

  const handleSaveAnnotations = useCallback(async () => {
    if (!projectId) return;

    try {
      setSaving(true);
      const annotations = getAllAnnotations();

      // Convert Map to plain object for JSON serialization
      const annotationsObj: Record<string, any> = {};
      annotations.forEach((value, key) => {
        annotationsObj[key.toString()] = value;
      });

      const response = await fetch(`/api/pdf/project/${projectId}/annotations`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ annotations: annotationsObj }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Annotations saved successfully");
      } else {
        toast.error("Failed to save annotations");
      }
    } catch (error) {
      console.error("Failed to save annotations:", error);
      toast.error("Failed to save annotations");
    } finally {
      setSaving(false);
    }
  }, [projectId, getAllAnnotations]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-muted-foreground">Loading PDF editor...</div>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <div className="flex flex-col h-screen bg-background">
        {/* Toolbar */}
        <div className="flex items-center justify-between border-b border-border bg-surface-2 px-6 py-3">
        <div className="flex items-center gap-4">
          <Link href="/pdf/projects">
            <Button variant="outline" size="sm" className="border-border">
              <FileText className="h-4 w-4 mr-2" />
              Projects
            </Button>
          </Link>

          <div className="h-6 w-px bg-gray-700" />

          <div>
            <h1 className="text-lg font-semibold text-white">{project.name}</h1>
            <p className="text-xs text-muted-foreground">
              {project.pageCount} pages • {project.annotationCount} annotations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <PDFZoomControls
            scale={scale}
            onZoomChange={handleZoomChange}
          />

          <div className="h-6 w-px bg-gray-700 mx-2" />

          <Button
            variant="outline"
            size="sm"
            className="border-border"
            onClick={handleSaveAnnotations}
            disabled={saving}
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save"}
          </Button>
          <Button className="bg-primary hover:bg-primary/90" size="sm">
            <DownloadIcon className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Page Thumbnails */}
        <div className="w-48 border-r border-border bg-surface-1 overflow-y-auto">
          <div className="p-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-3">
              Pages
            </h3>
            <div className="space-y-2">
              {pdfDoc &&
                Array.from({ length: pdfDoc.numPages }, (_, i) => (
                  <PDFThumbnail
                    key={i + 1}
                    pdfDoc={pdfDoc}
                    pageNum={i + 1}
                    isActive={currentPage === i + 1}
                    onClick={handlePageChange}
                  />
                ))}
              {!pdfDoc &&
                Array.from({ length: project.pageCount }, (_, i) => (
                  <div
                    key={i}
                    className="aspect-[8.5/11] bg-surface-1 border border-border rounded flex items-center justify-center"
                  >
                    <span className="text-xs text-muted-foreground">{i + 1}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Center - PDF Viewer */}
        <div className="flex-1 bg-background overflow-hidden">
          {pdfFileUrl ? (
            <AnnotatablePDFViewer
              fileUrl={pdfFileUrl}
              currentPage={currentPage}
              scale={scale}
              onPageChange={handlePageChange}
              onDocumentLoad={handleDocumentLoad}
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="text-center text-muted-foreground">
                <FileText className="h-16 w-16 mx-auto mb-4 text-foreground" />
                <p className="text-lg font-medium mb-2">No PDF Loaded</p>
                <p className="text-sm">Upload a PDF to get started</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar - Tools & Properties */}
        <div className="w-80 border-l border-border bg-surface-1 overflow-y-auto">
          <div className="p-4">
            <AnnotationToolbar />

            <div className="mt-8">
              <AnnotationProperties />
            </div>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="border-t border-border bg-surface-2 px-6 py-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div>
            Page {currentPage} of {pdfDoc?.numPages || project.pageCount}
          </div>
          <div className="flex items-center gap-4">
            <span>Status: {project.status}</span>
            <span>Zoom: {Math.round(scale * 100)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function PDFEditorPageInner() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");
  const router = useRouter();

  useEffect(() => {
    if (!projectId) {
      router.push("/pdf/projects");
    }
  }, [projectId, router]);

  if (!projectId) {
    return null;
  }

  return (
    <AnnotationProvider>
      <PDFEditorContent projectId={projectId} />
    </AnnotationProvider>
  );
}

export default function PDFEditorPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-muted-foreground">Loading PDF editor...</div>
      </div>
    }>
      <PDFEditorPageInner />
    </Suspense>
  );
}
