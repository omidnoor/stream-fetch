/**
 * TransitionHandle Component
 *
 * Visual indicator between clips where transitions can be added or edited.
 * Shows as a small button/handle between adjacent clips on the timeline.
 */

"use client";

import React from "react";
import { Plus, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TransitionHandleProps } from "@/lib/editor/types";

export function TransitionHandle({
  position,
  hasTransition,
  transition,
  isSelected,
  isPreviewing,
  onClick,
  onDoubleClick,
  onMouseEnter,
  onMouseLeave,
  className,
}: TransitionHandleProps) {
  return (
    <div
      className={cn(
        "absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10",
        "transition-all duration-200",
        className
      )}
      style={{ left: position }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <button
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        className={cn(
          "group relative flex items-center justify-center",
          "w-8 h-8 rounded-full",
          "transition-all duration-200",
          "focus:outline-none focus:ring-2 focus:ring-offset-2",
          // Base styles
          hasTransition
            ? [
                "bg-purple-500 hover:bg-purple-600",
                "text-white",
                "shadow-md hover:shadow-lg",
                "border-2 border-purple-400",
              ]
            : [
                "bg-gray-700 hover:bg-gray-600",
                "text-gray-400 hover:text-white",
                "border-2 border-gray-600",
                "opacity-0 group-hover:opacity-100",
              ],
          // Selected state
          isSelected && [
            "ring-2 ring-purple-400 ring-offset-2",
            "scale-110",
          ],
          // Previewing state
          isPreviewing && [
            "animate-pulse",
            "ring-2 ring-blue-400",
          ]
        )}
        title={
          hasTransition
            ? `Edit transition (${transition?.type})`
            : "Add transition"
        }
      >
        {hasTransition ? (
          <Sparkles className="w-4 h-4" />
        ) : (
          <Plus className="w-4 h-4" />
        )}

        {/* Pulse effect for preview */}
        {isPreviewing && (
          <span className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-75" />
        )}
      </button>

      {/* Transition duration indicator */}
      {hasTransition && transition && (
        <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap">
          <div className="px-2 py-0.5 text-xs font-medium bg-purple-500/90 text-white rounded">
            {(transition.duration / 1000).toFixed(1)}s
          </div>
        </div>
      )}

      {/* Hover tooltip for no transition */}
      {!hasTransition && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <div className="px-2 py-1 text-xs bg-gray-900 text-white rounded shadow-lg">
            Click to add transition
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * TransitionHandleContainer
 *
 * Container component that positions transition handles between clips.
 * Calculates positions based on clip layout.
 */
interface TransitionHandleContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function TransitionHandleContainer({
  children,
  className,
}: TransitionHandleContainerProps) {
  return (
    <div className={cn("relative h-full group", className)}>
      {children}
    </div>
  );
}
