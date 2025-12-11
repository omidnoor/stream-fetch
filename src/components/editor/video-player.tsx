"use client"

import { useState, useRef, useCallback, useEffect, useMemo } from "react"
import ReactPlayerBase from "react-player"
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Loader2,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useEffectPreview } from "@/hooks/useEffectPreview"
import type { ClipEffect, Transform, TextOverlay } from "@/lib/editor/types"

// Extended types for ReactPlayer callbacks not included in v3 types
interface ProgressState {
  played: number
  playedSeconds: number
  loaded: number
  loadedSeconds: number
}

interface ReactPlayerConfig {
  file?: {
    attributes?: Record<string, string>
  }
}

// ReactPlayer v3 types are incomplete - define the props we actually use
interface ExtendedReactPlayerProps {
  ref?: (player: unknown) => void
  url?: string
  playing?: boolean
  volume?: number
  muted?: boolean
  playbackRate?: number
  width?: string | number
  height?: string | number
  onReady?: () => void
  onProgress?: (state: ProgressState) => void
  onDuration?: (duration: number) => void
  onError?: (error: unknown) => void
  config?: ReactPlayerConfig
}

// Cast ReactPlayer to include extended props
const ReactPlayer = ReactPlayerBase as unknown as React.ComponentType<ExtendedReactPlayerProps>

interface ReactPlayerInstance {
  seekTo: (amount: number, type?: "seconds" | "fraction") => void
  getCurrentTime: () => number
  getSecondsLoaded: () => number
  getDuration: () => number
}

interface VideoPlayerProps {
  url?: string
  effects?: ClipEffect[]
  transform?: Transform
  textOverlays?: TextOverlay[]
  currentTime?: number
  volume?: number
  muted?: boolean
  onReady?: () => void
  onProgress?: (progress: { played: number; playedSeconds: number }) => void
  onDuration?: (duration: number) => void
  onSeek?: (seconds: number) => void
  className?: string
}

export function VideoPlayer({
  url,
  effects = [],
  transform,
  textOverlays = [],
  currentTime: externalCurrentTime,
  volume: externalVolume,
  muted: externalMuted,
  onReady,
  onProgress,
  onDuration,
  onSeek,
  className,
}: VideoPlayerProps) {
  const playerInstanceRef = useRef<ReactPlayerInstance | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [playing, setPlaying] = useState(false)
  const [volume, setVolume] = useState(externalVolume ?? 0.8)
  const [muted, setMuted] = useState(false)
  const [played, setPlayed] = useState(0)
  const [playedSeconds, setPlayedSeconds] = useState(0)
  const [duration, setDuration] = useState(0)
  const [seeking, setSeeking] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const playbackRates = [0.5, 1, 1.5, 2]

  // Apply effects to video
  const { filter, vignetteOverlay } = useEffectPreview(effects)

  // Apply transforms to video
  const transformStyle = useMemo((): React.CSSProperties => {
    if (!transform) return {}

    const transforms: string[] = []

    // Apply position offset
    if (transform.position.x !== 0 || transform.position.y !== 0) {
      transforms.push(`translate(${transform.position.x}px, ${transform.position.y}px)`)
    }

    // Apply scale
    if (transform.scale !== 1) {
      transforms.push(`scale(${transform.scale})`)
    }

    // Apply rotation
    if (transform.rotation !== 0) {
      transforms.push(`rotate(${transform.rotation}deg)`)
    }

    // Apply flip
    const scaleX = transform.flipH ? -1 : 1
    const scaleY = transform.flipV ? -1 : 1
    if (scaleX !== 1 || scaleY !== 1) {
      transforms.push(`scale(${scaleX}, ${scaleY})`)
    }

    return {
      transform: transforms.length > 0 ? transforms.join(' ') : undefined,
      transformOrigin: 'center center',
    }
  }, [transform])

  // Apply crop (using clip-path)
  const cropStyle = useMemo((): React.CSSProperties => {
    if (!transform?.crop) return {}

    const { top, right, bottom, left } = transform.crop
    if (top === 0 && right === 0 && bottom === 0 && left === 0) return {}

    // Convert crop values to clip-path inset
    return {
      clipPath: `inset(${top}% ${right}% ${bottom}% ${left}%)`,
    }
  }, [transform])

  // Sync with external volume/muted props from audio mixer
  useEffect(() => {
    if (externalVolume !== undefined) {
      setVolume(externalVolume)
    }
  }, [externalVolume])

  useEffect(() => {
    if (externalMuted !== undefined) {
      setMuted(externalMuted)
    }
  }, [externalMuted])

  // Filter visible text overlays based on current time
  const visibleTextOverlays = useMemo(() => {
    const currentPlayTime = externalCurrentTime ?? playedSeconds
    return textOverlays.filter((overlay) => {
      const overlayStart = overlay.startTime
      const overlayEnd = overlay.startTime + overlay.duration
      return currentPlayTime >= overlayStart && currentPlayTime <= overlayEnd
    })
  }, [textOverlays, externalCurrentTime, playedSeconds])

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    if (isNaN(seconds) || !isFinite(seconds)) {
      return "00:00"
    }
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // Handle play/pause toggle
  const handlePlayPause = useCallback(() => {
    setPlaying((prev) => !prev)
  }, [])

  // Handle seek
  const handleSeekChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value)
    setPlayed(newValue)
    setSeeking(true)
  }, [])

  const handleSeekMouseUp = useCallback(() => {
    setSeeking(false)
    playerInstanceRef.current?.seekTo(played)
    if (onSeek) {
      onSeek(played * duration)
    }
  }, [duration, onSeek, played])

  // Handle volume
  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    setMuted(newVolume === 0)
  }, [])

  const handleToggleMute = useCallback(() => {
    setMuted((prev) => !prev)
  }, [])

  // Handle playback rate
  const handlePlaybackRateChange = useCallback(() => {
    const currentIndex = playbackRates.indexOf(playbackRate)
    const nextIndex = (currentIndex + 1) % playbackRates.length
    setPlaybackRate(playbackRates[nextIndex])
  }, [playbackRate])

  // Handle fullscreen
  const handleFullscreen = useCallback(() => {
    if (!containerRef.current) return

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.error("Error attempting to enable fullscreen:", err)
      })
    } else {
      document.exitFullscreen()
    }
  }, [])

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
    }
  }, [])

  // Handle progress
  const handleProgress = useCallback(
    (state: ProgressState) => {
      if (!seeking) {
        setPlayed(state.played)
        setPlayedSeconds(state.playedSeconds)
        if (onProgress) {
          onProgress({
            played: state.played,
            playedSeconds: state.playedSeconds,
          })
        }
      }
    },
    [seeking, onProgress]
  )

  // Handle duration
  const handleDuration = useCallback(
    (dur: number) => {
      setDuration(dur)
      if (onDuration) {
        onDuration(dur)
      }
    },
    [onDuration]
  )

  // Handle ready
  const handleReady = useCallback(() => {
    setLoading(false)
    setError(null)
    if (onReady) {
      onReady()
    }
  }, [onReady])

  // Handle error
  const handleError = useCallback((err: unknown) => {
    setLoading(false)
    setError("Failed to load video. Please check the URL and try again.")
    console.error("Video player error:", err)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      switch (e.key) {
        case " ":
        case "k":
          e.preventDefault()
          handlePlayPause()
          break
        case "ArrowLeft":
          e.preventDefault()
          playerInstanceRef.current?.seekTo(Math.max(0, playedSeconds - 5), "seconds")
          break
        case "ArrowRight":
          e.preventDefault()
          playerInstanceRef.current?.seekTo(Math.min(duration, playedSeconds + 5), "seconds")
          break
        case "m":
          e.preventDefault()
          handleToggleMute()
          break
        case "f":
          e.preventDefault()
          handleFullscreen()
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [handlePlayPause, handleToggleMute, handleFullscreen, playedSeconds, duration])

  if (!url) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-secondary/50 rounded-lg border border-border",
          "min-h-[400px]",
          className
        )}
      >
        <div className="text-center space-y-2">
          <p className="text-muted-foreground">No video loaded</p>
          <p className="text-sm text-muted-foreground">Upload or select a video to begin</p>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex flex-col bg-black rounded-lg overflow-hidden border border-border",
        isFullscreen && "fixed inset-0 z-50 rounded-none",
        className
      )}
    >
      {/* Video Container */}
      <div className="relative flex-1 bg-black flex items-center justify-center min-h-[400px]">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading video...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
            <div className="flex flex-col items-center gap-3 max-w-md text-center px-4">
              <AlertCircle className="w-8 h-8 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          </div>
        )}

        {/* Video with effects and transforms applied */}
        <div
          className="w-full h-full relative"
          style={{
            filter: filter || undefined,
            ...transformStyle,
            ...cropStyle,
          }}
        >
          <ReactPlayer
            ref={(player) => {
              if (player) {
                const typedPlayer = player as unknown as ReactPlayerInstance
                playerInstanceRef.current = {
                  seekTo: typedPlayer.seekTo.bind(player),
                  getCurrentTime: typedPlayer.getCurrentTime.bind(player),
                  getSecondsLoaded: typedPlayer.getSecondsLoaded.bind(player),
                  getDuration: typedPlayer.getDuration.bind(player),
                }
              } else {
                playerInstanceRef.current = null
              }
            }}
            url={url}
            playing={playing}
            volume={volume}
            muted={muted}
            playbackRate={playbackRate}
            width="100%"
            height="100%"
            onReady={handleReady}
            onProgress={handleProgress}
            onDuration={handleDuration}
            onError={handleError}
            config={{
              file: {
                attributes: {
                  controlsList: "nodownload",
                },
              },
            }}
          />

          {/* Vignette overlay if effect is applied */}
          {vignetteOverlay && <div style={vignetteOverlay} />}

          {/* Text overlays */}
          {visibleTextOverlays.map((overlay) => (
            <div
              key={overlay.id}
              style={{
                position: 'absolute',
                left: `${overlay.position.x}%`,
                top: `${overlay.position.y}%`,
                width: overlay.position.width ? `${overlay.position.width}%` : 'auto',
                transform: overlay.position.rotation ? `rotate(${overlay.position.rotation}deg)` : undefined,
                transformOrigin: 'center center',
                fontFamily: overlay.style.fontFamily,
                fontSize: `${overlay.style.fontSize}px`,
                fontWeight: overlay.style.fontWeight,
                fontStyle: overlay.style.fontStyle,
                color: overlay.style.color,
                backgroundColor: overlay.style.backgroundColor,
                opacity: overlay.style.opacity,
                textAlign: overlay.style.align,
                textDecoration: overlay.style.underline ? 'underline' : undefined,
                padding: '4px 8px',
                pointerEvents: 'none',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                zIndex: 20,
              }}
            >
              {overlay.content}
            </div>
          ))}
        </div>
      </div>

      {/* Controls Container */}
      <div className="bg-secondary/95 backdrop-blur-sm p-4 space-y-3">
        {/* Seek Bar */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground font-mono min-w-[45px]">
            {formatTime(playedSeconds)}
          </span>
          <input
            type="range"
            min={0}
            max={0.999999}
            step="any"
            value={played}
            onChange={handleSeekChange}
            onMouseUp={handleSeekMouseUp}
            onTouchEnd={handleSeekMouseUp}
            className="flex-1 h-1.5 bg-muted rounded-lg appearance-none cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-3
              [&::-webkit-slider-thumb]:h-3
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:bg-primary
              [&::-webkit-slider-thumb]:cursor-pointer
              [&::-webkit-slider-thumb]:transition-transform
              [&::-webkit-slider-thumb]:hover:scale-110
              [&::-moz-range-thumb]:w-3
              [&::-moz-range-thumb]:h-3
              [&::-moz-range-thumb]:rounded-full
              [&::-moz-range-thumb]:bg-primary
              [&::-moz-range-thumb]:border-0
              [&::-moz-range-thumb]:cursor-pointer
              [&::-moz-range-thumb]:transition-transform
              [&::-moz-range-thumb]:hover:scale-110"
            style={{
              background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${played * 100}%, hsl(var(--muted)) ${played * 100}%, hsl(var(--muted)) 100%)`,
            }}
          />
          <span className="text-xs text-muted-foreground font-mono min-w-[45px]">
            {formatTime(duration)}
          </span>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {/* Play/Pause */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePlayPause}
              className="h-9 w-9"
              title={playing ? "Pause (Space)" : "Play (Space)"}
            >
              {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </Button>

            {/* Volume */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggleMute}
                className="h-9 w-9"
                title={muted ? "Unmute (M)" : "Mute (M)"}
              >
                {muted || volume === 0 ? (
                  <VolumeX className="h-5 w-5" />
                ) : (
                  <Volume2 className="h-5 w-5" />
                )}
              </Button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={muted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-20 h-1 bg-muted rounded-lg appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-2.5
                  [&::-webkit-slider-thumb]:h-2.5
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-primary
                  [&::-webkit-slider-thumb]:cursor-pointer
                  [&::-moz-range-thumb]:w-2.5
                  [&::-moz-range-thumb]:h-2.5
                  [&::-moz-range-thumb]:rounded-full
                  [&::-moz-range-thumb]:bg-primary
                  [&::-moz-range-thumb]:border-0
                  [&::-moz-range-thumb]:cursor-pointer"
                style={{
                  background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${(muted ? 0 : volume) * 100}%, hsl(var(--muted)) ${(muted ? 0 : volume) * 100}%, hsl(var(--muted)) 100%)`,
                }}
                title="Volume"
              />
            </div>

            {/* Time Display */}
            <div className="hidden sm:flex items-center text-xs text-muted-foreground font-mono px-2">
              {formatTime(playedSeconds)} / {formatTime(duration)}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Playback Speed */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePlaybackRateChange}
              className="h-9 px-3 text-xs font-medium"
              title="Playback Speed"
            >
              {playbackRate}x
            </Button>

            {/* Fullscreen */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleFullscreen}
              className="h-9 w-9"
              title="Fullscreen (F)"
            >
              <Maximize className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Keyboard Shortcuts Hint */}
        <div className="hidden lg:flex items-center justify-center gap-4 text-[10px] text-muted-foreground/60 pt-1 border-t border-border/50">
          <span>Space/K: Play/Pause</span>
          <span>←/→: Seek 5s</span>
          <span>M: Mute</span>
          <span>F: Fullscreen</span>
        </div>
      </div>
    </div>
  )
}
