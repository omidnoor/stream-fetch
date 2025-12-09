"use client";

import { useReducer, useCallback, useEffect, useMemo } from "react";
import type {
  MediaAsset,
  MediaAssetType,
  MediaLibraryState,
  MediaLibraryAction,
} from "@/lib/editor/types";

/**
 * API response shape for media assets
 */
interface MediaAssetResponse {
  id: string;
  type: MediaAssetType;
  filename: string;
  size: number;
  mimeType: string;
  thumbnail?: string;
  duration?: number;
  width?: number;
  height?: number;
  createdAt: string;
}

/**
 * Initial state for media library
 */
const initialState: MediaLibraryState = {
  assets: [],
  loading: false,
  error: null,
  filter: "all",
  searchQuery: "",
  viewMode: "grid",
  selectedAssetIds: [],
};

/**
 * Media library reducer
 */
function mediaLibraryReducer(
  state: MediaLibraryState,
  action: MediaLibraryAction
): MediaLibraryState {
  switch (action.type) {
    case "SET_ASSETS":
      return { ...state, assets: action.payload, loading: false };

    case "ADD_ASSET":
      return { ...state, assets: [...state.assets, action.payload] };

    case "REMOVE_ASSET":
      return {
        ...state,
        assets: state.assets.filter((a) => a.id !== action.payload),
        selectedAssetIds: state.selectedAssetIds.filter(
          (id) => id !== action.payload
        ),
      };

    case "SET_LOADING":
      return { ...state, loading: action.payload };

    case "SET_ERROR":
      return { ...state, error: action.payload, loading: false };

    case "SET_FILTER":
      return { ...state, filter: action.payload };

    case "SET_SEARCH":
      return { ...state, searchQuery: action.payload };

    case "SET_VIEW_MODE":
      return { ...state, viewMode: action.payload };

    case "SELECT_ASSET":
      if (state.selectedAssetIds.includes(action.payload)) {
        return state;
      }
      return {
        ...state,
        selectedAssetIds: [...state.selectedAssetIds, action.payload],
      };

    case "DESELECT_ASSET":
      return {
        ...state,
        selectedAssetIds: state.selectedAssetIds.filter(
          (id) => id !== action.payload
        ),
      };

    case "CLEAR_SELECTION":
      return { ...state, selectedAssetIds: [] };

    default:
      return state;
  }
}

/**
 * Transform API response to MediaAsset
 */
function transformAsset(response: MediaAssetResponse): MediaAsset {
  return {
    id: response.id,
    projectId: "", // Will be set by the hook
    type: response.type,
    filename: response.filename,
    originalFilename: response.filename,
    path: "", // Server-side only
    size: response.size,
    mimeType: response.mimeType,
    thumbnail: response.thumbnail,
    metadata: {
      duration: response.duration,
      width: response.width,
      height: response.height,
    },
    createdAt: new Date(response.createdAt),
    updatedAt: new Date(response.createdAt),
  };
}

/**
 * useMediaLibrary Hook
 *
 * Manages the media library state for a project including:
 * - Fetching and caching assets
 * - Uploading new assets
 * - Deleting assets
 * - Filtering and searching
 * - Selection management
 */
export function useMediaLibrary(projectId: string) {
  const [state, dispatch] = useReducer(mediaLibraryReducer, initialState);

  /**
   * Fetch assets from API
   */
  const fetchAssets = useCallback(async () => {
    if (!projectId) return;

    dispatch({ type: "SET_LOADING", payload: true });
    dispatch({ type: "SET_ERROR", payload: null });

    try {
      const response = await fetch(`/api/editor/project/${projectId}/media`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to fetch assets");
      }

      const assets = data.data.map((item: MediaAssetResponse) => ({
        ...transformAsset(item),
        projectId,
      }));

      dispatch({ type: "SET_ASSETS", payload: assets });
    } catch (error) {
      console.error("[useMediaLibrary] Fetch error:", error);
      dispatch({
        type: "SET_ERROR",
        payload: error instanceof Error ? error.message : "Failed to load assets",
      });
    }
  }, [projectId]);

  /**
   * Upload a new asset
   */
  const uploadAsset = useCallback(
    async (file: File): Promise<MediaAsset | null> => {
      if (!projectId) return null;

      dispatch({ type: "SET_ERROR", payload: null });

      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(`/api/editor/project/${projectId}/media`, {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error?.message || "Upload failed");
        }

        const asset: MediaAsset = {
          ...transformAsset(data.data),
          projectId,
        };

        dispatch({ type: "ADD_ASSET", payload: asset });

        return asset;
      } catch (error) {
        console.error("[useMediaLibrary] Upload error:", error);
        dispatch({
          type: "SET_ERROR",
          payload: error instanceof Error ? error.message : "Upload failed",
        });
        return null;
      }
    },
    [projectId]
  );

  /**
   * Delete an asset
   */
  const deleteAsset = useCallback(
    async (assetId: string): Promise<boolean> => {
      if (!projectId) return false;

      try {
        const response = await fetch(
          `/api/editor/project/${projectId}/media/${assetId}`,
          { method: "DELETE" }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error?.message || "Delete failed");
        }

        dispatch({ type: "REMOVE_ASSET", payload: assetId });
        return true;
      } catch (error) {
        console.error("[useMediaLibrary] Delete error:", error);
        dispatch({
          type: "SET_ERROR",
          payload: error instanceof Error ? error.message : "Delete failed",
        });
        return false;
      }
    },
    [projectId]
  );

  /**
   * Set filter
   */
  const setFilter = useCallback((filter: MediaAssetType | "all") => {
    dispatch({ type: "SET_FILTER", payload: filter });
  }, []);

  /**
   * Set search query
   */
  const setSearchQuery = useCallback((query: string) => {
    dispatch({ type: "SET_SEARCH", payload: query });
  }, []);

  /**
   * Set view mode
   */
  const setViewMode = useCallback((mode: "grid" | "list") => {
    dispatch({ type: "SET_VIEW_MODE", payload: mode });
  }, []);

  /**
   * Select an asset
   */
  const selectAsset = useCallback((assetId: string) => {
    dispatch({ type: "SELECT_ASSET", payload: assetId });
  }, []);

  /**
   * Deselect an asset
   */
  const deselectAsset = useCallback((assetId: string) => {
    dispatch({ type: "DESELECT_ASSET", payload: assetId });
  }, []);

  /**
   * Toggle asset selection
   */
  const toggleAssetSelection = useCallback(
    (assetId: string) => {
      if (state.selectedAssetIds.includes(assetId)) {
        dispatch({ type: "DESELECT_ASSET", payload: assetId });
      } else {
        dispatch({ type: "SELECT_ASSET", payload: assetId });
      }
    },
    [state.selectedAssetIds]
  );

  /**
   * Clear selection
   */
  const clearSelection = useCallback(() => {
    dispatch({ type: "CLEAR_SELECTION" });
  }, []);

  /**
   * Get asset by ID
   */
  const getAsset = useCallback(
    (assetId: string): MediaAsset | undefined => {
      return state.assets.find((a) => a.id === assetId);
    },
    [state.assets]
  );

  /**
   * Filtered and searched assets
   */
  const filteredAssets = useMemo(() => {
    let result = state.assets;

    // Apply type filter
    if (state.filter !== "all") {
      result = result.filter((a) => a.type === state.filter);
    }

    // Apply search
    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase();
      result = result.filter((a) =>
        a.originalFilename.toLowerCase().includes(query)
      );
    }

    // Sort by created date (newest first)
    result = [...result].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );

    return result;
  }, [state.assets, state.filter, state.searchQuery]);

  /**
   * Selected assets
   */
  const selectedAssets = useMemo(() => {
    return state.assets.filter((a) => state.selectedAssetIds.includes(a.id));
  }, [state.assets, state.selectedAssetIds]);

  /**
   * Asset counts by type
   */
  const assetCounts = useMemo(() => {
    const counts = {
      all: state.assets.length,
      video: 0,
      audio: 0,
      image: 0,
    };

    state.assets.forEach((asset) => {
      counts[asset.type]++;
    });

    return counts;
  }, [state.assets]);

  // Fetch assets on mount
  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  return {
    // State
    assets: state.assets,
    filteredAssets,
    selectedAssets,
    loading: state.loading,
    error: state.error,
    filter: state.filter,
    searchQuery: state.searchQuery,
    viewMode: state.viewMode,
    selectedAssetIds: state.selectedAssetIds,
    assetCounts,

    // Actions
    fetchAssets,
    uploadAsset,
    deleteAsset,
    setFilter,
    setSearchQuery,
    setViewMode,
    selectAsset,
    deselectAsset,
    toggleAssetSelection,
    clearSelection,
    getAsset,
  };
}

export type UseMediaLibraryReturn = ReturnType<typeof useMediaLibrary>;
