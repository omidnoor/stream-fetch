"use client";

import { useState, useCallback } from "react";
import {
  Search,
  Grid,
  List,
  Video,
  Music,
  Image,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MediaGrid } from "./media-grid";
import { MediaUploader } from "./media-uploader";
import { useMediaLibrary } from "@/hooks/useMediaLibrary";
import type { MediaLibraryProps, MediaAsset, MediaAssetType } from "@/lib/editor/types";

/**
 * Filter button component
 */
function FilterButton({
  type,
  label,
  icon: Icon,
  count,
  isActive,
  onClick,
}: {
  type: MediaAssetType | "all";
  label: string;
  icon: React.ElementType;
  count: number;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      variant={isActive ? "secondary" : "ghost"}
      size="sm"
      className="gap-1.5"
      onClick={onClick}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
      <span className="text-xs text-muted-foreground">({count})</span>
    </Button>
  );
}

/**
 * MediaLibrary Component
 *
 * Main panel for managing project media assets.
 * Includes upload, filtering, searching, and asset display.
 */
export function MediaLibrary({
  projectId,
  onAssetSelect,
  onAssetDragStart,
  className,
}: MediaLibraryProps) {
  const [showUploader, setShowUploader] = useState(false);

  const {
    filteredAssets,
    loading,
    error,
    filter,
    searchQuery,
    viewMode,
    selectedAssetIds,
    assetCounts,
    fetchAssets,
    uploadAsset,
    deleteAsset,
    setFilter,
    setSearchQuery,
    setViewMode,
    toggleAssetSelection,
    clearSelection,
    getAsset,
  } = useMediaLibrary(projectId);

  /**
   * Handle asset selection
   */
  const handleAssetSelect = useCallback(
    (assetId: string) => {
      toggleAssetSelection(assetId);
      const asset = getAsset(assetId);
      if (asset) {
        onAssetSelect?.(asset);
      }
    },
    [toggleAssetSelection, getAsset, onAssetSelect]
  );

  /**
   * Handle asset double click (add to timeline)
   */
  const handleAssetDoubleClick = useCallback(
    (asset: MediaAsset) => {
      onAssetSelect?.(asset);
    },
    [onAssetSelect]
  );

  /**
   * Handle drag start
   */
  const handleDragStart = useCallback(
    (asset: MediaAsset) => {
      onAssetDragStart?.(asset);
    },
    [onAssetDragStart]
  );

  /**
   * Handle delete with confirmation
   */
  const handleDelete = useCallback(
    async (assetId: string) => {
      const asset = getAsset(assetId);
      if (!asset) return;

      const confirmed = window.confirm(
        `Delete "${asset.originalFilename}"? This cannot be undone.`
      );

      if (confirmed) {
        await deleteAsset(assetId);
      }
    },
    [getAsset, deleteAsset]
  );

  /**
   * Handle upload complete
   */
  const handleUploadComplete = useCallback(
    (asset: MediaAsset) => {
      // Asset is already added to library by the hook
      setShowUploader(false);
    },
    []
  );

  return (
    <div className={cn("flex flex-col h-full bg-surface-1 rounded-lg border border-border", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <h3 className="font-semibold text-sm">Media Library</h3>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => fetchAssets()}
            title="Refresh"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
          </Button>
          <Button
            variant={showUploader ? "secondary" : "default"}
            size="sm"
            onClick={() => setShowUploader(!showUploader)}
          >
            {showUploader ? "Cancel" : "Upload"}
          </Button>
        </div>
      </div>

      {/* Uploader (collapsible) */}
      {showUploader && (
        <div className="p-3 border-b border-border">
          <MediaUploader
            projectId={projectId}
            onUploadComplete={handleUploadComplete}
          />
        </div>
      )}

      {/* Search & Filters */}
      <div className="p-3 space-y-2 border-b border-border">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search assets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-8"
          />
        </div>

        {/* Filter & View toggles */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 flex-wrap">
            <FilterButton
              type="all"
              label="All"
              icon={Grid}
              count={assetCounts.all}
              isActive={filter === "all"}
              onClick={() => setFilter("all")}
            />
            <FilterButton
              type="video"
              label="Video"
              icon={Video}
              count={assetCounts.video}
              isActive={filter === "video"}
              onClick={() => setFilter("video")}
            />
            <FilterButton
              type="audio"
              label="Audio"
              icon={Music}
              count={assetCounts.audio}
              isActive={filter === "audio"}
              onClick={() => setFilter("audio")}
            />
            <FilterButton
              type="image"
              label="Image"
              icon={Image}
              count={assetCounts.image}
              isActive={filter === "image"}
              onClick={() => setFilter("image")}
            />
          </div>

          {/* View mode toggle */}
          <div className="flex items-center gap-1">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              className="h-7 w-7"
              onClick={() => setViewMode("grid")}
              title="Grid view"
            >
              <Grid className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              className="h-7 w-7"
              onClick={() => setViewMode("list")}
              title="List view"
            >
              <List className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-3">
        {loading && filteredAssets.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <AlertCircle className="w-8 h-8 text-destructive mb-2" />
            <p className="text-sm text-destructive">{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => fetchAssets()}
            >
              Retry
            </Button>
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center text-muted-foreground">
            <p className="text-sm">
              {searchQuery
                ? "No assets match your search"
                : "No media assets yet"}
            </p>
            {!searchQuery && (
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => setShowUploader(true)}
              >
                Upload Media
              </Button>
            )}
          </div>
        ) : (
          <MediaGrid
            assets={filteredAssets}
            selectedIds={selectedAssetIds}
            viewMode={viewMode}
            onAssetSelect={handleAssetSelect}
            onAssetDoubleClick={handleAssetDoubleClick}
            onAssetDragStart={handleDragStart}
            onAssetDelete={handleDelete}
          />
        )}
      </div>

      {/* Footer */}
      {selectedAssetIds.length > 0 && (
        <div className="p-2 border-t border-border flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            {selectedAssetIds.length} selected
          </span>
          <Button variant="ghost" size="sm" onClick={clearSelection}>
            Clear
          </Button>
        </div>
      )}
    </div>
  );
}
