"use client";

import { useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import type { TextPreviewProps, TextOverlay, TextPosition } from "@/lib/editor/types";
import {
  isTextVisibleAtTime,
  calculateAnimationProgress,
  applyEasing,
  textPositionToPixels,
} from "@/lib/editor/utils";
import { useTextDrag } from "@/hooks/useTextDrag";

/**
 * TextPreview Component
 *
 * Renders text overlays on the video canvas with proper positioning,
 * styling, and animations based on the current playback time.
 */
export function TextPreview({
  overlays,
  currentTime,
  canvasWidth,
  canvasHeight,
  selectedTextId,
  onTextSelect,
  onTextMove,
  className,
}: TextPreviewProps) {
  // Get visible overlays at current time
  const visibleOverlays = useMemo(
    () => overlays.filter((overlay) => isTextVisibleAtTime(overlay, currentTime)),
    [overlays, currentTime]
  );

  // Drag handling
  const {
    containerRef,
    getDragHandleProps,
    isDraggingText,
    getCurrentPosition,
  } = useTextDrag({
    canvasWidth,
    canvasHeight,
    onPositionChange: (textId, position) => {
      // Update position during drag (for visual feedback)
    },
    onDragEnd: (textId, position) => {
      onTextMove?.(textId, position);
    },
  });

  /**
   * Handle text selection
   */
  const handleTextClick = useCallback(
    (e: React.MouseEvent, textId: string) => {
      e.stopPropagation();
      onTextSelect?.(textId);
    },
    [onTextSelect]
  );

  /**
   * Handle canvas click (deselect)
   */
  const handleCanvasClick = useCallback(() => {
    onTextSelect?.(null as any);
  }, [onTextSelect]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative overflow-hidden bg-black/20",
        className
      )}
      style={{ width: canvasWidth, height: canvasHeight }}
      onClick={handleCanvasClick}
    >
      {visibleOverlays.map((overlay) => (
        <TextOverlayItem
          key={overlay.id}
          overlay={overlay}
          currentTime={currentTime}
          canvasWidth={canvasWidth}
          canvasHeight={canvasHeight}
          isSelected={selectedTextId === overlay.id}
          isDragging={isDraggingText(overlay.id)}
          position={getCurrentPosition(overlay.id, overlay.position)}
          onClick={(e) => handleTextClick(e, overlay.id)}
          dragHandleProps={getDragHandleProps(overlay.id, overlay.position)}
        />
      ))}
    </div>
  );
}

/**
 * Individual text overlay item
 */
interface TextOverlayItemProps {
  overlay: TextOverlay;
  currentTime: number;
  canvasWidth: number;
  canvasHeight: number;
  isSelected: boolean;
  isDragging: boolean;
  position: TextPosition;
  onClick: (e: React.MouseEvent) => void;
  dragHandleProps: ReturnType<ReturnType<typeof useTextDrag>["getDragHandleProps"]>;
}

function TextOverlayItem({
  overlay,
  currentTime,
  canvasWidth,
  canvasHeight,
  isSelected,
  isDragging,
  position,
  onClick,
  dragHandleProps,
}: TextOverlayItemProps) {
  // Calculate animation state
  const { inProgress, outProgress } = useMemo(
    () => calculateAnimationProgress(overlay, currentTime),
    [overlay, currentTime]
  );

  // Calculate position in pixels
  const pixelPosition = useMemo(
    () => textPositionToPixels(position, canvasWidth, canvasHeight),
    [position, canvasWidth, canvasHeight]
  );

  // Calculate animation transforms
  const animationStyles = useMemo(() => {
    const styles: React.CSSProperties = {};

    // Entry animation
    if (overlay.animationIn && inProgress < 1) {
      const easedProgress = applyEasing(inProgress, overlay.animationIn.easing);

      switch (overlay.animationIn.type) {
        case "fade":
          styles.opacity = easedProgress;
          break;
        case "scale":
          styles.transform = `scale(${easedProgress})`;
          break;
        case "slide":
          const slideDistance = 50;
          switch (overlay.animationIn.slideDirection) {
            case "left":
              styles.transform = `translateX(${-slideDistance * (1 - easedProgress)}px)`;
              break;
            case "right":
              styles.transform = `translateX(${slideDistance * (1 - easedProgress)}px)`;
              break;
            case "up":
              styles.transform = `translateY(${-slideDistance * (1 - easedProgress)}px)`;
              break;
            case "down":
              styles.transform = `translateY(${slideDistance * (1 - easedProgress)}px)`;
              break;
          }
          break;
        case "blur":
          styles.filter = `blur(${(1 - easedProgress) * 10}px)`;
          break;
      }
    }

    // Exit animation
    if (overlay.animationOut && outProgress > 0) {
      const easedProgress = applyEasing(outProgress, overlay.animationOut.easing);

      switch (overlay.animationOut.type) {
        case "fade":
          styles.opacity = 1 - easedProgress;
          break;
        case "scale":
          styles.transform = `scale(${1 - easedProgress})`;
          break;
        case "slide":
          const slideDistance = 50;
          switch (overlay.animationOut.slideDirection) {
            case "left":
              styles.transform = `translateX(${-slideDistance * easedProgress}px)`;
              break;
            case "right":
              styles.transform = `translateX(${slideDistance * easedProgress}px)`;
              break;
            case "up":
              styles.transform = `translateY(${-slideDistance * easedProgress}px)`;
              break;
            case "down":
              styles.transform = `translateY(${slideDistance * easedProgress}px)`;
              break;
          }
          break;
        case "blur":
          styles.filter = `blur(${easedProgress * 10}px)`;
          break;
      }
    }

    return styles;
  }, [overlay, inProgress, outProgress]);

  // Build text styles
  const textStyles = useMemo((): React.CSSProperties => {
    const { style } = overlay;

    const baseStyles: React.CSSProperties = {
      fontFamily: style.fontFamily,
      fontSize: style.fontSize,
      fontWeight: style.bold ? "bold" : style.fontWeight,
      fontStyle: style.italic ? "italic" : "normal",
      textDecoration: style.underline ? "underline" : "none",
      color: style.color,
      backgroundColor: style.backgroundColor,
      opacity: style.opacity,
      textAlign: style.align,
      letterSpacing: style.letterSpacing ? `${style.letterSpacing}px` : undefined,
      lineHeight: style.lineHeight,
      borderRadius: style.borderRadius ? `${style.borderRadius}px` : undefined,
      padding: style.padding
        ? `${style.padding.top}px ${style.padding.right}px ${style.padding.bottom}px ${style.padding.left}px`
        : undefined,
    };

    // Add shadow
    if (style.shadow) {
      baseStyles.textShadow = `${style.shadow.offsetX}px ${style.shadow.offsetY}px ${style.shadow.blur}px ${style.shadow.color}`;
    }

    // Add stroke
    if (style.stroke) {
      baseStyles.WebkitTextStroke = `${style.stroke.width}px ${style.stroke.color}`;
    }

    return baseStyles;
  }, [overlay.style]);

  // Calculate alignment offset
  const alignmentOffset = useMemo(() => {
    const { align, verticalAlign } = overlay.style;
    let translateX = "-50%";
    let translateY = "-50%";

    switch (align) {
      case "left":
        translateX = "0";
        break;
      case "right":
        translateX = "-100%";
        break;
    }

    switch (verticalAlign) {
      case "top":
        translateY = "0";
        break;
      case "bottom":
        translateY = "-100%";
        break;
    }

    return `translate(${translateX}, ${translateY})`;
  }, [overlay.style.align, overlay.style.verticalAlign]);

  // Extract style from drag handle props to avoid duplicate style prop
  const { style: dragStyle, ...restDragHandleProps } = dragHandleProps;

  return (
    <div
      className={cn(
        "absolute select-none whitespace-pre-wrap",
        isSelected && "ring-2 ring-primary ring-offset-2",
        isDragging && "cursor-grabbing"
      )}
      style={{
        left: pixelPosition.x,
        top: pixelPosition.y,
        transform: `${alignmentOffset} ${position.rotation ? `rotate(${position.rotation}deg)` : ""}`,
        maxWidth: position.width ? `${position.width}%` : "80%",
        ...textStyles,
        ...animationStyles,
        ...dragStyle,
        pointerEvents: overlay.locked ? "none" : "auto",
      }}
      onClick={onClick}
      {...restDragHandleProps}
    >
      {overlay.content}

      {/* Selection handles */}
      {isSelected && !isDragging && (
        <>
          <div className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-primary rounded-full" />
          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary rounded-full" />
          <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 bg-primary rounded-full" />
          <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-primary rounded-full" />
        </>
      )}
    </div>
  );
}

/**
 * Simplified text preview for timeline thumbnails
 */
export function TextPreviewThumbnail({
  overlay,
  width,
  height,
}: {
  overlay: TextOverlay;
  width: number;
  height: number;
}) {
  const scale = Math.min(width / 320, height / 180);

  return (
    <div
      className="relative overflow-hidden bg-black/50 rounded"
      style={{ width, height }}
    >
      <div
        className="absolute truncate"
        style={{
          left: `${overlay.position.x}%`,
          top: `${overlay.position.y}%`,
          transform: "translate(-50%, -50%)",
          fontFamily: overlay.style.fontFamily,
          fontSize: overlay.style.fontSize * scale * 0.3,
          fontWeight: overlay.style.bold ? "bold" : "normal",
          color: overlay.style.color,
          maxWidth: "90%",
        }}
      >
        {overlay.content}
      </div>
    </div>
  );
}
