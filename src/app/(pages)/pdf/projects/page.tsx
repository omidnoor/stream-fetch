"use client";

/**
 * PDF Projects Page
 *
 * Lists all PDF editing projects with ability to:
 * - Create new project
 * - Upload PDF files
 * - View existing projects
 * - Open projects in editor
 * - Delete projects
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FileText, Upload, Trash2, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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

export default function PDFProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<PDFProjectDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/pdf/project");
      const data = await response.json();

      if (data.success) {
        setProjects(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Please upload a PDF file");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", file.name.replace(".pdf", ""));

      const response = await fetch("/api/pdf/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        toast.success("PDF uploaded successfully!");
        // Refresh projects list
        fetchProjects();
        // Navigate to editor
        router.push(`/pdf?projectId=${data.data.id}`);
      } else {
        toast.error(data.error || "Failed to upload PDF");
      }
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Failed to upload PDF");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (projectId: string) => {
    if (!confirm("Are you sure you want to delete this project?")) {
      return;
    }

    try {
      const response = await fetch(`/api/pdf/project/${projectId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Project deleted successfully");
        fetchProjects();
      } else {
        toast.error(data.error || "Failed to delete project");
      }
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error("Failed to delete project");
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">PDF Projects</h1>
            <p className="text-muted-foreground">Manage your PDF editing projects</p>
          </div>

          {/* Upload Button */}
          <label htmlFor="pdf-upload">
            <Button
              disabled={uploading}
              className="bg-primary hover:bg-primary/90"
              asChild
            >
              <span className="cursor-pointer">
                <Upload className="h-5 w-5 mr-2" />
                {uploading ? "Uploading..." : "Upload PDF"}
              </span>
            </Button>
            <input
              id="pdf-upload"
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleUpload}
              className="hidden"
            />
          </label>
        </div>

        {/* Projects Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-muted-foreground">Loading projects...</div>
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-border rounded-lg">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              No PDF projects yet
            </h2>
            <p className="text-muted-foreground mb-6">
              Upload a PDF to get started with editing
            </p>
            <label htmlFor="pdf-upload-empty">
              <Button className="bg-primary hover:bg-primary/90" asChild>
                <span className="cursor-pointer">
                  <Upload className="h-5 w-5 mr-2" />
                  Upload Your First PDF
                </span>
              </Button>
              <input
                id="pdf-upload-empty"
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleUpload}
                className="hidden"
              />
            </label>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-surface-2 border border-border rounded-lg p-6 hover:border-border transition-colors"
              >
                {/* Project Icon */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      project.status === "completed"
                        ? "bg-green-500/10 text-green-500"
                        : project.status === "processing"
                        ? "bg-yellow-500/10 text-yellow-500"
                        : project.status === "failed"
                        ? "bg-red-500/10 text-red-500"
                        : "bg-gray-500/10 text-muted-foreground"
                    }`}
                  >
                    {project.status}
                  </span>
                </div>

                {/* Project Info */}
                <h3 className="text-lg font-semibold text-white mb-2 truncate">
                  {project.name}
                </h3>

                <div className="space-y-1 mb-4">
                  <p className="text-sm text-muted-foreground">
                    {project.pageCount} page{project.pageCount !== 1 ? "s" : ""}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(project.fileSize)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {project.annotationCount} annotation
                    {project.annotationCount !== 1 ? "s" : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(project.updatedAt)}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => router.push(`/pdf?projectId=${project.id}`)}
                    className="flex-1 bg-primary hover:bg-primary/90"
                    size="sm"
                  >
                    <FolderOpen className="h-4 w-4 mr-2" />
                    Open
                  </Button>
                  <Button
                    onClick={() => handleDelete(project.id)}
                    variant="outline"
                    size="sm"
                    className="border-border hover:border-red-500 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
