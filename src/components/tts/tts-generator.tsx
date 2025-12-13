"use client";

import { useState, useCallback, useEffect } from "react";
import { Wand2, Loader2, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { VoiceUploader } from "./voice-uploader";
import { EmotionPresets } from "./emotion-presets";
import { EmotionSelector } from "./emotion-selector";
import { WaveformPlayer } from "./waveform-player";
import { useTTS } from "@/hooks/use-tts";
import { cn } from "@/lib/utils";

const MAX_TEXT_LENGTH = 5000;
const DEFAULT_EMOTION_VECTOR = [0, 0, 0, 0, 0, 0, 0, 0];

export function TTSGenerator() {
  // Form state
  const [text, setText] = useState("");
  const [voiceUrl, setVoiceUrl] = useState<string | null>(null);
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [emotionVector, setEmotionVector] = useState<number[]>(DEFAULT_EMOTION_VECTOR);
  const [emotionAlpha, setEmotionAlpha] = useState(0.7);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // TTS hook
  const {
    isGenerating,
    error,
    audioUrl,
    audioBlob,
    costEstimate,
    generateSpeech,
    estimateCost,
    reset,
  } = useTTS();

  // Update cost estimate when text changes
  useEffect(() => {
    if (text.length > 10) {
      const debounce = setTimeout(() => {
        estimateCost(text);
      }, 500);
      return () => clearTimeout(debounce);
    }
  }, [text, estimateCost]);

  const handleVoiceChange = useCallback(
    (url: string | null, blob: Blob | null) => {
      setVoiceUrl(url);
      setVoiceBlob(blob);
    },
    []
  );

  const handlePresetSelect = useCallback((preset: string, vector: number[]) => {
    setSelectedPreset(preset);
    setEmotionVector(vector);
  }, []);

  const handleVectorChange = useCallback((vector: number[]) => {
    setEmotionVector(vector);
    setSelectedPreset(null); // Clear preset when manually adjusting
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!text.trim() || !voiceUrl) return;

    await generateSpeech({
      text: text.trim(),
      voiceReferenceUrl: voiceUrl,
      emotionVector: emotionVector as [number, number, number, number, number, number, number, number],
      emotionAlpha,
      emotionMode: "vector",
    });
  }, [text, voiceUrl, emotionVector, emotionAlpha, generateSpeech]);

  const handleDownload = useCallback(() => {
    if (!audioBlob) return;

    const url = URL.createObjectURL(audioBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tts_${Date.now()}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [audioBlob]);

  const canGenerate = text.trim().length > 0 && voiceUrl && !isGenerating;
  const charCount = text.length;
  const charPercent = (charCount / MAX_TEXT_LENGTH) * 100;

  return (
    <div className="space-y-6">
      {/* Voice Reference Card */}
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">Voice Reference</h3>
          <p className="text-sm text-muted-foreground">
            Upload a voice sample to clone (10-15 seconds recommended)
          </p>
        </div>

        <VoiceUploader onVoiceChange={handleVoiceChange} />
      </div>

      {/* Text Input Card */}
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">Text to Speech</h3>
          <p className="text-sm text-muted-foreground">
            Enter the text you want to convert to speech
          </p>
        </div>

        <div className="space-y-2">
          <Textarea
            placeholder="Type or paste your text here..."
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, MAX_TEXT_LENGTH))}
            rows={5}
            className="resize-none"
          />

          {/* Character count and cost */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <span
                className={cn(
                  "font-mono",
                  charPercent > 90
                    ? "text-destructive"
                    : charPercent > 70
                    ? "text-warning"
                    : "text-muted-foreground"
                )}
              >
                {charCount.toLocaleString()} / {MAX_TEXT_LENGTH.toLocaleString()}
              </span>

              {costEstimate && (
                <span className="text-muted-foreground">
                  ~{costEstimate.estimatedAudioSeconds}s •{" "}
                  ${costEstimate.estimatedCostUsd.toFixed(3)}
                </span>
              )}
            </div>

            {/* Character progress bar */}
            <div className="w-24 h-1.5 bg-surface-3 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all duration-200 rounded-full",
                  charPercent > 90
                    ? "bg-destructive"
                    : charPercent > 70
                    ? "bg-warning"
                    : "bg-primary"
                )}
                style={{ width: `${charPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Emotion Control Card */}
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold">Emotion Control</h3>
            <p className="text-sm text-muted-foreground">
              Choose how the generated voice should sound
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="gap-2"
          >
            Advanced
            {showAdvanced ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Presets */}
        <EmotionPresets
          selectedPreset={selectedPreset}
          onPresetSelect={handlePresetSelect}
        />

        {/* Advanced Controls */}
        {showAdvanced && (
          <div className="pt-4 border-t">
            <EmotionSelector
              emotionVector={emotionVector}
              emotionAlpha={emotionAlpha}
              onVectorChange={handleVectorChange}
              onAlphaChange={setEmotionAlpha}
            />
          </div>
        )}
      </div>

      {/* Generate Button */}
      <Button
        onClick={handleGenerate}
        disabled={!canGenerate}
        size="lg"
        className="w-full gap-2 h-14 text-lg"
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Wand2 className="h-5 w-5" />
            Generate Speech
          </>
        )}
      </Button>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg p-3">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Generated Audio Preview */}
      {audioUrl && (
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">Generated Audio</h3>
              <p className="text-sm text-muted-foreground">
                Your AI-generated speech is ready
              </p>
            </div>
            <Button onClick={handleDownload} variant="outline" className="gap-2">
              Download
            </Button>
          </div>

          <WaveformPlayer
            audioUrl={audioUrl}
            audioBlob={audioBlob}
            height={100}
            showVolume
          />
        </div>
      )}
    </div>
  );
}
