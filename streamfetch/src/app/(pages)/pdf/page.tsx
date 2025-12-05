"use client";

/**
 * PDF Editor Page
 *
 * Main PDF editing interface
 * - Loads and displays PDF
 * - Provides annotation tools
 * - Handles editing operations
 */

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FileText, Upload, Save, Download as DownloadIcon, Settings, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Link from "next/link";

interface PDFProjectDto {
  id: string;
  name: string;
  status: string;
  pageCount: number;
  fileSize: number;
  annotationCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function PDFEditorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");

  const [project, setProject] = useState<PDFProjectDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (projectId) {
      fetchProject(projectId);
    } else {
      // Redirect to projects page if no project ID
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
          <Button variant="outline" size="sm" className="border-gray-700">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm text-gray-400 px-2">100%</span>
          <Button variant="outline" size="sm" className="border-gray-700">
            <ZoomIn className="h-4 w-4" />
          </Button>

          <div className="h-6 w-px bg-gray-700 mx-2" />

          <Button variant="outline" size="sm" className="border-gray-700">
            <Save className="h-4 w-4 mr-2" />
            Save
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
        <div className="w-48 border-r border-gray-800 bg-[#0f0f0f] overflow-y-auto">
          <div className="p-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">
              Pages
            </h3>
            <div className="space-y-2">
              {Array.from({ length: project.pageCount }, (_, i) => (
                <div
                  key={i}
                  className="aspect-[8.5/11] bg-gray-900 border border-gray-800 rounded cursor-pointer hover:border-primary transition-colors flex items-center justify-center"
                >
                  <span className="text-xs text-gray-600">{i + 1}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center - PDF Viewer */}
        <div className="flex-1 flex items-center justify-center bg-[#0a0a0a] p-8 overflow-auto">
          <div className="bg-white rounded shadow-2xl w-full max-w-4xl aspect-[8.5/11] flex items-center justify-center">
            <div className="text-center text-gray-400">
              <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">PDF Viewer Coming Soon</p>
              <p className="text-sm">
                PDF.js integration will be added in the next phase
              </p>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Tools & Properties */}
        <div className="w-80 border-l border-gray-800 bg-[#0f0f0f] overflow-y-auto">
          <div className="p-4">
            <h3 className="text-sm font-semibold text-white mb-4">
              Annotation Tools
            </h3>

            <div className="space-y-2 mb-6">
              <Button
                variant="outline"
                className="w-full justify-start border-gray-700 hover:bg-gray-800"
              >
                <span className="mr-2">T</span> Text
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start border-gray-700 hover:bg-gray-800"
              >
                <span className="mr-2">✏️</span> Draw
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start border-gray-700 hover:bg-gray-800"
              >
                <span className="mr-2">⬜</span> Shape
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start border-gray-700 hover:bg-gray-800"
              >
                <span className="mr-2">🖍️</span> Highlight
              </Button>
            </div>

            <h3 className="text-sm font-semibold text-white mb-4 mt-8">
              Properties
            </h3>

            <div className="text-sm text-gray-400">
              <p className="mb-2">Select an annotation to edit properties</p>
            </div>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="border-t border-gray-800 bg-[#1a1a1a] px-6 py-2">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div>Page 1 of {project.pageCount}</div>
          <div className="flex items-center gap-4">
            <span>Status: {project.status}</span>
            <span>Auto-save: Enabled</span>
          </div>
        </div>
      </div>
    </div>
  );
}
