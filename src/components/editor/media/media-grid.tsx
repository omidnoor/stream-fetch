"use client";

import { useCallback } from "react";
import { cn } from "@/lib/utils";
import { MediaItem } from "./media-item";
import type { MediaGridProps, MediaAsset } from "@/lib/editor/types";

/**
 * MediaGrid Component
 *
 * Displays a grid or list of media assets.
 * Handles selection, drag, and delete operations.
 */
export function MediaGrid({
  assets,
  selectedIds,
  viewMode,
  onAssetSelect,
  onAssetDoubleClick,
  onAssetDragStart,
  onAssetDelete,
  className,
}: MediaGridProps) {
  const handleSelect = useCallback(
    (assetId: string) => {
      onAssetSelect(assetId);
    },
    [onAssetSelect]
  );

  const handleDoubleClick = useCallback(
    (asset: MediaAsset) => {
      onAssetDoubleClick?.(asset);
    },
    [onAssetDoubleClick]
  );

  const handleDragStart = useCallback(
    (asset: MediaAsset) => {
      onAssetDragStart?.(asset);
    },
    [onAssetDragStart]
  );

  const handleDelete = useCallback(
    (assetId: string) => {
      onAssetDelete?.(assetId);
    },
    [onAssetDelete]
  );

  if (assets.length === 0) {
    return (
      <div
        className={cn(
          "flex items-center justify-center h-40 text-muted-foreground",
          className
        )}
      >
        <p className="text-sm">No media assets</p>
      </div>
    );
  }

  if (viewMode === "list") {
    return (
      <div className={cn("flex flex-col gap-1", className)}>
        {assets.map((asset) => (
          <MediaItem
            key={asset.id}
            asset={asset}
            isSelected={selectedIds.includes(asset.id)}
            viewMode="list"
            onSelect={() => handleSelect(asset.id)}
            onDoubleClick={() => handleDoubleClick(asset)}
            onDragStart={() => handleDragStart(asset)}
            onDelete={onAssetDelete ? () => handleDelete(asset.id) : undefined}
          />
        ))}
      </div>
    );
  }

  // Grid view
  return (
    <div
      className={cn(
        "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3",
        className
      )}
    >
      {assets.map((asset) => (
        <MediaItem
          key={asset.id}
          asset={asset}
          isSelected={selectedIds.includes(asset.id)}
          viewMode="grid"
          onSelect={() => handleSelect(asset.id)}
          onDoubleClick={() => handleDoubleClick(asset)}
          onDragStart={() => handleDragStart(asset)}
          onDelete={onAssetDelete ? () => handleDelete(asset.id) : undefined}
        />
      ))}
    </div>
  );
}
