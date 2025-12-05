"use client"

import { useState, useRef, useEffect } from "react"
import { Plus, Trash2, ScissorsIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Clip {
  id: string
  name: string
  startTime: number
  duration: number
  position: number
  sourceUrl: string
}

interface TimelineProps {
  clips: Clip[]
  duration: number
  currentTime: number
  onClipsChange?: (clips: Clip[]) => void
  onSeek?: (time: number) => void
  onDeleteClip?: (clipId: string) => void
  className?: string
}

export function Timeline({
  clips = [],
  duration = 0,
  currentTime = 0,
  onClipsChange,
  onSeek,
  onDeleteClip,
  className = "",
}: TimelineProps) {
  const timelineRef = useRef<HTMLDivElement>(null)
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [zoom, setZoom] = useState(1)

  const PIXELS_PER_SECOND = 50 * zoom
  const TIMELINE_HEIGHT = 80
  const timelineWidth = Math.max(duration * PIXELS_PER_SECOND, 1000)

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current || isDragging) return

    const rect = timelineRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const clickedTime = x / PIXELS_PER_SECOND

    onSeek?.(Math.max(0, Math.min(clickedTime, duration)))
  }

  const handleDeleteClip = (clipId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onDeleteClip?.(clipId)
    if (selectedClipId === clipId) {
      setSelectedClipId(null)
    }
  }

  const handleClipClick = (clipId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedClipId(clipId)
  }

  const renderTimeMarkers = () => {
    const markers = []
    const markerInterval = 5 // Show marker every 5 seconds
    const markerCount = Math.ceil(duration / markerInterval)

    for (let i = 0; i <= markerCount; i++) {
      const time = i * markerInterval
      const xPos = time * PIXELS_PER_SECOND

      markers.push(
        <div
          key={`marker-${i}`}
          className="absolute flex flex-col items-center"
          style={{ left: `${xPos}px` }}
        >
          <div className="h-2 w-px bg-gray-600" />
          <span className="text-[10px] text-gray-500 mt-1">
            {formatTime(time)}
          </span>
        </div>
      )
    }

    return markers
  }

  return (
    <div className={`w-full bg-[#1a1a1a] rounded-lg border border-gray-800 ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-400">Timeline</span>
          <span className="text-xs text-gray-600">
            {clips.length} clip{clips.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom Controls */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
            disabled={zoom <= 0.5}
          >
            -
          </Button>
          <span className="text-xs text-gray-500 w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setZoom(Math.min(3, zoom + 0.25))}
            disabled={zoom >= 3}
          >
            +
          </Button>
        </div>
      </div>

      {/* Timeline Area */}
      <div className="relative overflow-x-auto overflow-y-hidden">
        <div
          ref={timelineRef}
          className="relative cursor-pointer bg-[#0f0f0f]"
          style={{
            width: `${timelineWidth}px`,
            height: `${TIMELINE_HEIGHT + 40}px`,
          }}
          onClick={handleTimelineClick}
        >
          {/* Time Markers */}
          <div className="absolute top-0 left-0 right-0 h-8 border-b border-gray-800">
            {renderTimeMarkers()}
          </div>

          {/* Playhead */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 pointer-events-none"
            style={{
              left: `${currentTime * PIXELS_PER_SECOND}px`,
            }}
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-red-500 rounded-full" />
          </div>

          {/* Clips Track */}
          <div className="absolute top-8 left-0 right-0" style={{ height: `${TIMELINE_HEIGHT}px` }}>
            {clips.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-600 text-sm">
                No clips on timeline. Upload a video to get started.
              </div>
            ) : (
              clips.map((clip) => {
                const xPos = clip.position * PIXELS_PER_SECOND
                const width = clip.duration * PIXELS_PER_SECOND
                const isSelected = selectedClipId === clip.id

                return (
                  <div
                    key={clip.id}
                    className={`
                      absolute top-2 rounded cursor-pointer transition-all
                      ${isSelected
                        ? "ring-2 ring-primary shadow-lg"
                        : "hover:ring-1 hover:ring-gray-600"
                      }
                    `}
                    style={{
                      left: `${xPos}px`,
                      width: `${width}px`,
                      height: `${TIMELINE_HEIGHT - 16}px`,
                      background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                    }}
                    onClick={(e) => handleClipClick(clip.id, e)}
                  >
                    {/* Clip Content */}
                    <div className="relative h-full p-2 flex flex-col justify-between">
                      <div className="flex items-start justify-between gap-1">
                        <span className="text-xs font-medium text-white truncate flex-1">
                          {clip.name}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0 hover:bg-red-500/20"
                          onClick={(e) => handleDeleteClip(clip.id, e)}
                        >
                          <Trash2 className="h-3 w-3 text-white" />
                        </Button>
                      </div>

                      <div className="text-[10px] text-white/70">
                        {formatTime(clip.duration)}
                      </div>
                    </div>

                    {/* Resize Handles */}
                    {isSelected && (
                      <>
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/50 cursor-ew-resize hover:bg-white" />
                        <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/50 cursor-ew-resize hover:bg-white" />
                      </>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Timeline Info */}
      <div className="flex items-center justify-between p-3 border-t border-gray-800 text-xs text-gray-500">
        <div>
          Current: {formatTime(currentTime)} / {formatTime(duration)}
        </div>
        {selectedClipId && (
          <div className="text-primary">
            1 clip selected
          </div>
        )}
      </div>
    </div>
  )
}
