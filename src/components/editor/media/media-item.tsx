"use client";

import { useCallback, useState } from "react";
import { Video, Music, Image, Trash2, Clock, HardDrive } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { formatTime } from "@/lib/editor/utils";
import type { MediaItemProps } from "@/lib/editor/types";

/**
 * Format file size for display
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

/**
 * Get icon for asset type
 */
function getAssetIcon(type: string) {
  switch (type) {
    case "video":
      return Video;
    case "audio":
      return Music;
    case "image":
      return Image;
    default:
      return Video;
  }
}

/**
 * MediaItem Component
 *
 * Displays a single media asset in the library.
 * Supports grid and list view modes.
 */
export function MediaItem({
  asset,
  isSelected,
  viewMode,
  onSelect,
  onDoubleClick,
  onDragStart,
  onDelete,
  className,
}: MediaItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);

  const AssetIcon = getAssetIcon(asset.type);

  /**
   * Handle drag start
   */
  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      e.dataTransfer.setData("application/json", JSON.stringify(asset));
      e.dataTransfer.effectAllowed = "copy";
      onDragStart?.();
    },
    [asset, onDragStart]
  );

  /**
   * Handle delete click
   */
  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onDelete?.();
    },
    [onDelete]
  );

  if (viewMode === "list") {
    // List view
    return (
      <div
        className={cn(
          "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors",
          "hover:bg-surface-2",
          isSelected && "bg-primary/10 ring-1 ring-primary",
          className
        )}
        onClick={onSelect}
        onDoubleClick={onDoubleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        draggable
        onDragStart={handleDragStart}
      >
        {/* Thumbnail/Icon */}
        <div className="relative w-12 h-12 flex-shrink-0 rounded bg-surface-3 overflow-hidden">
          {asset.thumbnail && !imageError ? (
            <img
              src={asset.thumbnail}
              alt={asset.originalFilename}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <AssetIcon className="w-6 h-6 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{asset.originalFilename}</p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {asset.metadata.duration && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatTime(asset.metadata.duration)}
              </span>
            )}
            <span className="flex items-center gap-1">
              <HardDrive className="w-3 h-3" />
              {formatFileSize(asset.size)}
            </span>
          </div>
        </div>

        {/* Actions */}
        {(isHovered || isSelected) && onDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={handleDelete}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>
    );
  }

  // Grid view
  return (
    <div
      className={cn(
        "relative group rounded-lg overflow-hidden cursor-pointer transition-all",
        "border border-border hover:border-primary/50",
        isSelected && "ring-2 ring-primary border-primary",
        className
      )}
      onClick={onSelect}
      onDoubleClick={onDoubleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      draggable
      onDragStart={handleDragStart}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-surface-3">
        {asset.thumbnail && !imageError ? (
          <img
            src={asset.thumbnail}
            alt={asset.originalFilename}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <AssetIcon className="w-12 h-12 text-muted-foreground" />
          </div>
        )}

        {/* Duration badge */}
        {asset.metadata.duration && (
          <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/70 rounded text-xs text-white">
            {formatTime(asset.metadata.duration)}
          </div>
        )}

        {/* Type badge */}
        <div className="absolute top-1 left-1 p-1 bg-black/50 rounded">
          <AssetIcon className="w-3.5 h-3.5 text-white" />
        </div>

        {/* Delete button (on hover) */}
        {onDelete && (
          <div
            className={cn(
              "absolute top-1 right-1 transition-opacity",
              isHovered || isSelected ? "opacity-100" : "opacity-0"
            )}
          >
            <Button
              variant="secondary"
              size="icon"
              className="h-6 w-6 bg-black/50 hover:bg-destructive"
              onClick={handleDelete}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        )}

        {/* Selection overlay */}
        {isSelected && (
          <div className="absolute inset-0 bg-primary/10 pointer-events-none" />
        )}
      </div>

      {/* Info */}
      <div className="p-2">
        <p className="text-xs font-medium truncate" title={asset.originalFilename}>
          {asset.originalFilename}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatFileSize(asset.size)}
        </p>
      </div>
    </div>
  );
}
