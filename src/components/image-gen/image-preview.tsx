"use client";

import { useState } from "react";
import { Download, ZoomIn, ZoomOut, RotateCcw, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GeneratedImage {
  base64: string;
  mimeType: string;
}

interface ImagePreviewProps {
  images: GeneratedImage[];
  text?: string;
}

export function ImagePreview({ images, text }: ImagePreviewProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [zoom, setZoom] = useState(1);

  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-muted-foreground">
        <div className="w-24 h-24 rounded-full bg-surface-2 flex items-center justify-center mb-4">
          <Maximize2 className="w-10 h-10" />
        </div>
        <p className="text-lg font-medium">No images yet</p>
        <p className="text-sm">Enter a prompt to generate images</p>
      </div>
    );
  }

  const currentImage = images[selectedIndex];
  const imageSrc = `data:${currentImage.mimeType};base64,${currentImage.base64}`;

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = imageSrc;
    link.download = `generated-image-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 3));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.5));
  const handleResetZoom = () => setZoom(1);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2 bg-surface-1">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleZoomOut} disabled={zoom <= 0.5}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground w-16 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button variant="ghost" size="sm" onClick={handleZoomIn} disabled={zoom >= 3}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleResetZoom}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={handleDownload} className="gap-2">
          <Download className="h-4 w-4" />
          Download
        </Button>
      </div>

      {/* Image Display */}
      <div className="flex-1 overflow-auto bg-surface-0 p-4">
        <div className="flex items-center justify-center min-h-full">
          <img
            src={imageSrc}
            alt="Generated image"
            className="max-w-full rounded-lg shadow-lg transition-transform duration-200"
            style={{ transform: `scale(${zoom})`, transformOrigin: "center" }}
          />
        </div>
      </div>

      {/* Multiple Images Selector */}
      {images.length > 1 && (
        <div className="border-t border-border px-4 py-3 bg-surface-1">
          <div className="flex gap-2 overflow-x-auto">
            {images.map((img, index) => (
              <button
                key={index}
                onClick={() => setSelectedIndex(index)}
                className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                  index === selectedIndex
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-border hover:border-muted-foreground"
                }`}
              >
                <img
                  src={`data:${img.mimeType};base64,${img.base64}`}
                  alt={`Generated ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* AI Response Text */}
      {text && (
        <div className="border-t border-border px-4 py-3 bg-surface-1">
          <p className="text-sm text-muted-foreground">{text}</p>
        </div>
      )}
    </div>
  );
}
