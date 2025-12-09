/**
 * Waveform Component
 *
 * Visualizes audio waveform data with interactive features.
 * Displays audio peaks as a bar graph or smooth curve.
 */

"use client";

import React, { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { WaveformProps } from "@/lib/editor/types";

export function Waveform({
  data,
  width,
  height,
  color = "#3b82f6",
  backgroundColor = "transparent",
  progress,
  onClick,
  className,
}: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Draw waveform
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Fill background
    if (backgroundColor !== "transparent") {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);
    }

    // Draw waveform
    if (!data || !data.peaks || data.peaks.length === 0) {
      return;
    }

    const barWidth = width / data.peaks.length;
    const midY = height / 2;

    // Draw bars
    data.peaks.forEach((peak, index) => {
      const barHeight = peak * height * 0.9; // 90% of height max
      const x = index * barWidth;
      const y = midY - barHeight / 2;

      // Determine bar color (different if after progress)
      let barColor = color;
      if (progress !== undefined) {
        const barProgress = index / data.peaks.length;
        barColor = barProgress <= progress ? color : `${color}40`;
      }

      ctx.fillStyle = barColor;
      ctx.fillRect(x, y, Math.max(1, barWidth - 1), barHeight);
    });

    // Draw progress line
    if (progress !== undefined) {
      const progressX = width * progress;
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(progressX, 0);
      ctx.lineTo(progressX, height);
      ctx.stroke();
    }
  }, [data, width, height, color, backgroundColor, progress]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onClick) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const position = x / width;

    onClick(position);
  };

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      onClick={handleClick}
      className={cn(
        "block",
        onClick && "cursor-pointer hover:opacity-80",
        className
      )}
      style={{ width, height }}
    />
  );
}

/**
 * Simple waveform bars without canvas (lighter weight)
 */
interface WaveformBarsProps {
  data: WaveformProps["data"];
  width: number;
  height: number;
  color?: string;
  progress?: number;
  className?: string;
}

export function WaveformBars({
  data,
  width,
  height,
  color = "#3b82f6",
  progress,
  className,
}: WaveformBarsProps) {
  if (!data || !data.peaks || data.peaks.length === 0) {
    return (
      <div
        className={cn("flex items-center justify-center bg-gray-200 dark:bg-gray-800", className)}
        style={{ width, height }}
      >
        <span className="text-xs text-gray-400">No waveform data</span>
      </div>
    );
  }

  const barWidth = width / data.peaks.length;

  return (
    <div
      className={cn("flex items-center gap-px", className)}
      style={{ width, height }}
    >
      {data.peaks.map((peak, index) => {
        const barHeight = peak * height * 0.9;
        const barProgress = index / data.peaks.length;
        const isAfterProgress = progress !== undefined && barProgress > progress;

        return (
          <div
            key={index}
            className="flex-shrink-0 rounded-sm"
            style={{
              width: Math.max(1, barWidth - 1),
              height: barHeight,
              backgroundColor: color,
              opacity: isAfterProgress ? 0.3 : 1,
            }}
          />
        );
      })}
    </div>
  );
}
