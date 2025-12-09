/**
 * useTextDrag Hook
 *
 * Handles drag and drop positioning of text overlays on the video canvas.
 * Provides smooth drag interactions with boundary constraints.
 */

"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { TextPosition } from "@/lib/editor/types";
import { clamp, pixelsToTextPosition } from "@/lib/editor/utils";

/**
 * Drag state interface
 */
interface DragState {
  isDragging: boolean;
  textId: string | null;
  startX: number;
  startY: number;
  startPosition: TextPosition;
  currentPosition: TextPosition;
}

/**
 * Options for the drag hook
 */
interface UseTextDragOptions {
  /** Canvas width in pixels */
  canvasWidth: number;
  /** Canvas height in pixels */
  canvasHeight: number;
  /** Callback when position changes during drag */
  onPositionChange?: (textId: string, position: TextPosition) => void;
  /** Callback when drag ends */
  onDragEnd?: (textId: string, position: TextPosition) => void;
  /** Whether snapping is enabled */
  enableSnapping?: boolean;
  /** Snap threshold in percentage */
  snapThreshold?: number;
  /** Boundary padding in percentage */
  boundaryPadding?: number;
}

/**
 * Snap points for alignment
 */
const SNAP_POINTS = {
  x: [0, 10, 25, 50, 75, 90, 100],
  y: [0, 10, 25, 50, 75, 90, 100],
};

/**
 * Hook for handling text overlay drag and drop positioning
 */
export function useTextDrag({
  canvasWidth,
  canvasHeight,
  onPositionChange,
  onDragEnd,
  enableSnapping = true,
  snapThreshold = 3,
  boundaryPadding = 0,
}: UseTextDragOptions) {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    textId: null,
    startX: 0,
    startY: 0,
    startPosition: { x: 50, y: 50 },
    currentPosition: { x: 50, y: 50 },
  });

  const containerRef = useRef<HTMLDivElement>(null);

  /**
   * Snap a value to nearby snap points
   */
  const snapToPoint = useCallback(
    (value: number, snapPoints: number[]): number => {
      if (!enableSnapping) return value;

      for (const point of snapPoints) {
        if (Math.abs(value - point) < snapThreshold) {
          return point;
        }
      }
      return value;
    },
    [enableSnapping, snapThreshold]
  );

  /**
   * Calculate position from mouse/touch coordinates
   */
  const calculatePosition = useCallback(
    (clientX: number, clientY: number): TextPosition => {
      if (!containerRef.current) {
        return { x: 50, y: 50 };
      }

      const rect = containerRef.current.getBoundingClientRect();
      const relativeX = clientX - rect.left;
      const relativeY = clientY - rect.top;

      // Convert to percentage
      let x = (relativeX / rect.width) * 100;
      let y = (relativeY / rect.height) * 100;

      // Apply boundary constraints
      const minBound = boundaryPadding;
      const maxBound = 100 - boundaryPadding;
      x = clamp(x, minBound, maxBound);
      y = clamp(y, minBound, maxBound);

      // Apply snapping
      x = snapToPoint(x, SNAP_POINTS.x);
      y = snapToPoint(y, SNAP_POINTS.y);

      return { x, y };
    },
    [boundaryPadding, snapToPoint]
  );

  /**
   * Start dragging a text overlay
   */
  const startDrag = useCallback(
    (
      textId: string,
      initialPosition: TextPosition,
      event: React.MouseEvent | React.TouchEvent
    ) => {
      event.preventDefault();
      event.stopPropagation();

      const clientX =
        "touches" in event ? event.touches[0].clientX : event.clientX;
      const clientY =
        "touches" in event ? event.touches[0].clientY : event.clientY;

      setDragState({
        isDragging: true,
        textId,
        startX: clientX,
        startY: clientY,
        startPosition: initialPosition,
        currentPosition: initialPosition,
      });
    },
    []
  );

  /**
   * Handle drag movement
   */
  const handleDrag = useCallback(
    (event: MouseEvent | TouchEvent) => {
      if (!dragState.isDragging || !dragState.textId) return;

      const clientX =
        "touches" in event ? event.touches[0].clientX : event.clientX;
      const clientY =
        "touches" in event ? event.touches[0].clientY : event.clientY;

      const newPosition = calculatePosition(clientX, clientY);

      setDragState((prev) => ({
        ...prev,
        currentPosition: newPosition,
      }));

      // Call position change callback
      if (onPositionChange && dragState.textId) {
        onPositionChange(dragState.textId, newPosition);
      }
    },
    [dragState.isDragging, dragState.textId, calculatePosition, onPositionChange]
  );

  /**
   * End dragging
   */
  const endDrag = useCallback(() => {
    if (dragState.isDragging && dragState.textId) {
      // Call drag end callback
      if (onDragEnd) {
        onDragEnd(dragState.textId, dragState.currentPosition);
      }
    }

    setDragState((prev) => ({
      ...prev,
      isDragging: false,
      textId: null,
    }));
  }, [dragState.isDragging, dragState.textId, dragState.currentPosition, onDragEnd]);

  /**
   * Cancel dragging (revert to original position)
   */
  const cancelDrag = useCallback(() => {
    if (dragState.isDragging && dragState.textId && onPositionChange) {
      // Revert to original position
      onPositionChange(dragState.textId, dragState.startPosition);
    }

    setDragState((prev) => ({
      ...prev,
      isDragging: false,
      textId: null,
      currentPosition: prev.startPosition,
    }));
  }, [dragState, onPositionChange]);

  /**
   * Get drag handle props for a text element
   */
  const getDragHandleProps = useCallback(
    (textId: string, position: TextPosition) => ({
      onMouseDown: (e: React.MouseEvent) => startDrag(textId, position, e),
      onTouchStart: (e: React.TouchEvent) => startDrag(textId, position, e),
      style: {
        cursor: dragState.isDragging && dragState.textId === textId ? "grabbing" : "grab",
        touchAction: "none",
      },
    }),
    [startDrag, dragState.isDragging, dragState.textId]
  );

  /**
   * Set up global mouse/touch event listeners
   */
  useEffect(() => {
    if (dragState.isDragging) {
      const handleMouseMove = (e: MouseEvent) => handleDrag(e);
      const handleTouchMove = (e: TouchEvent) => handleDrag(e);
      const handleMouseUp = () => endDrag();
      const handleTouchEnd = () => endDrag();
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          cancelDrag();
        }
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("touchmove", handleTouchMove, { passive: false });
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("touchend", handleTouchEnd);
      document.addEventListener("keydown", handleKeyDown);

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("touchmove", handleTouchMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.removeEventListener("touchend", handleTouchEnd);
        document.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [dragState.isDragging, handleDrag, endDrag, cancelDrag]);

  /**
   * Check if a specific text is being dragged
   */
  const isDraggingText = useCallback(
    (textId: string) => dragState.isDragging && dragState.textId === textId,
    [dragState.isDragging, dragState.textId]
  );

  /**
   * Get current position for a text being dragged
   */
  const getCurrentPosition = useCallback(
    (textId: string, originalPosition: TextPosition): TextPosition => {
      if (dragState.isDragging && dragState.textId === textId) {
        return dragState.currentPosition;
      }
      return originalPosition;
    },
    [dragState.isDragging, dragState.textId, dragState.currentPosition]
  );

  return {
    // State
    isDragging: dragState.isDragging,
    draggingTextId: dragState.textId,
    currentPosition: dragState.currentPosition,

    // Refs
    containerRef,

    // Actions
    startDrag,
    endDrag,
    cancelDrag,

    // Helpers
    getDragHandleProps,
    isDraggingText,
    getCurrentPosition,
    calculatePosition,
  };
}

/**
 * Hook for handling resize of text overlays
 */
export function useTextResize({
  canvasWidth,
  canvasHeight,
  onResize,
  minWidth = 10,
  minHeight = 5,
}: {
  canvasWidth: number;
  canvasHeight: number;
  onResize?: (textId: string, width: number, height: number) => void;
  minWidth?: number;
  minHeight?: number;
}) {
  const [resizeState, setResizeState] = useState<{
    isResizing: boolean;
    textId: string | null;
    handle: "ne" | "nw" | "se" | "sw" | "n" | "s" | "e" | "w" | null;
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
  }>({
    isResizing: false,
    textId: null,
    handle: null,
    startX: 0,
    startY: 0,
    startWidth: 0,
    startHeight: 0,
  });

  /**
   * Start resizing
   */
  const startResize = useCallback(
    (
      textId: string,
      handle: typeof resizeState.handle,
      initialWidth: number,
      initialHeight: number,
      event: React.MouseEvent
    ) => {
      event.preventDefault();
      event.stopPropagation();

      setResizeState({
        isResizing: true,
        textId,
        handle,
        startX: event.clientX,
        startY: event.clientY,
        startWidth: initialWidth,
        startHeight: initialHeight,
      });
    },
    []
  );

  /**
   * Handle resize movement
   */
  useEffect(() => {
    if (!resizeState.isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = ((e.clientX - resizeState.startX) / canvasWidth) * 100;
      const deltaY = ((e.clientY - resizeState.startY) / canvasHeight) * 100;

      let newWidth = resizeState.startWidth;
      let newHeight = resizeState.startHeight;

      // Calculate new size based on handle
      switch (resizeState.handle) {
        case "e":
        case "ne":
        case "se":
          newWidth = Math.max(minWidth, resizeState.startWidth + deltaX);
          break;
        case "w":
        case "nw":
        case "sw":
          newWidth = Math.max(minWidth, resizeState.startWidth - deltaX);
          break;
      }

      switch (resizeState.handle) {
        case "s":
        case "se":
        case "sw":
          newHeight = Math.max(minHeight, resizeState.startHeight + deltaY);
          break;
        case "n":
        case "ne":
        case "nw":
          newHeight = Math.max(minHeight, resizeState.startHeight - deltaY);
          break;
      }

      if (onResize && resizeState.textId) {
        onResize(resizeState.textId, newWidth, newHeight);
      }
    };

    const handleMouseUp = () => {
      setResizeState((prev) => ({
        ...prev,
        isResizing: false,
        textId: null,
        handle: null,
      }));
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [resizeState, canvasWidth, canvasHeight, minWidth, minHeight, onResize]);

  /**
   * Get resize handle props
   */
  const getResizeHandleProps = useCallback(
    (
      textId: string,
      handle: typeof resizeState.handle,
      width: number,
      height: number
    ) => ({
      onMouseDown: (e: React.MouseEvent) =>
        startResize(textId, handle, width, height, e),
      style: {
        cursor: getCursorForHandle(handle),
      },
    }),
    [startResize]
  );

  return {
    isResizing: resizeState.isResizing,
    resizingTextId: resizeState.textId,
    startResize,
    getResizeHandleProps,
  };
}

/**
 * Get cursor style for resize handle
 */
function getCursorForHandle(
  handle: "ne" | "nw" | "se" | "sw" | "n" | "s" | "e" | "w" | null
): string {
  switch (handle) {
    case "n":
    case "s":
      return "ns-resize";
    case "e":
    case "w":
      return "ew-resize";
    case "ne":
    case "sw":
      return "nesw-resize";
    case "nw":
    case "se":
      return "nwse-resize";
    default:
      return "default";
  }
}
