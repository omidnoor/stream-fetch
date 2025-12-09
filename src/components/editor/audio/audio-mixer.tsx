/**
 * AudioMixer Component
 *
 * Professional audio mixing console with per-track and master controls.
 * Includes volume faders, mute/solo, panning, and level meters.
 */

"use client";

import React from "react";
import { Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import type { AudioMixerProps, AudioMixerTrack } from "@/lib/editor/types";
import { formatVolumeDb, volumeToDb } from "@/lib/editor/utils";

/**
 * Individual track channel strip
 */
interface TrackChannelProps {
  track: AudioMixerTrack;
  hasSolo: boolean;
  onVolumeChange: (volume: number) => void;
  onMuteToggle: () => void;
  onSoloToggle: () => void;
  onPanChange: (pan: number) => void;
}

function TrackChannel({
  track,
  hasSolo,
  onVolumeChange,
  onMuteToggle,
  onSoloToggle,
  onPanChange,
}: TrackChannelProps) {
  const isActive = !track.muted && (!hasSolo || track.solo);
  const db = volumeToDb(track.volume);

  return (
    <div className="flex flex-col gap-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border">
      {/* Track name */}
      <div className="text-sm font-medium truncate" title={track.name}>
        {track.name}
      </div>

      {/* Volume fader */}
      <div className="flex flex-col items-center gap-2 flex-1">
        <Slider
          min={0}
          max={2}
          step={0.01}
          value={[track.volume]}
          onValueChange={(values) => onVolumeChange(values[0])}
          orientation="vertical"
          className="h-32"
          disabled={track.muted}
        />

        {/* Volume display */}
        <div
          className={cn(
            "text-xs tabular-nums font-medium",
            !isActive && "text-gray-400",
            db > 6 && isActive && "text-red-500",
            db > 0 && db <= 6 && isActive && "text-yellow-500",
            db <= 0 && isActive && "text-green-500"
          )}
        >
          {formatVolumeDb(track.volume)}
        </div>
      </div>

      {/* Pan control */}
      <div className="space-y-1">
        <Label className="text-xs">Pan</Label>
        <Slider
          min={-1}
          max={1}
          step={0.01}
          value={[track.pan]}
          onValueChange={(values) => onPanChange(values[0])}
          className="w-full"
        />
        <div className="text-xs text-center text-muted-foreground">
          {track.pan === 0 ? "C" : track.pan < 0 ? `L${Math.abs(track.pan * 100).toFixed(0)}` : `R${(track.pan * 100).toFixed(0)}`}
        </div>
      </div>

      {/* Mute/Solo buttons */}
      <div className="flex gap-2">
        <Button
          variant={track.muted ? "default" : "outline"}
          size="sm"
          onClick={onMuteToggle}
          className={cn(
            "flex-1 text-xs",
            track.muted && "bg-red-500 hover:bg-red-600"
          )}
        >
          M
        </Button>
        <Button
          variant={track.solo ? "default" : "outline"}
          size="sm"
          onClick={onSoloToggle}
          className={cn(
            "flex-1 text-xs",
            track.solo && "bg-yellow-500 hover:bg-yellow-600"
          )}
        >
          S
        </Button>
      </div>
    </div>
  );
}

/**
 * Master channel strip
 */
interface MasterChannelProps {
  volume: number;
  muted: boolean;
  onVolumeChange: (volume: number) => void;
  onMuteToggle: () => void;
}

function MasterChannel({
  volume,
  muted,
  onVolumeChange,
  onMuteToggle,
}: MasterChannelProps) {
  const db = volumeToDb(volume);

  return (
    <div className="flex flex-col gap-3 p-4 bg-purple-50 dark:bg-purple-950 rounded-lg border-2 border-purple-500">
      {/* Master label */}
      <div className="text-sm font-bold">MASTER</div>

      {/* Volume fader */}
      <div className="flex flex-col items-center gap-2 flex-1">
        <Slider
          min={0}
          max={2}
          step={0.01}
          value={[volume]}
          onValueChange={(values) => onVolumeChange(values[0])}
          orientation="vertical"
          className="h-32"
          disabled={muted}
        />

        {/* Volume display */}
        <div
          className={cn(
            "text-xs tabular-nums font-bold",
            muted && "text-gray-400",
            db > 6 && !muted && "text-red-500",
            db > 0 && db <= 6 && !muted && "text-yellow-500",
            db <= 0 && !muted && "text-green-500"
          )}
        >
          {formatVolumeDb(muted ? 0 : volume)}
        </div>
      </div>

      {/* Mute button */}
      <Button
        variant={muted ? "default" : "outline"}
        size="sm"
        onClick={onMuteToggle}
        className={cn("w-full", muted && "bg-red-500 hover:bg-red-600")}
      >
        {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
      </Button>
    </div>
  );
}

/**
 * AudioMixer component
 */
export function AudioMixer({
  projectId,
  state,
  onChange,
  compact = false,
  className,
}: AudioMixerProps) {
  const handleTrackVolumeChange = (trackId: string, volume: number) => {
    const updatedTracks = state.tracks.map((t) =>
      t.trackId === trackId ? { ...t, volume } : t
    );
    onChange({ ...state, tracks: updatedTracks });
  };

  const handleTrackMuteToggle = (trackId: string) => {
    const updatedTracks = state.tracks.map((t) =>
      t.trackId === trackId ? { ...t, muted: !t.muted } : t
    );
    onChange({ ...state, tracks: updatedTracks });
  };

  const handleTrackSoloToggle = (trackId: string) => {
    const updatedTracks = state.tracks.map((t) =>
      t.trackId === trackId ? { ...t, solo: !t.solo } : t
    );
    const hasSolo = updatedTracks.some((t) => t.solo);
    onChange({ ...state, tracks: updatedTracks, hasSolo });
  };

  const handleTrackPanChange = (trackId: string, pan: number) => {
    const updatedTracks = state.tracks.map((t) =>
      t.trackId === trackId ? { ...t, pan } : t
    );
    onChange({ ...state, tracks: updatedTracks });
  };

  const handleMasterVolumeChange = (volume: number) => {
    onChange({ ...state, masterVolume: volume });
  };

  const handleMasterMuteToggle = () => {
    onChange({ ...state, masterMute: !state.masterMute });
  };

  if (compact) {
    // Compact mode: horizontal sliders only
    return (
      <div className={cn("space-y-2", className)}>
        {state.tracks.map((track) => (
          <div key={track.trackId} className="flex items-center gap-2">
            <span className="text-sm w-24 truncate">{track.name}</span>
            <Slider
              min={0}
              max={2}
              step={0.01}
              value={[track.volume]}
              onValueChange={(values) => handleTrackVolumeChange(track.trackId, values[0])}
              className="flex-1"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleTrackMuteToggle(track.trackId)}
              className={cn("h-8 w-8", track.muted && "text-red-500")}
            >
              {track.muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("p-4 bg-white dark:bg-gray-800 rounded-lg", className)}>
      <h3 className="text-lg font-semibold mb-4">Audio Mixer</h3>

      <div className="flex gap-4 overflow-x-auto">
        {/* Track channels */}
        {state.tracks
          .filter((t) => t.visible)
          .map((track) => (
            <TrackChannel
              key={track.trackId}
              track={track}
              hasSolo={state.hasSolo}
              onVolumeChange={(volume) => handleTrackVolumeChange(track.trackId, volume)}
              onMuteToggle={() => handleTrackMuteToggle(track.trackId)}
              onSoloToggle={() => handleTrackSoloToggle(track.trackId)}
              onPanChange={(pan) => handleTrackPanChange(track.trackId, pan)}
            />
          ))}

        {/* Master channel */}
        <MasterChannel
          volume={state.masterVolume}
          muted={state.masterMute}
          onVolumeChange={handleMasterVolumeChange}
          onMuteToggle={handleMasterMuteToggle}
        />
      </div>
    </div>
  );
}
